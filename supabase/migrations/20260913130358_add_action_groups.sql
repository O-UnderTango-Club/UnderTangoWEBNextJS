begin;
alter table operativo.follow_ups
 add column tipo_de_accion text not null default 'action' check(tipo_de_accion in ('action','group')),
 add column grupo_de_accion text references operativo.follow_ups(id) deferrable initially deferred,
 add column orden_en_grupo integer,
 add constraint group_members_no_rank check (grupo_de_accion is null or (tipo_de_accion='action' and frente_de_accion is null and posicion_de_accion is null)),
 add constraint group_member_order check ((grupo_de_accion is null and orden_en_grupo is null) or (grupo_de_accion is not null and orden_en_grupo is not null and orden_en_grupo>0)),
 add constraint group_order_unique unique(grupo_de_accion,orden_en_grupo) deferrable initially deferred;
create index follow_ups_group on operativo.follow_ups(grupo_de_accion) where grupo_de_accion is not null;

update operativo.migration_manifest set definition=jsonb_set(definition,'{fields}',(definition->'fields')||'[
 {"id":"action_kind","name":"Tipo de unidad","type":"singleSelect","column":"tipo_de_accion","sqlType":"text","config":{"choices":[{"name":"action"},{"name":"group"}]}},
 {"id":"action_group","name":"Grupo de acciones","type":"singleLineText","column":"grupo_de_accion","sqlType":"text"},
 {"id":"group_order","name":"Orden en grupo","type":"number","column":"orden_en_grupo","sqlType":"numeric"}
]'::jsonb) where target_table='follow_ups';
insert into operativo.panel_write_fields(table_name,field_id) values
 ('follow_ups','action_kind'),('follow_ups','action_group'),('follow_ups','group_order');

-- Existing audit, version and global-revision triggers remain installed.
-- Deferred validation checks the final state of an atomic multi-row change.
create function operativo.validate_action_groups() returns trigger
language plpgsql set search_path=pg_catalog,pg_temp as $$
begin
 if exists(select 1 from operativo.follow_ups m left join operativo.follow_ups g on g.id=m.grupo_de_accion
   where m.grupo_de_accion is not null and (g.id is null or g.tipo_de_accion<>'group' or g.grupo_de_accion is not null
   or (g.estado in ('Hecho','Cancelado') and m.estado not in ('Hecho','Cancelado')))) then
   raise exception using errcode='23514',message='Invalid action group membership';
 end if;
 if exists(select 1 from operativo.follow_ups g where g.tipo_de_accion='group' and g.estado not in ('Hecho','Cancelado')
   and (g.frente_de_accion is null or not exists(select 1 from operativo.follow_ups m where m.grupo_de_accion=g.id))) then
   raise exception using errcode='23514',message='Open groups need a position and members';
 end if;
 if exists(select 1 from operativo.follow_ups where tipo_de_accion='group' and estado not in ('Hecho','Cancelado')
    group by lower(btrim(regexp_replace(seguimiento,'\s+',' ','g'))) having count(*)>1) then
   raise exception using errcode='23514',message='Duplicate open action group';
 end if;
 return null;
end $$;
create constraint trigger validate_action_groups after insert or update or delete on operativo.follow_ups
 deferrable initially deferred for each row execute function operativo.validate_action_groups();
revoke all on function operativo.validate_action_groups() from public,anon,authenticated;

create function public.ut_panel_snapshot_v4() returns jsonb
language plpgsql security definer set search_path=pg_catalog,pg_temp as $$
declare s jsonb; tasks jsonb;
begin
 s:=public.ut_panel_snapshot_v3();
 select coalesce(jsonb_agg(t||jsonb_build_object('fields',(t->'fields')||jsonb_strip_nulls(jsonb_build_object(
  'action_kind',e.tipo_de_accion,'action_group',e.grupo_de_accion,'group_order',e.orden_en_grupo))) order by t->>'id'),'[]'::jsonb)
 into tasks from jsonb_array_elements(s->'tasks') t join operativo.follow_ups e on e.id=t->>'id';
 return s||jsonb_build_object('contract',4,'tasks',tasks);
end $$;
revoke all on function public.ut_panel_snapshot_v4() from public,anon,authenticated;
grant execute on function public.ut_panel_snapshot_v4() to service_role;

CREATE OR REPLACE FUNCTION public.ut_panel_commit_v2(p_request_id uuid, p_actor text, p_intent jsonb, p_expected_revision text, p_patches jsonb)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'pg_catalog', 'pg_temp'
AS $function$ declare control operativo.migration_control%rowtype; receipt jsonb; patch jsonb; saved_id text; first_id text; ids jsonb:='[]'; result jsonb; begin
if p_request_id is null or p_actor is null or length(p_actor) not between 1 and 320 or p_intent is null or jsonb_typeof(p_intent)<>'object' or octet_length(p_intent::text)>20000 or p_expected_revision is null or p_expected_revision!~'^(0|[1-9][0-9]*)$' or p_patches is null or jsonb_typeof(p_patches)<>'array' then raise exception using errcode='22023',message='Invalid change envelope'; end if;
if jsonb_array_length(p_patches) not between 1 and 500 or octet_length(p_patches::text)>200000 then raise exception using errcode='22023',message='Too many changes'; end if;
select * into strict control from operativo.migration_control where singleton for update;
receipt:=public.ut_panel_receipt_v1(p_request_id,p_actor,p_intent); if receipt is not null then return receipt; end if;
if control.status<>'active' then raise exception using errcode='PT409',message='Supabase cutover is not active'; end if;
if control.global_revision::text<>p_expected_revision then raise exception using errcode='PT409',message='The operational snapshot changed; refresh before saving'; end if;
perform set_config('undertango.actor',p_actor,true);
for patch in select value from jsonb_array_elements(p_patches) loop
if jsonb_typeof(patch)<>'object' or jsonb_typeof(patch->'create')<>'boolean' or exists(select 1 from jsonb_object_keys(patch) k where k not in ('table','id','fields','create')) then raise exception using errcode='22023',message='Invalid patch envelope'; end if;
if patch->'fields'->>'action_group'='__new_group__' then
if first_id is null then raise exception 'Missing new group'; end if;
patch:=jsonb_set(patch,'{fields,action_group}',to_jsonb(first_id));
end if;
saved_id:=operativo.apply_panel_patch(patch->>'table',patch->>'id',patch->'fields',(patch->>'create')::boolean); first_id:=coalesce(first_id,saved_id); ids:=ids||jsonb_build_array(saved_id);
end loop;
set constraints all immediate;
result:=jsonb_build_object('ok',true,'id',first_id,'ids',ids,'requestId',p_request_id,'revision',(select global_revision::text from operativo.migration_control where singleton),'savedAt',clock_timestamp());
insert into operativo.panel_receipts(request_id,actor,intent,result) values(p_request_id,p_actor,p_intent,result); return result; end $function$;

revoke all on function public.ut_panel_commit_v2(uuid,text,jsonb,text,jsonb) from public,anon,authenticated;
grant execute on function public.ut_panel_commit_v2(uuid,text,jsonb,text,jsonb) to service_role;
commit;
