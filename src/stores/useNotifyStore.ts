import { create } from 'zustand';

// Global toggle for completed-task desktop notifications. The watcher lives in
// TaskNotifier.tsx (mounted once in Layout); this store only owns the on/off
// preference (persisted to localStorage) and the current Notification permission.
const LS_KEY = 'mc-notify-enabled';

export type NotifyPermission = NotificationPermission | 'unsupported';

function notificationsSupported(): boolean {
  return typeof window !== 'undefined' && 'Notification' in window;
}

function loadEnabled(): boolean {
  try {
    return localStorage.getItem(LS_KEY) === '1';
  } catch {
    return false;
  }
}

interface NotifyStore {
  enabled: boolean;
  permission: NotifyPermission;
  /** Number of notifications fired this session (for the topbar badge / tooltip). */
  sentCount: number;
  setEnabled: (v: boolean) => void;
  /** Flip the toggle; when enabling, request OS permission first. */
  toggle: () => Promise<void>;
  bumpSent: () => void;
}

export const useNotifyStore = create<NotifyStore>((set, get) => ({
  // Only honor a persisted "on" if the browser still reports permission granted —
  // otherwise we'd show an enabled bell that can never actually fire.
  enabled: loadEnabled() && notificationsSupported() && Notification.permission === 'granted',
  permission: notificationsSupported() ? Notification.permission : 'unsupported',
  sentCount: 0,

  setEnabled: (v) => {
    try {
      localStorage.setItem(LS_KEY, v ? '1' : '0');
    } catch {
      /* ignore quota / private-mode failures */
    }
    set({ enabled: v });
  },

  toggle: async () => {
    const { enabled, setEnabled } = get();
    if (enabled) {
      setEnabled(false);
      return;
    }
    if (!notificationsSupported()) {
      set({ permission: 'unsupported' });
      return;
    }
    let perm = Notification.permission;
    if (perm === 'default') {
      try {
        perm = await Notification.requestPermission();
      } catch {
        /* some environments reject the prompt — treat as denied */
      }
    }
    set({ permission: perm });
    if (perm === 'granted') setEnabled(true);
  },

  bumpSent: () => set((s) => ({ sentCount: s.sentCount + 1 })),
}));
