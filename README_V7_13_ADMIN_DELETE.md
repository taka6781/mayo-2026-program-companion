# v7.13 — Admin Permanent Delete

Added Delete buttons to:
- Challenge Missions
- Announcements
- Quick Polls

Behavior:
- Delete is admin-only and requires a confirmation prompt.
- Mission deletion also removes points previously awarded by that mission and mission completion records.
- Announcement deletion also removes read-status records.
- Poll deletion also removes options and votes.
- Archive / Deactivate remains available when permanent deletion is not desired.

Deployment:
1. Run `Mayo_2026_Admin_Delete_PATCH_v7_13.sql` in Supabase SQL Editor.
2. Upload/overwrite the GitHub Pages files from the v7.13 package.
3. Wait for GitHub Pages deployment and hard refresh once.

No Edge Function change is required.
