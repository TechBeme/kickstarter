-- =====================================================
-- Function: get_home_data
-- Description: Get all data for home page in a single request
-- Returns: Statistics, top projects, and top creators
-- =====================================================

CREATE OR REPLACE FUNCTION get_home_data()
RETURNS JSONB
LANGUAGE plpgsql
AS $$
DECLARE
    v_result JSONB;
    v_stats JSONB;
    v_top_projects JSONB;
    v_top_creators JSONB;
BEGIN
    -- Get statistics (corrected - no CROSS JOIN)
    SELECT jsonb_build_object(
        'total_projects', (SELECT COUNT(*) FROM projects),
        'total_creators', (SELECT COUNT(*) FROM creators),
        'total_funding_goal', (SELECT COALESCE(SUM(goal), 0) FROM projects)
    )
    INTO v_stats;

    -- Get top 6 projects by goal
    SELECT jsonb_agg(project_data)
    INTO v_top_projects
    FROM (
        SELECT jsonb_build_object(
            'id', id,
            'name', name,
            'blurb', blurb,
            'goal', goal,
            'pledged', pledged,
            'state', state,
            'country', country,
            'currency', currency,
            'category', category,
            'photo', photo,
            'percent_funded', percent_funded,
            'backers_count', backers_count,
            'staff_pick', staff_pick
        ) as project_data
        FROM projects
        ORDER BY goal DESC
        LIMIT 6
    ) top_projects;

    -- Get top 6 creators by backing count
    SELECT jsonb_agg(creator_data)
    INTO v_top_creators
    FROM (
        SELECT jsonb_build_object(
            'id', id,
            'name', name,
            'slug', slug,
            'avatar', avatar,
            'is_superbacker', is_superbacker,
            'backing_action_count', backing_action_count
        ) as creator_data
        FROM creators
        ORDER BY backing_action_count DESC NULLS LAST
        LIMIT 6
    ) top_creators;

    -- Combine all data
    v_result := jsonb_build_object(
        'stats', v_stats,
        'top_projects', COALESCE(v_top_projects, '[]'::jsonb),
        'top_creators', COALESCE(v_top_creators, '[]'::jsonb)
    );

    RETURN v_result;
END;
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION get_home_data TO authenticated, anon;

-- Add comment
COMMENT ON FUNCTION get_home_data IS 'Returns all home page data (stats, top projects, top creators) in a single request.';
