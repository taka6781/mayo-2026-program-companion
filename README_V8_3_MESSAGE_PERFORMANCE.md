# v8.3 — Message Performance Fix

Root causes found:
1. Sending a message waited for the push-notification Edge Function to finish before returning.
2. Every state refresh loaded each conversation's members and messages one conversation at a time (N+1 sequential requests).

Fixes:
- Push notification dispatch is now fire-and-forget. Message send completes as soon as the message and read timestamp are saved.
- Conversation members are loaded in one bulk query.
- Conversation messages are loaded in one bulk query.
- Existing realtime behavior and Push Notification behavior remain enabled.

Expected effect:
- Direct/Team message send should feel immediate.
- Opening Messages and realtime refresh should be substantially faster as the number of conversations grows.

Deployment:
1. Upload/overwrite this package on GitHub Pages.
2. Wait for deployment.
3. Fully close and reopen the PWA.
4. Test sending Direct Message and Team Message.

No SQL or Edge Function changes are required.
