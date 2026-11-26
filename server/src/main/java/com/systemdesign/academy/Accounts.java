package com.systemdesign.academy;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.nio.charset.StandardCharsets;
import java.security.GeneralSecurityException;
import java.security.MessageDigest;
import java.security.SecureRandom;
import java.time.Duration;
import java.time.YearMonth;
import java.time.ZoneOffset;
import java.util.Base64;
import java.util.HexFormat;
import java.util.Locale;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.atomic.AtomicLong;
import javax.crypto.SecretKeyFactory;
import javax.crypto.spec.PBEKeySpec;
import org.springframework.dao.DuplicateKeyException;
import org.springframework.http.HttpStatus;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

@Service
class Accounts {
    static final Duration SESSION_LENGTH = Duration.ofDays(14);
    private static final int ITERATIONS = 600_000;
    private static final SecureRandom RANDOM = new SecureRandom();
    private static final Base64.Encoder ENCODER = Base64.getUrlEncoder().withoutPadding();
    private static final Base64.Decoder DECODER = Base64.getUrlDecoder();
    private final JdbcTemplate db;
    private final ObjectMapper json;
    private final String dummyPassword = passwordHash("unused random password " + UUID.randomUUID());
    private final ConcurrentHashMap<String, Window> authLimits = new ConcurrentHashMap<>();
    private final AtomicLong nextSweep = new AtomicLong();

    Accounts(JdbcTemplate db, ObjectMapper json) {
        this.db = db;
        this.json = json;
    }

    record Account(String id, String email, boolean pro) {}
    record Session(Account account, String token) {}
    record Snapshot(long revision, JsonNode data) {}
    private record Window(int count, long expiresAt) {}
    private record Login(String id, String passwordHash) {}

