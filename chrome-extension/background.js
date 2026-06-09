// Focus Guard — MV3 service worker.
//
// Watches which tab is active and, when its hostname matches the user's
// distracting-site list, fires a local Chrome notification (and, if voice is
// enabled, speaks it via the browser's built-in chrome.tts). It only ever reads
// the tab's URL hostname — never page content, form data, or messages — and it
// never makes a network request. All settings live in chrome.storage.sync.

const DEFAULTS = {
  enabled: true,
  voice: true,
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

async function checkUrl(url) {
  if (!url || !/^https?:/i.test(url)) return;
  const { enabled, voice, sites, cooldownSeconds } = await getSettings();
  if (!enabled) return;

  const host = hostnameFromUrl(url);
  if (!host || !matches(host, sites)) return;

  const now = Date.now();
  if (lastAlert[host] && now - lastAlert[host] < cooldownSeconds * 1000) return;
  lastAlert[host] = now;

  chrome.notifications.create(`focus-${now}`, {
    type: "basic",
    iconUrl: "icons/icon128.png",
    title: "Focus Guard",
    message: `${host} can wait — back to your lab. 🔬`,
    priority: 2,
  });

  chrome.action.setBadgeText({ text: "!" });
  chrome.action.setBadgeBackgroundColor({ color: "#f59e0b" });

  // Local, on-device speech — no API key and no network request.
  if (voice) {
    chrome.tts.speak(`${host} can wait. Back to your lab.`, {
      rate: 1.0,
      enqueue: false,
    });
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
