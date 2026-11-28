import { ACTIVE_SCORE, type ShowScene } from "./show-score";

const LAST_PLAYED_SCENE = "860-multiversos:last-played-scene:v1";
const sceneStores = [() => window.sessionStorage, () => window.localStorage];

function knownScene(value: unknown): ShowScene | null {
  return ACTIVE_SCORE.find(({number}) => number === value)?.number ?? null;
}

export function readLastPlayedScene(): ShowScene | null {
  try {
    const scene = knownScene(window.history.state?.[LAST_PLAYED_SCENE]);
    if (scene !== null) return scene;
  } catch {
    // Use storage if the current history entry is unavailable.
  }
  for (const getStorage of sceneStores) {
    try {
      const saved: unknown = JSON.parse(getStorage().getItem(LAST_PLAYED_SCENE) ?? "null");
      const scene = knownScene(saved);
      if (scene !== null) return scene;
    } catch {
      // Try the other store if this one is unavailable or invalid.
    }
  }
  return null;
}

export function saveLastPlayedScene(scene: ShowScene) {
  try {
    // Keep the router's entry intact and persist the scene in this tab through F5.
    window.history.replaceState({...window.history.state, [LAST_PLAYED_SCENE]: scene}, "");
  } catch {
    // The same checkpoint is also available in browser storage.
  }
  for (const getStorage of sceneStores) {
    try {
      getStorage().setItem(LAST_PLAYED_SCENE, String(scene));
    } catch {
      // Unavailable storage should never interrupt playback.
    }
  }
}

export function clearLastPlayedScene() {
  try {
    const state = {...window.history.state};
    delete state[LAST_PLAYED_SCENE];
    window.history.replaceState(state, "");
  } catch {
    // Clear the other copies even when history cannot be edited.
  }
  for (const getStorage of sceneStores) {
    try { getStorage().removeItem(LAST_PLAYED_SCENE); }
    catch { /* Storage can be unavailable in a private profile. */ }
  }
}
