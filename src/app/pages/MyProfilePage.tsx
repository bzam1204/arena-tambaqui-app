import { useEffect, useState } from 'react';
import { MobilePlayerProfile } from '@/components/MobilePlayerProfile';
import type { Player, PlayerGateway } from '@/app/gateways/PlayerGateway';
import type { ProfileGateway } from '@/app/gateways/ProfileGateway';
import { Inject, TkPlayerGateway, TkProfileGateway } from '@/infra/container';

type Props = {
  userId: string;
  playerId: string;
};

export function MyProfilePage({ userId, playerId }: Props) {
  const playerGateway = Inject<PlayerGateway>(TkPlayerGateway);
  const profileGateway = Inject<ProfileGateway>(TkProfileGateway);
  const [player, setPlayer] = useState<Player | null>(null);

  useEffect(() => {
    playerGateway.getPlayer(playerId).then(setPlayer);
  }, [playerId]);

  if (!player) return null;
  return (
    <MobilePlayerProfile
      player={player}
      onTargetClick={() => {}}
      isOwnProfile
      onProfileUpdate={(data) => {
        profileGateway.updateProfile(userId, data);
      }}
    />
  );
}
