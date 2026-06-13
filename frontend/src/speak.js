// Single shared TTS player. Only ONE voice ever plays at a time: each call to
// speak() first cancels whatever is currently playing (or about to play), so
// rapid step changes / verification results can't overlap into a garbled mix.
import { ttsAudioUrl } from "./api";

let current = null; // the <audio> currently playing, if any
let token = 0; // bumped on every stop/speak to supersede in-flight fetches

// Stop any playing audio and invalidate any speak() whose TTS fetch is still
// in flight (so it won't start once it resolves).
export function stopSpeaking() {
  token++;
  if (current) {
    try {
      current.pause();
    } catch {
      /* already stopped */
    }
    current = null;
  }
}

// Fetch TTS audio and play it, after silencing anything else. Safe to call
// repeatedly; the latest call wins.
export async function speak(text, voiceId) {
  if (!text || !text.trim()) return;
  stopSpeaking();
  const myToken = token;
  const url = await ttsAudioUrl(text, voiceId);
  // A newer speak()/stopSpeaking() ran while we were fetching — drop this one.
  if (myToken !== token) {
    URL.revokeObjectURL(url);
    return;
  }
  const audio = new Audio(url);
  current = audio;
  const cleanup = () => {
    URL.revokeObjectURL(url);
    if (current === audio) current = null;
  };
  audio.addEventListener("ended", cleanup);
  audio.addEventListener("error", cleanup);
  await audio.play();
}
