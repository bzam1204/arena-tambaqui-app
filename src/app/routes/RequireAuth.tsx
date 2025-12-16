import { Navigate, Outlet } from 'react-router-dom';
import type { SessionState } from '@/app/hooks/use-session';

export function RequireAuth({ session }: { session: SessionState }) {
  if (!session.userId) return <Navigate to="/auth" replace />;
  if (!session.onboarded) return <Navigate to="/onboarding" replace />;
  return <Outlet />;
}
