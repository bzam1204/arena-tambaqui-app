import { Navigate, Outlet } from 'react-router-dom';
import type { SessionState } from '@/app/hooks/use-session';

export function RequireAuth({ session, loading }: { session: SessionState; loading: boolean }) {
  if (loading) return null;
  if (!session.userId) return <Navigate to="/auth" replace />;
  if (!session.isCompleteProfile) return <Navigate to="/onboarding" replace />;
  return <Outlet />;
}
