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


## Beta v2 self-registration
Participant self-registration is enabled with full name, optional organization, email, password, confirmation-email guidance, and existing-user sign-in. Outlook/Hotmail users are explicitly reminded to check Junk/Spam for messages from no-reply@auth.planex-bp.com.


## v3 Password Reset
- Added Forgot password? on the Sign In screen.
- Sends Supabase password-recovery email through the configured Custom SMTP provider.
- Recovery link returns to the app and opens a Choose New Password screen.
- After password update, the user is signed out and can sign in with the new password.
- Ensure the app URL is included in Supabase Authentication > URL Configuration > Redirect URLs.


## v4 password recovery lock
- Keeps the Choose New Password screen active after Supabase establishes the recovery session.
- Uses sessionStorage to remember recovery mode even if Supabase cleans the recovery URL.
- Clears recovery mode only after a successful password update or explicit cancel.
