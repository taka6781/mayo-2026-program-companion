# v7.0 — Program Admin Console

Admin-only operational management now includes:

## Missions
- Add mission
- Edit title / description / category / points
- Require admin approval
- Activate / deactivate without deleting
- Optional active-from / active-until

## Teams
- Create team
- Rename team
- Delete an empty team
- Assign or move any participant with a dropdown
- Unassign participant

Existing team-chat membership triggers continue to synchronize team conversations.

## Schedule
- Add event
- Edit event
- Delete event
- Explicit event time zone
- Start / end time
- Location / map URL / description

## Existing tools retained
- Announcement
- Quick Poll

Deployment order:
1. Run Mayo_2026_Admin_Console_PATCH_v7_0.sql in Supabase SQL Editor.
2. Upload the GitHub files from this package, overwriting the current site files.
3. Wait for GitHub Pages deployment and hard refresh once.

The participant UI does not expose this console. It remains visible only to accounts whose profile role is admin.
