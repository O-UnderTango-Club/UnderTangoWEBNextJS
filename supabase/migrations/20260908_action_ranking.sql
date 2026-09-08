-- Additive migration. v1 snapshots remain compatible with the previous release.
-- The caller must use one transaction; the same script is rollback-tested first.
begin;
set local lock_timeout='5s';
set local statement_timeout='60s';
select singleton from operativo.migration_control where singleton for update;
do $$ begin
  if (select status from operativo.migration_control where singleton)<>'active' then raise exception 'Active source required'; end if;
  if exists(select 1 from information_schema.columns where table_schema='operativo' and table_name='follow_ups' and column_name='frente_de_accion') then raise exception 'Action ranking already exists; review migration'; end if;
end $$;

create table operativo.action_ranking_migration (
  id boolean primary key default true check(id),
  migrated_at timestamptz not null default clock_timestamp(),
  source_revision bigint not null,
  source_snapshot jsonb not null
);
alter table operativo.action_ranking_migration enable row level security;
revoke all on operativo.action_ranking_migration from public,anon,authenticated,service_role;
insert into operativo.action_ranking_migration(source_revision,source_snapshot)
select global_revision,public.ut_panel_snapshot_v1() from operativo.migration_control where singleton;

alter table operativo.follow_ups
  add column frente_de_accion text,
  add column posicion_de_accion integer,
  add column ranking_frente_abierto text generated always as
    (case when coalesce(estado,'') not in ('Hecho','Cancelado') then frente_de_accion end) stored,
  add column ranking_posicion_abierta integer generated always as
    (case when coalesce(estado,'') not in ('Hecho','Cancelado') then posicion_de_accion end) stored,
  add constraint follow_ups_action_position_valid check(
    (frente_de_accion is null and posicion_de_accion is null) or
    (frente_de_accion is not null and frente_de_accion in ('Primario','Secundario','Terciario')
      and posicion_de_accion is not null and posicion_de_accion>0)),
  add constraint follow_ups_action_position_unique unique(ranking_frente_abierto,ranking_posicion_abierta)
    deferrable initially deferred;

-- Inherit the previous ordering ONCE. Tasks without an open, ranked project
-- remain unassigned for explicit cataloguing; projects never assign future ranks.
-- The JS ordering parity check must pass before this transaction is committed.
select set_config('undertango.actor','action-ranking-migration/2026-09-08',true);
with snapshot as (select source_snapshot as s from operativo.action_ranking_migration),
tasks as (select t from snapshot cross join lateral jsonb_array_elements(s->'tasks') t
  where coalesce(t->'fields'->>'fldLXBjnEHgHDJvX0','') not in ('Hecho','Cancelado')),
assigned as (
  select t->>'id' as id,t->'fields'->>'fldLO5zuV38eu576D' as name,
    coalesce(nullif((t->'fields'->>'fldZCklniYktPL5NA')::numeric,0),9999) as step,
    principal.front,principal.rank
  from tasks cross join snapshot
  cross join lateral (
    select p->'fields'->>'fldy1wMKKlc6TRvmf' as front,
      coalesce(nullif((p->'fields'->>'fldGtRBM8QYXGZQPd')::numeric,0),9999) as rank
    from jsonb_array_elements(s->'projects') p
    where coalesce(p->'fields'->>'fldcypAILEecLnLGQ','') not in ('Completado','Archivado')
      and p->'fields'->>'fldy1wMKKlc6TRvmf' in ('Primario','Secundario','Terciario')
      and (coalesce(t->'fields'->'fldOCm8x8sOWDNlw6','[]'::jsonb) ? (p->>'id')
        or exists(select 1 from jsonb_array_elements(s->'cases') c
          where coalesce(t->'fields'->'fldazeCmB0kKeC56A','[]'::jsonb) ? (c->>'id')
            and coalesce(c->'fields'->'fldCd5XSjO7ySQYoj','[]'::jsonb) ? (p->>'id')))
    order by array_position(array['Primario','Secundario','Terciario'],p->'fields'->>'fldy1wMKKlc6TRvmf'),
      coalesce(nullif((p->'fields'->>'fldGtRBM8QYXGZQPd')::numeric,0),9999),p->>'id'
    limit 1
  ) principal
),
ranked as (select id,front,row_number() over(partition by front order by rank,step,name collate "es-x-icu",id)::integer as position from assigned where rank>=1 and rank=floor(rank) and rank<>9999)
update operativo.follow_ups t set frente_de_accion=r.front,posicion_de_accion=r.position
from ranked r where t.id=r.id;

-- Extend only the private write metadata. v1 panel_fields stays unchanged.
update operativo.migration_manifest set definition=jsonb_set(definition,'{fields}',
  (definition->'fields') || '[
    {"id":"action_front","name":"Frente de la accion","type":"singleSelect","column":"frente_de_accion","sqlType":"text","config":{"choices":[{"name":"Primario"},{"name":"Secundario"},{"name":"Terciario"}]}},
    {"id":"action_rank","name":"Posicion de la accion","type":"number","column":"posicion_de_accion","sqlType":"numeric"}
  ]'::jsonb)
where target_table='follow_ups';
insert into operativo.panel_write_fields(table_name,field_id)
values('follow_ups','action_front'),('follow_ups','action_rank');

create function public.ut_panel_snapshot_v2() returns jsonb
language plpgsql security definer set search_path=pg_catalog,pg_temp as $$
declare s jsonb; tasks jsonb;
begin
  s:=public.ut_panel_snapshot_v1();
  select coalesce(jsonb_agg(t || jsonb_build_object('fields',
      (t->'fields') || jsonb_strip_nulls(jsonb_build_object('action_front',e.frente_de_accion,'action_rank',e.posicion_de_accion)))
      order by t->>'id'),'[]'::jsonb)
    into tasks from jsonb_array_elements(s->'tasks') t join operativo.follow_ups e on e.id=t->>'id';
  return s || jsonb_build_object('contract',2,'tasks',tasks);
end $$;
revoke all on function public.ut_panel_snapshot_v2() from public,anon,authenticated;
grant execute on function public.ut_panel_snapshot_v2() to service_role;

-- Generated columns do not enter the fixed read allowlist. All existing stamp,
-- audit and global revision triggers stay installed; the RPC commits all ranks
-- in one transaction and forces deferred uniqueness before its receipt.
set constraints all immediate;
do $$ declare v1 jsonb; v2 jsonb; source jsonb; normalized jsonb; begin
  v1:=public.ut_panel_snapshot_v1(); v2:=public.ut_panel_snapshot_v2();
  select source_snapshot into source from operativo.action_ranking_migration;
  normalized:=v1-'revision'-'updatedAt';
  if normalized is distinct from source-'revision'-'updatedAt' then raise exception 'Existing panel values changed'; end if;
  if jsonb_array_length(v2->'tasks')<>jsonb_array_length(v1->'tasks') then raise exception 'Task count changed'; end if;
  if has_function_privilege('anon','public.ut_panel_snapshot_v2()','execute')
    or has_function_privilege('authenticated','public.ut_panel_snapshot_v2()','execute') then raise exception 'Unsafe snapshot grant'; end if;
end $$;
commit;
