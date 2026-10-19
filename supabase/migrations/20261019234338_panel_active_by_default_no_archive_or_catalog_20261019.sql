-- Normalize legacy operational statuses with existing audit triggers, then enforce future defaults.
-- This file corresponds to the Supabase migration version 20261019234338.
select set_config('undertango.actor','Migración: proyectos y acciones activos por defecto',true);

update operativo.projects
set estado=case
  when proyecto ilike 'DUPLICADO ARCHIVADO%' or proyecto ilike 'ERROR DE CAPTURA%' then 'Descartado'
  else 'Activo'
end
where estado='Archivado';

update operativo.follow_ups
set estado_de_accion=case
  when estado='Hecho' then 'Terminada'
  when estado='Cancelado' then null
  else 'Acción inmediata'
end
where estado_de_accion='Por revisar';

update operativo.follow_ups
set frente_de_accion='Secundario',
    posicion_de_accion=(select coalesce(max(posicion_de_accion),0)+1 from operativo.follow_ups where frente_de_accion='Secundario' and estado not in ('Hecho','Cancelado'))
where id='sb-202e63ca-d36f-49e1-8593-2f7952a73504'
  and estado='Pendiente' and frente_de_accion is null;

with unranked as (
  select id,row_number() over (order by case when estado='En espera' then 0 else 1 end, seguimiento,id) as rn
  from operativo.follow_ups
  where grupo_de_accion is null and estado not in ('Hecho','Cancelado') and frente_de_accion is null
), maxrank as (
  select coalesce(max(posicion_de_accion),0) as max_position
  from operativo.follow_ups where frente_de_accion='Terciario' and estado not in ('Hecho','Cancelado')
)
update operativo.follow_ups f
set frente_de_accion='Terciario',posicion_de_accion=m.max_position+u.rn
from unranked u cross join maxrank m
where f.id=u.id;

alter table operativo.projects alter column estado set default 'Activo';
alter table operativo.projects alter column estado set not null;
alter table operativo.follow_ups alter column estado set default 'Pendiente';
alter table operativo.follow_ups alter column estado_de_accion set default 'Acción inmediata';

alter table operativo.projects add constraint projects_lifecycle_no_archive
  check (estado in ('Activo','En espera','Completado','Descartado'));
alter table operativo.follow_ups add constraint follow_ups_no_uncategorized
  check (estado_de_accion is distinct from 'Por revisar');
alter table operativo.follow_ups add constraint follow_ups_open_action_has_ranking
  check (estado in ('Hecho','Cancelado') or grupo_de_accion is not null or
     (frente_de_accion in ('Primario','Secundario','Terciario') and posicion_de_accion > 0));

create function operativo.enforce_project_active_on_insert()
returns trigger
language plpgsql
set search_path = 'pg_catalog','pg_temp'
as $fn$
begin
  if new.estado is distinct from 'Activo' then
    raise exception using errcode='23514', message='Todo proyecto nuevo debe comenzar Activo';
  end if;
  return new;
end;
$fn$;
create trigger projects_insert_must_be_active
before insert on operativo.projects for each row
execute function operativo.enforce_project_active_on_insert();
