-- Version matches the applied Supabase migration history.
begin;
set local lock_timeout = '5s';
set local statement_timeout = '60s';
-- Preserve the existing patch implementation, privileges, triggers and receipts.
-- Abort if its creation guard changed since inspection.
do $migration$
declare source text; old_guard text := 'if p_create and (p_table=''projects'' or p_id is not null) then raise exception using errcode=''22023'',message=''Invalid creation''; end if;';
begin
  perform 1 from operativo.migration_control where singleton and status='active' for update;
  if not found then raise exception 'Operational cutover is not active'; end if;
  if not exists(select 1 from operativo.migration_manifest, jsonb_array_elements(definition->'fields') f where target_table='projects' and f->>'id'='fldChULRkd1GrXY3w' and f->>'column'='proyecto') then raise exception 'Unexpected project metadata'; end if;
  source := pg_get_functiondef('operativo.apply_panel_patch(text,text,jsonb,boolean)'::regprocedure);
  if strpos(source,old_guard)=0 then raise exception 'Project creation guard changed; review before applying'; end if;
  source := replace(source,old_guard,$guard$
if p_create and p_id is not null then raise exception using errcode='22023',message='Invalid creation'; end if;
if p_create and p_table='projects' then
  perform 1 from operativo.migration_control where singleton for update;
  if exists(select 1 from jsonb_object_keys(p_fields) k where k not in ('fldChULRkd1GrXY3w','fldrApFZcuzKj3Gax','fldcypAILEecLnLGQ','fldiMnJUvRox1quBE')) then raise exception using errcode='22023',message='Invalid project creation fields'; end if;
  if jsonb_typeof(p_fields->'fldChULRkd1GrXY3w') is distinct from 'string'
     or length(btrim(p_fields->>'fldChULRkd1GrXY3w')) not between 1 and 250
     or coalesce(p_fields->>'fldcypAILEecLnLGQ','') not in ('Activo','En espera') then
    raise exception using errcode='22023',message='Invalid project name or status';
  end if;
  if exists(select 1 from operativo.projects where lower(btrim(regexp_replace(proyecto,'\s+',' ','g')))=lower(btrim(regexp_replace(p_fields->>'fldChULRkd1GrXY3w','\s+',' ','g')))) then
    raise exception using errcode='PT409',message='Project already exists';
  end if;
end if;
$guard$);
  execute source;
end $migration$;
insert into operativo.panel_write_fields(table_name,field_id) values
('projects','fldChULRkd1GrXY3w'),('projects','fldrApFZcuzKj3Gax') on conflict do nothing;
-- No data updates, new tables, public grants or ranking changes.
commit;
