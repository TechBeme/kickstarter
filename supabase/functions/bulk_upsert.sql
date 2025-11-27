-- =====================================================
-- RPC Functions for efficient bulk operations
-- Description: Process data directly in the database
-- =====================================================

-- =====================================================
-- Function: upsert_creators_bulk
-- Description: Efficiently upsert multiple creators at once
-- =====================================================
CREATE OR REPLACE FUNCTION upsert_creators_bulk(creators_data JSONB)
RETURNS TABLE(
    inserted_count INTEGER,
    updated_count INTEGER,
    total_count INTEGER,
    errors JSONB
) 
LANGUAGE plpgsql
AS $$
DECLARE
    v_inserted INTEGER := 0;
    v_updated INTEGER := 0;
    v_total INTEGER := 0;
    v_errors JSONB := '[]'::jsonb;
    creator JSONB;
    v_data_hash TEXT;
    v_existing_hash TEXT;
    v_exists BOOLEAN;
BEGIN
    -- Process each creator in the input array
    FOR creator IN SELECT * FROM jsonb_array_elements(creators_data)
    LOOP
        BEGIN
            v_total := v_total + 1;
            
            -- Compute hash of the data
            v_data_hash := creator->>'data_hash';
            
            -- Check if creator exists and get existing hash
            SELECT EXISTS(SELECT 1 FROM creators WHERE id = (creator->>'id')::BIGINT),
                   data_hash INTO v_exists, v_existing_hash
            FROM creators 
            WHERE id = (creator->>'id')::BIGINT;
            
            -- Only insert/update if data changed or doesn't exist
            IF NOT v_exists OR v_existing_hash IS NULL OR v_existing_hash != v_data_hash THEN
                INSERT INTO creators (
                    id,
                    slug,
                    name,
                    is_registered,
                    is_email_verified,
                    chosen_currency,
                    is_superbacker,
                    has_admin_message_badge,
                    ppo_has_action,
                    backing_action_count,
                    avatar,
                    urls,
                    websites,
                    data_hash
                ) VALUES (
                    (creator->>'id')::BIGINT,
                    creator->>'slug',
                    creator->>'name',
                    (creator->>'is_registered')::BOOLEAN,
                    (creator->>'is_email_verified')::BOOLEAN,
                    creator->>'chosen_currency',
                    (creator->>'is_superbacker')::BOOLEAN,
                    COALESCE((creator->>'has_admin_message_badge')::BOOLEAN, false),
                    COALESCE((creator->>'ppo_has_action')::BOOLEAN, false),
                    COALESCE((creator->>'backing_action_count')::INTEGER, 0),
                    (creator->'avatar')::JSONB,
                    (creator->'urls')::JSONB,
                    COALESCE((creator->'websites')::JSONB, '[]'::jsonb),
                    v_data_hash
                )
                ON CONFLICT (id) DO UPDATE SET
                    slug = EXCLUDED.slug,
                    name = EXCLUDED.name,
                    is_registered = EXCLUDED.is_registered,
                    is_email_verified = EXCLUDED.is_email_verified,
                    chosen_currency = EXCLUDED.chosen_currency,
                    is_superbacker = EXCLUDED.is_superbacker,
                    has_admin_message_badge = EXCLUDED.has_admin_message_badge,
                    ppo_has_action = EXCLUDED.ppo_has_action,
                    backing_action_count = EXCLUDED.backing_action_count,
                    avatar = EXCLUDED.avatar,
                    urls = EXCLUDED.urls,
                    websites = EXCLUDED.websites,
                    data_hash = EXCLUDED.data_hash;
                
                IF v_exists THEN
                    v_updated := v_updated + 1;
                ELSE
                    v_inserted := v_inserted + 1;
                END IF;
            END IF;
            
        EXCEPTION WHEN OTHERS THEN
            v_errors := v_errors || jsonb_build_object(
                'creator_id', creator->>'id',
                'error', SQLERRM
            );
        END;
    END LOOP;
    
    RETURN QUERY SELECT v_inserted, v_updated, v_total, v_errors;
