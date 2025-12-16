import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus } from 'lucide-react';
import { MobileFeedCard } from '@/components/MobileFeedCard';
import { TransmissionModal, type TransmissionPlayer } from '@/components/TransmissionModal';
import { useSession } from '@/app/context/session-context';
import type { FeedEntry, Player } from '@/app/gateways/PlayerGateway';
import type { FeedGateway } from '@/app/gateways/FeedGateway';
import type { PlayerGateway } from '@/app/gateways/PlayerGateway';
import type { TransmissionGateway } from '@/app/gateways/TransmissionGateway';
import { Inject, TkFeedGateway, TkPlayerGateway, TkTransmissionGateway } from '@/infra/container';

type Props = {
  isLoggedIn: boolean;
};

export function FeedPage({ isLoggedIn }: Props) {
  const feedGateway = Inject<FeedGateway>(TkFeedGateway);
  const playerGateway = Inject<PlayerGateway>(TkPlayerGateway);
  const txGateway = Inject<TransmissionGateway>(TkTransmissionGateway);
  const { state } = useSession();

  const [feed, setFeed] = useState<FeedEntry[]>([]);
  const [players, setPlayers] = useState<Player[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [preSelectedPlayerId, setPreSelectedPlayerId] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    feedGateway.listFeed().then(setFeed);
    playerGateway.listPlayers().then(setPlayers);
  }, []);

  const handleSubmit = async (data: any) => {
    if (!state.userId) {
      navigate('/auth');
      return;
    }
    if (!state.playerId) {
      navigate('/onboarding');
      return;
    }
    await txGateway.createTransmission({
      targetId: data.targetId,
      type: data.type,
      content: data.content,
      submitterId: state.playerId,
    });
    const updatedFeed = await feedGateway.listFeed();
    setFeed(updatedFeed);
  };

  const handleTargetClick = (id: string) => {
    navigate(`/player/${id}`);
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
          if (!isLoggedIn || !state.playerId) {
            navigate(state.userId ? '/onboarding' : '/auth');
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
        players={players.map(
          (p): TransmissionPlayer => ({
            id: p.id,
            name: p.name,
            nickname: p.nickname,
            avatar: p.avatar,
          }),
        )}
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
