-- Read-only view for client-facing contact data
-- Contains only non-sensitive columns intended for sharing
-- Ensure RLS/policies allow SELECT on this view for a read-only role (e.g., anon)

create or replace view public.customer_contacts_view as
select
  c.id as creator_id,
  c.name as creator_name,
  c.slug as creator_slug,
  coalesce(co.email, '') as email,
  coalesce(co.email_source_url, '') as email_source_url,
  coalesce(co.contact_form_url, '') as contact_form_url,
  coalesce(co.has_contact_form, false) as has_contact_form,
  p.name as latest_project_name,
  p.slug as latest_project_slug,
  p.country_displayable_name as project_country,
  p.blurb as project_blurb,
  c.websites as creator_websites
from creators c
left join creator_outreach co on co.creator_id = c.id
left join lateral (
  select p1.*
  from projects p1
  where p1.creator_id = c.id
  order by p1.created_at_ks desc nulls last
  limit 1
) p on true;

comment on view public.customer_contacts_view is 'Client-facing view with non-sensitive creator/contact fields.';
