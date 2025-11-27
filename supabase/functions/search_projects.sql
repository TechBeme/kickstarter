-- Execute this complete file in Supabase SQL Editor

-- =====================================================
-- Function: search_projects
-- =====================================================
CREATE OR REPLACE FUNCTION search_projects(
    p_search TEXT DEFAULT NULL,
    p_state TEXT DEFAULT NULL,
    p_country TEXT DEFAULT NULL,
    p_category TEXT DEFAULT NULL,
    p_min_goal DECIMAL DEFAULT NULL,
    p_max_goal DECIMAL DEFAULT NULL,
    p_min_percent DECIMAL DEFAULT NULL,
    p_staff_pick BOOLEAN DEFAULT NULL,
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
    p_limit INTEGER DEFAULT 50,
    p_offset INTEGER DEFAULT 0
)
RETURNS TABLE (
    id BIGINT,
    name VARCHAR,
    blurb TEXT,
    goal DECIMAL,
    pledged DECIMAL,
    state VARCHAR,
    country VARCHAR,
    country_displayable_name VARCHAR,
    currency VARCHAR,
    deadline TIMESTAMP WITH TIME ZONE,
    created_at_ks TIMESTAMP WITH TIME ZONE,
    launched_at TIMESTAMP WITH TIME ZONE,
    state_changed_at TIMESTAMP WITH TIME ZONE,
    creator_id BIGINT,
    category JSONB,
    photo JSONB,
    percent_funded DECIMAL,
    backers_count INTEGER,
    staff_pick BOOLEAN,
    spotlight BOOLEAN,
    urls JSONB,
    creator_name VARCHAR,
    creator_slug VARCHAR,
    creator_avatar JSONB,
    creator_urls JSONB,
    creator_is_superbacker BOOLEAN,
    creator_websites JSONB,
    outreach_status VARCHAR,
    total_count BIGINT
) 
LANGUAGE plpgsql
AS $$
DECLARE
    v_total_count BIGINT;
