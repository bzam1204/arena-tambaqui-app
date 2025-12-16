import { useEffect, useMemo, useState } from 'react';
import {
  RouterProvider,
  createBrowserRouter,
  Navigate,
  Outlet,
  useNavigate,
  useParams,
  useLocation,
  Link,
} from 'react-router-dom';
import { Plus } from 'lucide-react';

import { MobileHeader } from './components/MobileHeader';
import { BottomNav } from './components/BottomNav';
import { MobileFeedCard } from './components/MobileFeedCard';
import { MobilePlayerProfile } from './components/MobilePlayerProfile';
import { RankingSection } from './components/RankingSection';
import { SearchPage } from './components/SearchPage';
import { TransmissionModal } from './components/TransmissionModal';
import { MobileRegister } from './components/MobileRegister';
import { ProfileCompletionStepper } from './components/ProfileCompletionStepper';

import type { FeedEntry, Player } from '@/app/gateways/PlayerGateway';
import type { AuthGateway } from '@/app/gateways/AuthGateway';
import type { ProfileGateway } from '@/app/gateways/ProfileGateway';
import type { PlayerGateway } from '@/app/gateways/PlayerGateway';
import type { FeedGateway } from '@/app/gateways/FeedGateway';
import type { TransmissionGateway } from '@/app/gateways/TransmissionGateway';
import { Inject, TkAuthGateway, TkProfileGateway, TkPlayerGateway, TkFeedGateway, TkTransmissionGateway } from '@/infra/container';

type SessionState = {
  userId: string | null;
  onboarded: boolean;
};

