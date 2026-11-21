-- Minimal private mapping for the authenticated server-side panel endpoint.
create or replace function public.ut_control_departments_v1()
returns jsonb
language sql stable security definer
set search_path = pg_catalog, pg_temp
as $$
  select coalesce(jsonb_agg(jsonb_build_object('id', f.id, 'department', f.department_code) order by f.id), '[]'::jsonb)
  from operativo.follow_ups f
  where f.estado not in ('Hecho', 'Cancelado');
$$;
revoke all on function public.ut_control_departments_v1() from public, anon, authenticated;
grant execute on function public.ut_control_departments_v1() to service_role;