    Session start(String endpoint, String address, String emailInput, String password) {
        throttle(address);
        String email = emailInput == null ? "" : emailInput.strip().toLowerCase(Locale.ROOT);
        if (email.length() > 254 || !email.matches("[^@\\s]+@[^@\\s]+\\.[^@\\s]+")
                || password == null || password.isEmpty() || password.length() > 128) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Enter a valid email and password.");
        }
        String id;
        if (endpoint.equals("register")) {
            if (password.length() < 12) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Choose a password with at least 12 characters.");
            }
            id = UUID.randomUUID().toString();
            try {
                db.update("INSERT INTO academy_account(id,email,password_hash) VALUES (?,?,?)", id, email, passwordHash(password));
            } catch (DuplicateKeyException conflict) {
                throw new ResponseStatusException(HttpStatus.CONFLICT, "An account already exists. Sign in instead.");
            }
        } else {
            var login = db.query("SELECT id,password_hash FROM academy_account WHERE email=?",
                    (row, index) -> new Login(row.getString(1), row.getString(2)), email).stream().findFirst();
            if (!matches(password, login.map(Login::passwordHash).orElse(dummyPassword)) || login.isEmpty()) {
                throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "The email or password is incorrect.");
            }
            id = login.orElseThrow().id();
        }
        var token = ENCODER.encodeToString(randomBytes(32));
        long now = System.currentTimeMillis();
        db.update("DELETE FROM academy_session WHERE expires_at<=?", now);
        db.update("INSERT INTO academy_session(token_hash,account_id,expires_at) VALUES (?,?,?)",
                tokenHash(token), id, now + SESSION_LENGTH.toMillis());
        return new Session(findAccount(id), token);
    }

    Account require(String token) {
        if (token == null || !token.matches("[A-Za-z0-9_-]{43}")) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Sign in to continue.");
        }
        return db.query("""
                SELECT a.id,a.email,a.pro_until FROM academy_session s
                JOIN academy_account a ON a.id=s.account_id WHERE s.token_hash=? AND s.expires_at>?
                """, (row, index) -> new Account(row.getString(1), row.getString(2), row.getLong(3) > System.currentTimeMillis()),
                tokenHash(token), System.currentTimeMillis()).stream().findFirst()
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Sign in to continue."));
    }

    void end(String token) {
        if (token != null && token.matches("[A-Za-z0-9_-]{43}")) {
            db.update("DELETE FROM academy_session WHERE token_hash=?", tokenHash(token));
        }
    }

    Snapshot workspace(String id) {
        return db.query("SELECT revision,progress FROM academy_workspace WHERE account_id=?",
                (row, i) -> new Snapshot(row.getLong(1), parse(row.getString(2))), id)
                .stream().findFirst().orElse(new Snapshot(0, null));
    }

    @Transactional
    public Snapshot save(String id, Snapshot snapshot) {
        db.queryForObject("SELECT id FROM academy_account WHERE id=? FOR UPDATE", String.class, id);
        var current = workspace(id);
        if (snapshot.revision() != current.revision()) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "A newer workspace copy exists.");
        }
        long revision = snapshot.revision() + 1;
        String payload = validate(snapshot.data());
        if (current.revision() == 0) {
            db.update("INSERT INTO academy_workspace(account_id,revision,progress) VALUES (?,?,?)", id, revision, payload);
        } else {
            db.update("UPDATE academy_workspace SET revision=?,progress=? WHERE account_id=?", revision, payload, id);
        }
        return new Snapshot(revision, snapshot.data());
    }

    @Transactional
    public void reserveTutorCall(Account account) {
        String period = YearMonth.now(ZoneOffset.UTC).toString();
        int used = db.queryForObject("""
                SELECT CASE WHEN quota_period=? THEN quota_used ELSE 0 END
                FROM academy_account WHERE id=? FOR UPDATE
                """, Integer.class, period, account.id());
        if (used >= (account.pro() ? 25 : 5)) {
            throw new ResponseStatusException(HttpStatus.TOO_MANY_REQUESTS, "You have reached this month’s AI tutor limit.");
        }
        db.update("UPDATE academy_account SET quota_period=?,quota_used=? WHERE id=?", period, used + 1, account.id());
    }

    private Account findAccount(String id) {
        return db.queryForObject("SELECT id,email,pro_until FROM academy_account WHERE id=?",
                (row, index) -> new Account(row.getString(1), row.getString(2), row.getLong(3) > System.currentTimeMillis()), id);
    }

    private String validate(JsonNode data) {
        if (data == null || !data.isObject() || data.path("version").asInt(-1) != 1
                || !data.path("profile").isObject() || !data.path("completed").isArray()
                || !data.path("drafts").isObject() || !data.path("attempts").isArray()
                || !data.path("quizChoices").isObject()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid workspace data.");
        }
        String payload = data.toString();
        if (payload.getBytes(StandardCharsets.UTF_8).length > 512 * 1024) {
            throw new ResponseStatusException(HttpStatus.PAYLOAD_TOO_LARGE, "Export your archive before syncing a smaller workspace.");
        }
        return payload;
    }

    private JsonNode parse(String data) {
        try { return json.readTree(data); }
        catch (java.io.IOException error) { throw new IllegalStateException("Invalid stored workspace", error); }
    }

    private void throttle(String address) {
        long now = System.currentTimeMillis();
        long scheduled = nextSweep.get();
        if (now >= scheduled && nextSweep.compareAndSet(scheduled, now + 60_000)) {
            authLimits.entrySet().removeIf(entry -> entry.getValue().expiresAt() <= now);
        }
        var slot = authLimits.compute(address, (key, window) ->
                window == null || window.expiresAt() <= now ? new Window(1, now + 60_000)
                        : new Window(window.count() + 1, window.expiresAt()));
        if (slot.count() > 12) {
            throw new ResponseStatusException(HttpStatus.TOO_MANY_REQUESTS, "Wait a minute before trying again.");
        }
    }

    private static String passwordHash(String password) {
        byte[] salt = randomBytes(16);
        return ENCODER.encodeToString(salt) + "." + ENCODER.encodeToString(passwordBytes(password, salt));
    }

    private static boolean matches(String password, String stored) {
        String[] parts = stored.split("\\.", 2);
        return MessageDigest.isEqual(DECODER.decode(parts[1]), passwordBytes(password, DECODER.decode(parts[0])));
    }

    private static byte[] passwordBytes(String password, byte[] salt) {
        var spec = new PBEKeySpec(password.toCharArray(), salt, ITERATIONS, 256);
        try { return SecretKeyFactory.getInstance("PBKDF2WithHmacSHA256").generateSecret(spec).getEncoded(); }
        catch (GeneralSecurityException error) { throw new IllegalStateException("Unable to hash password", error); }
        finally { spec.clearPassword(); }
    }

    private static String tokenHash(String token) {
        try {
            return HexFormat.of().formatHex(MessageDigest.getInstance("SHA-256").digest(token.getBytes(StandardCharsets.US_ASCII)));
        } catch (GeneralSecurityException error) {
            throw new IllegalStateException("Unable to hash session token", error);
        }
    }

    private static byte[] randomBytes(int count) {
        byte[] value = new byte[count];
        RANDOM.nextBytes(value);
        return value;
    }
}
