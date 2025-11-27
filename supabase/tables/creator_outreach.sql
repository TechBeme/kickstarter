-- =====================================================
-- Table: creator_outreach
-- Description: Tracks outreach status and contact information for creators
-- =====================================================

-- Create creator_outreach table
CREATE TABLE IF NOT EXISTS creator_outreach (
    -- Primary key (foreign key to creators)
    creator_id BIGINT PRIMARY KEY,
    
    -- Outreach status tracking
    outreach_status VARCHAR(50) NOT NULL DEFAULT 'not_contacted',
    -- Possible values:
    -- 'not_contacted' - No contact attempt made yet
    -- 'no_contact_info' - Creator has no contact information available
    -- 'contacted' - Message sent, awaiting response
    -- 'accepted' - Creator accepted the proposal
    -- 'declined' - Creator declined the proposal
    -- 'no_response' - Creator did not respond after contact
    -- 'invalid_contact' - Contact information is invalid/bounced
    
    -- Contact availability flags (auto-populated)
    has_instagram BOOLEAN DEFAULT false,
    has_facebook BOOLEAN DEFAULT false,
    has_twitter BOOLEAN DEFAULT false,
    has_youtube BOOLEAN DEFAULT false,
    has_tiktok BOOLEAN DEFAULT false,
    has_linkedin BOOLEAN DEFAULT false,
    has_patreon BOOLEAN DEFAULT false,
    has_discord BOOLEAN DEFAULT false,
    has_twitch BOOLEAN DEFAULT false,
    has_bluesky BOOLEAN DEFAULT false,
    has_other_website BOOLEAN DEFAULT false,
    has_any_contact BOOLEAN GENERATED ALWAYS AS (
        (email IS NOT NULL) OR COALESCE(has_contact_form, false)
    ) STORED,

    -- Contact info discovered via Firecrawl
    email TEXT,
    email_source_url TEXT,
    has_contact_form BOOLEAN,
    contact_form_url TEXT,
    last_contact_check_at TIMESTAMP WITH TIME ZONE,
    contact_status VARCHAR(50) DEFAULT 'not_checked',
    contact_error TEXT,
    contact_attempts INTEGER DEFAULT 0,
    site_hash TEXT,
    
    -- Contact URLs (denormalized for quick access)
    instagram_url TEXT,
    facebook_url TEXT,
    twitter_url TEXT,
    linkedin_url TEXT,
    youtube_url TEXT,
    tiktok_url TEXT,
    other_urls TEXT[], -- Array of other contact URLs
    
    -- Outreach details
    first_contacted_at TIMESTAMP WITH TIME ZONE,
    last_contacted_at TIMESTAMP WITH TIME ZONE,
    response_received_at TIMESTAMP WITH TIME ZONE,
    contact_method VARCHAR(50), -- 'instagram', 'email', 'facebook', etc.
    
    -- Notes and tracking
    notes TEXT,
    tags TEXT[], -- Flexible tagging system for custom categorization
    
    -- Priority and follow-up
    priority INTEGER DEFAULT 0, -- Higher number = higher priority
    follow_up_date DATE,
    
    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    -- Foreign Key constraint
    CONSTRAINT fk_creator_outreach
        FOREIGN KEY (creator_id)
        REFERENCES creators(id)
        ON DELETE CASCADE
        ON UPDATE CASCADE
);

-- =====================================================
-- Indexes for query optimization
-- =====================================================

-- Index on outreach status for filtering
CREATE INDEX IF NOT EXISTS idx_creator_outreach_status 
ON creator_outreach(outreach_status);

-- Index for finding creators without contact info
CREATE INDEX IF NOT EXISTS idx_creator_outreach_no_contact 
ON creator_outreach(outreach_status) 
WHERE outreach_status = 'no_contact_info';

-- Index for finding creators not yet contacted with contact info
CREATE INDEX IF NOT EXISTS idx_creator_outreach_ready_to_contact 
ON creator_outreach(has_any_contact, outreach_status) 
WHERE has_any_contact = true AND outreach_status = 'not_contacted';

-- Index for contact processing status
CREATE INDEX IF NOT EXISTS idx_creator_outreach_contact_status
ON creator_outreach(contact_status);

-- Index to find recent contact checks
CREATE INDEX IF NOT EXISTS idx_creator_outreach_last_contact_check
ON creator_outreach(last_contact_check_at);

-- Index to detect site changes quickly
CREATE INDEX IF NOT EXISTS idx_creator_outreach_site_hash
ON creator_outreach(site_hash);

-- Indexes for social media filtering
CREATE INDEX IF NOT EXISTS idx_creator_outreach_instagram 
ON creator_outreach(has_instagram) 
WHERE has_instagram = true;

CREATE INDEX IF NOT EXISTS idx_creator_outreach_twitter 
ON creator_outreach(has_twitter) 
WHERE has_twitter = true;

