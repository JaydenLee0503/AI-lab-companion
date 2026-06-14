# Focus Guard — NovaMind AI Chrome extension

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
- **By default, makes no network requests** — everything runs locally and
  settings live in `chrome.storage.sync`.
- **Optional AI features (off by default):** the **AI features** toggle (in the
  popup or Options) unlocks two things, both server-assisted:
  - **Relevant nudges** — the matched hostname, plus the short focus note you
    type and your chosen tone, is POSTed to the `focus-coach` edge function for
    a friendlier, on-topic message. No browsing history or page content.
  - **Quick page summary** — a **“Summarize this page”** button. *Only when you
    click it*, the current page's visible text is sent to the `summarize` edge
    function and a short summary comes back. This is the one path that reads page
    content, it is per-click and explicit, and it uses the `activeTab` grant so
    no standing access to your pages is held.

  No API key lives in the extension — it carries the same browser-safe anon key
  the web app ships, and the secret model key stays server-side. Any failure
  falls back to the local message. Turn the toggle off to return to **zero
  network requests** and zero page reads.

## Permissions (minimal)

| Permission                     | Why |
|--------------------------------|-----|
| `tabs`                         | Read the active tab's URL to compare its hostname. |
| `storage`                      | Save your site list / settings. |
| `notifications`                | Show the local focus alert. |
| `tts`                          | Speak alerts with the device voice (local). |
| `activeTab` + `scripting`      | Only when you click **Summarize this page**: read that one tab's visible text on that click. No standing access. |
| `host_permissions: *.supabase.co` | Reach the `focus-coach` / `summarize` functions when AI features are on. |

## AI nudges setup

AI nudges read public, browser-safe values from `config.js`. Before building the
zip, fill them in with your project's URL and anon key (the same pair the web app
uses):

```js
self.FOCUS_GUARD = {
  SUPABASE_URL: "https://YOUR-REF.supabase.co",
  SUPABASE_ANON_KEY: "YOUR-ANON-PUBLIC-KEY",
};
```

Deploy the function with the rest: `supabase functions deploy focus-coach`
(it needs `FEATHERLESS_API_KEY` set server-side, like the other functions).
Until `config.js` is filled in, the toggle is harmless — nudges silently use the
built-in local message.

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
- `config.js` — public Supabase URL + anon key for optional AI nudges.
- `popup.html` / `popup.js` — toolbar popup (guard toggle, AI toggle, focus
  note, tone, and the on-demand page-summary button).
- `options.html` / `options.js` — full settings page.
- `icons/` — generated action icons.
