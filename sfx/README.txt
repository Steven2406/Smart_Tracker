Medical HQ sound effects
- One mp3 per sound. The file name is the sound's name in the app (e.g. level_up.mp3).
- To replace a sound: overwrite the file with the same name, then raise SFX_VERSION in index.html
  (search for: const SFX_VERSION) so every device downloads the new version.
- To add a new sound: add the mp3 here, add its name to SFX_NAMES in index.html, and call playSfx("name").
