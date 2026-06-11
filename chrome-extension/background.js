// Focus Guard — MV3 service worker.
//
// Watches which tab is active and, when its hostname matches the user's
// distracting-site list, fires a local Chrome notification (and, if voice is
// enabled, speaks it via the browser's built-in chrome.tts). It only ever reads
// the tab's URL hostname — never page content, form data, or messages.
//
// By default it makes NO network requests. If (and only if) the user turns on
// AI nudges in Options, it POSTs the bare hostname to the focus-coach edge
// function to get a friendlier, varied nudge; any failure falls back silently
// to the built-in local message. All settings live in chrome.storage.sync.

// Public, browser-safe Supabase URL + anon key (RLS-gated). No secrets here.
importScripts("config.js");

const DEFAULTS = {
  enabled: true,
  voice: true,
  aiEnabled: false,
  cooldownSeconds: 60,
  sites: [
    "instagram.com",
    "youtube.com",
    "discord.com",
    "tiktok.com",
    "reddit.com",
    "twitter.com",
    "x.com",
    "facebook.com",
  ],
};

// In-memory throttle so a single distracting site doesn't spam notifications.
const lastAlert = {};

async function getSettings() {
  return chrome.storage.sync.get(DEFAULTS);
}

chrome.runtime.onInstalled.addListener(async () => {
  const current = await chrome.storage.sync.get(Object.keys(DEFAULTS));
  await chrome.storage.sync.set({ ...DEFAULTS, ...current });
});

function hostnameFromUrl(url) {
  try {
    return new URL(url).hostname.replace(/^www\./, "").toLowerCase();
  } catch {
    return "";
  }
}

function normalizeSite(site) {
  return site.trim().toLowerCase().replace(/^www\./, "").replace(/^https?:\/\//, "");
}

function matches(host, sites) {
  return sites.some((raw) => {
    const s = normalizeSite(raw);
    return s && (host === s || host.endsWith("." + s));
  });
}

// Opt-in only: ask the focus-coach edge function for a friendlier nudge. Sends
// just the hostname, holds no secret key (the anon key is browser-safe), and
// returns null on any problem so the caller can use the local fallback.
async function aiNudge(host) {
  const cfg = self.FOCUS_GUARD || {};
  if (!cfg.SUPABASE_URL || cfg.SUPABASE_URL.includes("YOUR-REF")) return null;
  try {
    const res = await fetch(`${cfg.SUPABASE_URL}/functions/v1/focus-coach`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        apikey: cfg.SUPABASE_ANON_KEY,
        Authorization: `Bearer ${cfg.SUPABASE_ANON_KEY}`,
      },
      body: JSON.stringify({ host }),
    });
    if (!res.ok) return null;
    const data = await res.json();
    return typeof data?.nudge === "string" && data.nudge.trim()
      ? data.nudge.trim()
      : null;
  } catch {
    return null; // offline / function down → fall back to the local message
  }
}

async function checkUrl(url) {
  if (!url || !/^https?:/i.test(url)) return;
  const { enabled, voice, aiEnabled, sites, cooldownSeconds } = await getSettings();
  if (!enabled) return;

  const host = hostnameFromUrl(url);
  if (!host || !matches(host, sites)) return;

  const now = Date.now();
  if (lastAlert[host] && now - lastAlert[host] < cooldownSeconds * 1000) return;
  lastAlert[host] = now;

  // Default message is fully local; AI (when opted in) only refines it.
  const fallback = `${host} can wait — back to your lab. 🔬`;
  const message = aiEnabled ? (await aiNudge(host)) || fallback : fallback;

  chrome.notifications.create(`focus-${now}`, {
    type: "basic",
    iconUrl: "icons/icon128.png",
    title: "Focus Guard",
    message,
    priority: 2,
  });

  chrome.action.setBadgeText({ text: "!" });
  chrome.action.setBadgeBackgroundColor({ color: "#f59e0b" });

  // Local, on-device speech of whatever message we settled on.
  if (voice) {
    chrome.tts.speak(message, { rate: 1.0, enqueue: false });
  }
}

// Active tab switched.
chrome.tabs.onActivated.addListener(async ({ tabId }) => {
  try {
    const tab = await chrome.tabs.get(tabId);
    checkUrl(tab.url);
  } catch {
    /* tab may have closed */
  }
});

// Active tab navigated to a new URL.
chrome.tabs.onUpdated.addListener((_tabId, changeInfo, tab) => {
  if (!tab.active) return;
  if (changeInfo.status === "complete" || changeInfo.url) {
    checkUrl(changeInfo.url || tab.url);
  }
});

// Switched browser window.
chrome.windows.onFocusChanged.addListener(async (windowId) => {
  if (windowId === chrome.windows.WINDOW_ID_NONE) return;
  try {
    const [tab] = await chrome.tabs.query({ active: true, windowId });
    if (tab) checkUrl(tab.url);
  } catch {
    /* no focusable window */
  }
});
