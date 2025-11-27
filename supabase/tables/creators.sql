-- =====================================================
-- Table: creators
-- Description: Stores information about Kickstarter project creators
-- =====================================================

-- Enable UUID extension (if not already enabled)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create creators table
CREATE TABLE IF NOT EXISTS creators (
    -- Primary key and identifiers
    id BIGINT PRIMARY KEY,
    slug VARCHAR(255),  -- Nullable - not all creators have this field
    name VARCHAR(500) NOT NULL,
    
    -- Registration information
    is_registered BOOLEAN,
    is_email_verified BOOLEAN,
    chosen_currency VARCHAR(3),
    is_superbacker BOOLEAN,
    
    -- Badges and actions
    has_admin_message_badge BOOLEAN DEFAULT false,
    ppo_has_action BOOLEAN DEFAULT false,
    backing_action_count INTEGER DEFAULT 0,
    
    -- Avatar (stored as JSONB for flexibility)
    avatar JSONB,
    -- Expected structure:
    -- {
    --   "thumb": "url",
    --   "small": "url",
    --   "medium": "url"
    -- }
    
    -- URLs (stored as JSONB)
    urls JSONB,
    -- Expected structure:
    -- {
    --   "web": {
    --     "user": "url"
    --   },
    --   "api": {
    --     "user": "url"
    --   }
    -- }
    
    -- Websites (array of objects)
    websites JSONB DEFAULT '[]'::jsonb,
    -- Expected structure:
    -- [
    --   {
    --     "url": "url",
    --     "domain": "domain"
    --   }
    -- ]
    
    -- Change detection
    data_hash TEXT,
    
    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- =====================================================
-- Indexes for query optimization
-- =====================================================

-- Unique index on slug for fast lookups (only for non-null slugs)
CREATE UNIQUE INDEX IF NOT EXISTS idx_creators_slug 
ON creators(slug)
WHERE slug IS NOT NULL;

-- Index on name for partial searches
CREATE INDEX IF NOT EXISTS idx_creators_name 
ON creators(name);

-- Index for filtering superbackers
CREATE INDEX IF NOT EXISTS idx_creators_is_superbacker 
ON creators(is_superbacker) 
WHERE is_superbacker = true;

-- GIN index for efficient JSONB search on websites
CREATE INDEX IF NOT EXISTS idx_creators_websites_gin 
ON creators USING GIN (websites);

-- Index for sorting by creation date
CREATE INDEX IF NOT EXISTS idx_creators_created_at 
ON creators(created_at DESC);

-- Index on data_hash for change detection
CREATE INDEX IF NOT EXISTS idx_creators_data_hash 
ON creators(data_hash);

-- =====================================================
-- Function to automatically update updated_at
-- =====================================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically update updated_at
DROP TRIGGER IF EXISTS set_creators_updated_at ON creators;
CREATE TRIGGER set_creators_updated_at
    BEFORE UPDATE ON creators
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- Table and column comments
-- =====================================================

COMMENT ON TABLE creators IS 'Stores information about Kickstarter project creators';
COMMENT ON COLUMN creators.id IS 'Unique creator ID on Kickstarter';
COMMENT ON COLUMN creators.slug IS 'Unique creator slug for friendly URLs (nullable - not all creators have this field)';
COMMENT ON COLUMN creators.name IS 'Full name of the creator';
COMMENT ON COLUMN creators.is_superbacker IS 'Indicates if the creator is a superbacker';
COMMENT ON COLUMN creators.avatar IS 'URLs of different avatar versions (thumb, small, medium)';
COMMENT ON COLUMN creators.urls IS 'URLs related to the creator profile (web and API)';
COMMENT ON COLUMN creators.websites IS 'List of creator websites/social media';
COMMENT ON COLUMN creators.created_at IS 'Record creation date';
COMMENT ON COLUMN creators.updated_at IS 'Last record update date';

-- =====================================================
-- RLS (Row Level Security) Policies - Optional
-- =====================================================

-- Enable RLS (uncomment if needed)
-- ALTER TABLE creators ENABLE ROW LEVEL SECURITY;

-- Public read policy (uncomment if needed)
-- CREATE POLICY "Allow public read access to creators"
-- ON creators FOR SELECT
-- USING (true);

-- Write policy for authenticated users only (uncomment if needed)
-- CREATE POLICY "Allow insert for authenticated users only"
-- ON creators FOR INSERT
-- WITH CHECK (auth.role() = 'authenticated');

-- =====================================================
-- End of script
-- =====================================================
