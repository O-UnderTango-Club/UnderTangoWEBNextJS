import { ACTIVE_SCORE, type ShowScene } from "./show-score";

const LAST_PLAYED_SCENE = "860-multiversos:last-played-scene:v1";
const sceneStores = [() => window.sessionStorage, () => window.localStorage];

export function readLastPlayedScene(): ShowScene | null {
  for (const getStorage of sceneStores) {
    try {
      const saved: unknown = JSON.parse(getStorage().getItem(LAST_PLAYED_SCENE) ?? "null");
      const scene = ACTIVE_SCORE.find(({number}) => number === saved);
      if (scene) return scene.number;
    } catch {
      // Try the other store if this one is unavailable or invalid.
    }
  }
  return null;
}

export function saveLastPlayedScene(scene: ShowScene) {
  for (const getStorage of sceneStores) {
    try {
      getStorage().setItem(LAST_PLAYED_SCENE, String(scene));
    } catch {
      // Unavailable storage should never interrupt playback.
    }
  }
}
