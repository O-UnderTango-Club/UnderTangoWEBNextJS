begin;
set local lock_timeout='5s';
set local statement_timeout='60s';

do $$ declare
  test_id text:='sb-future-activation-contract-test';
  test_rank integer;
  future_at timestamptz:=clock_timestamp()+interval '1 day';
  snapshot jsonb;
  task jsonb;
begin
  if not exists(
    select 1 from information_schema.columns
    where table_schema='operativo' and table_name='follow_ups'
      and column_name='activar_en' and data_type='timestamp with time zone'
  ) then raise exception 'activar_en timestamptz is missing';
  end if;

  select coalesce(max(posicion_de_accion),0)+1 into test_rank
  from operativo.follow_ups
  where frente_de_accion='Terciario' and coalesce(estado,'') not in ('Hecho','Cancelado');

  perform set_config('undertango.actor','future-activation-db-test',true);
  insert into operativo.follow_ups(
    id,seguimiento,estado,estado_de_accion,frente_de_accion,posicion_de_accion,activar_en
  ) values(
    test_id,'Prueba transaccional de activar_en','Pendiente','Acción inmediata','Terciario',test_rank,future_at
  );

  snapshot:=public.ut_panel_snapshot_v3();
  select value into strict task from jsonb_array_elements(snapshot->'tasks') where value->>'id'=test_id;
  if snapshot->>'contract'<>'3' then raise exception 'Unexpected panel contract'; end if;
  if (task->'fields'->>'activate_at')::timestamptz is distinct from future_at then
    raise exception 'Activation timestamp did not round-trip';
  end if;
  if (select posicion_de_accion from operativo.follow_ups where id=test_id)<>test_rank then
    raise exception 'Activation changed the action rank';
  end if;
end $$;

rollback;
