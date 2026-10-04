# v7.4 — User Management function connection fix

Diagnosis:
- The Admin Users screen loads, but browser requests never appear in Supabase Edge Function Invocations.
- v7.3 called the Edge Function with a hand-built `fetch()` request.
- v7.4 replaces that with Supabase's official browser invocation method:
  `client.functions.invoke('admin-users', { body: ... })`

Also:
- Asset URLs are versioned with `?v=7.4`
- Service-worker cache is bumped so the browser does not keep the old cloud.js

No SQL change is required.
The existing `admin-users` Edge Function can stay deployed as-is.

Deploy:
1. Upload all v7.4 web files to GitHub Pages and overwrite the existing v7.3 web files.
2. Wait for GitHub Pages deployment.
3. Ctrl+Shift+R once.
4. Open More -> Admin Panel -> Users.
5. Check Supabase Edge Functions -> admin-users -> Invocations.
