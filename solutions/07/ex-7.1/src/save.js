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
