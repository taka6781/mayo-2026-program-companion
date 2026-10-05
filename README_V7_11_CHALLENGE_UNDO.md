# v7.11 — Challenge Undo

Participant behavior:
- Complete Mission -> completes the mission as before.
- Completed mission -> button changes to "Undo Completion".
- Pending approval -> button changes to "Cancel Submission".
- Undo requires confirmation.
- Undoing an approved mission removes the mission's awarded points.
- After undo, the mission can be completed again.

Security:
- The database function only operates on the signed-in user's own completion.
- The browser cannot undo another participant's completion.

Deployment:
1. Run `Mayo_2026_Challenge_Undo_PATCH_v7_11.sql` in Supabase SQL Editor.
2. Upload the v7.11 GitHub Pages files and overwrite the current web files.
3. Wait for deployment and hard refresh once.

No Edge Function changes are required.