END;
$$;

-- =====================================================
-- Function: upsert_projects_bulk
-- Description: Efficiently upsert multiple projects at once
-- =====================================================
CREATE OR REPLACE FUNCTION upsert_projects_bulk(projects_data JSONB)
RETURNS TABLE(
    inserted_count INTEGER,
    updated_count INTEGER,
    total_count INTEGER,
    errors JSONB
) 
LANGUAGE plpgsql
AS $$
DECLARE
    v_inserted INTEGER := 0;
    v_updated INTEGER := 0;
    v_total INTEGER := 0;
    v_errors JSONB := '[]'::jsonb;
    project JSONB;
    v_data_hash TEXT;
    v_existing_hash TEXT;
    v_exists BOOLEAN;
BEGIN
    -- Process each project in the input array
    FOR project IN SELECT * FROM jsonb_array_elements(projects_data)
    LOOP
        BEGIN
            v_total := v_total + 1;
            
            -- Compute hash of the data
            v_data_hash := project->>'data_hash';
            
            -- Check if project exists and get existing hash
            SELECT EXISTS(SELECT 1 FROM projects WHERE id = (project->>'id')::BIGINT),
                   data_hash INTO v_exists, v_existing_hash
            FROM projects 
            WHERE id = (project->>'id')::BIGINT;
            
            -- Only insert/update if data changed or doesn't exist
            IF NOT v_exists OR v_existing_hash IS NULL OR v_existing_hash != v_data_hash THEN
                INSERT INTO projects (
                    id,
                    creator_id,
                    name,
                    blurb,
                    slug,
                    state,
                    country,
                    country_displayable_name,
                    currency,
                    goal,
                    pledged,
                    backers_count,
                    state_changed_at,
                    created_at_ks,
                    launched_at,
                    deadline,
                    photo,
                    category,
                    location,
                    profile,
                    urls,
                    data_hash
                ) VALUES (
                    (project->>'id')::BIGINT,
                    (project->>'creator_id')::BIGINT,
                    project->>'name',
                    project->>'blurb',
                    project->>'slug',
                    project->>'state',
                    project->>'country',
                    project->>'country_displayable_name',
                    project->>'currency',
                    (project->>'goal')::NUMERIC,
                    (project->>'pledged')::NUMERIC,
                    (project->>'backers_count')::INTEGER,
                    NULLIF(project->>'state_changed_at', '')::TIMESTAMP WITH TIME ZONE,
                    (project->>'created_at_ks')::TIMESTAMP WITH TIME ZONE,
                    NULLIF(project->>'launched_at', '')::TIMESTAMP WITH TIME ZONE,
                    NULLIF(project->>'deadline', '')::TIMESTAMP WITH TIME ZONE,
                    (project->'photo')::JSONB,
                    (project->'category')::JSONB,
                    (project->'location')::JSONB,
                    (project->'profile')::JSONB,
                    (project->'urls')::JSONB,
                    v_data_hash
                )
                ON CONFLICT (id) DO UPDATE SET
                    creator_id = EXCLUDED.creator_id,
                    name = EXCLUDED.name,
                    blurb = EXCLUDED.blurb,
                    slug = EXCLUDED.slug,
                    state = EXCLUDED.state,
                    country = EXCLUDED.country,
                    country_displayable_name = EXCLUDED.country_displayable_name,
                    currency = EXCLUDED.currency,
                    goal = EXCLUDED.goal,
                    pledged = EXCLUDED.pledged,
                    backers_count = EXCLUDED.backers_count,
                    state_changed_at = EXCLUDED.state_changed_at,
                    created_at_ks = EXCLUDED.created_at_ks,
                    launched_at = EXCLUDED.launched_at,
                    deadline = EXCLUDED.deadline,
                    photo = EXCLUDED.photo,
                    category = EXCLUDED.category,
                    location = EXCLUDED.location,
                    profile = EXCLUDED.profile,
                    urls = EXCLUDED.urls,
                    data_hash = EXCLUDED.data_hash,
                    updated_at = CURRENT_TIMESTAMP;
                
                IF v_exists THEN
                    v_updated := v_updated + 1;
                ELSE
                    v_inserted := v_inserted + 1;
                END IF;
            END IF;
            
        EXCEPTION WHEN OTHERS THEN
            v_errors := v_errors || jsonb_build_object(
                'project_id', project->>'id',
                'error', SQLERRM
            );
        END;
    END LOOP;
    
    RETURN QUERY SELECT v_inserted, v_updated, v_total, v_errors;
