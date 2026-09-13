# Action groups

Release based on a0e3b9c. Groups are explicit follow_up units with action_kind=group. Members keep their original records and have action_group/group_order; only the carrier has front/rank. Existing audit and revision triggers are preserved. Projects remain context. No group nesting or multiple memberships.

Deployment is separate from preparation. Before deployment, refresh the baseline and the live RPC definitions; review and apply 20260913130358_add_action_groups.sql. The matching app release defaults PANEL_ACTION_GROUPS to 1 in next.config.js; an explicit build-time override of 0 disables it. It selects snapshot v4 and commit v2. The latter preserves the v1 receipt/revision mechanism and resolves the __new_group__ reference inside one transaction. Public roles have no execution grants. The original snapshot/commit contracts are unchanged.

After the app is authorized and deployed, read a fresh snapshot, use the group planner to combine the five existing Brasil/Pix records, and commit at the fresh revision. Do not replay a prepared snapshot revision. Check member count, original IDs/states/history/dependencies, rank uniqueness, and authenticated UI. The data grouping is deliberately not hardcoded in the schema migration.

Portable tests:
- node scripts/panel.test.mjs
- node scripts/panel-operations.test.mjs
- node scripts/action-groups.test.mjs
- node scripts/action-groups-server.test.mjs
- node node_modules/typescript/bin/tsc --noEmit

Local operational fixture validation additionally uses GROUP_TEST_SOURCE pointing to a private JSON envelope containing snapshot from ut_panel_snapshot_v3, apply/commit/receipt function definitions, manifest and editable field IDs. This input is intentionally outside Git. With it, the model test emits ../grouped-preview.json and ../group-plan.json. The optional action-groups-db.test.mjs requires that source at ../live-group-source.json and PGlite 0.3.14 installed in ../group-test-runtime; its audit trigger is a test harness, not a clone of production audit infrastructure.

The development-only route /panel-de-control/grupos-vista-previa requires LOCAL_GROUP_PREVIEW=1 and reads ../grouped-preview.json. It is 404 outside development and has no operational write path. Do not include the private fixture in any deployment or source publication.

Local tests and TypeScript pass. The Windows production build compiles and type-checks but fails on the existing /shows/opengraph-image route because the reused Windows dependency runtime produces an Invalid URL in @vercel/og. Verify the full build in Vercel and the authenticated panel before marking the release complete.
