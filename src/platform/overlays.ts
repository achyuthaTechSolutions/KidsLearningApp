const closers: Array<() => void> = [];

/** Let the Android back button close the top dialog before leaving the screen. */
export function pushOverlay(close: () => void): () => void {
  closers.push(close);
  return () => {
    const index = closers.lastIndexOf(close);
    if (index >= 0) closers.splice(index, 1);
  };
}

export function closeTopOverlay(): boolean {
  const close = closers.pop();
  if (!close) return false;
  close();
  return true;
}
