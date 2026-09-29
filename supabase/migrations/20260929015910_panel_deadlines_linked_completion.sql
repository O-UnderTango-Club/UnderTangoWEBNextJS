begin;
set local lock_timeout='5s';
alter table operativo.agenda_items add column project_id text references operativo.projects(id),
 add column completion_task_id text references operativo.follow_ups(id);
create index agenda_items_project on operativo.agenda_items(project_id);
create index agenda_items_completion on operativo.agenda_items(completion_task_id);
update operativo.migration_manifest set definition=jsonb_set(definition,'{fields}',(definition->'fields')||
 '[{"id":"project_id","name":"Proyecto","column":"project_id","sqlType":"text","type":"singleLineText","config":{}},{"id":"completion_task_id","name":"Entrega vinculada","column":"completion_task_id","sqlType":"text","type":"singleLineText","config":{}}]'::jsonb) where target_table='agenda_items';
insert into operativo.panel_write_fields(table_name,field_id) values ('agenda_items','project_id'),('agenda_items','completion_task_id');
create or replace function public.ut_panel_deadlines_v1() returns jsonb
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
 left join operativo.follow_ups completed on completed.id=a.completion_task_id
 where a.status not in ('Realizado','Cancelado','Archivado')
 and (a.kind<>'deadline' or f.id is null or coalesce(f.estado,'') not in ('Hecho','Cancelado'))
 and (completed.id is null or coalesce(completed.estado,'') not in ('Hecho','Cancelado'))
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

 and not exists(select 1 from operativo.link_cases_proyectos l join operativo.cases c on c.id=l.left_id where l.right_id=p.id and c.fecha_tentativa=p.fecha_objetivo and coalesce(c.estado,'') not in ('Cerrado','Descartado','Perdido','Cancelado'))
 and not exists(select 1 from operativo.link_operations_proyectos l join operativo.operations o on o.id=l.left_id where l.right_id=p.id and o.fecha=p.fecha_objetivo and coalesce(o.estado,'') not in ('Realizada','Cancelada'))
 and not exists(select 1 from operativo.agenda_items a where a.project_id=p.id and a.on_date=p.fecha_objetivo)
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

commit;
