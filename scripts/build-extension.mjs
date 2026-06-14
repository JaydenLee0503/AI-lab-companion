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
  // Build the zip with explicit FORWARD-SLASH entry names. Neither
  // Compress-Archive nor .NET Framework's ZipFile.CreateFromDirectory works
  // here: both write BACKSLASH separators (e.g. `icons\icon16.png`), which
  // violate the ZIP spec (it mandates `/`). Chrome then can't find
  // `icons/icon16.png` after unzip and reports
  // "Could not load icon 'icons/icon16.png'". So we open a ZipArchive and add
  // each file ourselves, normalizing the relative path to `/`. The folder's
  // CONTENTS land at the archive root (no wrapper dir).
  const ps = [
    `Add-Type -AssemblyName System.IO.Compression.FileSystem;`,
    `$src = (Resolve-Path '${srcDir}').Path;`,
    `$zip = [System.IO.Compression.ZipFile]::Open('${out}', 'Create');`,
    `try {`,
    `  Get-ChildItem -LiteralPath $src -Recurse -File | ForEach-Object {`,
    `    $rel = $_.FullName.Substring($src.Length).Replace('\\','/').TrimStart('/');`,
    `    [void][System.IO.Compression.ZipFileExtensions]::CreateEntryFromFile($zip, $_.FullName, $rel);`,
    `  }`,
    `} finally { $zip.Dispose() }`,
  ].join(" ");
  execFileSync("powershell", ["-NoProfile", "-Command", ps], {
    stdio: "inherit",
  });
} else {
  // zip the contents from inside the folder so the archive has no wrapper dir.
  execFileSync("zip", ["-r", out, "."], {
    cwd: srcDir,
    stdio: "inherit",
  });
}

console.log(`Wrote ${out}`);
