import { useQuery, useInfiniteQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate, useParams } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { MobilePlayerProfile } from '@/components/MobilePlayerProfile';
import { Spinner } from '@/components/Spinner';
import { QueryErrorCard } from '@/components/QueryErrorCard';
import type { Player, PlayerGateway, FeedEntry } from '@/app/gateways/PlayerGateway';
import type { FeedGateway } from '@/app/gateways/FeedGateway';
import type { MatchGateway } from '@/app/gateways/MatchGateway';
import { Inject, TkPlayerGateway, TkFeedGateway, TkMatchGateway, TkTransmissionGateway } from '@/infra/container';
import { TransmissionModal, type TransmissionPlayer } from '@/components/TransmissionModal';
import { useSession } from '@/app/context/session-context';
import type { TransmissionGateway } from '@/app/gateways/TransmissionGateway';
import { TacticalButton } from '@/components/TacticalButton';

export function PlayerProfilePage() {
  const playerGateway = Inject<PlayerGateway>(TkPlayerGateway);
  const feedGateway = Inject<FeedGateway>(TkFeedGateway);
  const txGateway = Inject<TransmissionGateway>(TkTransmissionGateway);
  const matchGateway = Inject<MatchGateway>(TkMatchGateway);
  const { id } = useParams();
  const { state } = useSession();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [playerSearchTerm, setPlayerSearchTerm] = useState('');
  const [editingEntry, setEditingEntry] = useState<FeedEntry | null>(null);
  const [prefillLoading, setPrefillLoading] = useState(false);

  useEffect(() => {
    if (id && state.playerId && id === state.playerId) {
      navigate('/perfil', { replace: true });
    }
  }, [id, state.playerId, navigate]);
  const {
    data: player,
    error: playerError,
    isError: playerIsError,
    refetch: refetchPlayer,
  } = useQuery({
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
    isError: historyIsError,
    error: historyError,
    refetch: refetchHistory,
  } = useInfiniteQuery({
    queryKey: ['feed', 'target', id],
    queryFn: ({ pageParam = 0 }) =>
      id ? feedGateway.listByTarget(id, pageParam as number, 20) : Promise.resolve([]),
    getNextPageParam: (lastPage, allPages) => (lastPage.length < 20 ? undefined : allPages.length),
    enabled: Boolean(id),
  });

  const history = historyPages?.pages.flatMap((p) => p) ?? [];
  const {
    data: ranks,
    error: ranksError,
    isError: ranksIsError,
    refetch: refetchRanks,
  } = useQuery({
    queryKey: ['player', 'rank', id],
    queryFn: () => (id ? playerGateway.getPlayerRank(id) : Promise.resolve({ prestige: null, shame: null })),
    enabled: Boolean(id),
  });
  const closeModal = () => {
    setIsModalOpen(false);
    setPlayerSearchTerm('');
  };

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
    mutationFn: (data: { targetId: string; type: 'report' | 'praise'; content: string; matchId?: string | null }) => {
      if (!state.userId) {
        navigate('/auth');
        return Promise.resolve();
      }
      if (!state.playerId) {
        navigate('/onboarding');
        return Promise.resolve();
      }
      if (!data.matchId) {
        return Promise.reject(new Error('Selecione uma partida válida.'));
      }
      if (data.targetId === state.playerId) {
        return Promise.reject(new Error('Não é possível denunciar a si mesmo.'));
      }
      return txGateway.createTransmission({ ...data, submitterId: state.playerId, matchId: data.matchId });
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['feed', 'target', id] });
      await queryClient.invalidateQueries({ queryKey: ['feed'] });
      await queryClient.invalidateQueries({ queryKey: ['players'] });
      await queryClient.invalidateQueries({ queryKey: ['player', id] });
    },
  });

  const { data: eligibleMatches, isLoading: eligibleMatchesLoading } = useQuery({
    queryKey: ['matches', 'eligible', state.playerId],
    queryFn: () => matchGateway.listEligibleMatchesForTransmission({ playerId: state.playerId as string }),
    enabled: isModalOpen && Boolean(state.playerId) && !editingEntry,
  });

  const adminRetract = useMutation({
    mutationFn: (entryId: string) => feedGateway.adminRetract(entryId),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['feed'] });
      await queryClient.invalidateQueries({ queryKey: ['feed', 'target', id] });
    },
  });

  const adminRemove = useMutation({
    mutationFn: (entryId: string) => feedGateway.adminRemove(entryId),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['feed'] });
      await queryClient.invalidateQueries({ queryKey: ['feed', 'target', id] });
    },
  });

  const adminEdit = useMutation({
    mutationFn: (payload: { id: string; content: string }) => feedGateway.adminEdit(payload.id, payload.content),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['feed'] });
      await queryClient.invalidateQueries({ queryKey: ['feed', 'target', id] });
    },
  });

  if (playerIsError || historyIsError || ranksIsError) {
    return (
      <div className="p-6">
        <QueryErrorCard
          message={
            (playerError as Error)?.message ||
            (historyError as Error)?.message ||
            (ranksError as Error)?.message ||
            'Falha ao carregar perfil.'
          }
          action={
            <button
              className="px-4 py-2 bg-[#00F0FF]/10 border-2 border-[#00F0FF] rounded-lg text-[#00F0FF] font-mono-technical text-xs uppercase hover:bg-[#00F0FF]/20 transition-all"
              onClick={() => {
                void refetchPlayer();
                void refetchHistory();
                void refetchRanks();
              }}
            >
              [ TENTAR NOVAMENTE ]
            </button>
          }
        />
      </div>
    );
  }

  if (!player && history.length === 0) return <Spinner fullScreen label="carregando perfil" />;
  if (!player) return null;
  const isSubmitting = editingEntry ? adminEdit.isPending : createTransmission.isPending;
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
        isAdmin={state.isAdmin}
        onAdminRetract={(entryId) => adminRetract.mutate(entryId)}
        onAdminRemove={(entryId) => adminRemove.mutate(entryId)}
        onAdminEdit={(entry) => {
          setPrefillLoading(true);
          setEditingEntry(entry);
          setIsModalOpen(true);
          setTimeout(() => setPrefillLoading(false), 100);
        }}
        actionsAboveHistory={
          <div className="px-0">
            <TacticalButton
              variant="amber"
              fullWidth
              disabled={isSubmitting}
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
              leftIcon={
                isSubmitting ? (
                  <span className="inline-block w-4 h-4 border-2 border-current border-t-transparent border-l-transparent rounded-full animate-spin" />
                ) : undefined
              }
            >
              {isSubmitting ? '[ TRANSMITINDO... ]' : '[ REPORTAR JOGADOR ]'}
            </TacticalButton>
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
        submitterId={state.playerId ?? undefined}
        onSubmit={(data) =>
          editingEntry
            ? adminEdit.mutate(
              { id: editingEntry.id, content: data.content },
              {
                onSuccess: closeModal,
              },
            )
            : createTransmission.mutate(data, {
              onSuccess: closeModal,
            })
        }
        submitting={editingEntry ? adminEdit.isPending : createTransmission.isPending}
        searchTerm={playerSearchTerm}
        onSearchTermChange={setPlayerSearchTerm}
        isLoading={false}
        minChars={0}
        page={1}
        pageSize={1}
        total={1}
        onPageChange={() => { }}
        lockedTarget={
          editingEntry
            ? {
              id: editingEntry.targetId,
              name: editingEntry.targetName,
              nickname: editingEntry.targetName,
              avatar: editingEntry.targetAvatar,
            }
            : {
              id: player.id,
              name: player.name,
              nickname: player.nickname,
              avatar: player.avatar,
            }
        }
        lockedTargetId={editingEntry?.targetId ?? player?.id ?? undefined}
        lockedType={editingEntry?.type}
        initialContent={editingEntry?.content}
        prefillLoading={prefillLoading}
        eligibleMatches={eligibleMatches ?? []}
        eligibleMatchesLoading={eligibleMatchesLoading}
        requireMatch={!editingEntry}
      />
    </>
  );
}
