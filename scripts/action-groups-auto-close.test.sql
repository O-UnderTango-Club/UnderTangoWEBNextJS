-- Run after the migration in a transaction that is always rolled back.
begin;
select set_config('undertango.actor', 'test:group-completion', true);

do $test$
declare
  group_id text;
  cancelled_group_id text;
  first_step_id text;
  second_step_id text;
  added_step_id text;
  next_rank integer;
  before_order text[];
  after_order text[];
begin
  select array_agg(id order by posicion_de_accion, created_at, id) into before_order
    from operativo.follow_ups where frente_de_accion = 'Primario' and grupo_de_accion is null and estado not in ('Hecho', 'Cancelado');
  select coalesce(max(posicion_de_accion), 0) + 1 into next_rank
    from operativo.follow_ups where frente_de_accion = 'Primario' and estado not in ('Hecho', 'Cancelado');
  insert into operativo.follow_ups(seguimiento, tipo_de_accion, frente_de_accion, posicion_de_accion)
    values ('TEST completion ' || gen_random_uuid(), 'group', 'Primario', next_rank) returning id into group_id;
  insert into operativo.follow_ups(seguimiento, grupo_de_accion, orden_en_grupo)
    values ('TEST first step', group_id, 1) returning id into first_step_id;
  insert into operativo.follow_ups(seguimiento, grupo_de_accion, orden_en_grupo)
    values ('TEST second step', group_id, 2) returning id into second_step_id;

  update operativo.follow_ups set estado = 'Hecho', estado_de_accion = 'Terminada' where id = first_step_id;
  if (select estado from operativo.follow_ups where id = group_id) <> 'Pendiente' then
    raise exception 'A group with an open step was closed';
  end if;
  update operativo.follow_ups set estado = 'Hecho', estado_de_accion = 'Terminada' where id = second_step_id;
  if (select estado from operativo.follow_ups where id = group_id) <> 'Hecho' then
    raise exception 'A group with all steps completed was not closed';
  end if;
  select array_agg(id order by posicion_de_accion, created_at, id) into after_order
    from operativo.follow_ups where frente_de_accion = 'Primario' and grupo_de_accion is null and estado not in ('Hecho', 'Cancelado');
  if before_order is distinct from after_order then raise exception 'Closing changed the relative order of other actions'; end if;
  if not exists (select 1 from operativo.change_audit where table_name = 'follow_ups' and operation = 'UPDATE'
                 and actor = 'system:auto-close-completed-group' and after_row->>'id' = group_id and after_row->>'estado' = 'Hecho')
  then raise exception 'Automatic closure was not audited'; end if;
  if current_setting('undertango.actor', true) <> 'test:group-completion' then raise exception 'Caller audit actor was not restored'; end if;

  select coalesce(max(posicion_de_accion), 0) + 1 into next_rank
    from operativo.follow_ups where frente_de_accion = 'Primario' and estado not in ('Hecho', 'Cancelado');
  insert into operativo.follow_ups(seguimiento, tipo_de_accion, frente_de_accion, posicion_de_accion)
    values ('TEST discarded ' || gen_random_uuid(), 'group', 'Primario', next_rank) returning id into cancelled_group_id;
  insert into operativo.follow_ups(seguimiento, grupo_de_accion, orden_en_grupo)
    values ('TEST discarded step', cancelled_group_id, 1) returning id into added_step_id;
  update operativo.follow_ups set estado = 'Cancelado', estado_de_accion = null where id = added_step_id;
  if (select estado from operativo.follow_ups where id = cancelled_group_id) <> 'Pendiente' then
    raise exception 'A discarded step was treated as completed';
  end if;
  insert into operativo.follow_ups(seguimiento, grupo_de_accion, orden_en_grupo)
    values ('TEST completed alongside discarded', cancelled_group_id, 2) returning id into added_step_id;
  update operativo.follow_ups set estado = 'Hecho', estado_de_accion = 'Terminada' where id = added_step_id;
  if (select estado from operativo.follow_ups where id = cancelled_group_id) <> 'Pendiente' then
    raise exception 'Mixed discarded and completed steps closed a group';
  end if;

  -- A deliberately reopened group stays open so another step can be added.
  select coalesce(max(posicion_de_accion), 0) + 1 into next_rank
    from operativo.follow_ups where frente_de_accion = 'Primario' and estado not in ('Hecho', 'Cancelado');
  update operativo.follow_ups set estado = 'Pendiente', estado_de_accion = 'Acción inmediata', posicion_de_accion = next_rank where id = group_id;
  if (select estado from operativo.follow_ups where id = group_id) <> 'Pendiente' then
    raise exception 'Manual reopening did not persist';
  end if;
  insert into operativo.follow_ups(seguimiento, grupo_de_accion, orden_en_grupo)
    values ('TEST added step', group_id, 3) returning id into added_step_id;
  update operativo.follow_ups set estado = 'Hecho', estado_de_accion = 'Terminada' where id = added_step_id;
  if (select estado from operativo.follow_ups where id = group_id) <> 'Hecho' then
    raise exception 'A reopened group did not close after its new step was completed';
  end if;
end
$test$;


-- Exercise the same atomic RPC, revision and idempotency path used by the panel.
do $rpc_test$
declare
  group_id text;
  step_id text;
  next_rank integer;
  before_revision text;
  status_field text;
  gate_field text;
  request_id uuid := gen_random_uuid();
  patch jsonb;
  intent jsonb := '{"kind":"test_group_completion"}'::jsonb;
  receipt jsonb;
begin
  perform 1 from operativo.migration_control where singleton for update;
  select coalesce(max(posicion_de_accion), 0) + 1 into next_rank
    from operativo.follow_ups where frente_de_accion = 'Primario' and estado not in ('Hecho','Cancelado');
  insert into operativo.follow_ups(seguimiento, tipo_de_accion, frente_de_accion, posicion_de_accion)
    values ('TEST rpc ' || gen_random_uuid(), 'group', 'Primario', next_rank) returning id into group_id;
  insert into operativo.follow_ups(seguimiento, grupo_de_accion, orden_en_grupo)
    values ('TEST rpc step', group_id, 1) returning id into step_id;
  select global_revision::text into before_revision from operativo.migration_control where singleton;
  select f->>'id' into status_field from operativo.migration_manifest,
    lateral jsonb_array_elements(definition->'fields') f
    where target_table='follow_ups' and f->>'column'='estado';
  select f->>'id' into gate_field from operativo.migration_manifest,
    lateral jsonb_array_elements(definition->'fields') f
    where target_table='follow_ups' and f->>'column'='estado_de_accion';
  patch := jsonb_build_array(jsonb_build_object('table','follow_ups','id',step_id,'create',false,
    'fields',jsonb_build_object(status_field,'Hecho',gate_field,'Terminada')));
  receipt := public.ut_panel_commit_v2(request_id,'test:rpc',intent,before_revision,patch);
  if receipt->>'ok' <> 'true' or (select estado from operativo.follow_ups where id=group_id) <> 'Hecho'
  then raise exception 'Panel RPC did not close the completed group'; end if;
  if receipt->>'revision' <> (select global_revision::text from operativo.migration_control where singleton)
  then raise exception 'Panel RPC returned an incorrect revision'; end if;
  if public.ut_panel_commit_v2(request_id,'test:rpc',intent,before_revision,patch) is distinct from receipt
  then raise exception 'Panel RPC retry was not idempotent'; end if;
end
$rpc_test$;

set constraints all immediate;
rollback;
