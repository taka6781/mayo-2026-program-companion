# v8.2 — iPhone PWA Timer Audio Fix

What changed:
- Replaced the timer's primary Web Audio oscillator with a real `timer-bell.wav` played through HTMLAudio.
- Test Sound now reports whether playback succeeded or was blocked.
- Start also attempts to unlock the audio element while the user is actively tapping.
- Timer warnings/time-up reuse the same unlocked audio element.
- Vibration remains a best-effort fallback when supported.
- Push notification behavior is unchanged.

Deployment:
1. Upload/overwrite this package on GitHub Pages.
2. Wait for deployment.
3. On iPhone, fully close the Mayo 2026 PWA and reopen it.
4. If the old version appears, remove the Home Screen app and add it again, or clear its website data/cache.
5. Open Presentation Timer -> Test Sound.

No SQL or Edge Function changes are required.
