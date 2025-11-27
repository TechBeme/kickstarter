-- =====================================================
-- Table: pipeline_state
-- Description: Tracks incremental execution state of the Kickstarter + Firecrawl pipeline
-- =====================================================

-- Ensure helper function exists
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create pipeline_state table (single row control)
CREATE TABLE IF NOT EXISTS pipeline_state (
    id SMALLINT PRIMARY KEY DEFAULT 1 CHECK (id = 1),
    last_run_at TIMESTAMP WITH TIME ZONE,
    last_project_created_at TIMESTAMP WITH TIME ZONE,
    last_contact_check_at TIMESTAMP WITH TIME ZONE,
    last_site_hash TEXT,
    run_notes TEXT,
    pipeline_version TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Trigger to update updated_at
DROP TRIGGER IF EXISTS set_pipeline_state_updated_at ON pipeline_state;
CREATE TRIGGER set_pipeline_state_updated_at
    BEFORE UPDATE ON pipeline_state
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Ensure a single control row exists
INSERT INTO pipeline_state (id)
VALUES (1)
ON CONFLICT (id) DO NOTHING;

COMMENT ON TABLE pipeline_state IS 'Tracks last run timestamps and hashes for the Kickstarter + Firecrawl pipeline';
