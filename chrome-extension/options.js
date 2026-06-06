// Options page: edit the distracting-site list, toggle, and cooldown.

const DEFAULTS = {
  enabled: true,
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

const enabledEl = document.getElementById("enabled");
const cooldownEl = document.getElementById("cooldown");
const sitesEl = document.getElementById("sites");
const savedEl = document.getElementById("saved");

function parseSites(text) {
  return text
    .split(/[\n,]/)
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);
}

async function load() {
  const { enabled, cooldownSeconds, sites } = await chrome.storage.sync.get(
    DEFAULTS
  );
  enabledEl.checked = Boolean(enabled);
  cooldownEl.value = cooldownSeconds;
  sitesEl.value = (sites || []).join("\n");
}

function flashSaved() {
  savedEl.classList.add("show");
  setTimeout(() => savedEl.classList.remove("show"), 1500);
}

async function save() {
  const cooldown = Math.max(5, Math.min(3600, Number(cooldownEl.value) || 60));
  await chrome.storage.sync.set({
    enabled: enabledEl.checked,
    cooldownSeconds: cooldown,
    sites: parseSites(sitesEl.value),
  });
  cooldownEl.value = cooldown;
  flashSaved();
}

async function reset() {
  await chrome.storage.sync.set(DEFAULTS);
  await load();
  flashSaved();
}

document.getElementById("save").addEventListener("click", save);
document.getElementById("reset").addEventListener("click", reset);

load();