END;
$$;

-- =====================================================
-- Function: sync_creator_outreach_bulk
-- Description: Efficiently sync creator outreach data
-- =====================================================
CREATE OR REPLACE FUNCTION sync_creator_outreach_bulk(outreach_data JSONB)
RETURNS TABLE(
    inserted_count INTEGER,
    updated_count INTEGER,
    total_count INTEGER,
    errors JSONB
) 
LANGUAGE plpgsql
AS $$
DECLARE
    v_inserted INTEGER := 0;
    v_updated INTEGER := 0;
    v_total INTEGER := 0;
    v_errors JSONB := '[]'::jsonb;
    outreach JSONB;
    v_exists BOOLEAN;
BEGIN
    -- Process each outreach record in the input array
    FOR outreach IN SELECT * FROM jsonb_array_elements(outreach_data)
    LOOP
        BEGIN
            v_total := v_total + 1;
            
            -- Check if outreach record exists
            SELECT EXISTS(
                SELECT 1 FROM creator_outreach 
                WHERE creator_id = (outreach->>'creator_id')::BIGINT
            ) INTO v_exists;
            
            INSERT INTO creator_outreach (
                creator_id,
                has_instagram,
                has_facebook,
                has_twitter,
                has_youtube,
                has_tiktok,
                has_linkedin,
                has_patreon,
                has_discord,
                has_twitch,
                has_bluesky,
                has_other_website,
                outreach_status,
                first_contacted_at,
                last_contacted_at,
                response_received_at,
                notes,
                tags,
                email,
                email_source_url,
                has_contact_form,
                contact_form_url,
                last_contact_check_at,
                contact_status,
                contact_error,
                contact_attempts,
                site_hash
            ) VALUES (
                (outreach->>'creator_id')::BIGINT,
                COALESCE((outreach->>'has_instagram')::BOOLEAN, false),
                COALESCE((outreach->>'has_facebook')::BOOLEAN, false),
                COALESCE((outreach->>'has_twitter')::BOOLEAN, false),
                COALESCE((outreach->>'has_youtube')::BOOLEAN, false),
                COALESCE((outreach->>'has_tiktok')::BOOLEAN, false),
                COALESCE((outreach->>'has_linkedin')::BOOLEAN, false),
                COALESCE((outreach->>'has_patreon')::BOOLEAN, false),
                COALESCE((outreach->>'has_discord')::BOOLEAN, false),
                COALESCE((outreach->>'has_twitch')::BOOLEAN, false),
                COALESCE((outreach->>'has_bluesky')::BOOLEAN, false),
                COALESCE((outreach->>'has_other_website')::BOOLEAN, false),
                COALESCE(outreach->>'outreach_status', 'not_contacted'),
                NULLIF(outreach->>'first_contacted_at', '')::TIMESTAMP WITH TIME ZONE,
                NULLIF(outreach->>'last_contacted_at', '')::TIMESTAMP WITH TIME ZONE,
                NULLIF(outreach->>'response_received_at', '')::TIMESTAMP WITH TIME ZONE,
                outreach->>'notes',
                CASE 
                    WHEN jsonb_typeof(outreach->'tags') = 'array' 
                    THEN ARRAY(SELECT jsonb_array_elements_text(outreach->'tags'))
                    ELSE ARRAY[]::TEXT[]
                END,
                outreach->>'email',
                outreach->>'email_source_url',
                COALESCE((outreach->>'has_contact_form')::BOOLEAN, false),
                outreach->>'contact_form_url',
                NULLIF(outreach->>'last_contact_check_at', '')::TIMESTAMP WITH TIME ZONE,
                COALESCE(outreach->>'contact_status', 'not_checked'),
                outreach->>'contact_error',
                COALESCE((outreach->>'contact_attempts')::INTEGER, 0),
                outreach->>'site_hash'
            )
            ON CONFLICT (creator_id) DO UPDATE SET
                has_instagram = EXCLUDED.has_instagram,
                has_facebook = EXCLUDED.has_facebook,
                has_twitter = EXCLUDED.has_twitter,
                has_youtube = EXCLUDED.has_youtube,
                has_tiktok = EXCLUDED.has_tiktok,
                has_linkedin = EXCLUDED.has_linkedin,
                has_patreon = EXCLUDED.has_patreon,
                has_discord = EXCLUDED.has_discord,
                has_twitch = EXCLUDED.has_twitch,
                has_bluesky = EXCLUDED.has_bluesky,
                has_other_website = EXCLUDED.has_other_website,
                email = COALESCE(EXCLUDED.email, creator_outreach.email),
                email_source_url = COALESCE(EXCLUDED.email_source_url, creator_outreach.email_source_url),
                has_contact_form = COALESCE(EXCLUDED.has_contact_form, creator_outreach.has_contact_form),
                contact_form_url = COALESCE(EXCLUDED.contact_form_url, creator_outreach.contact_form_url),
                last_contact_check_at = COALESCE(EXCLUDED.last_contact_check_at, creator_outreach.last_contact_check_at),
                contact_status = COALESCE(EXCLUDED.contact_status, creator_outreach.contact_status),
                contact_error = COALESCE(EXCLUDED.contact_error, creator_outreach.contact_error),
                contact_attempts = COALESCE(EXCLUDED.contact_attempts, creator_outreach.contact_attempts),
                site_hash = COALESCE(EXCLUDED.site_hash, creator_outreach.site_hash),
                -- Only update status if it's still 'not_contacted' (preserve manual updates)
                outreach_status = CASE 
                    WHEN creator_outreach.outreach_status = 'not_contacted' 
                    THEN EXCLUDED.outreach_status 
                    ELSE creator_outreach.outreach_status 
                END;
            
            IF v_exists THEN
                v_updated := v_updated + 1;
            ELSE
                v_inserted := v_inserted + 1;
            END IF;
            
        EXCEPTION WHEN OTHERS THEN
            v_errors := v_errors || jsonb_build_object(
                'creator_id', outreach->>'creator_id',
                'error', SQLERRM
            );
        END;
    END LOOP;
    
    RETURN QUERY SELECT v_inserted, v_updated, v_total, v_errors;
