import { useState } from 'react';
import { MobileHeader } from './components/MobileHeader';
import { BottomNav } from './components/BottomNav';
import { MobileFeedCard, FeedEntry } from './components/MobileFeedCard';
import { MobilePlayerProfile, PlayerData } from './components/MobilePlayerProfile';
import { RankingSection, RankingPlayer } from './components/RankingSection';
import { SearchPage, SearchPlayer } from './components/SearchPage';
import { TransmissionModal, TransmissionPlayer } from './components/TransmissionModal';
import { MobileRegister } from './components/MobileRegister';
import { ProfileCompletionStepper } from './components/ProfileCompletionStepper';
import { Plus } from 'lucide-react';

// Mock data
const mockFeedData: FeedEntry[] = [
  {
    id: '1',
    type: 'praise',
    targetId: '1',
    targetName: 'Carlos "Raptor" Silva',
    targetAvatar: 'https://images.unsplash.com/photo-1695271710977-ee9a4b095304?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx0YWN0aWNhbCUyMG1pbGl0YXJ5JTIwcG9ydHJhaXR8ZW58MXx8fHwxNzY1ODI1NjA2fDA&ixlib=rb-4.1.0&q=80&w=1080',
    content: 'Jogador extremamente honesto. Durante partida no campo Zona Alpha, sinalizou hit mesmo estando em posição vantajosa. Exemplo de fair play.',
    date: '14.12.24',
    time: '15:30',
  },
  {
    id: '2',
    type: 'report',
    targetId: '2',
    targetName: 'João "Shadow" Santos',
    targetAvatar: 'https://images.unsplash.com/photo-1686587847397-ab5882b8d34f?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxzb2xkaWVyJTIwcG9ydHJhaXQlMjBtYXNrfGVufDF8fHx8MTc2NTgyNTYwN3ww&ixlib=rb-4.1.0&q=80&w=1080',
    content: 'Não aceitou hits múltiplos na partida de domingo. Vários jogadores confirmaram tiros certeiros no alvo, mas continuou jogando sem sinalizar.',
    date: '13.12.24',
    time: '18:45',
  },
  {
    id: '3',
    type: 'praise',
    targetId: '3',
    targetName: 'Maria "Eagle" Costa',
    targetAvatar: 'https://images.unsplash.com/photo-1735031896550-aae16d84b711?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxhaXJzb2Z0JTIwcGxheWVyfGVufDF8fHx8MTc2NTgyNTYwN3ww&ixlib=rb-4.1.0&q=80&w=1080',
    content: 'Atitude profissional e respeitosa. Ajudou jogador iniciante a ajustar equipamento e explicou regras. Espírito esportivo excelente.',
    date: '12.12.24',
    time: '10:15',
  },
  {
    id: '4',
    type: 'report',
    targetId: '2',
    targetName: 'João "Shadow" Santos',
    targetAvatar: 'https://images.unsplash.com/photo-1686587847397-ab5882b8d34f?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxzb2xkaWVyJTIwcG9ydHJhaXQlMjBtYXNrfGVufDF8fHx8MTc2NTgyNTYwN3ww&ixlib=rb-4.1.0&q=80&w=1080',
    content: 'Comportamento agressivo após eliminação. Discutiu com árbitro e outros jogadores de forma desrespeitosa.',
    date: '11.12.24',
    time: '16:20',
    isRetracted: true,
  },
  {
    id: '5',
    type: 'praise',
    targetId: '4',
    targetName: 'Pedro "Ghost" Oliveira',
    targetAvatar: 'https://images.unsplash.com/photo-1620058689342-80271a734f23?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxtaWxpdGFyeSUyMG9wZXJhdG9yfGVufDF8fHx8MTc2NTgyNTYwN3ww&ixlib=rb-4.1.0&q=80&w=1080',
    content: 'Organizou evento beneficente no campo. Doou equipamentos para jogadores novos. Grande contribuição para a comunidade.',
    date: '10.12.24',
    time: '14:00',
  },
];

