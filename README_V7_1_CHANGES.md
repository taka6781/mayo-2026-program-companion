# v7.1 — Announcement & Poll Management

## Announcements
Admin can:
- Publish a new announcement
- Edit an existing announcement
- Archive an announcement (hide from participants without deleting history)
- Restore an archived announcement

## Quick Polls
Admin can:
- Create a new poll
- Edit the question
- Edit answer options until the first vote is cast
- Change the automatic close time
- See live vote counts
- Close & publish results
- Reopen a closed poll (published results become hidden again while voting is open)
- Archive / restore a poll

Participant behavior remains:
- Interim poll results are hidden
- Their own selected answer remains visible
- Results become visible only when the poll closes
- Archived polls and announcements are hidden

Deployment order:
1. Run Mayo_2026_Announcement_Poll_Admin_PATCH_v7_1.sql in Supabase SQL Editor.
2. Upload the web files to GitHub, replacing the current files.
3. Wait for GitHub Pages deployment and hard refresh once.

This patch preserves existing announcement and poll history.
