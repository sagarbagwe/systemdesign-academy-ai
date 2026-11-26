package com.systemdesign.academy;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.io.IOException;
import java.net.URI;
import java.net.URLEncoder;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;
import java.security.GeneralSecurityException;
import java.security.MessageDigest;
import java.time.Duration;
import java.time.Instant;
import java.util.ArrayList;
import java.util.HexFormat;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;
import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

@Service
class StripeBilling {
    private static final Set<String> REFRESH_EVENTS = Set.of(
            "checkout.session.completed", "checkout.session.async_payment_succeeded",
            "customer.subscription.created", "customer.subscription.updated", "customer.subscription.deleted",
            "invoice.paid", "invoice.payment_failed");
    private final JdbcTemplate db;
    private final HttpClient http;
    private final ObjectMapper json;
    private final String key;
    private final String price;
    private final String webhook;
    private final String appUrl;

    StripeBilling(JdbcTemplate db, HttpClient http, ObjectMapper json,
                  @Value("${academy.stripe.key}") String key, @Value("${academy.stripe.price}") String price,
                  @Value("${academy.stripe.webhook}") String webhook, @Value("${academy.origin}") String appUrl) {
        this.db = db;
        this.http = http;
        this.json = json;
        this.key = key;
        this.price = price;
        this.webhook = webhook;
        this.appUrl = appUrl;
    }

    record Redirect(String url) {}
    private record BillingAccount(String id, String customer, String checkout, long proUntil) {}

    boolean enabled() { return !key.isBlank() && price.startsWith("price_") && !webhook.isBlank(); }

    @Transactional
    public Redirect checkout(Accounts.Account user) {
        requireEnabled();
        var billing = db.queryForObject("""
                SELECT id,stripe_customer,stripe_checkout,pro_until FROM academy_account WHERE id=? FOR UPDATE
                """, (row, index) -> new BillingAccount(row.getString(1), row.getString(2), row.getString(3), row.getLong(4)), user.id());
        if (billing == null) throw new ResponseStatusException(HttpStatus.NOT_FOUND);
        String customer = billing.customer();
        if (customer == null) {
            customer = call("/customers", Map.of("email", user.email(), "metadata[academy_id]", user.id()),
                    "academy-customer-" + user.id()).path("id").asText();
            validateId(customer);
            db.update("UPDATE academy_account SET stripe_customer=? WHERE id=?", customer, user.id());
        }
        if (billing.proUntil() > System.currentTimeMillis() || existingSubscription(customer)) {
            return portalFor(customer);
        }
        String previous = billing.checkout();
        if (previous != null) {
            validateId(previous);
            var existing = call("/checkout/sessions/" + previous, null, null);
            if (existing.path("status").asText().equals("open")) return toRedirect(existing);
        }
        var session = call("/checkout/sessions", Map.of(
                "customer", customer, "mode", "subscription", "line_items[0][price]", price,
                "line_items[0][quantity]", "1", "client_reference_id", user.id(),
                "success_url", appUrl + "/#settings", "cancel_url", appUrl + "/#settings"),
                "academy-checkout-" + user.id() + "-" + (previous == null ? "first" : previous));
        var sessionId = session.path("id").asText();
        validateId(sessionId);
        db.update("UPDATE academy_account SET stripe_checkout=? WHERE id=?", sessionId, user.id());
        return toRedirect(session);
    }

    Redirect portal(Accounts.Account user) {
        requireEnabled();
        String customer = db.queryForObject("SELECT stripe_customer FROM academy_account WHERE id=?", String.class, user.id());
        if (customer == null) throw new ResponseStatusException(HttpStatus.NOT_FOUND, "No Stripe customer exists for this account.");
        return portalFor(customer);
    }

