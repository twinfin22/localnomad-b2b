import { create } from 'zustand';

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'staff';
  content: string;
  intent?: string;
  language?: string;
  isEscalated?: boolean;
  sources?: string[];
  createdAt: string;
}

interface ChatStore {
  sessionId: string | null;
  messages: ChatMessage[];
  language: string;
  isOpen: boolean;
  isTyping: boolean;
  error: string | null;

  setIsOpen: (open: boolean) => void;
  setLanguage: (lang: string) => void;
  sendMessage: (message: string) => Promise<void>;
  loadHistory: () => Promise<void>;
  clearSession: () => void;
}

const SESSION_KEY = 'localnomad_chat_session';
const SESSION_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours

// Load session from localStorage with TTL check
const loadSessionFromStorage = (): string | null => {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as { sessionId: string; expiresAt: number };
    if (Date.now() > parsed.expiresAt) {
      localStorage.removeItem(SESSION_KEY);
      return null;
    }
    return parsed.sessionId;
  } catch {
    return null;
  }
};

// Save session to localStorage with TTL
const saveSessionToStorage = (sessionId: string): void => {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(
      SESSION_KEY,
      JSON.stringify({ sessionId, expiresAt: Date.now() + SESSION_TTL_MS }),
    );
  } catch {
    // localStorage not available
  }
};

const clearSessionFromStorage = (): void => {
  if (typeof window === 'undefined') return;
  try {
    localStorage.removeItem(SESSION_KEY);
  } catch {
    // localStorage not available
  }
};

export const useChatStore = create<ChatStore>((set, get) => ({
  sessionId: null,
  messages: [],
  language: 'ko',
  isOpen: false,
  isTyping: false,
  error: null,

  setIsOpen: (open: boolean) => {
    set({ isOpen: open });
    // Load session from storage when opening for the first time
    if (open && !get().sessionId) {
      const stored = loadSessionFromStorage();
      if (stored) {
        set({ sessionId: stored });
        void get().loadHistory();
      }
    }
  },

  setLanguage: (lang: string) => {
    set({ language: lang });
  },

  sendMessage: async (message: string) => {
    const { sessionId, language } = get();

    // Add user message optimistically
    const tempId = `temp-${Date.now()}`;
    set((state) => ({
      messages: [
        ...state.messages,
        {
          id: tempId,
          role: 'user' as const,
          content: message,
          createdAt: new Date().toISOString(),
        },
      ],
      isTyping: true,
      error: null,
    }));

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message,
          sessionId,
          language,
        }),
      });

      const json = await response.json();

      if (!response.ok || !json.success) {
        set({ isTyping: false, error: json.error ?? '오류가 발생했습니다.' });
        return;
      }

      const data = json.data;

      // Save session ID
      if (data.sessionId && data.sessionId !== get().sessionId) {
        set({ sessionId: data.sessionId });
        saveSessionToStorage(data.sessionId);
      }

      // Add assistant message
      set((state) => ({
        messages: [
          ...state.messages,
          {
            id: `msg-${Date.now()}`,
            role: 'assistant',
            content: data.message,
            intent: data.intent,
            language: data.language,
            isEscalated: data.isEscalated,
            sources: data.sources,
            createdAt: new Date().toISOString(),
          },
        ],
        isTyping: false,
        language: data.language || state.language,
      }));

      // If escalated, trigger escalation API
      if (data.isEscalated) {
        void fetch('/api/chat/escalate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            sessionId: data.sessionId,
            urgent: data.intent === 'escalation_overstay',
          }),
        });
      }
    } catch {
      set({ isTyping: false, error: '네트워크 오류가 발생했습니다.' });
    }
  },

  loadHistory: async () => {
    const { sessionId } = get();
    if (!sessionId) return;

    try {
      const response = await fetch(`/api/chat/${sessionId}?limit=50`);
      if (!response.ok) return;

      const json = await response.json();
      if (json.success && json.data) {
        set({
          messages: json.data.messages.map((m: ChatMessage) => ({
            id: m.id,
            role: m.role,
            content: m.content,
            intent: m.intent,
            language: m.language,
            isEscalated: m.isEscalated,
            sources: m.sources,
            createdAt: m.createdAt,
          })),
          language: json.data.language || 'ko',
        });
      }
    } catch {
      // History load failed silently
    }
  },

  clearSession: () => {
    clearSessionFromStorage();
    set({
      sessionId: null,
      messages: [],
      isTyping: false,
      error: null,
    });
  },
}));
