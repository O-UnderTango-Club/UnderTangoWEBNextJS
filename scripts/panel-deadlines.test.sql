-- Run as the migration owner. All fixtures and receipts roll back.
begin;
do $test$
declare r jsonb; intent jsonb; task_id text; agenda_id text; before_rev text; current_rev text;
 request_id uuid:=gen_random_uuid(); source_key text:='test:deadlines:'||gen_random_uuid()::text;
 target_date text:=((now() at time zone 'America/Argentina/Cordoba')::date+2)::text;
 moved_date text:=((now() at time zone 'America/Argentina/Cordoba')::date+5)::text;
 rows jsonb;
begin
 if has_function_privilege('anon','public.ut_panel_deadlines_v1()','execute')
 or has_function_privilege('authenticated','public.ut_panel_deadlines_v1()','execute')
 or not has_function_privilege('service_role','public.ut_panel_deadlines_v1()','execute')
 then raise exception 'Private RPC grants failed'; end if;
 select global_revision::text into before_rev from operativo.migration_control where singleton;
 intent:=jsonb_build_object('kind','test','source',source_key);
 r:=public.ut_panel_commit_v1(request_id,'deadline-regression-test',intent,before_rev,
 jsonb_build_array(jsonb_build_object('table','follow_ups','id',null,'create',true,'fields',jsonb_build_object(
 'fldLO5zuV38eu576D','Deadline regression fixture','fldLXBjnEHgHDJvX0','Pendiente','fldh7b5L9hg89tle4','Acción inmediata',
 'fldixmckZrFiyJ6xd',target_date,'weekdays_mask',127))));
 task_id:=r->>'id';
 if public.ut_panel_commit_v1(request_id,'deadline-regression-test',intent,before_rev,
 '[{"table":"follow_ups","id":null,"create":true,"fields":{"fldLO5zuV38eu576D":"Must never duplicate"}}]'::jsonb)<>r then
 raise exception 'Receipt idempotency failed'; end if;
 begin
  perform public.ut_panel_commit_v1(gen_random_uuid(),'deadline-regression-test','{}',before_rev,
  jsonb_build_array(jsonb_build_object('table','follow_ups','id',task_id,'create',false,'fields',jsonb_build_object('fldixmckZrFiyJ6xd',moved_date))));
  raise exception 'Stale revision accepted';
 exception when sqlstate 'PT409' then null;
 end;
 select global_revision::text into current_rev from operativo.migration_control where singleton;
 r:=public.ut_panel_commit_v1(gen_random_uuid(),'deadline-regression-test','{}',current_rev,
 jsonb_build_array(jsonb_build_object('table','agenda_items','id',null,'create',true,'fields',jsonb_build_object(
 'title','Linked deadline fixture','kind','deadline','status','Pendiente','source_key',source_key,'follow_up_id',task_id))));
 agenda_id:=r->>'id';
 select jsonb_agg(v) into rows from jsonb_array_elements(public.ut_panel_deadlines_v1()->'items') v where v->>'taskId'=task_id;
 if jsonb_array_length(rows)<>1 or rows->0->>'date'<>target_date then raise exception 'Source deduplication or date failed'; end if;
 select global_revision::text into current_rev from operativo.migration_control where singleton;
 perform public.ut_panel_commit_v1(gen_random_uuid(),'deadline-regression-test','{}',current_rev,
 jsonb_build_array(jsonb_build_object('table','follow_ups','id',task_id,'create',false,'fields',jsonb_build_object('fldixmckZrFiyJ6xd',moved_date))));
 if not exists(select 1 from jsonb_array_elements(public.ut_panel_deadlines_v1()->'items') v where v->>'id'=agenda_id and v->>'date'=moved_date) then raise exception 'Rescheduled source did not propagate'; end if;
 select global_revision::text into current_rev from operativo.migration_control where singleton;
 begin
  perform public.ut_panel_commit_v1(gen_random_uuid(),'deadline-regression-test','{}',current_rev,
  jsonb_build_array(jsonb_build_object('table','agenda_items','id',null,'create',true,'fields',jsonb_build_object(
  'title','Duplicate fixture','on_date',target_date,'kind','deadline','source_key',source_key))));
  raise exception 'Duplicate source accepted';
 exception when unique_violation then null;
 end;
 select global_revision::text into current_rev from operativo.migration_control where singleton;
 perform public.ut_panel_commit_v1(gen_random_uuid(),'deadline-regression-test','{}',current_rev,
 jsonb_build_array(jsonb_build_object('table','follow_ups','id',task_id,'create',false,'fields',
 jsonb_build_object('fldLXBjnEHgHDJvX0','Hecho','fldh7b5L9hg89tle4','Terminada'))));
 if exists(select 1 from jsonb_array_elements(public.ut_panel_deadlines_v1()->'items') v where v->>'taskId'=task_id) then raise exception 'Completed deadline still visible'; end if;
end $test$;
rollback;
select 'PASS: private grants, audit contract, idempotency, stale revision, deduplication, rescheduling, closure; fixtures rolled back' as result;
