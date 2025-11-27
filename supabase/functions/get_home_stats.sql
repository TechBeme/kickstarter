-- =====================================================
-- Function: get_home_stats
-- Description: Get statistics for the home page dashboard
-- Returns: Aggregated statistics about projects and creators
-- =====================================================

CREATE OR REPLACE FUNCTION get_home_stats()
RETURNS TABLE (
    total_projects BIGINT,
    total_creators BIGINT,
    total_backed_projects BIGINT,
    total_pledged NUMERIC,
    active_projects BIGINT,
    successful_projects BIGINT,
    failed_projects BIGINT,
    avg_backed_per_creator NUMERIC,
    creators_with_contact BIGINT,
    creators_not_contacted BIGINT,
    creators_partnership BIGINT,
    creators_interested BIGINT,
    projects_by_superbacker BIGINT
) 
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        -- Total counts
        (SELECT COUNT(*) FROM projects) as total_projects,
        (SELECT COUNT(*) FROM creators) as total_creators,
        (SELECT SUM(backing_action_count) FROM creators) as total_backed_projects,
        (SELECT SUM(pledged) FROM projects) as total_pledged,
        
        -- Project states
        (SELECT COUNT(*) FROM projects WHERE state IN ('live', 'started')) as active_projects,
        (SELECT COUNT(*) FROM projects WHERE state = 'successful') as successful_projects,
        (SELECT COUNT(*) FROM projects WHERE state = 'failed') as failed_projects,
        
        -- Creator stats
        (SELECT AVG(backing_action_count) FROM creators) as avg_backed_per_creator,
        
        -- Outreach stats
        (SELECT COUNT(*) FROM creator_outreach WHERE outreach_status != 'not_contacted') as creators_with_contact,
        (SELECT COUNT(*) FROM creators c LEFT JOIN creator_outreach co ON co.creator_id = c.id 
         WHERE co.creator_id IS NULL OR co.outreach_status = 'not_contacted') as creators_not_contacted,
        (SELECT COUNT(*) FROM creator_outreach WHERE outreach_status = 'partnership') as creators_partnership,
        (SELECT COUNT(*) FROM creator_outreach WHERE outreach_status = 'interested') as creators_interested,
        
        -- Superbacker stats
        (SELECT COUNT(*) FROM projects p INNER JOIN creators c ON c.id = p.creator_id 
         WHERE c.is_superbacker = true) as projects_by_superbacker;
END;
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION get_home_stats TO authenticated, anon;

-- Add comment
COMMENT ON FUNCTION get_home_stats IS 'Get aggregated statistics for the home page dashboard including project counts, creator stats, and outreach metrics.';