function useSessionState() {
  const auth = Inject<AuthGateway>(TkAuthGateway);
  const profile = Inject<ProfileGateway>(TkProfileGateway);
  const [state, setState] = useState<SessionState>({ userId: null, onboarded: false });

  useEffect(() => {
    auth.getSession().then(async (session: any) => {
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

function AppLayout({ isLoggedIn }: { isLoggedIn: boolean }) {
  const location = useLocation();
  const navigate = useNavigate();
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
      <MobileHeader showBack={isProfileRoute} onBack={() => window.history.back()} title={title} subtitle={subtitle} />
      <main className="relative z-10">
        <Outlet />
      </main>
      <BottomNav
        currentView={currentView as any}
        onNavigate={(view) => {
          if (view === 'feed') navigate('/mural/feed');
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

function RequireAuth({ session }: { session: SessionState }) {
  if (!session.userId) return <Navigate to="/auth" replace />;
  if (!session.onboarded) return <Navigate to="/onboarding" replace />;
  return <Outlet />;
}

function AuthPage({ onLogin }: { onLogin: () => Promise<void> }) {
  const navigate = useNavigate();
  const handleLogin = async () => {
    await onLogin();
    navigate('/onboarding', { replace: true });
  };
  return <MobileRegister onGoogleSignIn={handleLogin} />;
}

function OnboardingPage({ userId, onComplete }: { userId: string; onComplete: (data: { nickname: string; name: string; cpf: string; photo: File | null }) => Promise<void> }) {
  const navigate = useNavigate();
  const profile = Inject<ProfileGateway>(TkProfileGateway);
  const handleComplete = async (data: { nickname: string; name: string; cpf: string; photo: File | null }) => {
    await onComplete(data);
    await profile.completeProfile(userId, {
      cpf: data.cpf,
      name: data.name,
      photo: data.photo ? URL.createObjectURL(data.photo) : undefined,
      nickname: data.nickname,
    });
    navigate('/mural/feed', { replace: true });
  };
  return <ProfileCompletionStepper onComplete={handleComplete} />;
};

function FeedPage({ isLoggedIn }: { isLoggedIn: boolean }) {
  const feedGateway = Inject<FeedGateway>(TkFeedGateway);
  const playerGateway = Inject<PlayerGateway>(TkPlayerGateway);
  const txGateway = Inject<TransmissionGateway>(TkTransmissionGateway);
  const [feed, setFeed] = useState<FeedEntry[]>([]);
  const [players, setPlayers] = useState<Player[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [preSelectedPlayerId, setPreSelectedPlayerId] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    feedGateway.listFeed().then(setFeed);
    playerGateway.listPlayers().then(setPlayers);
  }, [feedGateway, playerGateway]);

  const handleSubmit = async (data: any) => {
    await txGateway.createTransmission({
      targetId: data.targetId,
      type: data.type,
      content: data.content,
      submitterName: data.submitterName,
      submitterCPF: data.submitterCPF,
      submitterPhoto: data.submitterPhoto,
    });
    const updatedFeed = await feedGateway.listFeed();
    setFeed(updatedFeed);
  };

  const handleTargetClick = (id: string) => {
    navigate(`/player/${id}`);
  };

  const handlePreselect = (id: string) => {
    setPreSelectedPlayerId(id);
    setIsModalOpen(true);
  };

  return (
    <div className="space-y-0">
      <div className="px-4 pb-6 space-y-4">
        <h2 className="text-sm font-mono-technical tracking-wider uppercase text-[#7F94B0] mb-4">
          Registro Global
        </h2>
        {feed.map((entry) => (
          <MobileFeedCard key={entry.id} entry={entry} onTargetClick={handleTargetClick} />
        ))}
      </div>

      <button
        onClick={() => {
          if (!isLoggedIn) {
            navigate('/auth');
            return;
          }
          setIsModalOpen(true);
        }}
        className="fixed bottom-24 right-6 w-14 h-14 bg-[#D4A536] rounded-full flex items-center justify-center shadow-[0_0_20px_rgba(212,165,54,0.6)] hover:shadow-[0_0_30px_rgba(212,165,54,0.8)] transition-all z-40 hover:scale-110"
      >
        <Plus className="w-6 h-6 text-[#0B0E14]" />
      </button>

      <TransmissionModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        players={players}
        preSelectedPlayerId={preSelectedPlayerId}
        onSubmit={handleSubmit}
        onSuccess={async () => {
          const updatedFeed = await feedGateway.listFeed();
          setFeed(updatedFeed);
          setIsModalOpen(false);
        }}
      />
    </div>
  );
}

function RankingsPage() {
  const playerGateway = Inject<PlayerGateway>(TkPlayerGateway);
  const [players, setPlayers] = useState<Player[]>([]);
  const navigate = useNavigate();
  useEffect(() => {
    playerGateway.listPlayers().then(setPlayers);
  }, [playerGateway]);
  return (
    <div className="px-4 pb-6">
      <RankingSection
        players={players.map((p) => ({
          id: p.id,
          name: p.name,
          nickname: p.nickname,
          avatar: p.avatar,
          elogios: p.elogios,
          denuncias: p.denuncias,
        }))}
        onPlayerClick={(id) => navigate(`/player/${id}`)}
      />
    </div>
  );
}

function SearchRoute() {
  const playerGateway = Inject<PlayerGateway>(TkPlayerGateway);
  const [players, setPlayers] = useState<Player[]>([]);
  const navigate = useNavigate();
  useEffect(() => {
    playerGateway.listPlayers().then(setPlayers);
  }, [playerGateway]);
  return (
    <SearchPage
      players={players.map((p) => ({
        id: p.id,
        name: p.name,
        nickname: p.nickname,
        avatar: p.avatar,
        reputation: p.reputation,
        elogios: p.elogios,
        denuncias: p.denuncias,
      }))}
      onPlayerSelect={(id) => navigate(`/player/${id}`)}
    />
  );
}

function MyProfileRoute({ userId }: { userId: string }) {
  const playerGateway = Inject<PlayerGateway>(TkPlayerGateway);
  const profileGateway = Inject<ProfileGateway>(TkProfileGateway);
  const [player, setPlayer] = useState<Player | null>(null);
  useEffect(() => {
    playerGateway.getPlayer(userId).then(setPlayer);
  }, [playerGateway, userId]);
  if (!player) return null;
  return (
    <MobilePlayerProfile
      player={player}
      onTargetClick={() => { }}
      isOwnProfile
      onProfileUpdate={(data) => {
        profileGateway.updateProfile(userId, data);
      }}
    />
  );
}

function PlayerProfileRoute() {
  const playerGateway = Inject<any>(TkPlayerGateway);
  const { id } = useParams();
  const [player, setPlayer] = useState<Player | null>(null);
  useEffect(() => {
    if (id) {
      playerGateway.getPlayer(id).then(setPlayer);
    }
  }, [id, playerGateway]);
  if (!player) return null;
  return <MobilePlayerProfile player={player} onTargetClick={() => { }} />;
}

function MuralTabs() {
  const location = useLocation();
  const isFeed = location.pathname.endsWith('/feed');
  return (
    <div className="px-4 pt-6 pb-4">
      <div className="flex gap-2 bg-[#141A26] align-center justify-center p-1 rounded-lg border border-[#2D3A52]">
        <Link
          to="/mural/feed"
          className={`flex-1 text-center py-3 rounded-md transition-all font-mono-technical text-sm uppercase tracking-wider ${isFeed
            ? 'bg-[#00F0FF]/10 text-[#00F0FF] border border-[#00F0FF]/30 shadow-[0_0_15px_rgba(0,240,255,0.3)]'
            : 'text-[#7F94B0] hover:text-[#E6F1FF] border border-[#00F0FF]/1'
            }`}
        >
          Transmissões
        </Link>
        <Link
          to="/mural/rankings"
          className={`flex-1 py-3 text-center rounded-md transition-all font-mono-technical text-sm uppercase tracking-wider ${!isFeed
            ? 'bg-[#00F0FF]/10 text-[#00F0FF] border border-[#00F0FF]/30 shadow-[0_0_15px_rgba(0,240,255,0.3)]'
            : 'text-[#7F94B0] hover:text-[#E6F1FF] border border-[#00F0FF]/1'
            }`}
        >
          Rankings
        </Link>
      </div>
    </div>
  );
}

function MuralLayout() {
  return (
    <>
      <MuralTabs />
      <Outlet />
    </>
  );
}

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
              onComplete={async () => {
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
                { path: 'feed', element: <FeedPage isLoggedIn={Boolean(state.userId)} /> }, // public feed
                { path: 'rankings', element: <RankingsPage /> }, // public rankings
              ],
            },
            { path: '/search', element: <SearchRoute /> }, // public search
            { path: '/player/:id', element: <PlayerProfileRoute /> }, // public player profile
            {
              element: <RequireAuth session={state} />, // private area
              children: [{ path: '/perfil', element: state.userId ? <MyProfileRoute userId={state.userId} /> : <Navigate to="/auth" replace /> }],
            },
          ],
        },
      ]),
    [state, login, markOnboarded],
  );

  return <RouterProvider router={router} />;
}
