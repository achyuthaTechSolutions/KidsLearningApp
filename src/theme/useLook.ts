import { useAppStore } from '../store/useAppStore';
import { looks, type LookSpec } from './looks';

/** The parent's chosen look, and its colours and shapes. */
export function useLook(): LookSpec {
  const look = useAppStore((s) => s.settings.appLook);
  return looks[look] ?? looks.classic;
}
