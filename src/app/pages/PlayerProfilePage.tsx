import { useQuery, useInfiniteQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate, useParams } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { MobilePlayerProfile } from '@/components/MobilePlayerProfile';
import { Spinner } from '@/components/Spinner';
import type { Player, PlayerGateway, FeedEntry } from '@/app/gateways/PlayerGateway';
import type { FeedGateway } from '@/app/gateways/FeedGateway';
import { Inject, TkPlayerGateway, TkFeedGateway, TkTransmissionGateway } from '@/infra/container';
import { TransmissionModal, type TransmissionPlayer } from '@/components/TransmissionModal';
import { useSession } from '@/app/context/session-context';
import type { TransmissionGateway } from '@/app/gateways/TransmissionGateway';

export function PlayerProfilePage() {
  const playerGateway = Inject<PlayerGateway>(TkPlayerGateway);
  const feedGateway = Inject<FeedGateway>(TkFeedGateway);
  const txGateway = Inject<TransmissionGateway>(TkTransmissionGateway);
  const { id } = useParams();
  const { state } = useSession();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [playerSearchTerm, setPlayerSearchTerm] = useState('');

  useEffect(() => {
    if (id && state.playerId && id === state.playerId) {
      navigate('/perfil', { replace: true });
    }
  }, [id, state.playerId, navigate]);
  const { data: player } = useQuery({
    queryKey: ['player', id],
    queryFn: () => (id ? playerGateway.getPlayer(id) : Promise.resolve(null)),
    enabled: Boolean(id),
  });

  const {
    data: historyPages,
    isLoading: historyLoading,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useInfiniteQuery({
    queryKey: ['feed', 'target', id],
    queryFn: ({ pageParam = 0 }) =>
      id ? feedGateway.listByTarget(id, pageParam as number, 20) : Promise.resolve([]),
    getNextPageParam: (lastPage, allPages) => (lastPage.length < 20 ? undefined : allPages.length),
    enabled: Boolean(id),
  });

  const history = historyPages?.pages.flatMap((p) => p) ?? [];
  const { data: ranks } = useQuery({
    queryKey: ['player', 'rank', id],
    queryFn: () => (id ? playerGateway.getPlayerRank(id) : Promise.resolve({ prestige: null, shame: null })),
    enabled: Boolean(id),
  });

  // Reset scroll when opening a player profile
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior });
  }, [id]);

  useEffect(() => {
    const sentinel = document.getElementById('history-sentinel');
    if (!sentinel) return;
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && hasNextPage && !isFetchingNextPage) fetchNextPage();
        });
      },
      { rootMargin: '200px' },
    );
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  const createTransmission = useMutation({
    mutationFn: (data: { targetId: string; type: 'report' | 'praise'; content: string }) => {
      if (!state.userId) {
        navigate('/auth');
        return Promise.resolve();
      }
      if (!state.playerId) {
        navigate('/onboarding');
        return Promise.resolve();
      }
      if (data.targetId === state.playerId) {
        return Promise.reject(new Error('Não é possível denunciar a si mesmo.'));
      }
      return txGateway.createTransmission({ ...data, submitterId: state.playerId });
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['feed', 'target', id] });
      await queryClient.invalidateQueries({ queryKey: ['feed'] });
      await queryClient.invalidateQueries({ queryKey: ['players'] });
      await queryClient.invalidateQueries({ queryKey: ['player', id] });
    },
  });

  if (!player && history.length === 0) return <Spinner fullScreen label="carregando perfil" />;
  if (!player) return null;
  const closeModal = () => {
    setIsModalOpen(false);
    setPlayerSearchTerm('');
  };
  return (
    <>
      <MobilePlayerProfile
        player={{ ...player, history, rankPrestige: ranks?.prestige ?? null, rankShame: ranks?.shame ?? null }}
        onTargetClick={(targetId) => {
          if (targetId === state.playerId) {
            navigate('/perfil');
          } else {
            navigate(`/player/${targetId}`);
          }
        }}
        onRankClick={(kind) => navigate(`/mural/rankings/${kind === 'prestige' ? 'prestigio' : 'vergonha'}`)}
        actionsAboveHistory={
          <div className="px-0">
            <button
              onClick={() => {
                if (!state.userId) {
                  navigate('/auth');
                  return;
                }
                if (!state.playerId) {
                  navigate('/onboarding');
                  return;
                }
                setPlayerSearchTerm(player?.nickname ?? '');
                setIsModalOpen(true);
              }}
              className="w-full bg-[#D4A536] text-[#0B0E14] font-mono-technical uppercase py-3 rounded-lg shadow-[0_0_20px_rgba(212,165,54,0.5)]"
            >
              [ REPORTAR JOGADOR ]
            </button>
          </div>
        }
      />
      <div id="history-sentinel" />
      {isFetchingNextPage && <Spinner label="carregando histórico" />}
      <TransmissionModal
        isOpen={isModalOpen}
        onClose={closeModal}
        players={
          player
            ? [
              {
                id: player.id,
                name: player.name,
                nickname: player.nickname,
                avatar: player.avatar,
              } as TransmissionPlayer,
            ]
            : []
        }
        preSelectedPlayerId={player?.id ?? null}
        onSubmit={(data) =>
          createTransmission.mutate(data, {
            onSuccess: closeModal,
          })
        }
        submitting={createTransmission.isPending}
        searchTerm={playerSearchTerm}
        onSearchTermChange={setPlayerSearchTerm}
        isLoading={false}
        minChars={0}
        page={1}
        pageSize={1}
        total={1}
        onPageChange={() => {}}
      />
    </>
  );
}
