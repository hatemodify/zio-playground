const RECOVERY_PREFIX = 'kidsedu-page-reload:';

export function isPageLoadError(error: unknown): boolean {
  return error instanceof Error && /Failed to fetch dynamically imported module|Importing a module script failed|error loading dynamically imported module|Loading chunk [\w-]+ failed|Unable to preload CSS/i.test(error.message);
}

/** Give the existing PWA a chance to replace its old app shell before reloading. */
async function updateServiceWorker(): Promise<void> {
  if (!('serviceWorker' in navigator)) return;
  let timer: ReturnType<typeof setTimeout> | undefined;
  let stopListening: (() => void) | undefined;
  let stopped = false;
  try {
    await Promise.race([
      (async () => {
        const registration = await navigator.serviceWorker.getRegistration();
        if (!registration || stopped) return;
        await registration.update();
        if (stopped) return;
        const worker = registration.installing ?? registration.waiting;
        if (!worker || worker.state === 'activated' || worker.state === 'redundant') return;
        await new Promise<void>((resolve) => {
          const changed = () => {
            if (worker.state === 'activated' || worker.state === 'redundant') resolve();
          };
          stopListening = () => worker.removeEventListener('statechange', changed);
          worker.addEventListener('statechange', changed);
          changed();
        });
      })(),
      new Promise<void>((resolve) => { timer = setTimeout(resolve, 2000); }),
    ]);
  } catch {
    // A service-worker or network failure must not prevent a normal reload.
  } finally {
    stopped = true;
    clearTimeout(timer);
    stopListening?.();
  }
}

/** A rejected React.lazy import is cached; a fresh document is required to retry. */
export async function loadPage<T>(factory: () => Promise<T>): Promise<T> {
  const recoveryKey = `${RECOVERY_PREFIX}${window.location.pathname}`;
  try {
    const page = await factory();
    try { sessionStorage.removeItem(recoveryKey); } catch { /* Storage can be unavailable. */ }
    return page;
  } catch (error) {
    if (!isPageLoadError(error) || !navigator.onLine) throw error;
    try {
      // Keep this marker until this route loads successfully, including across reloads.
      if (sessionStorage.getItem(recoveryKey)) throw error;
      sessionStorage.setItem(recoveryKey, '1');
    } catch {
      // Fail visibly instead of risking a reload loop when storage is blocked.
      throw error;
    }
    await updateServiceWorker();
    window.location.reload();
    // Keep Suspense active until navigation replaces the broken document.
    return new Promise<T>(() => {});
  }
}
