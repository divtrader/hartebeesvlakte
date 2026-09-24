import { useEffect, useState } from 'react';

// Chrome on Android offers its own install prompt; keep it so the app can show an Install button.
interface InstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

let deferred: InstallPromptEvent | null = null;
const listeners = new Set<() => void>();

export function listenForInstall(): void {
  window.addEventListener('beforeinstallprompt', (event) => {
    event.preventDefault();
    deferred = event as InstallPromptEvent;
    listeners.forEach((l) => l());
  });
  window.addEventListener('appinstalled', () => {
    deferred = null;
    listeners.forEach((l) => l());
  });
}

export function isInstalled(): boolean {
  return window.matchMedia('(display-mode: standalone)').matches || (navigator as Navigator & { standalone?: boolean }).standalone === true;
}

export function isIPhone(): boolean {
  return /iPhone|iPad|iPod/.test(navigator.userAgent);
}

/** True when the browser can install the app with one tap (Chrome on Android, Chrome and Edge on PC). */
export function useCanInstall(): boolean {
  const [can, setCan] = useState(deferred !== null);
  useEffect(() => {
    const update = () => setCan(deferred !== null);
    listeners.add(update);
    update();
    return () => {
      listeners.delete(update);
    };
  }, []);
  return can;
}

export async function install(): Promise<void> {
  if (!deferred) return;
  await deferred.prompt();
  await deferred.userChoice;
  deferred = null;
  listeners.forEach((l) => l());
}
