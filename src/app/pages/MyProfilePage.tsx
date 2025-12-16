import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { MobilePlayerProfile } from '@/components/MobilePlayerProfile';
import { Spinner } from '@/components/Spinner';
import type { Player, PlayerGateway, FeedEntry } from '@/app/gateways/PlayerGateway';
import type { ProfileGateway } from '@/app/gateways/ProfileGateway';
import type { FeedGateway } from '@/app/gateways/FeedGateway';
import { Inject, TkPlayerGateway, TkProfileGateway, TkFeedGateway } from '@/infra/container';

type Props = {
  userId: string;
  playerId: string;
};

export function MyProfilePage({ userId, playerId }: Props) {
  const playerGateway = Inject<PlayerGateway>(TkPlayerGateway);
  const profileGateway = Inject<ProfileGateway>(TkProfileGateway);
  const feedGateway = Inject<FeedGateway>(TkFeedGateway);
  const queryClient = useQueryClient();

  const { data: player } = useQuery({
    queryKey: ['player', playerId],
    queryFn: () => playerGateway.getPlayer(playerId),
    enabled: Boolean(playerId),
  });

  const { data: history = [] } = useQuery<FeedEntry[]>({
    queryKey: ['feed', 'submitter', playerId],
    queryFn: () => feedGateway.listBySubmitter(playerId),
    enabled: Boolean(playerId),
  });

  const retractMutation = useMutation({
    mutationFn: (entryId: string) => feedGateway.retract(entryId, playerId),
    onSuccess: async () => {
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

  if (!player) return <Spinner fullScreen label="carregando perfil" />;
  if (!player) return null;
  return (
    <MobilePlayerProfile
      player={{ ...player, history }}
      onTargetClick={() => {}}
      isOwnProfile
      onProfileUpdate={(data) => updateProfile.mutate(data)}
      onRetract={(id) => retractMutation.mutate(id)}
    />
  );
}
