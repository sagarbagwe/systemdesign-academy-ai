package com.systemdesign.academy;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.util.Map;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ProblemDetail;
import org.springframework.http.ResponseCookie;
import org.springframework.web.bind.annotation.CookieValue;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

@RestController
@RequestMapping("/api")
class AcademyApi {
    private static final String SESSION = "academy_session";
    private final Accounts accounts;
    private final Tutor tutor;
    private final StripeBilling billing;
    private final String origin;
    private final boolean secureCookie;

    AcademyApi(Accounts accounts, Tutor tutor, StripeBilling billing, @Value("${academy.origin}") String origin,
            @Value("${academy.secure-cookie}") boolean secureCookie) {
        this.accounts = accounts;
        this.tutor = tutor;
        this.billing = billing;
        this.origin = origin;
        this.secureCookie = secureCookie;
    }

    record Credentials(String email, String password) {}
    record Question(String question) {}

    @GetMapping("/capabilities")
    Map<String, Boolean> capabilities() {
        return Map.of("tutor", tutor.enabled(), "billing", billing.enabled());
    }

    @PostMapping(path = "/auth/{action:login|register}", consumes = MediaType.APPLICATION_JSON_VALUE)
    Accounts.Account authenticate(@PathVariable String action, @RequestBody Credentials credentials,
            HttpServletRequest request, HttpServletResponse response,
            @CookieValue(name = SESSION, required = false) String previous) {
        sameOrigin(request);
        var session = accounts.start(action, request.getRemoteAddr(), credentials.email(), credentials.password());
        accounts.end(previous);
        response.addHeader(HttpHeaders.SET_COOKIE, cookie(session.token(), Accounts.SESSION_LENGTH.toSeconds()).toString());
        response.setHeader(HttpHeaders.CACHE_CONTROL, "no-store");
        return session.account();
    }

    @GetMapping("/auth/me")
    Accounts.Account me(@CookieValue(name = SESSION, required = false) String token, HttpServletResponse response) {
        response.setHeader(HttpHeaders.CACHE_CONTROL, "no-store");
        return accounts.require(token);
    }

    @PostMapping("/auth/logout")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    void logout(@CookieValue(name = SESSION, required = false) String token,
            HttpServletRequest request, HttpServletResponse response) {
        sameOrigin(request);
        accounts.end(token);
        response.addHeader(HttpHeaders.SET_COOKIE, cookie("", 0).toString());
    }

    @GetMapping("/workspace")
    Accounts.Snapshot workspace(@CookieValue(name = SESSION, required = false) String token, HttpServletResponse response) {
        response.setHeader(HttpHeaders.CACHE_CONTROL, "no-store");
        return accounts.workspace(accounts.require(token).id());
    }

    @PutMapping(path = "/workspace", consumes = MediaType.APPLICATION_JSON_VALUE)
    Accounts.Snapshot workspace(@CookieValue(name = SESSION, required = false) String token,
            @RequestBody Accounts.Snapshot snapshot, HttpServletRequest request, HttpServletResponse response) {
        sameOrigin(request);
        response.setHeader(HttpHeaders.CACHE_CONTROL, "no-store");
        return accounts.save(accounts.require(token).id(), snapshot);
    }

    @PostMapping(path = "/tutor", consumes = MediaType.APPLICATION_JSON_VALUE)
    Tutor.Reply ask(@CookieValue(name = SESSION, required = false) String token,
            @RequestBody Question question, HttpServletRequest request) {
        sameOrigin(request);
        var account = accounts.require(token);
        if (!tutor.enabled()) throw new ResponseStatusException(HttpStatus.SERVICE_UNAVAILABLE, "Live AI tutoring has not been configured.");
        String value = question.question() == null ? "" : question.question().strip();
        if (value.isEmpty() || value.length() > 1200) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Enter a question under 1,200 characters.");
        }
        accounts.reserveTutorCall(account);
        return tutor.answer(value);
    }

    @PostMapping("/billing/checkout")
    StripeBilling.Redirect checkout(@CookieValue(name = SESSION, required = false) String token, HttpServletRequest request) {
        sameOrigin(request);
        return billing.checkout(accounts.require(token));
    }

    @PostMapping("/billing/portal")
    StripeBilling.Redirect portal(@CookieValue(name = SESSION, required = false) String token, HttpServletRequest request) {
        sameOrigin(request);
        return billing.portal(accounts.require(token));
    }

    @PostMapping(path = "/billing/webhook", consumes = MediaType.APPLICATION_JSON_VALUE)
    @ResponseStatus(HttpStatus.NO_CONTENT)
    void webhook(@RequestHeader(name = "Stripe-Signature", required = false) String signature, @RequestBody byte[] body) {
        billing.webhook(signature, body);
    }

    @ExceptionHandler(ResponseStatusException.class)
    ProblemDetail problem(ResponseStatusException error) {
        return error.getBody();
    }

    private void sameOrigin(HttpServletRequest request) {
        String sent = request.getHeader(HttpHeaders.ORIGIN);
        if (sent != null && !origin.equals(sent)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "This request came from an unexpected origin.");
        }
    }

    private ResponseCookie cookie(String token, long seconds) {
        return ResponseCookie.from(SESSION, token).httpOnly(true).secure(secureCookie)
                .sameSite("Lax").path("/api").maxAge(seconds).build();
    }
}
