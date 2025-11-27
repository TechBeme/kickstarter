-- =====================================================
-- Function: search_creators
-- Description: Search creators with filters including social media and outreach status
-- Returns: Creators with their outreach data and project count
-- =====================================================

CREATE OR REPLACE FUNCTION search_creators(
    p_search TEXT DEFAULT NULL,
    p_min_backed INTEGER DEFAULT NULL,
    p_outreach_status TEXT DEFAULT NULL,
    p_has_instagram BOOLEAN DEFAULT FALSE,
    p_has_facebook BOOLEAN DEFAULT FALSE,
    p_has_twitter BOOLEAN DEFAULT FALSE,
    p_has_youtube BOOLEAN DEFAULT FALSE,
    p_has_tiktok BOOLEAN DEFAULT FALSE,
    p_has_linkedin BOOLEAN DEFAULT FALSE,
    p_has_patreon BOOLEAN DEFAULT FALSE,
    p_has_discord BOOLEAN DEFAULT FALSE,
    p_has_twitch BOOLEAN DEFAULT FALSE,
    p_has_bluesky BOOLEAN DEFAULT FALSE,
    p_has_other_website BOOLEAN DEFAULT FALSE,
    p_has_website BOOLEAN DEFAULT FALSE,
    p_limit INTEGER DEFAULT 50,
    p_offset INTEGER DEFAULT 0
)
RETURNS TABLE (
    id BIGINT,
    name VARCHAR,
    slug VARCHAR,
    avatar JSONB,
    urls JSONB,
    is_superbacker BOOLEAN,
    websites JSONB,
    backed_action_count INTEGER,
    project_count BIGINT,
    outreach_status VARCHAR,
    total_count BIGINT
) 
LANGUAGE plpgsql
AS $$
DECLARE
    v_total_count BIGINT;
