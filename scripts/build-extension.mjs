// Packages chrome-extension/ into a downloadable zip the app can link to:
//   frontend/public/focus-guard-extension.zip
//
// The archive holds the extension files at its ROOT (manifest.json, icons/,
// ...) — no wrapper folder. Unzipping yields a single `focus-guard-extension`
// folder with manifest.json directly inside, ready for Chrome's "Load
// unpacked". (Wrapping them in a nested folder makes Chrome report
// "Manifest file is missing or unreadable", since it looks for the manifest
// at the top level of the folder you select.)
//
//   node scripts/build-extension.mjs
//
import { execFileSync } from "node:child_process";
import { mkdirSync, rmSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const srcDir = join(root, "chrome-extension");
const outDir = join(root, "frontend", "public");
const out = join(outDir, "focus-guard-extension.zip");

mkdirSync(outDir, { recursive: true });
rmSync(out, { force: true });

if (process.platform === "win32") {
  // `<dir>\*` archives the folder's CONTENTS at the root (subfolders like
  // icons/ are preserved), not the folder itself — so there's no wrapper.
  execFileSync(
    "powershell",
    [
      "-NoProfile",
      "-Command",
      `Compress-Archive -Path '${join(srcDir, "*")}' -DestinationPath '${out}' -Force`,
    ],
    { stdio: "inherit" }
  );
} else {
  // zip the contents from inside the folder so the archive has no wrapper dir.
  execFileSync("zip", ["-r", out, "."], {
    cwd: srcDir,
    stdio: "inherit",
  });
}

console.log(`Wrote ${out}`);
