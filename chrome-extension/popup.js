// Popup: quick controls without opening the options page —
//   - enable/disable the active-tab guard
//   - turn AI features on/off (off = zero network requests)
//   - set the focus note + nudge tone that make AI nudges relevant
//   - summarize the current page on demand (only when AI is on, only on click)
// Clears the action badge on open.

const DEFAULTS = {
  enabled: true,
  sites: [],
  aiEnabled: false,
  focusNote: "",
  tone: "gentle",
};

const enabledEl = document.getElementById("enabled");
const countEl = document.getElementById("count");
const statusEl = document.getElementById("status");
const aiEnabledEl = document.getElementById("aiEnabled");
const aiPanelEl = document.getElementById("aiPanel");
const focusNoteEl = document.getElementById("focusNote");
const toneEl = document.getElementById("tone");
const summarizeBtn = document.getElementById("summarize");
const summaryEl = document.getElementById("summary");
const optionsBtn = document.getElementById("options");

chrome.action.setBadgeText({ text: "" });

function showSummary(text) {
  summaryEl.textContent = text;
  summaryEl.hidden = !text;
}

async function load() {
  const s = await chrome.storage.sync.get(DEFAULTS);
  enabledEl.checked = Boolean(s.enabled);
  const n = Array.isArray(s.sites) ? s.sites.length : 0;
  countEl.textContent = `${n} site${n === 1 ? "" : "s"} on your watch list`;
  statusEl.textContent = s.enabled ? "Guard is on." : "Guard is paused.";

  aiEnabledEl.checked = Boolean(s.aiEnabled);
  aiPanelEl.hidden = !s.aiEnabled;
  focusNoteEl.value = s.focusNote || "";
  toneEl.value = s.tone || "gentle";
}

enabledEl.addEventListener("change", async () => {
  await chrome.storage.sync.set({ enabled: enabledEl.checked });
  statusEl.textContent = enabledEl.checked ? "Guard is on." : "Guard is paused.";
});

aiEnabledEl.addEventListener("change", async () => {
  aiPanelEl.hidden = !aiEnabledEl.checked;
  await chrome.storage.sync.set({ aiEnabled: aiEnabledEl.checked });
});

// Save the focus note as the student types (debounced lightly).
let saveTimer;
focusNoteEl.addEventListener("input", () => {
  clearTimeout(saveTimer);
  saveTimer = setTimeout(
    () => chrome.storage.sync.set({ focusNote: focusNoteEl.value.trim() }),
    300,
  );
});

toneEl.addEventListener("change", () =>
  chrome.storage.sync.set({ tone: toneEl.value }));

optionsBtn.addEventListener("click", () => chrome.runtime.openOptionsPage());

// --- Summarize the current page (opt-in, click-only) -----------------------

// Runs in the page to grab visible text. Returns "" for empty/odd documents.
function grabPageText() {
  const t = document.body ? document.body.innerText || "" : "";
  return t.replace(/\s+/g, " ").trim().slice(0, 8000);
}

async function summarize() {
  const cfg = self.FOCUS_GUARD || {};
  if (!cfg.SUPABASE_URL || cfg.SUPABASE_URL.includes("YOUR-REF")) {
    showSummary("Summaries need NovaMind's server configured. Ask your admin.");
    return;
  }

  summarizeBtn.disabled = true;
  summarizeBtn.textContent = "Summarizing…";
  showSummary("");

  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (!tab || !/^https?:/i.test(tab.url || "")) {
      throw new Error("This page can't be summarized.");
    }

    const [{ result: text } = {}] = await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      func: grabPageText,
    });
    if (!text || text.length < 40) {
      throw new Error("Not enough readable text on this page.");
    }

    const res = await fetch(`${cfg.SUPABASE_URL}/functions/v1/summarize`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        apikey: cfg.SUPABASE_ANON_KEY,
        Authorization: `Bearer ${cfg.SUPABASE_ANON_KEY}`,
      },
      body: JSON.stringify({ text, title: tab.title || "" }),
    });
    if (!res.ok) throw new Error("Couldn't summarize right now. Try again.");
    const data = await res.json();
    showSummary((data && data.summary) || "No summary returned.");
  } catch (e) {
    showSummary(e instanceof Error ? e.message : "Something went wrong.");
  } finally {
    summarizeBtn.disabled = false;
    summarizeBtn.textContent = "Summarize this page";
  }
}

summarizeBtn.addEventListener("click", summarize);

load();
