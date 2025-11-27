-- =====================================================
-- Table: projects
-- Description: Stores information about Kickstarter projects
-- =====================================================

-- Create projects table
CREATE TABLE IF NOT EXISTS projects (
    -- Primary key and identifiers
    id BIGINT PRIMARY KEY,
    slug VARCHAR(500) NOT NULL,
    name VARCHAR(1000) NOT NULL,
    blurb TEXT,
    
    -- Financial information
    goal DECIMAL(15, 2) NOT NULL,
    pledged DECIMAL(15, 2) DEFAULT 0,
    percent_funded DECIMAL(10, 2) DEFAULT 0,
    backers_count INTEGER DEFAULT 0,
    
    -- Currency and conversion
    currency VARCHAR(3) NOT NULL,
    currency_symbol VARCHAR(10),
    currency_trailing_code BOOLEAN DEFAULT false,
    static_usd_rate DECIMAL(15, 6) DEFAULT 0,
    usd_pledged DECIMAL(15, 2),
    converted_pledged_amount DECIMAL(15, 2),
    fx_rate DECIMAL(15, 8),
    usd_exchange_rate DECIMAL(15, 8),
    current_currency VARCHAR(3),
    usd_type VARCHAR(50),
    
    -- Location
    country VARCHAR(2) NOT NULL,
    country_displayable_name VARCHAR(255),
    
    -- Location (JSONB for detailed location data)
    location JSONB,
    -- Expected structure:
    -- {
    --   "id": number,
    --   "name": "string",
    --   "slug": "string",
    --   "short_name": "string",
    --   "displayable_name": "string",
    --   "localized_name": "string",
    --   "country": "string",
    --   "state": "string",
    --   "type": "string",
    --   "is_root": boolean,
    --   "urls": {...}
    -- }
    
    -- Status and dates
    state VARCHAR(50) NOT NULL,
    state_changed_at TIMESTAMP WITH TIME ZONE,
    created_at_ks TIMESTAMP WITH TIME ZONE NOT NULL,
    launched_at TIMESTAMP WITH TIME ZONE,
    deadline TIMESTAMP WITH TIME ZONE,
    
    -- Project features
    staff_pick BOOLEAN DEFAULT false,
    spotlight BOOLEAN DEFAULT false,
    is_starrable BOOLEAN DEFAULT true,
    disable_communication BOOLEAN DEFAULT false,
    is_in_post_campaign_pledging_phase BOOLEAN DEFAULT false,
    is_launched BOOLEAN DEFAULT false,
    prelaunch_activated BOOLEAN DEFAULT false,
    
    -- User interactions
    is_liked BOOLEAN DEFAULT false,
    is_disliked BOOLEAN DEFAULT false,
    
    -- Relationship with Creator (FOREIGN KEY)
    creator_id BIGINT NOT NULL,
    
    -- Project photo (JSONB for all variations)
    photo JSONB,
    -- Expected structure:
    -- {
    --   "key": "string",
    --   "full": "url",
    --   "ed": "url",
    --   "med": "url",
    --   "little": "url",
    --   "small": "url",
    --   "thumb": "url",
    --   "1024x576": "url",
    --   "1536x864": "url"
    -- }
    
    -- Category (JSONB)
    category JSONB,
    -- Expected structure:
    -- {
    --   "id": number,
    --   "name": "string",
    --   "analytics_name": "string",
    --   "slug": "string",
    --   "position": number,
    --   "parent_id": number,
    --   "parent_name": "string",
    --   "color": number,
    --   "urls": {...}
    -- }
    
    -- Video (JSONB - can be null)
    video JSONB,
    
    -- Profile (JSONB)
    profile JSONB,
    -- Expected structure:
    -- {
    --   "id": number,
    --   "project_id": number,
    --   "state": "string",
    --   "state_changed_at": number,
    --   "name": "string",
    --   "blurb": "string",
    --   "background_color": "string",
    --   "text_color": "string",
    --   "link_background_color": "string",
    --   "link_text_color": "string",
    --   "link_text": "string",
    --   "link_url": "string",
    --   "show_feature_image": boolean,
    --   "background_image_opacity": number,
    --   "should_show_feature_image_section": boolean,
    --   "feature_image_attributes": {...}
    -- }
    
    -- URLs (JSONB)
    urls JSONB,
    -- Expected structure:
    -- {
    --   "web": {
    --     "project": "url",
    --     "rewards": "url"
    --   }
    -- }
    
    -- Change detection
    data_hash TEXT,
    
    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    -- Foreign Key constraint
    CONSTRAINT fk_creator
        FOREIGN KEY (creator_id)
        REFERENCES creators(id)
        ON DELETE RESTRICT
        ON UPDATE CASCADE
);

-- =====================================================
-- Indexes for query optimization
-- =====================================================

-- Unique index on slug
CREATE UNIQUE INDEX IF NOT EXISTS idx_projects_slug 
ON projects(slug);

-- Index on foreign key to creators
CREATE INDEX IF NOT EXISTS idx_projects_creator_id 
ON projects(creator_id);

-- Index on name for searches
CREATE INDEX IF NOT EXISTS idx_projects_name 
ON projects(name);

-- Index on project state
CREATE INDEX IF NOT EXISTS idx_projects_state 
ON projects(state);

-- Index on country
CREATE INDEX IF NOT EXISTS idx_projects_country 
ON projects(country);

-- Composite index for featured projects
CREATE INDEX IF NOT EXISTS idx_projects_staff_pick_state 
ON projects(staff_pick, state) 
WHERE staff_pick = true;

-- Index for sorting by launch date
CREATE INDEX IF NOT EXISTS idx_projects_launched_at 
ON projects(launched_at DESC NULLS LAST);