BEGIN
    SELECT COUNT(DISTINCT p.id) INTO v_total_count
    FROM projects p
    INNER JOIN creators c ON c.id = p.creator_id
    LEFT JOIN creator_outreach co ON co.creator_id = c.id
    WHERE 
        (p_search IS NULL OR p.name ILIKE '%' || p_search || '%' OR p.blurb ILIKE '%' || p_search || '%')
        AND (p_state IS NULL OR p.state = p_state)
        AND (p_country IS NULL OR COALESCE(p.location->>'expanded_country', p.country_displayable_name, p.country) = p_country)
        AND (p_category IS NULL OR p.category->>'name' = p_category)
        AND (p_min_goal IS NULL OR p.goal >= p_min_goal)
        AND (p_max_goal IS NULL OR p.goal <= p_max_goal)
        AND (p_min_percent IS NULL OR p.percent_funded >= p_min_percent)
        AND (p_staff_pick IS NULL OR p.staff_pick = p_staff_pick)
        AND (p_outreach_status IS NULL OR p_outreach_status = 'all' OR COALESCE(co.outreach_status, 'not_contacted') = p_outreach_status)
        AND (p_has_instagram = FALSE OR EXISTS (SELECT 1 FROM jsonb_array_elements(c.websites) as w WHERE w->>'type' ILIKE '%instagram%' OR w->>'domain' ILIKE '%instagram.com%'))
        AND (p_has_facebook = FALSE OR EXISTS (SELECT 1 FROM jsonb_array_elements(c.websites) as w WHERE w->>'type' ILIKE '%facebook%' OR w->>'domain' ILIKE '%facebook.com%'))
        AND (p_has_twitter = FALSE OR EXISTS (SELECT 1 FROM jsonb_array_elements(c.websites) as w WHERE w->>'type' ILIKE '%twitter%' OR w->>'domain' ILIKE '%twitter.com%' OR w->>'domain' ILIKE '%x.com%'))
        AND (p_has_youtube = FALSE OR EXISTS (SELECT 1 FROM jsonb_array_elements(c.websites) as w WHERE w->>'type' ILIKE '%youtube%' OR w->>'domain' ILIKE '%youtube.com%'))
        AND (p_has_tiktok = FALSE OR EXISTS (SELECT 1 FROM jsonb_array_elements(c.websites) as w WHERE w->>'type' ILIKE '%tiktok%' OR w->>'domain' ILIKE '%tiktok.com%'))
        AND (p_has_linkedin = FALSE OR EXISTS (SELECT 1 FROM jsonb_array_elements(c.websites) as w WHERE w->>'type' ILIKE '%linkedin%' OR w->>'domain' ILIKE '%linkedin.com%'))
        AND (p_has_patreon = FALSE OR EXISTS (SELECT 1 FROM jsonb_array_elements(c.websites) as w WHERE w->>'type' ILIKE '%patreon%' OR w->>'domain' ILIKE '%patreon.com%'))
        AND (p_has_discord = FALSE OR EXISTS (SELECT 1 FROM jsonb_array_elements(c.websites) as w WHERE w->>'type' ILIKE '%discord%' OR w->>'domain' ILIKE '%discord.gg%' OR w->>'domain' ILIKE '%discord.com%'))
        AND (p_has_twitch = FALSE OR EXISTS (SELECT 1 FROM jsonb_array_elements(c.websites) as w WHERE w->>'type' ILIKE '%twitch%' OR w->>'domain' ILIKE '%twitch.tv%'))
        AND (p_has_bluesky = FALSE OR EXISTS (SELECT 1 FROM jsonb_array_elements(c.websites) as w WHERE w->>'type' ILIKE '%bluesky%' OR w->>'domain' ILIKE '%bsky.app%'))
        AND (p_has_other_website = FALSE OR jsonb_array_length(c.websites) > 0);

    RETURN QUERY
    SELECT 
        p.id, p.name, p.blurb, p.goal, p.pledged, p.state, p.country, 
        COALESCE(p.location->>'expanded_country', p.country_displayable_name, p.country)::VARCHAR as country_displayable_name,
        p.currency, p.deadline, p.created_at_ks, p.launched_at, p.state_changed_at, p.creator_id,
        p.category, p.photo, p.percent_funded, p.backers_count, p.staff_pick, p.spotlight, p.urls,
        c.name as creator_name, c.slug as creator_slug, c.avatar as creator_avatar, c.urls as creator_urls,
        c.is_superbacker as creator_is_superbacker, c.websites as creator_websites,
        COALESCE(co.outreach_status, 'not_contacted') as outreach_status, v_total_count as total_count
    FROM projects p
    INNER JOIN creators c ON c.id = p.creator_id
    LEFT JOIN creator_outreach co ON co.creator_id = c.id
    WHERE 
        (p_search IS NULL OR p.name ILIKE '%' || p_search || '%' OR p.blurb ILIKE '%' || p_search || '%')
        AND (p_state IS NULL OR p.state = p_state)
        AND (p_country IS NULL OR COALESCE(p.location->>'expanded_country', p.country_displayable_name, p.country) = p_country)
        AND (p_category IS NULL OR p.category->>'name' = p_category)
        AND (p_min_goal IS NULL OR p.goal >= p_min_goal)
        AND (p_max_goal IS NULL OR p.goal <= p_max_goal)
        AND (p_min_percent IS NULL OR p.percent_funded >= p_min_percent)
        AND (p_staff_pick IS NULL OR p.staff_pick = p_staff_pick)
        AND (p_outreach_status IS NULL OR p_outreach_status = 'all' OR COALESCE(co.outreach_status, 'not_contacted') = p_outreach_status)
        AND (p_has_instagram = FALSE OR EXISTS (SELECT 1 FROM jsonb_array_elements(c.websites) as w WHERE w->>'type' ILIKE '%instagram%' OR w->>'domain' ILIKE '%instagram.com%'))
        AND (p_has_facebook = FALSE OR EXISTS (SELECT 1 FROM jsonb_array_elements(c.websites) as w WHERE w->>'type' ILIKE '%facebook%' OR w->>'domain' ILIKE '%facebook.com%'))
        AND (p_has_twitter = FALSE OR EXISTS (SELECT 1 FROM jsonb_array_elements(c.websites) as w WHERE w->>'type' ILIKE '%twitter%' OR w->>'domain' ILIKE '%twitter.com%' OR w->>'domain' ILIKE '%x.com%'))
        AND (p_has_youtube = FALSE OR EXISTS (SELECT 1 FROM jsonb_array_elements(c.websites) as w WHERE w->>'type' ILIKE '%youtube%' OR w->>'domain' ILIKE '%youtube.com%'))
        AND (p_has_tiktok = FALSE OR EXISTS (SELECT 1 FROM jsonb_array_elements(c.websites) as w WHERE w->>'type' ILIKE '%tiktok%' OR w->>'domain' ILIKE '%tiktok.com%'))
        AND (p_has_linkedin = FALSE OR EXISTS (SELECT 1 FROM jsonb_array_elements(c.websites) as w WHERE w->>'type' ILIKE '%linkedin%' OR w->>'domain' ILIKE '%linkedin.com%'))
        AND (p_has_patreon = FALSE OR EXISTS (SELECT 1 FROM jsonb_array_elements(c.websites) as w WHERE w->>'type' ILIKE '%patreon%' OR w->>'domain' ILIKE '%patreon.com%'))
        AND (p_has_discord = FALSE OR EXISTS (SELECT 1 FROM jsonb_array_elements(c.websites) as w WHERE w->>'type' ILIKE '%discord%' OR w->>'domain' ILIKE '%discord.gg%' OR w->>'domain' ILIKE '%discord.com%'))
        AND (p_has_twitch = FALSE OR EXISTS (SELECT 1 FROM jsonb_array_elements(c.websites) as w WHERE w->>'type' ILIKE '%twitch%' OR w->>'domain' ILIKE '%twitch.tv%'))
        AND (p_has_bluesky = FALSE OR EXISTS (SELECT 1 FROM jsonb_array_elements(c.websites) as w WHERE w->>'type' ILIKE '%bluesky%' OR w->>'domain' ILIKE '%bsky.app%'))
        AND (p_has_other_website = FALSE OR jsonb_array_length(c.websites) > 0)
    ORDER BY p.created_at_ks DESC
    LIMIT p_limit
    OFFSET p_offset;
END;
$$;
