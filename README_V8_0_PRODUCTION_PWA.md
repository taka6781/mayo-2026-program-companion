# v8.0 — Production PWA

This build promotes the Mayo 2026 web app from Beta packaging to Production PWA packaging.

Changes
- Production cache name/version.
- Correct PWA icon declarations (192x192 and 512x512 PNG).
- iPhone Home Screen icon (180x180).
- iOS standalone web-app metadata.
- Production manifest description and short app name: Mayo 2026.
- No database or Edge Function changes.
- Existing Supabase backend and custom domain stay the same.

Important
- This makes the app installable to the iPhone Home Screen and run in standalone app-like mode.
- Push notifications are NOT added in v8.0. They can be implemented as a separate next step after PWA behavior is validated.

Deploy
1. Overwrite the current GitHub Pages web files with this package.
2. Wait for GitHub Pages deployment.
3. On desktop, hard refresh once.
4. On iPhone Safari, open https://mayo2026.planex-bp.com
5. Share -> Add to Home Screen -> Add.
6. Launch Mayo 2026 from the new Home Screen icon.