CREATE INDEX IF NOT EXISTS idx_creator_outreach_linkedin 
ON creator_outreach(has_linkedin) 
WHERE has_linkedin = true;

CREATE INDEX IF NOT EXISTS idx_creator_outreach_facebook 
ON creator_outreach(has_facebook) 
WHERE has_facebook = true;

CREATE INDEX IF NOT EXISTS idx_creator_outreach_youtube 
ON creator_outreach(has_youtube) 
WHERE has_youtube = true;

CREATE INDEX IF NOT EXISTS idx_creator_outreach_tiktok 
ON creator_outreach(has_tiktok) 
WHERE has_tiktok = true;

-- Index for priority and follow-up
CREATE INDEX IF NOT EXISTS idx_creator_outreach_priority 
ON creator_outreach(priority DESC, follow_up_date ASC NULLS LAST);

-- Index for follow-up dates
CREATE INDEX IF NOT EXISTS idx_creator_outreach_follow_up 
ON creator_outreach(follow_up_date) 
WHERE follow_up_date IS NOT NULL;

-- GIN index for tags array
CREATE INDEX IF NOT EXISTS idx_creator_outreach_tags_gin 
ON creator_outreach USING GIN (tags);

-- Index for recently contacted
CREATE INDEX IF NOT EXISTS idx_creator_outreach_last_contacted 
ON creator_outreach(last_contacted_at DESC NULLS LAST);

-- =====================================================
-- Trigger to automatically update updated_at
-- =====================================================

DROP TRIGGER IF EXISTS set_creator_outreach_updated_at ON creator_outreach;
CREATE TRIGGER set_creator_outreach_updated_at
    BEFORE UPDATE ON creator_outreach
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- Table and column comments
-- =====================================================

COMMENT ON TABLE creator_outreach IS 'Tracks outreach status and contact information for Kickstarter creators';
COMMENT ON COLUMN creator_outreach.creator_id IS 'Creator ID (foreign key to creators table)';
COMMENT ON COLUMN creator_outreach.outreach_status IS 'Current status of outreach efforts';
COMMENT ON COLUMN creator_outreach.has_any_contact IS 'Auto-computed: true if creator has any contact method available';
COMMENT ON COLUMN creator_outreach.has_instagram IS 'Creator has Instagram profile';
COMMENT ON COLUMN creator_outreach.has_twitter IS 'Creator has Twitter/X profile';
COMMENT ON COLUMN creator_outreach.has_linkedin IS 'Creator has LinkedIn profile';
COMMENT ON COLUMN creator_outreach.first_contacted_at IS 'Date of first contact attempt';
COMMENT ON COLUMN creator_outreach.last_contacted_at IS 'Date of most recent contact attempt';
COMMENT ON COLUMN creator_outreach.response_received_at IS 'Date when response was received';
COMMENT ON COLUMN creator_outreach.email IS 'Email discovered via contact extraction';
COMMENT ON COLUMN creator_outreach.email_source_url IS 'Source URL where email was found';
COMMENT ON COLUMN creator_outreach.has_contact_form IS 'Whether a contact form exists on the creator site';
COMMENT ON COLUMN creator_outreach.contact_form_url IS 'URL of the contact form, if available';
COMMENT ON COLUMN creator_outreach.last_contact_check_at IS 'Timestamp of the last contact extraction attempt';
COMMENT ON COLUMN creator_outreach.contact_status IS 'Status of the contact extraction (completed/not_found/blocked/error/not_checked)';
COMMENT ON COLUMN creator_outreach.contact_error IS 'Last error captured during contact extraction';
COMMENT ON COLUMN creator_outreach.contact_attempts IS 'How many times contact extraction was attempted';
COMMENT ON COLUMN creator_outreach.site_hash IS 'Hash of the canonical site to detect changes and trigger re-checks';
COMMENT ON COLUMN creator_outreach.contact_method IS 'Primary method used for contact';
COMMENT ON COLUMN creator_outreach.notes IS 'Free-form notes about the creator or outreach';
COMMENT ON COLUMN creator_outreach.tags IS 'Custom tags for flexible categorization';
COMMENT ON COLUMN creator_outreach.priority IS 'Contact priority (higher = more important)';
COMMENT ON COLUMN creator_outreach.follow_up_date IS 'Date to follow up with this creator';
COMMENT ON COLUMN creator_outreach.created_at IS 'Record creation date';
COMMENT ON COLUMN creator_outreach.updated_at IS 'Last record update date';

-- =====================================================
-- Useful views for common queries
-- =====================================================

-- View: Creators ready to contact (with contact info, not yet contacted)
CREATE OR REPLACE VIEW vw_creators_ready_to_contact AS
SELECT 
    co.*,
    c.name as creator_name,
    c.slug as creator_slug,
    c.websites
