# v8.4 — Live Chat + Notification Sound

Fix 1: live chat
- An open Direct/Team chat now refreshes in place when a Realtime message INSERT arrives.
- The user no longer needs to close and reopen the chat window.
- The open conversation is automatically marked read after the live update.

Fix 2: sound
- When the PWA is open/foreground, incoming messages play an in-app chime after audio has been unlocked by the user's first tap.
- When the PWA is backgrounded/locked, Web Push remains responsible for the alert.
- Service Worker notifications explicitly request non-silent delivery.
- Push message tags now use the message ID instead of the conversation ID, avoiding replacement/coalescing of multiple messages.

Important iPhone behavior:
- Web Push cannot choose a custom iOS notification sound.
- Background/Lock Screen sound is controlled by iPhone Settings > Notifications > Mayo 2026 > Sounds, Silent Mode, Focus, and system notification behavior.

Deployment:
1. Upload the v8.4 GitHub Pages package.
2. Redeploy the supplied `push-notify-v1` Edge Function v8.4.
3. No SQL changes and no Secret changes are required.
4. Fully close/reopen the Home Screen PWA.
5. Test with two accounts:
   a. Receiver keeps a chat open -> new message should appear immediately.
   b. Receiver backgrounds/locks iPhone -> push notification should appear; sound depends on iOS notification settings.
