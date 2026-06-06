// Popup: quick enable/disable toggle and a shortcut to the options page.
// Clears the action badge on open.

const DEFAULTS = { enabled: true, sites: [] };

const enabledEl = document.getElementById("enabled");
const countEl = document.getElementById("count");
const statusEl = document.getElementById("status");
const optionsBtn = document.getElementById("options");

chrome.action.setBadgeText({ text: "" });

async function load() {
  const { enabled, sites } = await chrome.storage.sync.get(DEFAULTS);
  enabledEl.checked = Boolean(enabled);
  const n = Array.isArray(sites) ? sites.length : 0;
  countEl.textContent = `${n} site${n === 1 ? "" : "s"} on your watch list`;
  statusEl.textContent = enabled ? "Guard is on." : "Guard is paused.";
}

enabledEl.addEventListener("change", async () => {
  await chrome.storage.sync.set({ enabled: enabledEl.checked });
  statusEl.textContent = enabledEl.checked ? "Guard is on." : "Guard is paused.";
});

optionsBtn.addEventListener("click", () => chrome.runtime.openOptionsPage());

load();
