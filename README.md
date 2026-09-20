# Mayo 2026 Program Companion — GitHub Pages Beta

Static frontend for the Mayo 2026 Program Companion.

- Frontend hosting: GitHub Pages
- Backend/Auth/Realtime: Supabase
- This repository contains **no Supabase secret/service_role key** and no database password.
- The browser-safe Supabase Project URL and publishable key are intentionally present in `config.js`.

## Publish

1. Upload these files to the root of the GitHub repository.
2. GitHub → Settings → Pages.
3. Source: Deploy from a branch.
4. Branch: `main`, folder: `/ (root)`.
5. Save and wait for the Pages URL to appear.

Then add the resulting Pages URL to Supabase Authentication → URL Configuration → Redirect URLs.
