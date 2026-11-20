// Best time, kept in the browser. localStorage can be missing or full
// (private windows, some embeds), so every call is wrapped.

const KEY = 'cold-chain:best-time';

export function loadBestTime() {
  try {
    const value = Number(window.localStorage.getItem(KEY));
    return value > 0 ? value : null;
  } catch {
    return null;
  }
}

export function saveBestTime(ms) {
  const best = loadBestTime();
  if (best !== null && best <= ms) return false;
  try {
    window.localStorage.setItem(KEY, String(Math.round(ms)));
    return true;
  } catch {
    return false;
  }
}

export function formatTime(ms) {
  const total = Math.floor(ms / 100) / 10;
  const minutes = Math.floor(total / 60);
  const seconds = (total % 60).toFixed(1).padStart(4, '0');
  return `${minutes}:${seconds}`;
}

// new: remember whether the sound is off
const MUTE_KEY = 'cold-chain:muted';

export function loadMuted() {
  try {
    return window.localStorage.getItem(MUTE_KEY) === 'true';
  } catch {
    return false;
  }
}

export function saveMuted(muted) {
  try {
    window.localStorage.setItem(MUTE_KEY, String(muted));
  } catch {
    // no storage: the setting just won't survive a reload
  }
}

// Flip the sound on or off from any scene. The setting lives in the registry,
// not in this.sound.mute: before the first click, the browser hasn't started
// audio yet, and reading this.sound.mute back still gives the old value.
export function toggleMute(scene) {
  const muted = !scene.registry.get('muted');
  scene.registry.set('muted', muted);
  scene.sound.mute = muted;
  saveMuted(muted);
  return muted;
}
