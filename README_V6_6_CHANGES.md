# v6.6 changes

- Main navigation always opens the destination page at the top.
- The active main page is stored in sessionStorage, so a browser reload stays on the same page.
- J-StarX logo + full program name replace the old "J-StarX 2026" header label.
- PlanEx footer is larger, fully visible (not watermark style), and names PlanEx Business Partners LLC.
- Browser favicon uses the PlanEx logo.
- Schedule action buttons (Open Map / Add to My Schedule / Add to My Calendar) use the same light PlanEx pink treatment.
- Kudos:
  - giver receives +5 points
  - recipient receives +3 points
  - same giver cannot give the same recipient more than one Kudo per program day
  - self-Kudos are blocked
  - individual and team displayed points include the derived Kudo bonus

Deployment:
1. Run Mayo_2026_Kudos_Rules_PATCH_v6_6.sql in Supabase SQL Editor.
2. Upload all web files in this package to GitHub, overwriting existing files.
3. Wait for GitHub Pages deployment and hard refresh once.
