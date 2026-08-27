# Clock (Honor OS Clock & Stealth E2EE Messenger)

A high-fidelity web rewrite of the Honor MagicOS Clock application featuring a dual-layer stealth encrypted communication engine.

## Features

- **Honor MagicOS Clock UI**:
  - Fully functional Clock, Alarm Manager, World Clock, Stopwatch, and Countdown Timer.
  - Interactive alarm scheduling with repeat days, vibration, and ringtone options.
  - **Stealth 11:11 Trigger**: Setting an alarm to `11:11` intercepts the input and opens the biometric/PIN security gate.

- **Biometric & PIN Authentication Gate**:
  - 4-digit Master PIN setup and verification.
  - Biometric authentication simulation.
  - SHA-256 with salt key derivation.

- **Encrypted Messaging Vault**:
  - Direct P2P messaging using `@handle` identities.
  - Client-side AES-256-GCM encryption for messages, images, and videos.
  - Read receipts, online presence, and message status tracking.
  - Static emoji picker and media preview modal.
  - Ephemeral chat controls: Clear History, Delete for Me (Secure Shredding), and Delete for Everyone.

- **P2P History Recovery**:
  - Request and approve historical message sync between peers with selectable time ranges.

- **Camouflaged Notifications**:
  - Astronomical solar prayer time calculation (Fajr, Sunrise, Dhuhr, Asr, Maghrib, Isha) based on GPS coordinates.
  - Contextual camouflage phrases to hide sensitive message content.

- **Settings & Vault Management**:
  - Enter-to-send toggle, font scaling, auto-download preferences.
  - Local vault size inspection, cache clearing, and secure physical shredding wipe.
