# SIGNAL Wallpaper Desktop

Desktop packaging for the SIGNAL/WALLPAPER live wallpaper encoder.

## Included

- Existing SIGNAL/WALLPAPER UI and renderer
- Local FFmpeg WebAssembly bundle
- Native Windows/macOS application shell using Electron
- Native Save As dialog for rendered MP4/WebM files
- Native File > Open Image menu action
- Offline local serving of app assets so FFmpeg workers/WASM load reliably
- Windows NSIS packaging configuration
- macOS DMG/ZIP packaging configuration for Intel and Apple Silicon

## Requirements

- Node.js 22 or newer recommended
- npm
- Windows 10/11 to build/test the Windows installer
- macOS to build/test/sign/notarize the macOS application

## Run in development

```bash
npm install
npm start
```

## Build Windows

```bash
npm run dist:win
```

Artifacts are written to `dist/`.

## Build macOS

```bash
npm run dist:mac
```

Artifacts are written to `dist/`.

### macOS signing/notarization

The project can build an unsigned local DMG for testing. Public distribution should be signed with an Apple Developer ID certificate and notarized. Configure the normal electron-builder Apple signing environment before running the macOS build.

## App architecture

`main.js` starts a private HTTP server bound only to `127.0.0.1` on a random free port. The renderer is loaded from this local origin rather than `file://`. This preserves browser-style relative `fetch()`, worker, and WebAssembly behavior used by the bundled FFmpeg code without exposing a network service externally.

The renderer stays isolated from Node.js. A narrow preload bridge exposes only native save/open functionality.

## Packaging notes

Electron and electron-builder versions are pinned in `package.json` for reproducible installs. The FFmpeg `.wasm` file is unpacked from ASAR so it can be streamed reliably at runtime.

## GitHub repository setup

Recommended repository name: `signal-wallpaper-desktop`

This source tree is ready to commit directly to a GitHub repository. The included `.gitignore` excludes dependencies, build output, logs, and OS metadata. The FFmpeg WebAssembly runtime is intentionally committed under `app/ffmpeg/` so the application remains self-contained and offline-capable.

### First push

```bash
git init
git branch -M main
git add .
git commit -m "Initial SIGNAL Wallpaper desktop app"
git remote add origin https://github.com/YOUR-USERNAME/signal-wallpaper-desktop.git
git push -u origin main
```

### GitHub Actions

`.github/workflows/build.yml` runs Windows and macOS packaging checks on pushes and pull requests to `main`. It also supports manual runs from the **Actions** tab. Build outputs are uploaded as workflow artifacts.

The macOS CI build is unsigned. For public macOS distribution, configure Apple Developer signing and notarization secrets before publishing a release.

## Large files

`app/ffmpeg/ffmpeg-core.wasm` is roughly 31 MB. It is intentionally stored directly in Git because it is below GitHub's 100 MB per-file limit. Git LFS is not required for the current project.
