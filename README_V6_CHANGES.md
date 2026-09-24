# Mayo 2026 Beta v6 — What changed

## Participant-facing
- People cards now show profile details directly, with Message and Kudo buttons on each card.
- Admin Panel, Grouping, and Random Pick are hidden from participants.
- Edit Profile and Sign Out are compact controls at the top of More.
- Quick Poll hides interim results from participants.
- Participants can see their own vote for open polls and their own voting history for past polls.
- Results become visible after manual close or an optional scheduled close time.
- Presentation Timer now includes 2 minutes.
- 2/3/5 minute timers sound one bell at 1:00 remaining; every timer sounds two bells at 0:00.

## Admin-facing
- Grouping and Random Pick remain available under Admin Tools.
- Quick Poll shows live aggregate results.
- Admin can close a poll and publish results immediately.
- Admin can optionally specify an automatic close time when creating a poll.

## Required database update
Run `Mayo_2026_Supabase_Poll_Privacy_v6.sql` in Supabase SQL Editor before deploying the frontend. The database change is required to prevent participants from querying interim vote rows directly.
