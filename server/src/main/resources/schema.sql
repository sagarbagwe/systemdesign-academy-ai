CREATE TABLE IF NOT EXISTS academy_account (
    id VARCHAR(36) PRIMARY KEY,
    email VARCHAR(254) NOT NULL UNIQUE,
    password_hash VARCHAR(144) NOT NULL,
    stripe_customer VARCHAR(96) UNIQUE,
    stripe_checkout VARCHAR(96),
    pro_until BIGINT NOT NULL DEFAULT 0,
    quota_period VARCHAR(7),
    quota_used INTEGER NOT NULL DEFAULT 0
);
CREATE TABLE IF NOT EXISTS academy_session (
    token_hash VARCHAR(64) PRIMARY KEY,
    account_id VARCHAR(36) NOT NULL REFERENCES academy_account(id) ON DELETE CASCADE,
    expires_at BIGINT NOT NULL
);
CREATE INDEX IF NOT EXISTS academy_session_expiry ON academy_session(expires_at);
CREATE TABLE IF NOT EXISTS academy_workspace (
    account_id VARCHAR(36) PRIMARY KEY REFERENCES academy_account(id) ON DELETE CASCADE,
    revision BIGINT NOT NULL,
    progress TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS academy_stripe_event (
    event_id VARCHAR(96) PRIMARY KEY,
    processed_at BIGINT NOT NULL
);
