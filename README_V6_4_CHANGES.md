# v6.4 Schedule improvements

Changes:
- Schedule times are displayed in each event's local time zone, not the viewer's current device time zone.
  - Oct 25-28 Rochester: America/Chicago
  - Oct 29-30 Phoenix: America/Phoenix
- Schedule tab selection (Today / Full Program / My Schedule) is preserved in the browser session.
- Schedule scroll position is preserved when the page is re-rendered after backgrounding.
- Supabase TOKEN_REFRESHED events no longer force a full UI re-render.
- Today shows only current/upcoming events for the current program day; completed events disappear.
- If today's program has finished, Today shows a completion message.
- If there is no event today, Today shows the next program day.
- Open Map is displayed consistently; it uses location_url or falls back to a Google Maps search from the event location/address.
- Description content is visually structured into About / Speaker-Host / Address rows.

Deployment order:
1. Run Mayo_2026_Schedule_Display_Data_PATCH_v6_4.sql in Supabase SQL Editor.
2. Upload the web files to GitHub Pages, replacing existing files.
3. Wait for deployment, then hard refresh once (Ctrl+Shift+R).
