import { useMemo } from 'react';
import { RouterProvider, createBrowserRouter, Navigate } from 'react-router-dom';
import { useSessionState } from '@/app/hooks/use-session';
import { RequireAuth } from '@/app/routes/RequireAuth';
import { AppLayout } from '@/app/layouts/AppLayout';
import { MuralLayout } from '@/app/layouts/MuralLayout';
import { FeedPage } from '@/app/pages/FeedPage';
import { RankingsPage } from '@/app/pages/RankingsPage';
import { SearchPageRoute } from '@/app/pages/SearchPageRoute';
import { PlayerProfilePage } from '@/app/pages/PlayerProfilePage';
import { MyProfilePage } from '@/app/pages/MyProfilePage';
import { AuthPage } from '@/app/pages/AuthPage';
import { OnboardingPage } from '@/app/pages/OnboardingPage';

export default function App() {
  const { state, login, markOnboarded, loading } = useSessionState();

  const router = useMemo(
    () =>
      createBrowserRouter([
        {
          path: '/',
          element:
            state.userId && !state.onboarded ? <Navigate to="/onboarding" replace /> : <Navigate to="/mural/feed" replace />,
        },
        {
          path: '/auth',
          element: loading ? null : state.userId ? (
            state.isCompleteProfile ? <Navigate to="/mural/feed" replace /> : <Navigate to="/onboarding" replace />
          ) : (
            <AuthPage onLogin={login} />
          ),
        },
        {
          path: '/onboarding',
          element:
            loading ? null : state.userId ? (
              state.isCompleteProfile ? (
                <Navigate to="/mural/feed" replace />
              ) : (
                <OnboardingPage
                  userId={state.userId}
                  onComplete={(playerId) => {
                    markOnboarded(playerId);
                  }}
                />
              )
            ) : (
              <Navigate to="/auth" replace />
            ),
        },
        {
          element: <AppLayout isLoggedIn={Boolean(state.userId)} />,
          children: [
            {
              path: '/mural',
              element: <MuralLayout />,
              children: [
                { path: 'feed', element: <FeedPage isLoggedIn={Boolean(state.userId)} /> },
                { path: 'rankings', element: <RankingsPage /> },
              ],
            },
            { path: '/search', element: <SearchPageRoute /> },
            { path: '/player/:id', element: <PlayerProfilePage /> },
            {
              element: <RequireAuth session={state} loading={loading} />,
              children: [
                {
                  path: '/perfil',
                  element: loading ? null : state.userId ? (
                    state.playerId ? (
                      <MyProfilePage userId={state.userId} playerId={state.playerId} />
                    ) : (
                      <Navigate to="/onboarding" replace />
                    )
                  ) : (
                    <Navigate to="/auth" replace />
                  ),
                },
              ],
            },
          ],
        },
      ]),
    [state, login, markOnboarded, loading],
  );

  return <RouterProvider router={router} />;
}
