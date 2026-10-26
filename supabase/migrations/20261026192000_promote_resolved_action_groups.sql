begin;

create or replace function operativo.promote_resolved_action_group(p_group_id text)
returns boolean
language plpgsql
security definer
set search_path to 'pg_catalog', 'pg_temp'
as $function$
declare
  group_row operativo.follow_ups%rowtype;
begin
  if p_group_id is null then return false; end if;

  perform 1 from operativo.migration_control where singleton for update;

  select * into group_row
  from operativo.follow_ups g
  where g.id = p_group_id
    and g.tipo_de_accion = 'group'
    and coalesce(g.estado, '') not in ('Hecho', 'Cancelado')
    and g.estado_de_accion = 'Acción inmediata'
  for update;

  if not found then return false; end if;
  if not exists (
    select 1 from operativo.follow_ups m
    where m.grupo_de_accion = group_row.id
  ) then return false; end if;
  if exists (
    select 1 from operativo.follow_ups m
    where m.grupo_de_accion = group_row.id
      and coalesce(m.estado, '') not in ('Hecho', 'Cancelado')
  ) then return false; end if;
  if group_row.frente_de_accion = 'Primario'
     and group_row.posicion_de_accion = 1 then return false; end if;

  perform f.id
  from operativo.follow_ups f
  where coalesce(f.estado, '') not in ('Hecho', 'Cancelado')
    and (
      f.frente_de_accion = 'Primario'
      or (group_row.frente_de_accion is not null and f.frente_de_accion = group_row.frente_de_accion)
    )
  order by f.frente_de_accion, f.posicion_de_accion, f.id
  for update;

  with ordered as (
    select f.id,
           row_number() over (
             order by (f.id = group_row.id) desc,
                      f.posicion_de_accion nulls last,
                      f.created_at,
                      f.id
           )::integer as next_position
    from operativo.follow_ups f
    where coalesce(f.estado, '') not in ('Hecho', 'Cancelado')
      and (f.frente_de_accion = 'Primario' or f.id = group_row.id)
  )
  update operativo.follow_ups f
  set frente_de_accion = 'Primario',
      posicion_de_accion = ordered.next_position
  from ordered
  where f.id = ordered.id;

  if group_row.frente_de_accion is not null
     and group_row.frente_de_accion <> 'Primario' then
    with source_order as (
      select f.id,
             row_number() over (
               order by f.posicion_de_accion nulls last, f.created_at, f.id
             )::integer as next_position
      from operativo.follow_ups f
      where f.frente_de_accion = group_row.frente_de_accion
        and coalesce(f.estado, '') not in ('Hecho', 'Cancelado')
        and f.id <> group_row.id
    )
    update operativo.follow_ups f
    set posicion_de_accion = source_order.next_position
    from source_order
    where f.id = source_order.id;
  end if;

  return true;
end
$function$;

create or replace function operativo.promote_resolved_action_group_on_change()
returns trigger
language plpgsql
security definer
set search_path to 'pg_catalog', 'pg_temp'
as $function$
declare
  group_id text;
begin
  if tg_op = 'UPDATE' then
    if new.tipo_de_accion = 'group' then
      if new.estado is not distinct from old.estado
         and new.estado_de_accion is not distinct from old.estado_de_accion then
        return new;
      end if;
    else
      if new.grupo_de_accion is not distinct from old.grupo_de_accion
         and not (
           coalesce(old.estado, '') not in ('Hecho', 'Cancelado')
           and coalesce(new.estado, '') in ('Hecho', 'Cancelado')
         ) then
        return new;
      end if;
    end if;
  end if;

  if new.tipo_de_accion = 'group' then
    group_id := new.id;
  else
    group_id := new.grupo_de_accion;
  end if;

  if group_id is not null then
    perform operativo.promote_resolved_action_group(group_id);
  end if;
  return new;
end
$function$;

revoke all on function operativo.promote_resolved_action_group(text) from public, anon, authenticated;
revoke all on function operativo.promote_resolved_action_group_on_change() from public, anon, authenticated;

drop trigger if exists follow_up_promote_resolved_group on operativo.follow_ups;
create trigger follow_up_promote_resolved_group
after insert or update of estado, estado_de_accion, grupo_de_accion
on operativo.follow_ups
for each row
execute function operativo.promote_resolved_action_group_on_change();

set constraints follow_ups_action_position_unique deferred;
select set_config('undertango.actor', 'system:resolved-group-promotion', true);

do $migration$
declare
  candidate record;
begin
  for candidate in
    select g.id
    from operativo.follow_ups g
    where g.tipo_de_accion = 'group'
      and coalesce(g.estado, '') not in ('Hecho', 'Cancelado')
      and g.estado_de_accion = 'Acción inmediata'
      and exists (
        select 1 from operativo.follow_ups m
        where m.grupo_de_accion = g.id
      )
      and not exists (
        select 1 from operativo.follow_ups m
        where m.grupo_de_accion = g.id
          and coalesce(m.estado, '') not in ('Hecho', 'Cancelado')
      )
    order by
      case g.frente_de_accion
        when 'Primario' then 1
        when 'Secundario' then 2
        when 'Terciario' then 3
        else 9
      end desc,
      g.posicion_de_accion desc,
      g.created_at desc,
      g.id desc
  loop
    perform operativo.promote_resolved_action_group(candidate.id);
  end loop;
end
$migration$;

commit;
