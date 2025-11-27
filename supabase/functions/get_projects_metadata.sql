-- =====================================================
-- Function: get_projects_metadata
-- Description: Get metadata for project filters (countries and categories)
-- Returns: Lists of unique countries and categories
-- =====================================================

CREATE OR REPLACE FUNCTION get_projects_metadata()
RETURNS TABLE (
    countries TEXT[],
    categories TEXT[]
)
LANGUAGE plpgsql
AS $$
DECLARE
    v_countries TEXT[];
    v_categories TEXT[];
BEGIN
    -- Get unique countries (use displayable names instead of ISO codes)
    SELECT ARRAY_AGG(DISTINCT COALESCE(location->>'expanded_country', country_displayable_name, country) ORDER BY COALESCE(location->>'expanded_country', country_displayable_name, country))
    INTO v_countries
    FROM projects
    WHERE COALESCE(location->>'expanded_country', country_displayable_name, country) IS NOT NULL
      AND COALESCE(location->>'expanded_country', country_displayable_name, country) != '';

    -- Get unique categories
    SELECT ARRAY_AGG(DISTINCT category->>'name' ORDER BY category->>'name')
    INTO v_categories
    FROM projects
    WHERE category IS NOT NULL 
      AND category->>'name' IS NOT NULL;

    RETURN QUERY SELECT v_countries, v_categories;
END;
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION get_projects_metadata TO authenticated, anon;

-- Add comment
COMMENT ON FUNCTION get_projects_metadata IS 'Returns lists of unique countries and categories for project filtering dropdowns.';