const mockPlayerData: Record<string, PlayerData> = {
  '1': {
    id: '1',
    name: 'Carlos Silva Santos',
    nickname: 'Carlos "Raptor" Silva',
    avatar: 'https://images.unsplash.com/photo-1695271710977-ee9a4b095304?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx0YWN0aWNhbCUyMG1pbGl0YXJ5JTIwcG9ydHJhaXR8ZW58MXx8fHwxNzY1ODI1NjA2fDA&ixlib=rb-4.1.0&q=80&w=1080',
    reputation: 9,
    reportCount: 1,
    praiseCount: 12,
    history: [
      {
        id: '101',
        type: 'praise',
        targetId: '1',
        targetName: 'Carlos "Raptor" Silva',
        targetAvatar: 'https://images.unsplash.com/photo-1695271710977-ee9a4b095304?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx0YWN0aWNhbCUyMG1pbGl0YXJ5JTIwcG9ydHJhaXR8ZW58MXx8fHwxNzY1ODI1NjA2fDA&ixlib=rb-4.1.0&q=80&w=1080',
        content: 'Jogador extremamente honesto. Durante partida no campo Zona Alpha, sinalizou hit mesmo estando em posição vantajosa.',
        date: '14.12.24',
        time: '15:30',
      },
      {
        id: '102',
        type: 'praise',
        targetId: '1',
        targetName: 'Carlos "Raptor" Silva',
        targetAvatar: 'https://images.unsplash.com/photo-1695271710977-ee9a4b095304?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx0YWN0aWNhbCUyMG1pbGl0YXJ5JTIwcG9ydHJhaXR8ZW58MXx8fHwxNzY1ODI1NjA2fDA&ixlib=rb-4.1.0&q=80&w=1080',
        content: 'Sempre cumpre as regras e respeita os adversários. Jogador modelo.',
        date: '08.12.24',
        time: '11:20',
      },
    ],
  },
  '2': {
    id: '2',
    name: 'João Santos Oliveira',
    nickname: 'João "Shadow" Santos',
    avatar: 'https://images.unsplash.com/photo-1686587847397-ab5882b8d34f?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxzb2xkaWVyJTIwcG9ydHJhaXQlMjBtYXNrfGVufDF8fHx8MTc2NTgyNTYwN3ww&ixlib=rb-4.1.0&q=80&w=1080',
    reputation: 3,
    reportCount: 14,
    praiseCount: 3,
    history: [
      {
        id: '201',
        type: 'report',
        targetId: '2',
        targetName: 'João "Shadow" Santos',
        targetAvatar: 'https://images.unsplash.com/photo-1686587847397-ab5882b8d34f?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxzb2xkaWVyJTIwcG9ydHJhaXQlMjBtYXNrfGVufDF8fHx8MTc2NTgyNTYwN3ww&ixlib=rb-4.1.0&q=80&w=1080',
        content: 'Não aceitou hits múltiplos na partida de domingo. Vários jogadores confirmaram tiros certeiros no alvo.',
        date: '13.12.24',
        time: '18:45',
      },
      {
        id: '202',
        type: 'report',
        targetId: '2',
        targetName: 'João "Shadow" Santos',
        targetAvatar: 'https://images.unsplash.com/photo-1686587847397-ab5882b8d34f?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxzb2xkaWVyJTIwcG9ydHJhaXQlMjBtYXNrfGVufDF8fHx8MTc2NTgyNTYwN3ww&ixlib=rb-4.1.0&q=80&w=1080',
        content: 'Comportamento agressivo após eliminação. Discutiu com árbitro e outros jogadores.',
        date: '11.12.24',
        time: '16:20',
        isRetracted: true,
      },
    ],
  },
  '3': {
    id: '3',
    name: 'Maria Costa Ferreira',
    nickname: 'Maria "Eagle" Costa',
    avatar: 'https://images.unsplash.com/photo-1735031896550-aae16d84b711?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxhaXJzb2Z0JTIwcGxheWVyfGVufDF8fHx8MTc2NTgyNTYwN3ww&ixlib=rb-4.1.0&q=80&w=1080',
    reputation: 8,
    reportCount: 2,
    praiseCount: 15,
    history: [
      {
        id: '301',
        type: 'praise',
        targetId: '3',
        targetName: 'Maria "Eagle" Costa',
        targetAvatar: 'https://images.unsplash.com/photo-1735031896550-aae16d84b711?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxhaXJzb2Z0JTIwcGxheWVyfGVufDF8fHx8MTc2NTgyNTYwN3ww&ixlib=rb-4.1.0&q=80&w=1080',
        content: 'Atitude profissional e respeitosa. Ajudou jogador iniciante a ajustar equipamento.',
        date: '12.12.24',
        time: '10:15',
      },
    ],
  },
  '4': {
    id: '4',
    name: 'Pedro Oliveira Lima',
    nickname: 'Pedro "Ghost" Oliveira',
    avatar: 'https://images.unsplash.com/photo-1620058689342-80271a734f23?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxtaWxpdGFyeSUyMG9wZXJhdG9yfGVufDF8fHx8MTc2NTgyNTYwN3ww&ixlib=rb-4.1.0&q=80&w=1080',
    reputation: 10,
    reportCount: 0,
    praiseCount: 23,
    history: [
      {
        id: '401',
        type: 'praise',
        targetId: '4',
        targetName: 'Pedro "Ghost" Oliveira',
        targetAvatar: 'https://images.unsplash.com/photo-1620058689342-80271a734f23?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxtaWxpdGFyeSUyMG9wZXJhdG9yfGVufDF8fHx8MTc2NTgyNTYwN3ww&ixlib=rb-4.1.0&q=80&w=1080',
        content: 'Organizou evento beneficente no campo. Doou equipamentos para jogadores novos.',
        date: '10.12.24',
        time: '14:00',
      },
    ],
  },
  '5': {
    id: '5',
    name: 'Ana Paula Ribeiro',
    nickname: 'Ana "Viper" Ribeiro',
    avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=400&h=400&fit=crop',
    reputation: 7,
    reportCount: 5,
    praiseCount: 8,
    history: [],
  },
  '6': {
    id: '6',
    name: 'Rafael Souza Mendes',
    nickname: 'Rafael "Hawk" Souza',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=400&fit=crop',
    reputation: 6,
    reportCount: 8,
    praiseCount: 10,
    history: [],
  },
  '7': {
    id: '7',
    name: 'Fernanda Lima Santos',
    nickname: 'Fernanda "Phoenix" Lima',
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400&h=400&fit=crop',
    reputation: 9,
    reportCount: 2,
    praiseCount: 18,
    history: [],
  },
  '8': {
    id: '8',
    name: 'Lucas Pereira Costa',
    nickname: 'Lucas "Wolf" Pereira',
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&h=400&fit=crop',
    reputation: 4,
    reportCount: 11,
    praiseCount: 5,
    history: [],
  },
  '9': {
    id: '9',
    name: 'Juliana Costa Alves',
    nickname: 'Juliana "Falcon" Costa',
    avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=400&h=400&fit=crop',
    reputation: 8,
    reportCount: 3,
    praiseCount: 14,
    history: [],
  },
  '10': {
    id: '10',
    name: 'Bruno Santos Rocha',
    nickname: 'Bruno "Tiger" Santos',
    avatar: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=400&h=400&fit=crop',
    reputation: 5,
    reportCount: 9,
    praiseCount: 7,
    history: [],
  },
  '11': {
    id: '11',
    name: 'Camila Rodrigues Silva',
    nickname: 'Camila "Raven" Rodrigues',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&h=400&fit=crop',
    reputation: 10,
    reportCount: 0,
    praiseCount: 25,
    history: [],
  },
  '12': {
    id: '12',
    name: 'Diego Martins Ferreira',
    nickname: 'Diego "Snake" Martins',
    avatar: 'https://images.unsplash.com/photo-1506277886164-e25aa3f4ef7f?w=400&h=400&fit=crop',
    reputation: 2,
    reportCount: 18,
    praiseCount: 2,
    history: [],
  },
};