FROM creator_outreach co
INNER JOIN creators c ON co.creator_id = c.id
WHERE co.has_any_contact = true 
  AND co.outreach_status = 'not_contacted'
ORDER BY co.priority DESC, c.name;

COMMENT ON VIEW vw_creators_ready_to_contact IS 'Creators with contact info who have not been contacted yet';

-- View: Creators without contact information
CREATE OR REPLACE VIEW vw_creators_no_contact AS
SELECT 
    co.*,
    c.name as creator_name,
    c.slug as creator_slug,
    c.websites
FROM creator_outreach co
INNER JOIN creators c ON co.creator_id = c.id
WHERE co.outreach_status = 'no_contact_info'
ORDER BY c.name;

COMMENT ON VIEW vw_creators_no_contact IS 'Creators marked as having no contact information';

-- View: Creators needing follow-up
CREATE OR REPLACE VIEW vw_creators_follow_up AS
SELECT 
    co.*,
    c.name as creator_name,
    c.slug as creator_slug,
    c.websites
FROM creator_outreach co
INNER JOIN creators c ON co.creator_id = c.id
WHERE co.follow_up_date IS NOT NULL 
  AND co.follow_up_date <= CURRENT_DATE
  AND co.outreach_status IN ('contacted', 'no_response')
ORDER BY co.follow_up_date ASC, co.priority DESC;

COMMENT ON VIEW vw_creators_follow_up IS 'Creators who need follow-up today or earlier';

-- View: Outreach statistics
CREATE OR REPLACE VIEW vw_outreach_statistics AS
SELECT 
    outreach_status,
    COUNT(*) as count,
    COUNT(*) FILTER (WHERE has_instagram) as with_instagram,
    COUNT(*) FILTER (WHERE has_twitter) as with_twitter,
    COUNT(*) FILTER (WHERE has_linkedin) as with_linkedin,
    COUNT(*) FILTER (WHERE has_facebook) as with_facebook,
    COUNT(*) FILTER (WHERE has_youtube) as with_youtube,
    COUNT(*) FILTER (WHERE has_any_contact) as with_any_contact
FROM creator_outreach
GROUP BY outreach_status
ORDER BY 
    CASE outreach_status
        WHEN 'not_contacted' THEN 1
        WHEN 'contacted' THEN 2
        WHEN 'accepted' THEN 3
        WHEN 'declined' THEN 4
        WHEN 'no_response' THEN 5
        WHEN 'no_contact_info' THEN 6
        WHEN 'invalid_contact' THEN 7
        ELSE 99
    END;

COMMENT ON VIEW vw_outreach_statistics IS 'Aggregated statistics about outreach efforts';

-- View: Complete creator information with outreach status
CREATE OR REPLACE VIEW vw_creators_complete AS
SELECT 
    c.id,
    c.name,
    c.slug,
    c.is_superbacker,
    c.websites,
    co.outreach_status,
    co.has_instagram,
    co.has_twitter,
    co.has_linkedin,
    co.has_facebook,
    co.has_youtube,
    co.has_tiktok,
    co.has_any_contact,
    co.instagram_url,
    co.twitter_url,
    co.linkedin_url,
    co.first_contacted_at,
    co.last_contacted_at,
    co.response_received_at,
    co.contact_method,
    co.notes,
    co.tags,
    co.priority,
    co.follow_up_date,
    COUNT(p.id) as project_count
FROM creators c
LEFT JOIN creator_outreach co ON c.id = co.creator_id
LEFT JOIN projects p ON c.id = p.creator_id
GROUP BY 
    c.id, c.name, c.slug, c.is_superbacker, c.websites,
    co.outreach_status, co.has_instagram, co.has_twitter, 
    co.has_linkedin, co.has_facebook, co.has_youtube, co.has_tiktok,
    co.has_any_contact, co.instagram_url, co.twitter_url, co.linkedin_url,
    co.first_contacted_at, co.last_contacted_at, co.response_received_at,
    co.contact_method, co.notes, co.tags, co.priority, co.follow_up_date
ORDER BY c.name;

COMMENT ON VIEW vw_creators_complete IS 'Complete creator information including outreach status and project count';

-- =====================================================
-- RLS (Row Level Security) Policies - Optional
-- =====================================================

-- Enable RLS (uncomment if needed)
-- ALTER TABLE creator_outreach ENABLE ROW LEVEL SECURITY;

-- Public read policy (uncomment if needed)
-- CREATE POLICY "Allow public read access to creator_outreach"
-- ON creator_outreach FOR SELECT
-- USING (true);

-- Write policy for authenticated users only (uncomment if needed)
-- CREATE POLICY "Allow write for authenticated users only"
-- ON creator_outreach FOR ALL
-- USING (auth.role() = 'authenticated')
-- WITH CHECK (auth.role() = 'authenticated');

-- =====================================================
-- End of script
-- =====================================================
