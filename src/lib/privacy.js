import { useSyncExternalStore } from "react";

const KEY = "class-privacy-hidden";
export const MASK = "R$ ••••";

let hidden = false;
try {
  hidden = localStorage.getItem(KEY) === "1";
} catch {
  // localStorage indisponível — começa visível
}

const listeners = new Set();

export function isHidden() {
  return hidden;
}

export function toggleHidden() {
  hidden = !hidden;
  try {
    localStorage.setItem(KEY, hidden ? "1" : "0");
  } catch {
    // sem persistência, tudo bem
  }
  listeners.forEach((l) => l());
}

function subscribe(l) {
  listeners.add(l);
  return () => listeners.delete(l);
}

export function usePrivacy() {
  const h = useSyncExternalStore(subscribe, isHidden);
  return [h, toggleHidden];
}
