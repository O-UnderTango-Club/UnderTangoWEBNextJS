begin;

-- The old rule promoted a group to Primario after its steps were resolved.
-- Completion is now based on the final state of the group's own steps.
drop trigger if exists follow_up_promote_resolved_group on operativo.follow_ups;

create or replace function operativo.close_completed_action_group(p_group_id text)
returns boolean
language plpgsql
security invoker
set search_path to 'pg_catalog', 'pg_temp'
as $function$
declare
  group_row operativo.follow_ups%rowtype;
  previous_actor text;
begin
  if p_group_id is null then return false; end if;

  -- All panel writes serialize through this row before changing ranks.
  perform 1 from operativo.migration_control where singleton for update;
  select * into group_row
    from operativo.follow_ups
   where id = p_group_id and tipo_de_accion = 'group'
     and estado not in ('Hecho', 'Cancelado')
   for update;
  if not found then return false; end if;

  -- An empty group or a discarded step must never be reported as completed.
  if not exists (select 1 from operativo.follow_ups where grupo_de_accion = group_row.id)
     or exists (select 1 from operativo.follow_ups where grupo_de_accion = group_row.id and estado is distinct from 'Hecho')
  then return false; end if;

  previous_actor := current_setting('undertango.actor', true);
  perform set_config('undertango.actor', 'system:auto-close-completed-group', true);
  update operativo.follow_ups
     set estado = 'Hecho', estado_de_accion = 'Terminada'
   where id = group_row.id;

  -- Close the gap without altering the relative order of other open units.
  with ordered as (
    select id, row_number() over (order by posicion_de_accion, created_at, id)::integer as next_position
      from operativo.follow_ups
     where frente_de_accion = group_row.frente_de_accion
       and grupo_de_accion is null and estado not in ('Hecho', 'Cancelado')
  )
  update operativo.follow_ups f set posicion_de_accion = ordered.next_position
    from ordered
   where f.id = ordered.id and f.posicion_de_accion is distinct from ordered.next_position;

  perform set_config('undertango.actor', coalesce(previous_actor, ''), true);
  return true;
end
$function$;

create or replace function operativo.close_completed_action_group_on_change()
returns trigger
language plpgsql
security invoker
set search_path to 'pg_catalog', 'pg_temp'
as $function$
begin
  perform operativo.close_completed_action_group(new.grupo_de_accion);
  return new;
end
$function$;

revoke all on function operativo.close_completed_action_group(text) from public, anon, authenticated;
revoke all on function operativo.close_completed_action_group_on_change() from public, anon, authenticated;

drop trigger if exists follow_up_close_completed_group on operativo.follow_ups;
create trigger follow_up_close_completed_group
after update of estado on operativo.follow_ups
for each row
when (old.estado is distinct from new.estado and new.estado = 'Hecho' and new.grupo_de_accion is not null)
execute function operativo.close_completed_action_group_on_change();

-- Reconcile groups that already meet the same condition, without fixed IDs.
do $reconcile$
declare candidate record;
begin
  for candidate in
    select g.id from operativo.follow_ups g
     where g.tipo_de_accion = 'group' and g.estado not in ('Hecho', 'Cancelado')
       and exists (select 1 from operativo.follow_ups m where m.grupo_de_accion = g.id)
       and not exists (select 1 from operativo.follow_ups m where m.grupo_de_accion = g.id and m.estado is distinct from 'Hecho')
     order by g.frente_de_accion, g.posicion_de_accion, g.id
  loop
    perform operativo.close_completed_action_group(candidate.id);
  end loop;
end
$reconcile$;

commit;
