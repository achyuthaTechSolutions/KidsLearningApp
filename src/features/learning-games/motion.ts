/** True when the parent turned on reduced motion or the device asks for it. */
export function prefersReducedMotion(setting: boolean): boolean {
  return setting || (typeof window !== 'undefined' && Boolean(window.matchMedia?.('(prefers-reduced-motion: reduce)').matches));
}

/** True for form fields, where game keyboard shortcuts must not act. */
export function isEditableTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  return ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName) || target.isContentEditable;
}
