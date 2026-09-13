-- Read only the explicit comment submitted through the panel's audited receipt.
-- Do not infer comments from free-form result/history text or copy stored history.
create function public.ut_panel_snapshot_v5() returns jsonb
language plpgsql security definer set search_path=pg_catalog,pg_temp as $$
declare s jsonb; tasks jsonb;
begin
 s:=public.ut_panel_snapshot_v4();
 with comments as (
  select coalesce(nullif(intent->>'id',''),result->>'id') as task_id,
    string_agg(btrim(intent->'changes'->>'comment'),E'\n\n' order by created_at,request_id) as body
  from operativo.panel_receipts
  where intent->>'kind'='task' and jsonb_typeof(intent->'changes'->'comment')='string'
    and btrim(intent->'changes'->>'comment')<>'' and result->>'ok'='true'
  group by coalesce(nullif(intent->>'id',''),result->>'id')
 )
 select coalesce(jsonb_agg(t||jsonb_build_object('fields',(t->'fields')||
   jsonb_build_object('panel_comment',coalesce(c.body,''))) order by t->>'id'),'[]'::jsonb)
 into tasks from jsonb_array_elements(s->'tasks') t left join comments c on c.task_id=t->>'id';
 return s||jsonb_build_object('contract',5,'tasks',tasks);
end $$;
revoke all on function public.ut_panel_snapshot_v5() from public,anon,authenticated;
grant execute on function public.ut_panel_snapshot_v5() to service_role;
