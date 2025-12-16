import { useEffect, useState } from 'react';
import type { AuthGateway } from '@/app/gateways/AuthGateway';
import type { ProfileGateway } from '@/app/gateways/ProfileGateway';
import { Inject, TkAuthGateway, TkProfileGateway } from '@/infra/container';

export type SessionState = {
  userId: string | null;
  onboarded: boolean;
};

export function useSessionState() {
  const auth = Inject<AuthGateway>(TkAuthGateway);
  const profile = Inject<ProfileGateway>(TkProfileGateway);
  const [state, setState] = useState<SessionState>({ userId: null, onboarded: false });

  useEffect(() => {
    auth.getSession().then(async (session) => {
      if (session?.userId) {
        const onboarded = await profile.isOnboarded(session.userId);
        setState({ userId: session.userId, onboarded });
      }
    });
  }, [auth, profile]);

  const login = async () => {
    const s = await auth.login();
    const onboarded = await profile.isOnboarded(s.userId);
    setState({ userId: s.userId, onboarded });
  };

  const markOnboarded = () => {
    setState((prev) => (prev.userId ? { ...prev, onboarded: true } : prev));
  };

  return { state, login, markOnboarded };
}
