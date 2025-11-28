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
  proj.project_names,
  proj.project_urls,
  proj.project_countries,
  proj.project_blurbs,
  ws.creator_websites
from creators c
left join creator_outreach co on co.creator_id = c.id
left join lateral (
  select
    string_agg(p1.name, E'\n' order by p1.created_at_ks desc nulls last) as project_names,
    string_agg(
      case
        when p1.slug is not null then 'https://www.kickstarter.com/projects/' || p1.slug
        else 'https://www.kickstarter.com/projects/' || p1.id::text
      end,
      E'\n' order by p1.created_at_ks desc nulls last
    ) as project_urls,
    string_agg(coalesce(p1.country_displayable_name, ''), E'\n' order by p1.created_at_ks desc nulls last) as project_countries,
    string_agg(coalesce(p1.blurb, ''), E'\n' order by p1.created_at_ks desc nulls last) as project_blurbs
  from projects p1
  where p1.creator_id = c.id
) proj on true
left join lateral (
  select string_agg(url, E'\n') as creator_websites
  from (
    select site->>'url' as url
    from jsonb_array_elements(c.websites) as site
    where site->>'url' is not null and site->>'url' <> ''
  ) w
) ws on true
where co.contact_status = 'completed'
  and (co.email is not null and co.email <> '' or coalesce(co.has_contact_form, false) = true);

comment on view public.customer_contacts_view is 'Client-facing view with non-sensitive creator/contact fields.';
