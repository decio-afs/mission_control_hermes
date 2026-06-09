import { create } from 'zustand';

export interface ChatAttachment {
  name: string;
  mime: string;
  size: number;
  /** data: URL — present for images so they can render inline; may be dropped on persist for large blobs */
  dataUrl?: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: string;
  error?: boolean;
  attachments?: ChatAttachment[];
}

export interface ChatSession {
  id: string;
  name: string;
  messages: ChatMessage[];
  createdAt: string;
  updatedAt: string;
}

interface ChatStore {
  sessions: ChatSession[];
  activeSessionId: string | null;
  getActiveSession: () => ChatSession | null;
  createSession: (name?: string) => string;
  switchSession: (id: string) => void;
  renameSession: (id: string, name: string) => void;
  deleteSession: (id: string) => void;
  addMessage: (sessionId: string, message: Omit<ChatMessage, 'id' | 'timestamp'>) => void;
  loadFromStorage: () => void;
  saveToStorage: () => void;
}

const STORAGE_KEY = 'mc-chat-sessions';

function generateId(): string {
  return `s-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

function now(): string {
  return new Date().toISOString();
}

function createDefaultSession(): ChatSession {
  return {
    id: generateId(),
    name: 'New Session',
    messages: [
      {
        id: 'welcome',
        role: 'system',
        content: 'GHOST LEGION COMMS // Chat interface active. Type a message to dispatch to Hermes.',
        timestamp: now(),
      },
    ],
    createdAt: now(),
    updatedAt: now(),
  };
}

export const useChatStore = create<ChatStore>((set, get) => ({
  sessions: [],
  activeSessionId: null,

  getActiveSession: () => {
    const { sessions, activeSessionId } = get();
    if (!activeSessionId) return null;
    return sessions.find((s) => s.id === activeSessionId) || null;
  },

  createSession: (name?: string) => {
    const session = createDefaultSession();
    if (name) session.name = name;
    set((state) => {
      const newSessions = [session, ...state.sessions];
      return { sessions: newSessions, activeSessionId: session.id };
    });
    get().saveToStorage();
    return session.id;
  },

  switchSession: (id: string) => {
    set({ activeSessionId: id });
  },

  renameSession: (id: string, name: string) => {
    set((state) => ({
      sessions: state.sessions.map((s) =>
        s.id === id ? { ...s, name, updatedAt: now() } : s
      ),
    }));
    get().saveToStorage();
  },

  deleteSession: (id: string) => {
    set((state) => {
      const newSessions = state.sessions.filter((s) => s.id !== id);
      let newActiveId = state.activeSessionId;
      if (state.activeSessionId === id) {
        newActiveId = newSessions.length > 0 ? newSessions[0].id : null;
      }
      return { sessions: newSessions, activeSessionId: newActiveId };
    });
    get().saveToStorage();
  },

  addMessage: (sessionId: string, message: Omit<ChatMessage, 'id' | 'timestamp'>) => {
    const msg: ChatMessage = {
      ...message,
      id: `m-${Date.now()}-${Math.random().toString(36).slice(2, 5)}`,
      timestamp: now(),
    };
    set((state) => ({
      sessions: state.sessions.map((s) =>
        s.id === sessionId
          ? { ...s, messages: [...s.messages, msg], updatedAt: now() }
          : s
      ),
    }));
    get().saveToStorage();
  },

  loadFromStorage: () => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as ChatSession[];
        const sessions = Array.isArray(parsed) ? parsed : [];
        set({
          sessions,
          activeSessionId: sessions.length > 0 ? sessions[0].id : null,
        });
      } else {
        // First time — create default session
        const session = createDefaultSession();
        set({ sessions: [session], activeSessionId: session.id });
        localStorage.setItem(STORAGE_KEY, JSON.stringify([session]));
      }
    } catch {
      const session = createDefaultSession();
      set({ sessions: [session], activeSessionId: session.id });
    }
  },

  saveToStorage: () => {
    const { sessions } = get();
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(sessions));
    } catch {
      // Likely a quota overflow from inline image data URLs. Retry with the heavy
      // dataUrl blobs stripped so the conversation text/structure still persists.
      try {
        const lite = sessions.map((s) => ({
          ...s,
          messages: s.messages.map((m) =>
            m.attachments
              ? {
                  ...m,
                  attachments: m.attachments.map((a): ChatAttachment => ({
                    name: a.name,
                    mime: a.mime,
                    size: a.size,
                  })),
                }
              : m
          ),
        }));
        localStorage.setItem(STORAGE_KEY, JSON.stringify(lite));
      } catch {
        // give up silently
      }
    }
  },
}));
