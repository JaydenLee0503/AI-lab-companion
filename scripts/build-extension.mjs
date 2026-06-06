// Packages chrome-extension/ into a downloadable zip the app can link to:
//   frontend/public/focus-guard-extension.zip
//
// The archive contains a top-level `chrome-extension` folder, so unzipping
// yields a folder ready for Chrome's "Load unpacked".
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
  execFileSync(
    "powershell",
    [
      "-NoProfile",
      "-Command",
      `Compress-Archive -Path '${srcDir}' -DestinationPath '${out}' -Force`,
    ],
    { stdio: "inherit" }
  );
} else {
  // zip the folder itself so the archive keeps a top-level directory.
  execFileSync("zip", ["-r", out, "chrome-extension"], {
    cwd: root,
    stdio: "inherit",
  });
}

console.log(`Wrote ${out}`);
