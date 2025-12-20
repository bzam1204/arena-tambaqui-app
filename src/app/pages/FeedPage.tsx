import { Suspense, lazy, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus } from 'lucide-react';
import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { MobileFeedCard } from '@/components/MobileFeedCard';
import { Spinner } from '@/components/Spinner';
import { QueryErrorCard } from '@/components/QueryErrorCard';
import { useSession } from '@/app/context/session-context';
import type { FeedGateway } from '@/app/gateways/FeedGateway';
import type { MatchGateway } from '@/app/gateways/MatchGateway';
import type { TransmissionGateway } from '@/app/gateways/TransmissionGateway';
import { Inject, TkFeedGateway, TkMatchGateway, TkTransmissionGateway } from '@/infra/container';

const TransmissionModal = lazy(() =>
  import('@/components/TransmissionModal').then((m) => ({ default: m.TransmissionModal })),
);

type Props = {
  isLoggedIn: boolean;
};

export function FeedPage({ isLoggedIn }: Props) {
  const feedGateway = Inject<FeedGateway>(TkFeedGateway);
  const txGateway = Inject<TransmissionGateway>(TkTransmissionGateway);
  const matchGateway = Inject<MatchGateway>(TkMatchGateway);
  const { state } = useSession();
  const queryClient = useQueryClient();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [playerSearchInput, setPlayerSearchInput] = useState('');
  const [modalPage, setModalPage] = useState(1);
  const [editingEntry, setEditingEntry] = useState<FeedEntry | null>(null);
  const [prefillLoading, setPrefillLoading] = useState(false);
  const navigate = useNavigate();
  const sentinelRef = useRef<HTMLDivElement | null>(null);
  const minSearchChars = 0;
  const modalPageSize = 20;

  const {
    data: feedPages,
    isLoading: feedLoading,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isError: feedIsError,
    error: feedError,
    refetch: refetchFeed,
  } = useInfiniteQuery({
    queryKey: ['feed'],
    queryFn: ({ pageParam = 0 }) => feedGateway.listFeedPage({ page: pageParam, pageSize: 20 }),
    getNextPageParam: (lastPage, allPages) => (lastPage.length < 20 ? undefined : allPages.length),
  });

  const feed = feedPages?.pages.flatMap((p) => p) ?? [];

  const closeModal = () => {
    setIsModalOpen(false);
    setPlayerSearchInput('');
    setModalPage(1);
    setEditingEntry(null);
    setPrefillLoading(false);
  };

  const createTransmission = useMutation({
    mutationFn: async (data: { targetId: string; type: 'report' | 'praise'; content: string; matchId?: string | null }) => {
      if (!state.userId) {
        navigate('/auth');
        return;
      }
      if (!state.playerId) {
        navigate('/onboarding');
        return;
      }
      if (!data.matchId) {
        throw new Error('Selecione uma partida válida.');
      }
      if (data.targetId === state.playerId) {
        throw new Error('Não é possível denunciar a si mesmo.');
      }
      await txGateway.createTransmission({
        targetId: data.targetId,
        type: data.type,
        content: data.content,
        submitterId: state.playerId,
        matchId: data.matchId,
      });
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['feed'] });
      await queryClient.invalidateQueries({ queryKey: ['players'] });
    },
  });

  const { data: eligibleMatches, isLoading: eligibleMatchesLoading } = useQuery({
    queryKey: ['matches', 'eligible', state.playerId],
    queryFn: () => matchGateway.listEligibleMatchesForTransmission({ playerId: state.playerId as string }),
    enabled: isModalOpen && Boolean(state.playerId) && !editingEntry,
  });
  const adminRetractAny = useMutation({
    mutationFn: (entryId: string) => feedGateway.adminRetract(entryId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['feed'] }),
  });
  const adminRemove = useMutation({
    mutationFn: (entryId: string) => feedGateway.adminRemove(entryId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['feed'] }),
  });
  const adminEdit = useMutation({
    mutationFn: (payload: { id: string; content: string }) => feedGateway.adminEdit(payload.id, payload.content),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['feed'] }),
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

  if (feedIsError) {
    return (
      <div className="p-6">
        <QueryErrorCard
          message={(feedError as Error)?.message || 'Falha ao carregar feed.'}
          action={
            <button
              className="px-4 py-2 bg-[#00F0FF]/10 border-2 border-[#00F0FF] rounded-lg text-[#00F0FF] font-mono-technical text-xs uppercase hover:bg-[#00F0FF]/20 transition-all"
              onClick={() => void refetchFeed()}
            >
              [ TENTAR NOVAMENTE ]
            </button>
          }
        />
      </div>
    );
  }

  return (
    <div className="space-y-0">
      <div className="px-4 pb-6 space-y-4">
        <h2 className="text-sm font-mono-technical tracking-wider uppercase text-[#7F94B0] mb-4">
          Registro Global
        </h2>
        {feedLoading ? (
          <Spinner label="carregando feed" />
        ) : (
          feed.map((entry) => (
            <MobileFeedCard
              key={entry.id}
              entry={entry}
              onTargetClick={handleTargetClick}
              isAdmin={state.isAdmin}
              onRetract={(id) =>
                adminRetractAny.mutate(id, {
                  onSuccess: async () => {
                    await queryClient.invalidateQueries({ queryKey: ['feed'] });
                  },
                })
              }
              onRemove={(id) =>
                adminRemove.mutate(id, {
                  onSuccess: async () => {
                    await queryClient.invalidateQueries({ queryKey: ['feed'] });
                  },
                })
              }
              onEdit={(entry) => {
                setPrefillLoading(true);
                setEditingEntry(entry);
                setIsModalOpen(true);
                setTimeout(() => setPrefillLoading(false), 150);
              }}
            />
          ))
        )}
      </div>

      <button
        onClick={() => {
          if (!isLoggedIn || !state.playerId) {
            navigate(state.userId ? '/onboarding' : '/auth');
            return;
          }
          closeModal();
          setIsModalOpen(true);
        }}
        className="fixed bottom-24 right-6 w-14 h-14 bg-[#D4A536] rounded-full flex items-center justify-center shadow-[0_0_20px_rgba(212,165,54,0.6)] hover:shadow-[0_0_30px_rgba(212,165,54,0.8)] transition-all z-40 hover:scale-110"
      >
        <Plus className="w-6 h-6 text-[#0B0E14]" />
      </button>

      {isModalOpen ? (
        <Suspense fallback={<Spinner label="carregando interface" />}>
          <TransmissionModal
            isOpen={isModalOpen}
            onClose={() => {
              closeModal();
            }}
            players={[]}
            preSelectedPlayerId={null}
            submitterId={state.playerId ?? undefined}
            onSubmit={(data) => {
              if (editingEntry) {
                adminEdit.mutate(
                  { id: editingEntry.id, content: data.content },
                  {
                    onSuccess: closeModal,
                  },
                );
              } else {
                createTransmission.mutate(data, {
                  onSuccess: closeModal,
                });
              }
            }}
            submitting={editingEntry ? adminEdit.isPending : createTransmission.isPending}
            searchTerm={playerSearchInput}
            onSearchTermChange={(term) => {
              setPlayerSearchInput(term);
              setModalPage(1);
            }}
            isLoading={false}
            minChars={minSearchChars}
            page={modalPage}
            pageSize={modalPageSize}
            total={0}
            onPageChange={setModalPage}
            lockedTargetId={editingEntry?.targetId ?? undefined}
            lockedTarget={
              editingEntry
                ? {
                    id: editingEntry.targetId,
                    name: editingEntry.targetName,
                    nickname: editingEntry.targetName,
                    avatar: editingEntry.targetAvatar,
                  }
                : undefined
            }
            lockedType={editingEntry?.type ?? undefined}
            initialContent={editingEntry?.content ?? undefined}
            prefillLoading={prefillLoading}
            eligibleMatches={eligibleMatches ?? []}
            eligibleMatchesLoading={eligibleMatchesLoading}
            requireMatch={!editingEntry}
          />
        </Suspense>
      ) : null}
      <div ref={sentinelRef} />
      {isFetchingNextPage && <Spinner label="carregando mais" />}
      {!hasNextPage && feed.length > 0 && (
        <div className="py-4 text-center text-xs text-[#7F94B0] font-mono-technical">[ fim do mural ]</div>
      )}
    </div>
  );
}
