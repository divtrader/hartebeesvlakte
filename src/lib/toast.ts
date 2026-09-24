type Listener = (message: string) => void;

const listeners = new Set<Listener>();

/** Shows a short message at the bottom of the screen. */
export function toast(message: string): void {
  listeners.forEach((listener) => listener(message));
}

export function onToast(listener: Listener): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}