END;
$$;

-- =====================================================
-- Add data_hash column to track changes
-- =====================================================
ALTER TABLE creators ADD COLUMN IF NOT EXISTS data_hash TEXT;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS data_hash TEXT;

-- Create indexes on data_hash for performance
CREATE INDEX IF NOT EXISTS idx_creators_data_hash ON creators(data_hash);
CREATE INDEX IF NOT EXISTS idx_projects_data_hash ON projects(data_hash);

-- =====================================================
-- Grant execute permissions
-- =====================================================
-- Uncomment if using RLS with specific roles
-- GRANT EXECUTE ON FUNCTION upsert_creators_bulk TO authenticated;
-- GRANT EXECUTE ON FUNCTION upsert_projects_bulk TO authenticated;
-- GRANT EXECUTE ON FUNCTION sync_creator_outreach_bulk TO authenticated;

-- =====================================================
-- Comments
-- =====================================================
COMMENT ON FUNCTION upsert_creators_bulk IS 'Bulk upsert creators with smart update detection based on data hash';
COMMENT ON FUNCTION upsert_projects_bulk IS 'Bulk upsert projects with smart update detection based on data hash';
COMMENT ON FUNCTION sync_creator_outreach_bulk IS 'Bulk sync creator outreach data, preserving manual status updates';

-- =====================================================
-- End of script
-- =====================================================
