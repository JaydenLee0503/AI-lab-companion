# Focus Guard — AI Lab Companion Chrome extension

A tiny **Manifest V3** extension that helps students stay on task during a lab.
When the active tab is a distracting site, Focus Guard pops a **local Chrome
notification** nudging you back to work.

## What it does

- Watches the **active tab's hostname** (only the hostname) on tab switch,
  navigation, and window focus changes.
- If the hostname matches your distracting-site list, it fires a local
  notification (throttled by a configurable cooldown).
- Fully configurable list, enable/disable toggle, and cooldown on the
  **Options** page.

## Privacy

- Reads **only the URL hostname** of the active tab.
- Never reads page content, form fields, passwords, messages, or any personal
  data.
- Makes **no network requests** — everything runs locally. Settings are stored
  in `chrome.storage.sync`.

## Permissions (minimal)

| Permission      | Why |
|-----------------|-----|
| `tabs`          | Read the active tab's URL to compare its hostname. |
| `storage`       | Save your site list / settings. |
| `notifications` | Show the local focus alert. |

## Install (unpacked)

1. Unzip (if you downloaded the `.zip`) or use this folder directly.
2. Open `chrome://extensions` in Chrome or Edge.
3. Enable **Developer mode** (top-right).
4. Click **Load unpacked** and select this `chrome-extension/` folder.
5. Pin **Focus Guard** and open its **Options** to edit your site list.

## Default watched sites

`instagram.com`, `youtube.com`, `discord.com`, `tiktok.com`, `reddit.com`,
`twitter.com`, `x.com`, `facebook.com` — all editable in Options.

## Build a distributable zip

From the repo root (PowerShell):

```powershell
npm run build:extension
```

This writes `frontend/public/focus-guard-extension.zip`, which the app's
**Focus Guard** page links to for download.

## Files

- `manifest.json` — MV3 manifest.
- `background.js` — service worker; the tab-watching logic.
- `popup.html` / `popup.js` — toolbar popup (toggle + status).
- `options.html` / `options.js` — settings page.
- `icons/` — generated action icons.
