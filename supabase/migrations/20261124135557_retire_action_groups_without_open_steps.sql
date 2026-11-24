-- The panel flushes deferred group validation before it records the receipt.
-- Evaluate the final membership, including batches that replace the last step.
set local lock_timeout='5s';
set local statement_timeout='35s';
drop trigger follow_up_close_completed_group on operativo.follow_ups;
drop function operativo.close_completed_action_group_on_change();

create or replace function operativo.close_completed_action_group(p_group_id text)
returns boolean language plpgsql security invoker
set search_path = pg_catalog, pg_temp as $$
declare
  group_front text;
  total integer;
  finished integer;
  discarded integer;
  completed boolean;
  previous_actor text;
begin
  perform 1 from operativo.migration_control where singleton for update;
  select frente_de_accion into group_front from operativo.follow_ups
    where id=p_group_id and tipo_de_accion='group' and estado not in ('Hecho','Cancelado')
    for update;
  if not found then return false; end if;

  select count(*), count(*) filter (where estado='Hecho'), count(*) filter (where estado='Cancelado')
    into total, finished, discarded from operativo.follow_ups where grupo_de_accion=p_group_id;
  if finished + discarded < total then return false; end if;
  completed := total > 0 and finished = total;
  previous_actor := current_setting('undertango.actor', true);
  perform set_config('undertango.actor', 'system:auto-close-completed-group', true);
  update operativo.follow_ups
    set estado=case when completed then 'Hecho' else 'Cancelado' end,
        estado_de_accion=case when completed then 'Terminada' else null end
    where id=p_group_id;

  with ordered as (
    select id, row_number() over (order by posicion_de_accion, created_at, id)::integer as next_position
    from operativo.follow_ups
    where frente_de_accion=group_front and grupo_de_accion is null and estado not in ('Hecho','Cancelado')
  )
  update operativo.follow_ups f set posicion_de_accion=ordered.next_position
    from ordered where f.id=ordered.id and f.posicion_de_accion is distinct from ordered.next_position;
  perform set_config('undertango.actor', coalesce(previous_actor,''), true);
  return true;
end $$;

create or replace function operativo.validate_action_groups() returns trigger
language plpgsql security invoker set search_path = pg_catalog, pg_temp as $$
begin
  if tg_op <> 'INSERT' and old.grupo_de_accion is not null then
    if tg_op='DELETE' or old.grupo_de_accion is distinct from new.grupo_de_accion
      or (old.estado is distinct from new.estado and new.estado in ('Hecho','Cancelado')) then
      perform operativo.close_completed_action_group(old.grupo_de_accion);
    end if;
  end if;

  -- A parent patch may be queued before the detach of its last member.
  -- Inspect that parent's final row here. Other changed parents get their own
  -- deferred event, so unrelated patches cannot reject a valid dissolution.
  if tg_op <> 'DELETE' and new.tipo_de_accion='group' and exists (
    select 1 from operativo.follow_ups g
    where g.id=new.id and g.tipo_de_accion='group' and g.estado not in ('Hecho','Cancelado')
      and not exists (select 1 from operativo.follow_ups m where m.grupo_de_accion=g.id)
  ) then
    if tg_op='UPDATE' and old.tipo_de_accion='group' and old.estado not in ('Hecho','Cancelado') then
      perform operativo.close_completed_action_group(new.id);
    else
      raise exception using errcode='23514',message='Open groups need a position and members';
    end if;
  end if;

  if exists (select 1 from operativo.follow_ups m left join operativo.follow_ups g on g.id=m.grupo_de_accion
    where m.grupo_de_accion is not null and (g.id is null or g.tipo_de_accion<>'group' or g.grupo_de_accion is not null
    or (g.estado in ('Hecho','Cancelado') and m.estado not in ('Hecho','Cancelado')))) then
    raise exception using errcode='23514',message='Invalid action group membership';
  end if;
  if exists (select 1 from operativo.follow_ups where tipo_de_accion='group'
    and estado not in ('Hecho','Cancelado') and frente_de_accion is null) then
    raise exception using errcode='23514',message='Open groups need a position and members';
  end if;
  if exists (select 1 from operativo.follow_ups where tipo_de_accion='group' and estado not in ('Hecho','Cancelado')
    group by lower(btrim(regexp_replace(seguimiento,'\s+',' ','g'))) having count(*)>1) then
    raise exception using errcode='23514',message='Duplicate open action group';
  end if;
  return null;
end $$;

do $$
declare candidate record;
begin
  for candidate in select g.id from operativo.follow_ups g
    where g.tipo_de_accion='group' and g.estado not in ('Hecho','Cancelado')
      and not exists (select 1 from operativo.follow_ups m where m.grupo_de_accion=g.id
        and (m.estado is null or m.estado not in ('Hecho','Cancelado')))
    order by g.frente_de_accion, g.posicion_de_accion, g.id
  loop
    perform operativo.close_completed_action_group(candidate.id);
  end loop;
end $$;