-- Index for sorting by deadline
CREATE INDEX IF NOT EXISTS idx_projects_deadline 
ON projects(deadline DESC NULLS LAST);

-- Index for sorting by pledged amount
CREATE INDEX IF NOT EXISTS idx_projects_pledged 
ON projects(pledged DESC);

-- Index for sorting by number of backers
CREATE INDEX IF NOT EXISTS idx_projects_backers_count 
ON projects(backers_count DESC);

-- Index on data_hash for change detection
CREATE INDEX IF NOT EXISTS idx_projects_data_hash 
ON projects(data_hash);

-- GIN index for searching in category JSONB
CREATE INDEX IF NOT EXISTS idx_projects_category_gin 
ON projects USING GIN (category);

-- Index for sorting by creation date
CREATE INDEX IF NOT EXISTS idx_projects_created_at 
ON projects(created_at DESC);

-- Partial index for successful projects
CREATE INDEX IF NOT EXISTS idx_projects_successful 
ON projects(state, pledged, goal) 
WHERE state = 'successful';

-- Partial index for active projects
CREATE INDEX IF NOT EXISTS idx_projects_live 
ON projects(state, deadline) 
WHERE state IN ('live', 'started');

-- =====================================================
-- Trigger to automatically update updated_at
-- =====================================================

DROP TRIGGER IF EXISTS set_projects_updated_at ON projects;
CREATE TRIGGER set_projects_updated_at
    BEFORE UPDATE ON projects
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- Table and main column comments
-- =====================================================

COMMENT ON TABLE projects IS 'Stores information about Kickstarter projects';
COMMENT ON COLUMN projects.id IS 'Unique project ID on Kickstarter';
COMMENT ON COLUMN projects.slug IS 'Unique project slug for friendly URLs';
COMMENT ON COLUMN projects.name IS 'Full project name';
COMMENT ON COLUMN projects.blurb IS 'Short project description';
COMMENT ON COLUMN projects.goal IS 'Funding goal';
COMMENT ON COLUMN projects.pledged IS 'Amount pledged';
COMMENT ON COLUMN projects.percent_funded IS 'Percentage of goal achieved';
COMMENT ON COLUMN projects.backers_count IS 'Total number of backers';
COMMENT ON COLUMN projects.state IS 'Current project state (live, successful, failed, started, etc)';
COMMENT ON COLUMN projects.staff_pick IS 'Indicates if chosen by Kickstarter staff';
COMMENT ON COLUMN projects.creator_id IS 'Creator ID of the project (foreign key to creators)';
COMMENT ON COLUMN projects.photo IS 'URLs of different versions of the project photo';
COMMENT ON COLUMN projects.category IS 'Complete information about the project category';
COMMENT ON COLUMN projects.video IS 'Project video information (if available)';
COMMENT ON COLUMN projects.profile IS 'Project profile/page information';
COMMENT ON COLUMN projects.urls IS 'URLs related to the project';
COMMENT ON COLUMN projects.created_at IS 'Database record creation date';
COMMENT ON COLUMN projects.updated_at IS 'Last database record update date';

-- =====================================================
-- Useful views for common queries
-- =====================================================

-- View: Projects with creator information
CREATE OR REPLACE VIEW vw_projects_with_creators AS
SELECT 
    p.*,
    c.name as creator_name,
    c.slug as creator_slug,
    c.is_superbacker as creator_is_superbacker,
    c.websites as creator_websites
FROM projects p
INNER JOIN creators c ON p.creator_id = c.id;

COMMENT ON VIEW vw_projects_with_creators IS 'View with projects and basic creator information';

-- View: Statistics by category
CREATE OR REPLACE VIEW vw_category_statistics AS
SELECT 
    category->>'name' as category_name,
    category->>'parent_name' as parent_category,
    COUNT(*) as total_projects,
    COUNT(*) FILTER (WHERE state = 'successful') as successful_projects,
    COUNT(*) FILTER (WHERE state = 'failed') as failed_projects,
    COUNT(*) FILTER (WHERE state IN ('live', 'started')) as active_projects,
    ROUND(AVG(percent_funded), 2) as avg_percent_funded,
    SUM(pledged) as total_pledged,
    SUM(backers_count) as total_backers
FROM projects
WHERE category IS NOT NULL
GROUP BY category->>'name', category->>'parent_name'
ORDER BY total_projects DESC;

COMMENT ON VIEW vw_category_statistics IS 'Aggregated statistics by category';

-- View: Featured active projects
CREATE OR REPLACE VIEW vw_featured_active_projects AS
SELECT 
    p.id,
    p.name,
    p.blurb,
    p.goal,
    p.pledged,
    p.percent_funded,
    p.backers_count,
    p.state,
    p.deadline,
    p.category->>'name' as category_name,
    c.name as creator_name,
    c.slug as creator_slug
FROM projects p
INNER JOIN creators c ON p.creator_id = c.id
WHERE p.staff_pick = true 
  AND p.state IN ('live', 'started')
ORDER BY p.launched_at DESC;

COMMENT ON VIEW vw_featured_active_projects IS 'Featured projects that are currently active';

-- =====================================================
-- RLS (Row Level Security) Policies - Optional
-- =====================================================

-- Enable RLS (uncomment if needed)
-- ALTER TABLE projects ENABLE ROW LEVEL SECURITY;

-- Public read policy (uncomment if needed)
-- CREATE POLICY "Allow public read access to projects"
-- ON projects FOR SELECT
-- USING (true);

-- Write policy for authenticated users only (uncomment if needed)
-- CREATE POLICY "Allow insert for authenticated users only"
-- ON projects FOR INSERT
-- WITH CHECK (auth.role() = 'authenticated');

-- =====================================================
-- End of script
-- =====================================================
