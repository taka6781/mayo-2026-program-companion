# Mayo 2026 v7.3 — User Management

This version is based on v7.1. The previously proposed v7.2 is not required.

Admin User Management:
- List all Auth users with status / role / team / last sign-in
- Invite a new user from the app
- Assign role and team during invitation
- Edit profile, role, and team
- Send password-reset email
- Permanently delete a user
- Protect the signed-in admin from self-deletion
- Protect the last Admin from deletion/demotion

Security:
- The Supabase service-role key is never placed in GitHub Pages or browser code.
- Auth-admin actions run in the Supabase Edge Function `admin-users`.
- The function validates the caller session and confirms `profiles.role = admin`.

Deployment order:
1. Run `Mayo_2026_User_Management_PATCH_v7_3.sql`.
2. Deploy the Edge Function `admin-users` from `supabase/functions/admin-users/index.ts`.
3. Upload the v7.3 web app files to GitHub Pages, overwriting v7.1.
4. Wait for deployment, then Ctrl+Shift+R once.

Invitation flow:
Admin Panel -> Users -> Invite User.
The participant receives an invitation email, opens it, accepts Privacy Notice / Terms, creates a password, and enters the app.

Important:
Do not put `SUPABASE_SERVICE_ROLE_KEY` in config.js, GitHub, or any browser-visible file.
