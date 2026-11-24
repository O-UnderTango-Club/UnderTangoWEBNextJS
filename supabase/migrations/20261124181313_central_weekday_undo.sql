create or replace function public.ut_central_latest_v1(p_actor text)
returns jsonb
language sql stable security definer
set search_path = pg_catalog, pg_temp
as $$
  select jsonb_build_object(
    'requestId', r.request_id,
    'taskId', r.intent->>'id',
    'operation', r.intent->>'centralAction'
  )
  from operativo.panel_receipts r
  where r.actor = p_actor and r.intent->>'origin' = 'central-control'
    and r.intent->>'kind' = 'task'
    and r.intent->>'centralAction' in ('finish', 'doneToday', 'weekdays')
    and not exists (
      select 1 from operativo.panel_receipts u
      where u.actor = r.actor and u.intent->>'kind' = 'centralUndo'
        and u.intent->>'originalId' = r.request_id::text
    )
  order by r.created_at desc, r.request_id desc
  limit 1;
$$;

create or replace function public.ut_central_undo_v1(p_actor text, p_request_id uuid, p_original_id uuid)
returns jsonb
language plpgsql security definer
set search_path = pg_catalog, pg_temp
as $$
declare
  undo_intent jsonb := jsonb_build_object('kind', 'centralUndo', 'originalId', p_original_id);
  original operativo.panel_receipts%rowtype;
  receipt jsonb;
  frames jsonb;
  frame jsonb;
  prior operativo.follow_ups%rowtype;
  saved operativo.follow_ups%rowtype;
  actual operativo.follow_ups%rowtype;
  edited_fields constant text[] := array['estado','estado_de_accion','activar_en','resultado','posicion_de_accion','dias_semana'];
  technical_fields constant text[] := array['version','updated_at','ranking_frente_abierto','ranking_posicion_abierta'];
begin
  if nullif(p_actor, '') is null or p_request_id is null or p_original_id is null then
    raise exception using errcode = '22023', message = 'Invalid undo envelope';
  end if;

  perform 1 from operativo.migration_control where singleton and status = 'active' for update;
  if not found then raise exception using errcode = 'PT409', message = 'Supabase is not active'; end if;

  receipt := public.ut_panel_receipt_v1(p_request_id, p_actor, undo_intent);
  if receipt is not null then return receipt; end if;
  if public.ut_central_latest_v1(p_actor)->>'requestId' is distinct from p_original_id::text then
    raise exception using errcode = 'PT409', message = 'The latest change has moved';
  end if;
  select * into strict original from operativo.panel_receipts where request_id = p_original_id;

  -- The panel commits under the same lock and records every affected row, including automatic group closure.
  select jsonb_agg(jsonb_build_object('before', changes.before_row, 'after', changes.after_row))
  into frames
  from (
    select (array_agg(a.before_row order by a.id))[1] as before_row,
           (array_agg(a.after_row order by a.id desc))[1] as after_row
    from operativo.change_audit a
    where a.table_name = 'follow_ups' and a.operation = 'UPDATE'
      and a.revision > (original.intent->>'snapshotRevision')::bigint
      and a.revision <= (original.result->>'revision')::bigint
    group by a.after_row->>'id'
  ) changes;
  if not exists (select 1 from jsonb_array_elements(frames) x where x->'after'->>'id' = original.intent->>'id') then
    raise exception using errcode = 'PT409', message = 'Undo history unavailable';
  end if;

  for frame in select value from jsonb_array_elements(frames) loop
    select * into actual from operativo.follow_ups where id = frame->'after'->>'id' for update;
    if not found
      or ((frame->'before') - technical_fields - edited_fields) is distinct from ((frame->'after') - technical_fields - edited_fields)
      or exists (
        select 1 from unnest(edited_fields || array['frente_de_accion','grupo_de_accion','tipo_de_accion']) as fields(field)
        where (fields.field not in (select unnest(edited_fields)) or frame->'before'->fields.field is distinct from frame->'after'->fields.field)
          and to_jsonb(actual)->fields.field is distinct from frame->'after'->fields.field
      ) then
      raise exception using errcode = 'PT409', message = 'An affected action has been edited since this change';
    end if;
  end loop;

  perform set_config('undertango.actor', p_actor, true);
  for frame in select value from jsonb_array_elements(frames) loop
    prior := jsonb_populate_record(null::operativo.follow_ups, frame->'before');
    saved := jsonb_populate_record(null::operativo.follow_ups, frame->'after');
    if row(prior.estado, prior.estado_de_accion, prior.activar_en, prior.resultado, prior.posicion_de_accion, prior.dias_semana)
      is distinct from row(saved.estado, saved.estado_de_accion, saved.activar_en, saved.resultado, saved.posicion_de_accion, saved.dias_semana) then
      update operativo.follow_ups f
      set estado = case when prior.estado is distinct from saved.estado then prior.estado else f.estado end,
          estado_de_accion = case when prior.estado_de_accion is distinct from saved.estado_de_accion then prior.estado_de_accion else f.estado_de_accion end,
          activar_en = case when prior.activar_en is distinct from saved.activar_en then prior.activar_en else f.activar_en end,
          resultado = case when prior.resultado is distinct from saved.resultado then prior.resultado else f.resultado end,
          dias_semana = case when prior.dias_semana is distinct from saved.dias_semana then prior.dias_semana else f.dias_semana end,
          posicion_de_accion = case when prior.posicion_de_accion is distinct from saved.posicion_de_accion then prior.posicion_de_accion else f.posicion_de_accion end
      where f.id = prior.id;
    end if;
  end loop;
  set constraints all immediate;

  receipt := jsonb_build_object('ok', true, 'id', original.intent->>'id', 'requestId', p_request_id);
  insert into operativo.panel_receipts(request_id, actor, intent, result)
  values (p_request_id, p_actor, undo_intent, receipt);
  return receipt;
exception when integrity_constraint_violation then
  raise exception using errcode = 'PT409', message = 'The previous configuration no longer fits';
end;
$$;
