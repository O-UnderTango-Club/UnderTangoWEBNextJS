-- Run after the migration body, before its COMMIT/ROLLBACK.
-- Every write below is rolled back in a nested transaction.
do $$ declare a record; b record; before_revision bigint; request uuid; intent jsonb; receipt jsonb; repeated jsonb; begin
  select * into strict a from operativo.follow_ups where ranking_frente_abierto='Primario' and ranking_posicion_abierta=1;
  select * into strict b from operativo.follow_ups where ranking_frente_abierto='Primario' and ranking_posicion_abierta=2;
  select global_revision into before_revision from operativo.migration_control where singleton;
  request:=gen_random_uuid(); intent:='{"verification":"action-ranking-rollback"}';
  begin
    set constraints all deferred;
    receipt:=public.ut_panel_commit_v1(request,'action-ranking-test',intent,before_revision::text,
      jsonb_build_array(
        jsonb_build_object('table','follow_ups','id',a.id,'fields',jsonb_build_object('action_rank',2),'create',false),
        jsonb_build_object('table','follow_ups','id',b.id,'fields',jsonb_build_object('action_rank',1),'create',false)));
    if (select posicion_de_accion from operativo.follow_ups where id=a.id)<>2 then raise exception 'Swap failed'; end if;
    repeated:=public.ut_panel_commit_v1(request,'action-ranking-test',intent,before_revision::text,'[]'::jsonb||jsonb_build_object('table','follow_ups','id',a.id,'fields',jsonb_build_object('action_rank',2),'create',false));
    if repeated is distinct from receipt then raise exception 'Retry duplicated a write'; end if;
    if (select global_revision from operativo.migration_control where singleton)<>before_revision+2 then raise exception 'Unexpected revision count'; end if;
    raise exception using errcode='UT001',message='Intentional trial rollback';
  exception when sqlstate 'UT001' then null;
  end;
  if (select global_revision from operativo.migration_control where singleton)<>before_revision then raise exception 'Trial leaked a write'; end if;
  begin
    set constraints all deferred;
    perform public.ut_panel_commit_v1(gen_random_uuid(),'action-ranking-test',intent,before_revision::text,
      jsonb_build_array(jsonb_build_object('table','follow_ups','id',a.id,'fields',jsonb_build_object('action_rank',2),'create',false)));
    raise exception 'Duplicate position was accepted';
  exception when unique_violation then null;
  end;
  if (select posicion_de_accion from operativo.follow_ups where id=a.id)<>1
    or (select global_revision from operativo.migration_control where singleton)<>before_revision then raise exception 'Duplicate rejection was not atomic'; end if;
end $$;
