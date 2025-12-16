import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus } from 'lucide-react';
import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { MobileFeedCard } from '@/components/MobileFeedCard';
import { TransmissionModal, type TransmissionPlayer } from '@/components/TransmissionModal';
import { Spinner } from '@/components/Spinner';
import { useSession } from '@/app/context/session-context';
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
  const queryClient = useQueryClient();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [preSelectedPlayerId, setPreSelectedPlayerId] = useState<string | null>(null);
  const navigate = useNavigate();
  const sentinelRef = useRef<HTMLDivElement | null>(null);

  const {
    data: feedPages,
    isLoading: feedLoading,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useInfiniteQuery({
    queryKey: ['feed'],
    queryFn: ({ pageParam = 0 }) => feedGateway.listFeedPage({ page: pageParam, pageSize: 20 }),
    getNextPageParam: (lastPage, allPages) => (lastPage.length < 20 ? undefined : allPages.length),
  });

  const feed = feedPages?.pages.flatMap((p) => p) ?? [];

  const { data: players = [], isLoading: playersLoading } = useQuery({
    queryKey: ['players'],
    queryFn: () => playerGateway.listPlayers(),
  });

  const createTransmission = useMutation({
    mutationFn: async (data: { targetId: string; type: 'report' | 'praise'; content: string }) => {
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
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['feed'] });
      await queryClient.invalidateQueries({ queryKey: ['players'] });
    },
  });

  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel) return;
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && hasNextPage && !isFetchingNextPage) {
            fetchNextPage();
          }
        });
      },
      { rootMargin: '200px' },
    );
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  const handleTargetClick = (id: string) => {
    navigate(`/player/${id}`);
  };

  return (
    <div className="space-y-0">
      <div className="px-4 pb-6 space-y-4">
        <h2 className="text-sm font-mono-technical tracking-wider uppercase text-[#7F94B0] mb-4">
          Registro Global
        </h2>
        {feedLoading ? (
          <Spinner label="carregando feed" />
        ) : (
          feed.map((entry) => <MobileFeedCard key={entry.id} entry={entry} onTargetClick={handleTargetClick} />)
        )}
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
        onSubmit={(data) => createTransmission.mutate(data)}
        onSuccess={async () => {
          setIsModalOpen(false);
        }}
      />
      <div ref={sentinelRef} />
      {isFetchingNextPage && <Spinner label="carregando mais" />}
      {!hasNextPage && feed.length > 0 && (
        <div className="py-4 text-center text-xs text-[#7F94B0] font-mono-technical">[ fim do mural ]</div>
      )}
      {(playersLoading || feedLoading) && feed.length === 0 && <Spinner label="sincronizando dados" />}
    </div>
  );
}
