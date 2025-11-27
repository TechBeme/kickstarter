-- =====================================================
-- Table: firecrawl_accounts
-- Description: Stores Firecrawl API accounts/keys and status
-- =====================================================

CREATE TABLE IF NOT EXISTS firecrawl_accounts (
    id BIGSERIAL PRIMARY KEY,
    email TEXT,
    api_key TEXT UNIQUE NOT NULL,
    status TEXT DEFAULT 'active',
    exhausted_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    notes TEXT
);

DROP TRIGGER IF EXISTS set_firecrawl_accounts_updated_at ON firecrawl_accounts;
CREATE TRIGGER set_firecrawl_accounts_updated_at
    BEFORE UPDATE ON firecrawl_accounts
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

COMMENT ON TABLE firecrawl_accounts IS 'Firecrawl API accounts and status (active/exhausted).';
COMMENT ON COLUMN firecrawl_accounts.api_key IS 'Firecrawl API key (unique).';
COMMENT ON COLUMN firecrawl_accounts.status IS 'Account status: active/exhausted/etc.';
