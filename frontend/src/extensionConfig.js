// Focus Guard extension distribution config.
//
// After you publish Focus Guard to the Chrome Web Store, paste its public
// listing URL here (looks like
// https://chromewebstore.google.com/detail/<name>/<id>). When this is set, the
// "Get the extension" buttons link straight to the store page. While it's empty,
// the app falls back to the local .zip + load-unpacked flow.
export const CHROME_STORE_URL = "";

/** Local packaged extension served from /public. Always available as a fallback. */
export const EXTENSION_ZIP_URL = "/focus-guard-extension.zip";

/** True once a Chrome Web Store listing URL has been provided above. */
export const STORE_AVAILABLE = Boolean(CHROME_STORE_URL);
