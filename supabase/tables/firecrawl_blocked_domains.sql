-- =====================================================
-- Table: firecrawl_blocked_domains
-- Description: Tracks domains blocked for Firecrawl extraction (shared state)
-- =====================================================

CREATE TABLE IF NOT EXISTS firecrawl_blocked_domains (
    domain TEXT PRIMARY KEY,
    reason TEXT,
    source TEXT DEFAULT 'firecrawl',
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Trigger for updated_at
DROP TRIGGER IF EXISTS set_firecrawl_blocked_domains_updated_at ON firecrawl_blocked_domains;
CREATE TRIGGER set_firecrawl_blocked_domains_updated_at
    BEFORE UPDATE ON firecrawl_blocked_domains
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

COMMENT ON TABLE firecrawl_blocked_domains IS 'Domains blocked for Firecrawl contact extraction.';
COMMENT ON COLUMN firecrawl_blocked_domains.domain IS 'Domain name (primary key).';
COMMENT ON COLUMN firecrawl_blocked_domains.reason IS 'Reason for blocking (e.g., not supported, payment required).';
COMMENT ON COLUMN firecrawl_blocked_domains.source IS 'Subsystem that blocked (default firecrawl).';
