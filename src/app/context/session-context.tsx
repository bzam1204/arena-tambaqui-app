import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import type { AuthGateway, Session } from '@/app/gateways/AuthGateway';
import type { ProfileGateway } from '@/app/gateways/ProfileGateway';
import { Inject, TkAuthGateway, TkProfileGateway } from '@/infra/container';

export type SessionState = {
  userId: string | null;
  playerId: string | null;
  onboarded: boolean;
  isCompleteProfile: boolean;
  isAdmin: boolean;
  isVip: boolean;
};

type SessionContextValue = {
  state: SessionState;
  loading: boolean;
  login: () => Promise<Session | null>;
  logout: () => Promise<void>;
  markOnboarded: (playerId?: string) => void;
  refresh: () => Promise<void>;
};

const SessionContext = createContext<SessionContextValue | undefined>(undefined);

export function SessionProvider({ children }: { children: ReactNode }) {
  const auth = Inject<AuthGateway>(TkAuthGateway);
  const profile = Inject<ProfileGateway>(TkProfileGateway);

  const [state, setState] = useState<SessionState>({
    userId: null,
    playerId: null,
    onboarded: false,
    isCompleteProfile: false,
    isAdmin: false,
    isVip: false,
  });
  const [loading, setLoading] = useState(true);

  const loadSession = async () => {
    const session = await auth.getSession();
    if (session?.userId) {
      const status = await profile.isOnboarded(session.userId);
      setState({
        userId: session.userId,
        playerId: status.playerId,
        onboarded: status.onboarded,
        isCompleteProfile: status.onboarded,
        isAdmin: status.isAdmin,
        isVip: status.isVip,
      });
    } else {
      setState({ userId: null, playerId: null, onboarded: false, isCompleteProfile: false, isAdmin: false, isVip: false });
    }
  };

  useEffect(() => {
    loadSession().finally(() => setLoading(false));
  }, []);

  const login = async () => {
    const s = await auth.login();
    if (!s) return null;
    const status = await profile.isOnboarded(s.userId);
    setState({
      userId: s.userId,
      playerId: status.playerId,
      onboarded: status.onboarded,
      isCompleteProfile: status.onboarded,
      isAdmin: status.isAdmin,
      isVip: status.isVip,
    });
    return s;
  };

  const logout = async () => {
    await auth.logout();
    setState({ userId: null, playerId: null, onboarded: false, isCompleteProfile: false, isAdmin: false, isVip: false });
  };

  const markOnboarded = (playerId?: string) => {
    setState((prev) =>
      prev.userId
        ? {
            ...prev,
            playerId: playerId ?? prev.playerId,
            onboarded: true,
            isCompleteProfile: true,
          }
        : prev,
    );
  };

  const value: SessionContextValue = {
    state: {...state, isCompleteProfile: true},
    loading,
    login,
    logout,
    markOnboarded,
    refresh: async () => {
      await loadSession();
    },
  };

  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
}

export function useSession() {
  const ctx = useContext(SessionContext);
  if (!ctx) throw new Error('useSession must be used within SessionProvider');
  return ctx;
}
