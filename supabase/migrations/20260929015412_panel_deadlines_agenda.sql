-- Canonical agenda complements actions, operations and cases without changing ranks.
begin;
set local lock_timeout = '5s';
set local statement_timeout = '60s';
create table operativo.agenda_items (
 id text primary key default ('sb-' || gen_random_uuid()::text),
 created_at timestamptz not null default now(),
 updated_at timestamptz not null default now(),
 version bigint not null default 1,
 title text not null check (length(btrim(title)) between 1 and 300),
 on_date date,
 time_label text check (length(time_label)<=160),
 kind text not null check (kind in ('deadline','confirmed','tentative','conditional')),
 status text not null default 'Pendiente' check (status in ('Pendiente','Confirmado','Por confirmar','Condicionado','Realizado','Cancelado','Archivado')),
 priority text check (priority in ('Alta','Media','Baja')),
 notes text check (length(notes)<=20000),
 source_key text not null unique check (length(source_key) between 1 and 250),
 source_url text check (source_url is null or source_url ~ '^https://'),
 follow_up_id text unique references operativo.follow_ups(id),
 operation_id text unique references operativo.operations(id),
 case_id text unique references operativo.cases(id),
 constraint agenda_source_valid check (num_nonnulls(follow_up_id,operation_id,case_id)<=1),
 constraint agenda_date_valid check (on_date is not null or num_nonnulls(follow_up_id,operation_id,case_id)=1)
);
alter table operativo.agenda_items enable row level security;
revoke all on operativo.agenda_items from public,anon,authenticated;
create index agenda_items_date_open on operativo.agenda_items(on_date) where status not in ('Realizado','Cancelado','Archivado');
create trigger ut_begin_change before insert or delete or update or truncate on operativo.agenda_items for each statement execute function operativo.begin_change();
create trigger ut_stamp_entity before insert or update on operativo.agenda_items for each row execute function operativo.stamp_entity();
create trigger ut_audit_change after insert or delete or update on operativo.agenda_items for each row execute function operativo.audit_change();

-- Use the established validated patch contract, receipt, audit and global lock.
do $migration$
declare source text; guard text := '(''follow_ups'',''projects'',''trigger_events'',''team_members'')';
begin
 source:=pg_get_functiondef('operativo.apply_panel_patch(text,text,jsonb,boolean)'::regprocedure);
 if strpos(source,guard)=0 then raise exception 'Patch allowlist changed; review before applying'; end if;
 execute replace(source,guard,'(''follow_ups'',''projects'',''trigger_events'',''team_members'',''agenda_items'')');
end $migration$;

insert into operativo.migration_manifest(table_id,target_table,source_rows,imported_rows,definition)
select 'native_agenda_items','agenda_items',0,0,
 jsonb_build_object('id','native_agenda_items','name','Agenda','targetTable','agenda_items','targetSchema','operativo','primaryFieldId','title','fields',jsonb_agg(
 jsonb_build_object('id',col,'name',col,'column',col,'sqlType',case when col='on_date' then 'date' else 'text' end,'type',case when col in ('kind','status','priority') then 'singleSelect' else 'singleLineText' end,'config',
 case when col='kind' then '{"choices":[{"name":"deadline"},{"name":"confirmed"},{"name":"tentative"},{"name":"conditional"}]}'::jsonb
 when col='status' then '{"choices":[{"name":"Pendiente"},{"name":"Confirmado"},{"name":"Por confirmar"},{"name":"Condicionado"},{"name":"Realizado"},{"name":"Cancelado"},{"name":"Archivado"}]}'::jsonb
 when col='priority' then '{"choices":[{"name":"Alta"},{"name":"Media"},{"name":"Baja"}]}'::jsonb else '{}'::jsonb end)))
from unnest(array['title','on_date','time_label','kind','status','priority','notes','source_key','source_url','follow_up_id','operation_id','case_id']) col;
insert into operativo.panel_write_fields(table_name,field_id)
select 'agenda_items',f->>'id' from operativo.migration_manifest m,jsonb_array_elements(m.definition->'fields') f where m.target_table='agenda_items';

