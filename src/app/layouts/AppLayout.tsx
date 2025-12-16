import { useEffect, useMemo } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { MobileHeader } from '@/components/MobileHeader';
import { BottomNav } from '@/components/BottomNav';
import { useSession } from '@/app/context/session-context';

type Props = {
  isLoggedIn: boolean;
};

export function AppLayout({ isLoggedIn }: Props) {
  const location = useLocation();
  const navigate = useNavigate();
  const { logout } = useSession();
  const isProfileRoute = location.pathname.startsWith('/player') || location.pathname === '/perfil';
  const isSearch = location.pathname.startsWith('/search');
  const title = isSearch ? 'Busca' : undefined;
  const subtitle = isSearch ? 'Selecionar operador para transmissão' : undefined;
  const currentView = useMemo(() => {
    if (location.pathname.startsWith('/mural')) return 'feed';
    if (location.pathname.startsWith('/search')) return 'search';
    if (location.pathname.startsWith('/perfil') || location.pathname.startsWith('/player')) return 'profile';
    return 'feed';
  }, [location.pathname]);

  useEffect(() => {
    if (!isLoggedIn && location.pathname === '/perfil') {
      navigate('/auth', { replace: true });
    }
  }, [isLoggedIn, location.pathname, navigate]);

  return (
    <div className="min-h-screen bg-[#0B0E14] pb-20">
      <MobileHeader
        showBack={isProfileRoute}
        onBack={() => window.history.back()}
        title={title}
        subtitle={subtitle}
        isLoggedIn={isLoggedIn}
        onLogin={() => navigate('/auth')}
        onLogout={async () => {
          await logout();
          window.location.href = '/auth';
        }}
      />
      <main className="relative z-10">
        <Outlet />
      </main>
      <BottomNav
        currentView={currentView as any}
        onNavigate={(view) => {
          if (view === 'feed') {
            navigate('/mural/feed');
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }
          if (view === 'search') navigate('/search');
          if (view === 'profile') {
            if (isLoggedIn) {
              navigate('/perfil');
            } else {
              navigate('/auth');
            }
          }
        }}
        isLoggedIn={isLoggedIn}
      />
    </div>
  );
}
