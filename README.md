# SIGNAL/WALLPAPER Desktop

Desktop packaging for SIGNAL/WALLPAPER — a still-image/slideshow to motion wallpaper encoder for Windows and macOS.

## Features

- Single image and slideshow modes
- Landscape 16:9 and portrait 9:16 output
- 1080p, 1440p, and 4K UHD
- 24, 30, and 60 fps
- Motion presets and atmospheric effects
- WebM recording with local FFmpeg/WASM MP4 conversion
- Native desktop file open/save dialogs
- Offline-capable app bundle

## Development

Requirements: Node.js 20+ and npm.

```bash
npm install
npm start
```

## Build

Windows:
```bash
npm run dist:win
```

macOS:
```bash
npm run dist:mac
```

Build outputs are written to `dist/`.

## GitHub Actions

`.github/workflows/build.yml` verifies Windows and macOS builds on pushes and pull requests to `main`, and can be run manually from the Actions tab.

## Notes

- FFmpeg WebAssembly assets live under `app/ffmpeg/`.
- macOS distribution builds should be code signed and notarized before public release.
- The project is currently marked `UNLICENSED` in `package.json`.
