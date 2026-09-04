begin;
create table public.analytics_events (
  source text not null check (source in ('undertango', 'aprende')),
  event_id text not null,
  occurred_at timestamptz not null,
  event text not null,
  visitor_id text not null default '',
  session_id text not null default '',
  path text not null default '',
  destination text not null default '',
  intent text not null default '',
  subintent text not null default '',
  cta text not null default '',
  utm_source text not null default '',
  utm_medium text not null default '',
  utm_campaign text not null default '',
  utm_content text not null default '',
  referrer text not null default '',
  notes text not null default '',
  airtable_record_id text unique,
  airtable_record jsonb,
  ingested_at timestamptz not null default now(),
  primary key (source, event_id)
);
create index analytics_events_source_time on public.analytics_events (source, occurred_at desc);
create index analytics_events_campaign_time on public.analytics_events (utm_campaign, occurred_at desc);
alter table public.analytics_events enable row level security;
revoke all on public.analytics_events from anon, authenticated;
grant select, insert, update, delete on public.analytics_events to service_role;
comment on table public.analytics_events is 'Private web telemetry. Client event names such as payment are not accounting proof. Historical Airtable records are preserved verbatim in airtable_record.';
commit;
