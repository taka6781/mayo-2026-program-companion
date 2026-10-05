# v7.12 — Self-Certified Missions + Balanced Team Drafting

Challenge
- Removed the Admin Approval option from Mission management.
- All mission completions are immediately approved and scored.
- Existing pending submissions are converted to approved by the SQL patch.
- Undo Completion remains available.

Teams
- New one-click "Generate Balanced Draft".
- Uses every participant (Admin accounts excluded).
- Team sizes are guaranteed to differ by no more than one person.
- The heuristic prioritizes diversity in this order:
  1. Organization / affiliation
  2. Exact title
  3. Stated interests
  4. Balanced team size
- A small random factor allows repeated Generate clicks to create alternative balanced drafts.
- Draft is preview-only.
- "Confirm Assignment" applies the entire draft atomically in one database transaction.
- Manual team assignment remains available.

Deployment
1. Run `Mayo_2026_Self_Certified_Missions_Balanced_Teams_PATCH_v7_12.sql`.
2. Upload the v7.12 GitHub Pages files and overwrite the current site.
3. Wait for deployment and hard refresh once.

No Edge Function changes are required.
