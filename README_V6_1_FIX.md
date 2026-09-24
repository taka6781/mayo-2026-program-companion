# Mayo 2026 Beta v6.1 Hotfix

Fixes a regression in v6 where `editMyProfile` was referenced but its function definition was accidentally omitted. Because that JavaScript error occurred while binding the More-page controls, both **Edit Profile** and **Sign Out** appeared but did not respond.

Changes:
- Restored `editMyProfile()` from the working v5 implementation.
- Updated the service-worker cache key so browsers pick up the patched JavaScript.
- No database or SQL changes are required for this hotfix.