BEGIN
    -- Get total count first
    SELECT COUNT(DISTINCT c.id) INTO v_total_count
    FROM creators c
    LEFT JOIN creator_outreach co ON co.creator_id = c.id
    WHERE 
        -- Search filter
        (p_search IS NULL OR c.name ILIKE '%' || p_search || '%' OR c.slug ILIKE '%' || p_search || '%')
        
        -- Backed count filter
        AND (p_min_backed IS NULL OR c.backing_action_count >= p_min_backed)
        
        -- Outreach status filter
        AND (p_outreach_status IS NULL OR p_outreach_status = 'all' OR COALESCE(co.outreach_status, 'not_contacted') = p_outreach_status)
        
        -- Social media filters
        AND (p_has_instagram = FALSE OR EXISTS (
            SELECT 1 FROM jsonb_array_elements(c.websites) as w
            WHERE w->>'type' ILIKE '%instagram%' OR w->>'domain' ILIKE '%instagram.com%'
        ))
        AND (p_has_facebook = FALSE OR EXISTS (
            SELECT 1 FROM jsonb_array_elements(c.websites) as w
            WHERE w->>'type' ILIKE '%facebook%' OR w->>'domain' ILIKE '%facebook.com%'
        ))
        AND (p_has_twitter = FALSE OR EXISTS (
            SELECT 1 FROM jsonb_array_elements(c.websites) as w
            WHERE w->>'type' ILIKE '%twitter%' OR w->>'domain' ILIKE '%twitter.com%' OR w->>'domain' ILIKE '%x.com%'
        ))
        AND (p_has_youtube = FALSE OR EXISTS (
            SELECT 1 FROM jsonb_array_elements(c.websites) as w
            WHERE w->>'type' ILIKE '%youtube%' OR w->>'domain' ILIKE '%youtube.com%'
        ))
        AND (p_has_tiktok = FALSE OR EXISTS (
            SELECT 1 FROM jsonb_array_elements(c.websites) as w
            WHERE w->>'type' ILIKE '%tiktok%' OR w->>'domain' ILIKE '%tiktok.com%'
        ))
        AND (p_has_linkedin = FALSE OR EXISTS (
            SELECT 1 FROM jsonb_array_elements(c.websites) as w
            WHERE w->>'type' ILIKE '%linkedin%' OR w->>'domain' ILIKE '%linkedin.com%'
        ))
        AND (p_has_patreon = FALSE OR EXISTS (
            SELECT 1 FROM jsonb_array_elements(c.websites) as w
            WHERE w->>'type' ILIKE '%patreon%' OR w->>'domain' ILIKE '%patreon.com%'
        ))
        AND (p_has_discord = FALSE OR EXISTS (
            SELECT 1 FROM jsonb_array_elements(c.websites) as w
            WHERE w->>'type' ILIKE '%discord%' OR w->>'domain' ILIKE '%discord.gg%' OR w->>'domain' ILIKE '%discord.com%'
        ))
        AND (p_has_twitch = FALSE OR EXISTS (
            SELECT 1 FROM jsonb_array_elements(c.websites) as w
            WHERE w->>'type' ILIKE '%twitch%' OR w->>'domain' ILIKE '%twitch.tv%'
        ))
        AND (p_has_bluesky = FALSE OR EXISTS (
            SELECT 1 FROM jsonb_array_elements(c.websites) as w
            WHERE w->>'type' ILIKE '%bluesky%' OR w->>'domain' ILIKE '%bsky.app%'
        ))
        AND (p_has_other_website = FALSE OR jsonb_array_length(c.websites) > 0)
        AND (p_has_website = FALSE OR jsonb_array_length(c.websites) > 0);

    -- Return paginated results with total count
    RETURN QUERY
    SELECT 
        c.id,
        c.name,
        c.slug,
        c.avatar,
        c.urls,
        c.is_superbacker,
        c.websites,
        c.backing_action_count,
        COUNT(p.id) as project_count,
        COALESCE(co.outreach_status, 'not_contacted') as outreach_status,
        v_total_count as total_count
    FROM creators c
    LEFT JOIN projects p ON p.creator_id = c.id
    LEFT JOIN creator_outreach co ON co.creator_id = c.id
    WHERE 
        -- Search filter
        (p_search IS NULL OR c.name ILIKE '%' || p_search || '%' OR c.slug ILIKE '%' || p_search || '%')
        
        -- Backed count filter
        AND (p_min_backed IS NULL OR c.backing_action_count >= p_min_backed)
        
        -- Outreach status filter
        AND (p_outreach_status IS NULL OR p_outreach_status = 'all' OR COALESCE(co.outreach_status, 'not_contacted') = p_outreach_status)
        
        -- Social media filters (check creator websites JSONB array)
        AND (p_has_instagram = FALSE OR EXISTS (
            SELECT 1 FROM jsonb_array_elements(c.websites) as w
            WHERE w->>'type' ILIKE '%instagram%' OR w->>'domain' ILIKE '%instagram.com%'
        ))
        AND (p_has_facebook = FALSE OR EXISTS (
            SELECT 1 FROM jsonb_array_elements(c.websites) as w
            WHERE w->>'type' ILIKE '%facebook%' OR w->>'domain' ILIKE '%facebook.com%'
        ))
        AND (p_has_twitter = FALSE OR EXISTS (
            SELECT 1 FROM jsonb_array_elements(c.websites) as w
            WHERE w->>'type' ILIKE '%twitter%' OR w->>'domain' ILIKE '%twitter.com%' OR w->>'domain' ILIKE '%x.com%'
        ))
        AND (p_has_youtube = FALSE OR EXISTS (
            SELECT 1 FROM jsonb_array_elements(c.websites) as w
            WHERE w->>'type' ILIKE '%youtube%' OR w->>'domain' ILIKE '%youtube.com%'
        ))
        AND (p_has_tiktok = FALSE OR EXISTS (
            SELECT 1 FROM jsonb_array_elements(c.websites) as w
            WHERE w->>'type' ILIKE '%tiktok%' OR w->>'domain' ILIKE '%tiktok.com%'
        ))
        AND (p_has_linkedin = FALSE OR EXISTS (
            SELECT 1 FROM jsonb_array_elements(c.websites) as w
            WHERE w->>'type' ILIKE '%linkedin%' OR w->>'domain' ILIKE '%linkedin.com%'
        ))
        AND (p_has_patreon = FALSE OR EXISTS (
            SELECT 1 FROM jsonb_array_elements(c.websites) as w
            WHERE w->>'type' ILIKE '%patreon%' OR w->>'domain' ILIKE '%patreon.com%'
        ))
        AND (p_has_discord = FALSE OR EXISTS (
            SELECT 1 FROM jsonb_array_elements(c.websites) as w
            WHERE w->>'type' ILIKE '%discord%' OR w->>'domain' ILIKE '%discord.gg%' OR w->>'domain' ILIKE '%discord.com%'
        ))
        AND (p_has_twitch = FALSE OR EXISTS (
            SELECT 1 FROM jsonb_array_elements(c.websites) as w
            WHERE w->>'type' ILIKE '%twitch%' OR w->>'domain' ILIKE '%twitch.tv%'
        ))
        AND (p_has_bluesky = FALSE OR EXISTS (
            SELECT 1 FROM jsonb_array_elements(c.websites) as w
            WHERE w->>'type' ILIKE '%bluesky%' OR w->>'domain' ILIKE '%bsky.app%'
        ))
        AND (p_has_other_website = FALSE OR jsonb_array_length(c.websites) > 0)
        AND (p_has_website = FALSE OR jsonb_array_length(c.websites) > 0)
    GROUP BY c.id, c.name, c.slug, c.avatar, c.urls, c.is_superbacker, c.websites, c.backing_action_count, co.outreach_status
    ORDER BY c.id DESC
    LIMIT p_limit
    OFFSET p_offset;
END;
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION search_creators TO authenticated, anon;

-- Add comment
COMMENT ON FUNCTION search_creators IS 'Search creators with filters including social media, outreach status, and website filters. Returns creators with project count and outreach data.';
