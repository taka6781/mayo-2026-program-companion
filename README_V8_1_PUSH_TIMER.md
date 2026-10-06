# v8.1 — PWA Notifications + iPhone Timer Audio Fix

## Notifications
- Added opt-in PWA Web Push subscription UI under More.
- Direct Message notifications.
- Team Message notifications.
- Program Announcement notifications.
- No Schedule/Event notifications.
- Push is opt-in and intended for installed Home Screen PWAs.

## Timer
- Fixed the iPhone/PWA audio-unlock path: AudioContext is now activated from the Start/Test Sound tap.
- Added a Test Sound button.
- Added Screen Wake Lock while timer runs when the device supports it.

Additional deployment is required for Push: SQL + `push-notify-v1` Edge Function + VAPID secrets.
