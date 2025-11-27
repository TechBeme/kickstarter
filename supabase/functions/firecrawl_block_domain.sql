-- Function: firecrawl_block_domain
-- Upsert a blocked domain (idempotent)

CREATE OR REPLACE FUNCTION firecrawl_block_domain(
    p_domain TEXT,
    p_reason TEXT DEFAULT 'Not supported by Firecrawl',
    p_source TEXT DEFAULT 'firecrawl',
    p_notes TEXT DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
    IF p_domain IS NULL OR length(trim(p_domain)) = 0 THEN
        RAISE NOTICE 'Skipping empty domain';
        RETURN;
    END IF;

    INSERT INTO firecrawl_blocked_domains (domain, reason, source, notes)
    VALUES (lower(p_domain), p_reason, p_source, p_notes)
    ON CONFLICT (domain) DO UPDATE SET
        reason = COALESCE(EXCLUDED.reason, firecrawl_blocked_domains.reason),
        source = COALESCE(EXCLUDED.source, firecrawl_blocked_domains.source),
        notes = COALESCE(EXCLUDED.notes, firecrawl_blocked_domains.notes),
        updated_at = CURRENT_TIMESTAMP;
END;
$$;

COMMENT ON FUNCTION firecrawl_block_domain(TEXT, TEXT, TEXT, TEXT) IS 'Upsert a blocked domain for Firecrawl contact extraction.';
