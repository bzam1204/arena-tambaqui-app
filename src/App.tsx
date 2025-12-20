import { Suspense, lazy, useMemo } from 'react';
import { RouterProvider, createBrowserRouter, Navigate } from 'react-router-dom';
import { useSessionState } from '@/app/hooks/use-session';
import { Spinner } from '@/components/Spinner';
import { RequireAuth } from '@/app/routes/RequireAuth';

const AppLayout = lazy(() => import('@/app/layouts/AppLayout').then((m) => ({ default: m.AppLayout })));
const MuralLayout = lazy(() => import('@/app/layouts/MuralLayout').then((m) => ({ default: m.MuralLayout })));
const FeedPage = lazy(() => import('@/app/pages/FeedPage').then((m) => ({ default: m.FeedPage })));
const MatchesPage = lazy(() => import('@/app/pages/MatchesPage').then((m) => ({ default: m.MatchesPage })));
const RankingsPage = lazy(() => import('@/app/pages/RankingsPage').then((m) => ({ default: m.RankingsPage })));
const SearchPageRoute = lazy(() => import('@/app/pages/SearchPageRoute').then((m) => ({ default: m.SearchPageRoute })));
const PlayerProfilePage = lazy(() => import('@/app/pages/PlayerProfilePage').then((m) => ({ default: m.PlayerProfilePage })));
const MyProfilePage = lazy(() => import('@/app/pages/MyProfilePage').then((m) => ({ default: m.MyProfilePage })));
const AuthPage = lazy(() => import('@/app/pages/AuthPage').then((m) => ({ default: m.AuthPage })));
const OnboardingPage = lazy(() => import('@/app/pages/OnboardingPage').then((m) => ({ default: m.OnboardingPage })));

export default function App() {
  const { state, login, markOnboarded, loading } = useSessionState();

  const router = useMemo(
    () =>
      createBrowserRouter([
        {
          path: '/',
          element:
            state.userId && !state.onboarded ? <Navigate to="/onboarding" replace /> : <Navigate to="/partidas" replace />,
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
            { path: '/partidas', element: <MatchesPage /> },
            {
              path: '/mural',
              element: <MuralLayout />,
              children: [
                { path: 'feed', element: <FeedPage isLoggedIn={Boolean(state.userId)} /> },
                { path: 'rankings', element: <Navigate to="/mural/rankings/prestigio" replace /> },
                { path: 'rankings/:kind', element: <RankingsPage /> },
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

  return (
    <Suspense fallback={<Spinner fullScreen label="carregando interface" />}>
      <RouterProvider router={router} />
    </Suspense>
  );
}
