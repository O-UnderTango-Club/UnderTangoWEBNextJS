begin;
set local lock_timeout='5s';
set local statement_timeout='30s';
do $test$
declare request uuid:=gen_random_uuid(); revision text; result jsonb; replay jsonb;
  intent jsonb:=jsonb_build_object('test','project-creation'); fields jsonb;
  original_tasks jsonb; original_projects bigint; project_name text:='TEST-project-'||gen_random_uuid()::text;
begin
  select global_revision::text into revision from operativo.migration_control where singleton for update;
  select jsonb_agg(to_jsonb(t) order by id) into original_tasks from operativo.follow_ups t;
  select count(*) into original_projects from operativo.projects;
  fields:=jsonb_build_object('fldChULRkd1GrXY3w',project_name,'fldcypAILEecLnLGQ','Activo','fldrApFZcuzKj3Gax','Rollback-only verification');
  result:=public.ut_panel_commit_v1(request,'project-creation-test',intent,revision,jsonb_build_array(jsonb_build_object('table','projects','id',null,'create',true,'fields',fields)));
  replay:=public.ut_panel_commit_v1(request,'project-creation-test',intent,revision,jsonb_build_array(jsonb_build_object('table','projects','id',null,'create',true,'fields',fields)));
  if result is distinct from replay then raise exception 'Receipt replay changed'; end if;
  if (select count(*) from operativo.projects)<>original_projects+1 then raise exception 'Duplicate project created'; end if;
  if not exists(select 1 from operativo.projects where id=result->>'id' and proyecto=project_name and frente_actual is null and ranking_en_frente is null) then raise exception 'Project data/rank mismatch'; end if;
  if not exists(select 1 from operativo.change_audit where table_name='projects' and operation='INSERT' and actor='project-creation-test' and after_row->>'id'=result->>'id') then raise exception 'Missing audit'; end if;
  if not exists(select 1 from jsonb_array_elements(public.ut_panel_snapshot_v3()->'projects') p where p->>'id'=result->>'id') then raise exception 'Project absent from snapshot'; end if;
  select global_revision::text into revision from operativo.migration_control where singleton;
  begin
    perform public.ut_panel_commit_v1(gen_random_uuid(),'project-creation-test',intent,revision,jsonb_build_array(jsonb_build_object('table','projects','id',null,'create',true,'fields',fields||jsonb_build_object('fldChULRkd1GrXY3w','  '||upper(project_name)||'  '))));
    raise exception 'Duplicate project accepted';
  exception when sqlstate 'PT409' then null; end;
  if original_tasks is distinct from (select jsonb_agg(to_jsonb(t) order by id) from operativo.follow_ups t) then raise exception 'Existing tasks changed'; end if;
end $test$;
rollback;
