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
  const { state, login, markOnboarded } = useSessionState();

  const router = useMemo(
    () =>
      createBrowserRouter([
        {
          path: '/',
          element: <Navigate to="/mural/feed" replace />,
        },
        {
          path: '/auth',
          element: <AuthPage onLogin={login} />,
        },
        {
          path: '/onboarding',
          element: state.userId ? (
            <OnboardingPage
              userId={state.userId}
              onComplete={() => {
                markOnboarded();
              }}
            />
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
              element: <RequireAuth session={state} />,
              children: [{ path: '/perfil', element: state.userId ? <MyProfilePage userId={state.userId} /> : <Navigate to="/auth" replace /> }],
            },
          ],
        },
      ]),
    [state, login, markOnboarded],
  );

  return <RouterProvider router={router} />;
}
