-- Add a structured activation instant without interpreting or rewriting the
-- legacy free-text activation trigger. Existing panel contracts remain valid.
begin;
set local lock_timeout='5s';
set local statement_timeout='60s';
select singleton from operativo.migration_control where singleton for update;

do $$ begin
  if (select status from operativo.migration_control where singleton)<>'active' then
    raise exception 'Active source required';
  end if;
  if exists(
    select 1 from information_schema.columns
    where table_schema='operativo' and table_name='follow_ups' and column_name='activar_en'
  ) then raise exception 'Structured activation already exists; review migration';
  end if;
  if exists(
    select 1 from operativo.migration_manifest m
    cross join lateral jsonb_array_elements(m.definition->'fields') f
    where m.target_table='follow_ups'
      and (f->>'id'='activate_at' or f->>'column'='activar_en')
  ) then raise exception 'Activation metadata already exists; review migration';
  end if;
end $$;

create table operativo.follow_up_activation_migration (
  id boolean primary key default true check(id),
  migrated_at timestamptz not null default clock_timestamp(),
  source_revision bigint not null,
  source_rows bigint not null,
  source_snapshot jsonb not null
);
alter table operativo.follow_up_activation_migration enable row level security;
revoke all on operativo.follow_up_activation_migration from public,anon,authenticated,service_role;
insert into operativo.follow_up_activation_migration(source_revision,source_rows,source_snapshot)
select c.global_revision,(select count(*) from operativo.follow_ups),public.ut_panel_snapshot_v2()
from operativo.migration_control c where c.singleton;

select set_config('undertango.actor','follow-up-activation-migration/2026-09-11',true);
alter table operativo.follow_ups add column activar_en timestamptz;
comment on column operativo.follow_ups.activar_en is
  'Instante desde el cual una acción puede ser ejecutable. Se conserva separado de vencimiento y del disparador textual.';
create index follow_ups_activation_at_open_idx on operativo.follow_ups(activar_en)
  where activar_en is not null and coalesce(estado,'') not in ('Hecho','Cancelado');

update operativo.migration_manifest
set definition=jsonb_set(definition,'{fields}',(definition->'fields') || '[
  {
    "id":"activate_at",
    "name":"Activar en",
    "type":"dateTime",
    "column":"activar_en",
    "sqlType":"timestamptz",
    "config":{"timeZone":"America/Argentina/Cordoba"},
    "description":"Fecha y hora estructurada desde la cual la acción puede ocupar un cupo ejecutable. Es independiente de Vencimiento y no reemplaza condiciones documentadas en Disparador de activación."
  }
]'::jsonb)
where target_table='follow_ups';
insert into operativo.panel_write_fields(table_name,field_id)
values('follow_ups','activate_at');

create function public.ut_panel_snapshot_v3() returns jsonb
language plpgsql security definer set search_path=pg_catalog,pg_temp as $$
declare s jsonb; tasks jsonb;
begin
  s:=public.ut_panel_snapshot_v2();
  select coalesce(jsonb_agg(t || jsonb_build_object('fields',
      (t->'fields') || jsonb_strip_nulls(jsonb_build_object('activate_at',e.activar_en)))
      order by t->>'id'),'[]'::jsonb)
    into tasks
    from jsonb_array_elements(s->'tasks') t
    join operativo.follow_ups e on e.id=t->>'id';
  return s || jsonb_build_object('contract',3,'tasks',tasks);
end $$;
revoke all on function public.ut_panel_snapshot_v3() from public,anon,authenticated;
grant execute on function public.ut_panel_snapshot_v3() to service_role;

do $$ declare before jsonb; after jsonb; begin
  select source_snapshot into before from operativo.follow_up_activation_migration where id;
  after:=public.ut_panel_snapshot_v3();
  if jsonb_array_length(after->'tasks')<>(select source_rows from operativo.follow_up_activation_migration where id) then
    raise exception 'Task count changed';
  end if;
  if (after-'contract'-'revision'-'updatedAt'-'tasks') is distinct from
     (before-'contract'-'revision'-'updatedAt'-'tasks') then
    raise exception 'Existing panel collections changed';
  end if;
  if exists(
    select 1
    from jsonb_array_elements(after->'tasks') current
    join jsonb_array_elements(before->'tasks') previous on previous->>'id'=current->>'id'
    where ((current->'fields') - 'activate_at'::text) is distinct from previous->'fields'
  ) then raise exception 'Existing task values changed';
  end if;
  if exists(select 1 from operativo.follow_ups where activar_en is not null) then
    raise exception 'Existing actions unexpectedly received an activation date';
  end if;
  if has_function_privilege('anon','public.ut_panel_snapshot_v3()','execute')
    or has_function_privilege('authenticated','public.ut_panel_snapshot_v3()','execute') then
    raise exception 'Unsafe snapshot grant';
  end if;
end $$;
commit;