// Convert player data for ranking and search
const allPlayers: (RankingPlayer & SearchPlayer)[] = Object.values(mockPlayerData).map(p => ({
  id: p.id,
  name: p.name,
  nickname: p.nickname,
  avatar: p.avatar,
  elogios: p.praiseCount,
  denuncias: p.reportCount,
  reputation: p.reputation,
}));

export default function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isGoogleAuthenticated, setIsGoogleAuthenticated] = useState(false);
  const [isProfileComplete, setIsProfileComplete] = useState(false);
  const [currentView, setCurrentView] = useState<'feed' | 'search' | 'profile' | 'playerProfile'>('feed');
  const [selectedPlayerId, setSelectedPlayerId] = useState<string | null>(null);
  const [feedData, setFeedData] = useState<FeedEntry[]>(mockFeedData);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [preSelectedPlayerId, setPreSelectedPlayerId] = useState<string | null>(null);
  const [muralTab, setMuralTab] = useState<'transmissoes' | 'rankings'>('transmissoes');

  const handleGoogleSignIn = () => {
    setIsGoogleAuthenticated(true);
  };

  const handleProfileCompletion = (data: { nickname: string; name: string; cpf: string; photo: File | null }) => {
    // Save profile data (in real app, this would go to Supabase)
    console.log('Profile completed:', data);
    
    // Update mock data with new user profile
    mockPlayerData['1'].name = data.name;
    mockPlayerData['1'].nickname = data.nickname;
    
    // Convert photo to preview URL if provided
    if (data.photo) {
      const photoUrl = URL.createObjectURL(data.photo);
      mockPlayerData['1'].avatar = photoUrl;
    }
    
    setIsProfileComplete(true);
    setIsLoggedIn(true);
    setCurrentView('feed');
  };

  const handleLogin = () => {
    setIsLoggedIn(true);
  };

  const handleNavigate = (view: 'feed' | 'search' | 'profile') => {
    if (view === 'profile') {
      if (!isLoggedIn) {
        // Show login prompt
        return;
      }
      // Show user's own profile (for demo, using player 1)
      setSelectedPlayerId('1');
      setCurrentView('playerProfile');
    } else {
      setCurrentView(view);
    }
  };

  const handleTargetClick = (targetId: string) => {
    setSelectedPlayerId(targetId);
    setCurrentView('playerProfile');
  };

  const handlePlayerSelectFromSearch = (playerId: string) => {
    setPreSelectedPlayerId(playerId);
    setIsModalOpen(true);
  };

  const handleOpenTransmissionModal = () => {
    setPreSelectedPlayerId(null);
    setIsModalOpen(true);
  };

  const handleCreateReport = (data: { 
    targetId: string; 
    type: 'report' | 'praise'; 
    content: string;
    submitterName: string;
    submitterCPF: string;
    submitterPhoto: File | null;
  }) => {
    const now = new Date();
    const newEntry: FeedEntry = {
      id: Date.now().toString(),
      type: data.type,
      targetId: data.targetId,
      targetName: mockPlayerData[data.targetId]?.nickname || 'Jogador Desconhecido',
      targetAvatar: mockPlayerData[data.targetId]?.avatar,
      content: data.content,
      date: now.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: '2-digit' }).replace(/\//g, '.'),
      time: now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
    };
    setFeedData([newEntry, ...feedData]);
  };

  const handleProfileUpdate = (data: { name: string; nickname: string; avatar?: string }) => {
    // For demo purposes, updating player 1's profile (the logged-in user)
    if (mockPlayerData['1']) {
      mockPlayerData['1'].name = data.name;
      mockPlayerData['1'].nickname = data.nickname;
      if (data.avatar) {
        mockPlayerData['1'].avatar = data.avatar;
      }
      // Force a re-render by updating the player data reference
      setSelectedPlayerId('1');
    }
  };

  const showFloatingButton = isLoggedIn && currentView === 'feed';

  // Show registration screen if not logged in
  if (!isLoggedIn && !isGoogleAuthenticated) {
    return <MobileRegister onGoogleSignIn={handleGoogleSignIn} />;
  }

  // Show profile completion stepper after Google auth but before profile is complete
  if (isGoogleAuthenticated && !isProfileComplete) {
    return <ProfileCompletionStepper onComplete={handleProfileCompletion} />;
  }

  return (
    <div className="min-h-screen bg-[#0B0E14] pb-20">
      {/* Header */}
      <MobileHeader 
        isLoggedIn={isLoggedIn} 
        onLogin={handleLogin}
        showBack={currentView === 'playerProfile'}
        onBack={currentView === 'playerProfile' ? () => setCurrentView('feed') : undefined}
        title={currentView === 'search' ? 'Busca' : undefined}
        subtitle={currentView === 'search' ? 'Selecionar operador para transmissão' : undefined}
      />

      {/* Main Content */}
      <main className="relative z-10">
        {currentView === 'feed' && (
          <div className="space-y-0">
            {/* Mural Tabs */}
            <div className="px-4 pt-6 pb-4">
              <div className="flex gap-2 bg-[#141A26] p-1 rounded-lg border border-[#2D3A52]">
                <button
                  onClick={() => setMuralTab('transmissoes')}
                  className={`flex-1 py-3 rounded-md transition-all font-mono-technical text-sm uppercase tracking-wider ${
                    muralTab === 'transmissoes'
                      ? 'bg-[#00F0FF]/10 text-[#00F0FF] border border-[#00F0FF]/30 shadow-[0_0_15px_rgba(0,240,255,0.3)]'
                      : 'text-[#7F94B0] hover:text-[#E6F1FF]'
                  }`}
                >
                  Transmissões
                </button>
                <button
                  onClick={() => setMuralTab('rankings')}
                  className={`flex-1 py-3 rounded-md transition-all font-mono-technical text-sm uppercase tracking-wider ${
                    muralTab === 'rankings'
                      ? 'bg-[#00F0FF]/10 text-[#00F0FF] border border-[#00F0FF]/30 shadow-[0_0_15px_rgba(0,240,255,0.3)]'
                      : 'text-[#7F94B0] hover:text-[#E6F1FF]'
                  }`}
                >
                  Rankings
                </button>
              </div>
            </div>

            {/* Tab Content */}
            {muralTab === 'transmissoes' ? (
              <div className="px-4 pb-6 space-y-4">
                <h2 className="text-sm font-mono-technical tracking-wider uppercase text-[#7F94B0] mb-4">
                  Registro Global
                </h2>
                {feedData.map((entry) => (
                  <MobileFeedCard 
                    key={entry.id} 
                    entry={entry} 
                    onTargetClick={handleTargetClick} 
                  />
                ))}
              </div>
            ) : (
              <div className="px-4 pb-6">
                <RankingSection 
                  players={allPlayers} 
                  onPlayerClick={handleTargetClick}
                />
              </div>
            )}
          </div>
        )}

        {currentView === 'search' && (
          <SearchPage 
            players={allPlayers}
            onPlayerSelect={handlePlayerSelectFromSearch}
          />
        )}

        {currentView === 'profile' && !isLoggedIn && (
          <div className="px-4 py-6">
            <div className="bg-[#141A26] rounded-lg border border-[#2D3A52] p-8 text-center">
              <p className="text-[#7F94B0] mb-4">Faça login para ver seu perfil</p>
            </div>
          </div>
        )}

        {currentView === 'playerProfile' && selectedPlayerId && mockPlayerData[selectedPlayerId] && (
          <MobilePlayerProfile
            player={mockPlayerData[selectedPlayerId]}
            onTargetClick={handleTargetClick}
            isOwnProfile={isLoggedIn && selectedPlayerId === '1'}
            onProfileUpdate={handleProfileUpdate}
          />
        )}
      </main>

      {/* Floating Action Button */}
      {showFloatingButton && (
        <button
          onClick={handleOpenTransmissionModal}
          className="fixed bottom-24 right-6 w-14 h-14 bg-[#D4A536] rounded-full flex items-center justify-center shadow-[0_0_20px_rgba(212,165,54,0.6)] hover:shadow-[0_0_30px_rgba(212,165,54,0.8)] transition-all z-40 hover:scale-110"
        >
          <Plus className="w-6 h-6 text-[#0B0E14]" />
        </button>
      )}

      {/* Transmission Modal */}
      <TransmissionModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        players={allPlayers}
        preSelectedPlayerId={preSelectedPlayerId}
        onSubmit={handleCreateReport}
        onSuccess={() => {
          setIsModalOpen(false);
          setCurrentView('feed');
        }}
      />

      {/* Bottom Navigation */}
      <BottomNav 
        currentView={currentView === 'playerProfile' ? 'profile' : currentView} 
        onNavigate={handleNavigate} 
        isLoggedIn={isLoggedIn} 
      />
    </div>
  );
}