-- Only the trusted server role can call this RPC. The existing private API
-- authorizes Pablo before making this call; no browser receives a secret key.
create function public.ut_panel_deadlines_v1() returns jsonb
language sql stable security definer set search_path=pg_catalog,pg_temp as $rpc$
with manual as (
 select a.id,'agenda'::text as source,coalesce(a.follow_up_id,a.operation_id,a.case_id,a.id) as source_id,
 a.title,coalesce(f.vencimiento,o.fecha,c.fecha_tentativa,a.on_date) as date,
 coalesce(a.time_label,o.hora,c.hora_tentativa,'') as time_label,a.kind,a.status,
 coalesce(a.priority,f.prioridad,c.prioridad,'') as priority,coalesce(a.notes,'') as detail,coalesce(a.source_url,'') as url,
 a.follow_up_id as task_id
 from operativo.agenda_items a
 left join operativo.follow_ups f on f.id=a.follow_up_id
 left join operativo.operations o on o.id=a.operation_id
 left join operativo.cases c on c.id=a.case_id
 where a.status not in ('Realizado','Cancelado','Archivado')
 and (a.kind<>'deadline' or f.id is null or coalesce(f.estado,'') not in ('Hecho','Cancelado'))
 and (o.id is null or coalesce(o.estado,'') not in ('Realizada','Cancelada'))
 and (c.id is null or coalesce(c.estado,'') not in ('Cerrado','Descartado','Perdido','Cancelado'))
), items as (
 select * from manual
 union all
 select 'task:'||f.id,'task',f.id,f.seguimiento,f.vencimiento,''::text,'deadline',coalesce(f.estado_de_accion,f.estado,'Pendiente'),
 coalesce(f.prioridad,''),coalesce(f.motivo_de_espera_revision,''),coalesce(f.documento_de_apoyo,''),f.id
 from operativo.follow_ups f
 where f.vencimiento is not null and coalesce(f.estado,'') not in ('Hecho','Cancelado')
 and coalesce(f.estado_de_accion,'')<>'Terminada' and coalesce(f.tipo_de_accion,'action')<>'group'
 and not exists(select 1 from operativo.agenda_items a where a.follow_up_id=f.id)
 union all
 select 'operation:'||o.id,'operation',o.id,o.operacion,o.fecha,coalesce(o.hora,''),
 case when o.estado in ('Confirmada','Confirmado') then 'confirmed' else 'tentative' end,
 coalesce(o.estado,'Por confirmar'),''::text,coalesce(o.notas,''),''::text,null::text
 from operativo.operations o where o.fecha is not null and coalesce(o.estado,'') not in ('Realizada','Cancelada')
 and not exists(select 1 from operativo.agenda_items a where a.operation_id=o.id)
 union all
 select 'case:'||c.id,'case',c.id,c.caso,c.fecha_tentativa,coalesce(c.hora_tentativa,''),
 case when c.estado='Propuesta enviada' then 'conditional' else 'tentative' end,
 coalesce(c.estado,'Por confirmar'),coalesce(c.prioridad,''),coalesce(c.resumen_actual,''),coalesce(c.enlace_de_origen,''),null::text
 from operativo.cases c where c.fecha_tentativa is not null
 and coalesce(c.estado,'') not in ('Cerrado','Descartado','Perdido','Cancelado')
 and (c.estado is distinct from 'Propuesta enviada' or exists(select 1 from operativo.link_cases_eventos_disparadores l join operativo.trigger_events e on e.id=l.right_id where l.left_id=c.id and e.estado='Esperando'))
 and not exists(select 1 from operativo.agenda_items a where a.case_id=c.id)
 and not exists(select 1 from operativo.link_cases_operacion_resultante l join operativo.operations o on o.id=l.right_id where l.left_id=c.id and o.fecha=c.fecha_tentativa and coalesce(o.estado,'')<>'Cancelada')
 union all
 select 'project:'||p.id,'project',p.id,p.proyecto,p.fecha_objetivo,''::text,'deadline',coalesce(p.estado,'Pendiente'),
 coalesce(p.prioridad,''),'Objetivo del proyecto. '||coalesce(p.proximo_hito,''),coalesce(p.documento_de_apoyo,''),null::text
 from operativo.projects p where p.fecha_objetivo is not null and p.estado in ('Activo','Bloqueado')
 and not exists(select 1 from operativo.link_follow_ups_proyectos l join operativo.follow_ups f on f.id=l.left_id where l.right_id=p.id and f.vencimiento=p.fecha_objetivo and coalesce(f.estado,'') not in ('Hecho','Cancelado'))
), filtered as (
 select * from items where date is not null and title is not null
 and (date >= (now() at time zone 'America/Argentina/Cordoba')::date or kind='deadline')
)
select jsonb_build_object('contract',1,'source','supabase','timezone','America/Argentina/Cordoba',
 'today',(now() at time zone 'America/Argentina/Cordoba')::date,'updatedAt',now(),
 'revision',(select global_revision::text from operativo.migration_control where singleton),
 'items',coalesce((select jsonb_agg(jsonb_build_object('id',id,'source',source,'sourceId',source_id,'title',title,
 'date',date,'time',time_label,'kind',kind,'status',status,'priority',priority,'detail',left(detail,2000),'url',url,'taskId',task_id)
 order by date,time_label,title,id) from filtered),'[]'::jsonb));
$rpc$;
revoke all on function public.ut_panel_deadlines_v1() from public,anon,authenticated;
grant execute on function public.ut_panel_deadlines_v1() to service_role;
comment on table operativo.agenda_items is 'Supabase canonical dated commitments. Calendar is supporting evidence, not queried by the panel. Writes use ut_panel_commit_v1 and source_key deduplicates imports. Linked source dates remain authoritative.';
commit;