    @Transactional
    public void webhook(String signature, byte[] body) {
        requireEnabled();
        if (body.length > 262_144 || !validSignature(signature, body)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid Stripe signature.");
        }
        JsonNode event;
        try { event = json.readTree(body); }
        catch (IOException error) { throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid Stripe event."); }
        if (event == null || !REFRESH_EVENTS.contains(event.path("type").asText())) return;
        String customer = event.path("data").path("object").path("customer").asText();
        if (!customer.startsWith("cus_")) return;
        validateId(customer);
        String id = event.path("id").asText();
        validateId(id);
        var recipients = db.query("SELECT id FROM academy_account WHERE stripe_customer=? FOR UPDATE",
                (row, index) -> row.getString(1), customer);
        if (recipients.isEmpty()) return;
        if (Boolean.TRUE.equals(db.queryForObject("SELECT EXISTS (SELECT 1 FROM academy_stripe_event WHERE event_id=?)", Boolean.class, id))) return;

        long until = 0;
        for (var subscription : subscriptions(customer)) {
            String status = subscription.path("status").asText();
            if (!status.equals("active") && !status.equals("trialing")) continue;
            for (var item : subscription.path("items").path("data")) {
                if (!price.equals(item.path("price").path("id").asText())) continue;
                long seconds = item.path("current_period_end").asLong(subscription.path("current_period_end").asLong(0));
                until = Math.max(until, seconds * 1000);
            }
        }
        db.update("UPDATE academy_account SET pro_until=? WHERE id=?", until, recipients.getFirst());
        db.update("INSERT INTO academy_stripe_event(event_id,processed_at) VALUES (?,?)", id, System.currentTimeMillis());
    }

    private JsonNode subscriptions(String customer) {
        return call("/subscriptions?status=all&limit=100&customer=" + customer, null, null).path("data");
    }

    private boolean existingSubscription(String customer) {
        validateId(customer);
        for (var subscription : subscriptions(customer)) {
            if (Set.of("active", "trialing", "past_due", "unpaid", "paused", "incomplete")
                    .contains(subscription.path("status").asText())) return true;
        }
        return false;
    }

    private Redirect portalFor(String customer) {
        return toRedirect(call("/billing_portal/sessions", Map.of("customer", customer, "return_url", appUrl + "/#settings"), null));
    }

    private Redirect toRedirect(JsonNode data) {
        try {
            URI uri = URI.create(data.path("url").asText());
            if ("https".equals(uri.getScheme()) && Set.of("checkout.stripe.com", "billing.stripe.com").contains(uri.getHost())) {
                return new Redirect(uri.toString());
            }
        } catch (IllegalArgumentException | NullPointerException ignored) {
            // Report invalid provider redirects without including the provider response.
        }
        throw unavailable();
    }

    private JsonNode call(String path, Map<String, String> form, String idempotency) {
        var request = HttpRequest.newBuilder(URI.create("https://api.stripe.com/v1" + path))
                .timeout(Duration.ofSeconds(8)).header("Authorization", "Bearer " + key);
        if (idempotency != null) request.header("Idempotency-Key", idempotency);
        if (form != null) {
            String body = form.entrySet().stream().sorted(Map.Entry.comparingByKey())
                    .map(entry -> urlEncode(entry.getKey()) + "=" + urlEncode(entry.getValue()))
                    .collect(Collectors.joining("&"));
            request.header("Content-Type", "application/x-www-form-urlencoded").POST(HttpRequest.BodyPublishers.ofString(body));
        }
        try {
            var response = http.send(request.build(), HttpResponse.BodyHandlers.ofString());
            if (response.statusCode() / 100 != 2) throw unavailable();
            return json.readTree(response.body());
        } catch (IOException error) {
            throw unavailable();
        } catch (InterruptedException error) {
            Thread.currentThread().interrupt();
            throw unavailable();
        }
    }

    private boolean validSignature(String signature, byte[] body) {
        if (signature == null || signature.length() > 1500) return false;
        long timestamp = 0;
        var signatures = new ArrayList<String>();
        try {
            for (String pair : signature.split(",")) {
                if (pair.startsWith("t=")) timestamp = Long.parseLong(pair.substring(2));
                if (pair.startsWith("v1=")) signatures.add(pair.substring(3));
            }
            long now = Instant.now().getEpochSecond();
            if (timestamp < now - 300 || timestamp > now + 300) return false;
            Mac hmac = Mac.getInstance("HmacSHA256");
            hmac.init(new SecretKeySpec(webhook.getBytes(StandardCharsets.UTF_8), "HmacSHA256"));
            hmac.update((timestamp + ".").getBytes(StandardCharsets.US_ASCII));
            byte[] digest = hmac.doFinal(body);
            for (String entry : signatures) {
                if (entry.matches("[0-9a-fA-F]{64}") && MessageDigest.isEqual(digest, HexFormat.of().parseHex(entry))) return true;
            }
            return false;
        } catch (IllegalArgumentException | GeneralSecurityException error) {
            return false;
        }
    }

    private void requireEnabled() {
        if (!enabled()) throw new ResponseStatusException(HttpStatus.SERVICE_UNAVAILABLE, "Billing has not been configured.");
    }

    private static void validateId(String value) {
        if (!value.matches("[A-Za-z0-9_]{3,96}")) throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid Stripe identifier.");
    }

    private static String urlEncode(String value) { return URLEncoder.encode(value, StandardCharsets.UTF_8); }

    private static ResponseStatusException unavailable() {
        return new ResponseStatusException(HttpStatus.BAD_GATEWAY, "Stripe is temporarily unavailable.");
    }
}
