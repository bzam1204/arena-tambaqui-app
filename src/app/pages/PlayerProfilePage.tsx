import { useQuery, useInfiniteQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate, useParams } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { MobilePlayerProfile } from '@/components/MobilePlayerProfile';
import { Spinner } from '@/components/Spinner';
import { QueryErrorCard } from '@/components/QueryErrorCard';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import type { Player, PlayerGateway, FeedEntry } from '@/app/gateways/PlayerGateway';
import type { FeedGateway } from '@/app/gateways/FeedGateway';
import type { MatchGateway } from '@/app/gateways/MatchGateway';
import type { ProfileGateway } from '@/app/gateways/ProfileGateway';
import { Inject, TkPlayerGateway, TkFeedGateway, TkMatchGateway, TkTransmissionGateway, TkProfileGateway } from '@/infra/container';
import { TransmissionModal, type TransmissionPlayer } from '@/components/TransmissionModal';
import { useSession } from '@/app/context/session-context';
import type { TransmissionGateway } from '@/app/gateways/TransmissionGateway';
import { TacticalButton } from '@/components/TacticalButton';

export function PlayerProfilePage() {
  const playerGateway = Inject<PlayerGateway>(TkPlayerGateway);
  const feedGateway = Inject<FeedGateway>(TkFeedGateway);
  const txGateway = Inject<TransmissionGateway>(TkTransmissionGateway);
  const matchGateway = Inject<MatchGateway>(TkMatchGateway);
  const profileGateway = Inject<ProfileGateway>(TkProfileGateway);
  const { id } = useParams();
  const { state } = useSession();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [playerSearchTerm, setPlayerSearchTerm] = useState('');
  const [editingEntry, setEditingEntry] = useState<FeedEntry | null>(null);
  const [prefillLoading, setPrefillLoading] = useState(false);
  const [identityModalOpen, setIdentityModalOpen] = useState(false);

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
    setIdentityModalOpen(false);
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

  const { data: matchCount } = useQuery({
    queryKey: ['player', 'match-count', id],
    queryFn: () => matchGateway.countPlayerMatches({ playerId: id as string }),
    enabled: Boolean(id),
  });

  const {
    data: userPhoto,
    isLoading: userPhotoLoading,
    isError: userPhotoIsError,
    error: userPhotoError,
  } = useQuery({
    queryKey: ['player', id, 'user-photo'],
    queryFn: () => (id ? profileGateway.getUserPhoto(id) : Promise.resolve(null)),
    enabled: Boolean(id) && Boolean(state.userId) && identityModalOpen,
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

  const updateProfile = useMutation({
    mutationFn: (data: { name: string; nickname: string; avatar?: File | string | null; motto?: string | null; avatarFrame?: string | null; isVip?: boolean }) => {
      if (!id) return Promise.resolve();
      return playerGateway.updatePlayerProfile({ playerId: id, ...data });
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['player', id] });
      await queryClient.invalidateQueries({ queryKey: ['players'] });
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
        player={{
          ...player,
          history,
          rankPrestige: ranks?.prestige ?? null,
          rankShame: ranks?.shame ?? null,
          matchCount: matchCount ?? null,
        }}
        onTargetClick={(targetId) => {
          if (targetId === state.playerId) {
            navigate('/perfil');
          } else {
            navigate(`/player/${targetId}`);
          }
        }}
        onRankClick={(kind) => {
          const slug = kind === 'prestige' ? 'prestigio' : 'vergonha';
          const rank = kind === 'prestige' ? ranks?.prestige : ranks?.shame;
          const params = new URLSearchParams();
          if (id) params.set('focus', id);
          if (rank && rank > 0) params.set('rank', String(rank));
          const query = params.toString();
          navigate(`/mural/rankings/${slug}${query ? `?${query}` : ''}`);
        }}
        canEditProfile={state.isAdmin}
        onProfileUpdate={state.isAdmin ? (data) => updateProfile.mutateAsync(data) : undefined}
        isSaving={state.isAdmin ? updateProfile.isPending : false}
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
          <div className="space-y-3">
            {state.userId ? (
              <div className="clip-tactical-card bg-[#141A26] border border-[#2D3A52] p-4 space-y-3">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <div className="text-xs text-[#7F94B0] font-mono-technical uppercase">
                      Verificação de identidade
                    </div>
                    <div className="text-[10px] text-[#7F94B0] font-mono-technical">
                      Privada · visível apenas sob demanda
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIdentityModalOpen(true)}
                    className="clip-tactical px-3 py-1 border transition-all text-[10px] uppercase font-mono-technical border-[#D4A536] bg-[#D4A536]/15 text-[#D4A536] hover:border-[#F1C36B]"
                  >
                    Exibir
                  </button>
                </div>
                <p className="text-xs text-[#7F94B0] font-mono-technical text-center">
                  Exibe a credencial de identificação com foto e nome completos.
                </p>
              </div>
            ) : null}
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
                avatarFrame: player.avatarFrame ?? null,
                isVip: player.isVip ?? false,
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
              avatarFrame: editingEntry.targetAvatarFrame ?? null,
              isVip: editingEntry.targetIsVip ?? false,
            }
            : {
              id: player.id,
              name: player.name,
              nickname: player.nickname,
              avatar: player.avatar,
              avatarFrame: player.avatarFrame ?? null,
              isVip: player.isVip ?? false,
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
      <Dialog open={identityModalOpen} onOpenChange={setIdentityModalOpen}>
        <DialogContent className="bg-[#0B0E14] border border-[#2D3A52] text-[#E6F1FF] max-w-xl w-[92vw]">
          <DialogHeader>
            <DialogTitle className="text-[#E6F1FF] font-mono-technical uppercase text-sm">
              [ CREDENCIAL DE IDENTIFICAÇÃO ]
            </DialogTitle>
            <DialogDescription className="text-[#7F94B0] text-xs font-mono-technical">
              Documento interno para verificação de identidade.
            </DialogDescription>
          </DialogHeader>
          <div className="clip-tactical-card border border-[#D4A536]/60 bg-gradient-to-br from-[#141A26] via-[#0B0E14] to-[#1A2233] p-5 space-y-4">
            <div className="flex items-center justify-between text-[10px] font-mono-technical uppercase text-[#D4A536]">
              <span>Identidade Operacional</span>
              <span className="text-[#7F94B0]">Nível de acesso: Restrito</span>
            </div>
            <div className="grid gap-4 sm:grid-cols-[140px_1fr] items-center">
              <div className="relative w-full max-w-[140px] mx-auto sm:mx-0">
                <div className="clip-tactical border-2 border-[#D4A536]/70 bg-[#0B0E14] p-1">
                  <div className="clip-tactical bg-[#0B0E14] border border-[#2D3A52] overflow-hidden">
                    {userPhotoLoading ? (
                      <div className="h-[160px] w-full flex items-center justify-center">
                        <Spinner inline size="sm" />
                      </div>
                    ) : null}
                    {!userPhotoLoading && userPhotoIsError ? (
                      <div className="h-[160px] w-full flex items-center justify-center text-[10px] text-[#D4A536] font-mono-technical px-2 text-center">
                        {(userPhotoError as Error)?.message || 'Falha ao carregar a foto.'}
                      </div>
                    ) : null}
                    {!userPhotoLoading && !userPhotoIsError && userPhoto ? (
                      <img
                        src={userPhoto}
                        alt="Foto de identidade"
                        className="h-[160px] w-full object-cover"
                      />
                    ) : null}
                    {!userPhotoLoading && !userPhotoIsError && !userPhoto ? (
                      <div className="h-[160px] w-full flex items-center justify-center text-[10px] text-[#7F94B0] font-mono-technical px-2 text-center">
                        Foto não disponível.
                      </div>
                    ) : null}
                  </div>
                </div>
              </div>
              <div className="space-y-3">
                <div>
                  <div className="text-[10px] text-[#7F94B0] font-mono-technical uppercase">Nome completo</div>
                  <div className="text-lg text-[#E6F1FF] font-mono-technical">{player.name}</div>
                </div>
                <div>
                  <div className="text-[10px] text-[#7F94B0] font-mono-technical uppercase">Codinome</div>
                  <div className="text-base text-[#D4A536] font-mono-technical">{player.nickname}</div>
                </div>
                <div className="flex flex-wrap items-center gap-3 text-[10px] font-mono-technical uppercase text-[#7F94B0]">
                  <span className="px-2 py-1 border border-[#2D3A52] bg-[#0B0E14]">Verificação ativa</span>
                  <span className="px-2 py-1 border border-[#2D3A52] bg-[#0B0E14]">Uso interno</span>
                </div>
                <div className="h-[2px] w-full bg-gradient-to-r from-transparent via-[#D4A536] to-transparent opacity-60" />
                <p className="text-[10px] text-[#7F94B0] font-mono-technical">
                  Credencial emitida para conferência visual de identidade. Compartilhamento proibido.
                </p>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
