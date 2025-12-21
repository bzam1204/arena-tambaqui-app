import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { MobilePlayerProfile } from '@/components/MobilePlayerProfile';
import { Spinner } from '@/components/Spinner';
import type { Player, PlayerGateway, FeedEntry } from '@/app/gateways/PlayerGateway';
import type { ProfileGateway } from '@/app/gateways/ProfileGateway';
import type { FeedGateway } from '@/app/gateways/FeedGateway';
import { Inject, TkPlayerGateway, TkProfileGateway, TkFeedGateway } from '@/infra/container';
import { QueryErrorCard } from '@/components/QueryErrorCard';

type Props = {
  userId: string;
  playerId: string;
};

export function MyProfilePage({ userId, playerId }: Props) {
  const playerGateway = Inject<PlayerGateway>(TkPlayerGateway);
  const profileGateway = Inject<ProfileGateway>(TkProfileGateway);
  const feedGateway = Inject<FeedGateway>(TkFeedGateway);
  const queryClient = useQueryClient();
  const [retractingId, setRetractingId] = useState<string | null>(null);
  const navigate = useNavigate();

  const {
    data: player,
    error: playerError,
    isError: playerIsError,
    refetch: refetchPlayer,
  } = useQuery({
    queryKey: ['player', playerId],
    queryFn: () => playerGateway.getPlayer(playerId),
    enabled: Boolean(playerId),
  });

  const {
    data: history = [],
    error: historyError,
    isError: historyIsError,
    refetch: refetchHistory,
  } = useQuery<FeedEntry[]>({
    queryKey: ['feed', 'submitter', playerId],
    queryFn: () => feedGateway.listBySubmitter(playerId),
    enabled: Boolean(playerId),
  });

  const {
    data: ranks,
    error: ranksError,
    isError: ranksIsError,
    refetch: refetchRanks,
  } = useQuery({
    queryKey: ['player', 'rank', playerId],
    queryFn: () => playerGateway.getPlayerRank(playerId),
    enabled: Boolean(playerId),
  });
  const retractMutation = useMutation({
    mutationFn: (entryId: string) => feedGateway.retract(entryId, playerId),
    onMutate: (entryId) => setRetractingId(entryId),
    onSettled: async () => {
      setRetractingId(null);
      await queryClient.invalidateQueries({ queryKey: ['feed', 'submitter', playerId] });
      await queryClient.invalidateQueries({ queryKey: ['player', playerId] });
      await queryClient.invalidateQueries({ queryKey: ['players'] });
    },
  });

  const updateProfile = useMutation({
    mutationFn: (data: { name: string; nickname: string; avatar?: File | string | null }) =>
      profileGateway.updateProfile(userId, data),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['player', playerId] });
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

  if (!player) return <Spinner fullScreen label="carregando perfil" />;
  if (!player) return null;
  return (
    <MobilePlayerProfile
      player={{ ...player, history, rankPrestige: ranks?.prestige ?? null, rankShame: ranks?.shame ?? null }}
      onTargetClick={(targetId) => {
        if (targetId === playerId) return;
        navigate(`/player/${targetId}`);
      }}
      onRankClick={(kind) => {
        const slug = kind === 'prestige' ? 'prestigio' : 'vergonha';
        const rank = kind === 'prestige' ? ranks?.prestige : ranks?.shame;
        const params = new URLSearchParams();
        params.set('focus', playerId);
        if (rank && rank > 0) params.set('rank', String(rank));
        const query = params.toString();
        navigate(`/mural/rankings/${slug}${query ? `?${query}` : ''}`);
      }}
      isOwnProfile
      onProfileUpdate={(data) => updateProfile.mutateAsync(data)}
      isSaving={updateProfile.isPending}
      onRetract={(id) => retractMutation.mutate(id)}
      isRetracting={retractMutation.isPending}
      retractingId={retractingId}
    />
  );
}
