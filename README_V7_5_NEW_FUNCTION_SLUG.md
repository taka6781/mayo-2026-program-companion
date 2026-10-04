# v7.5 — User Management public endpoint fix

Diagnosis:
- Dashboard Test POST reaches `admin-users` and returns 401 Not authenticated, proving the function code runs.
- Direct browser access to the public endpoint returns Supabase platform error:
  `{"code":"NOT_FOUND","message":"Requested function was not found"}`
- That means the public Edge Function route for the original slug is not being recognized consistently by Supabase.

Fix:
- Deploy the identical function under a fresh slug: `admin-users-v2`.
- The web app now invokes `admin-users-v2`.
- No SQL changes are required.

Deployment:
1. In Supabase Edge Functions, create a NEW function named exactly `admin-users-v2`.
2. Paste `supabase/functions/admin-users-v2/index.ts`.
3. Keep `Verify JWT with legacy secret` OFF.
4. Deploy.
5. Test public URL:
   https://qtufwebaxqvamhjaeeky.supabase.co/functions/v1/admin-users-v2
   A browser GET should reach the function and return `{"error":"Method not allowed."}`.
6. Only after that succeeds, upload the v7.5 GitHub package and hard refresh.
7. Open More -> Admin Panel -> Users.

The old `admin-users` function can remain temporarily; delete it only after v2 works.
