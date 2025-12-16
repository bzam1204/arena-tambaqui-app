import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { MobilePlayerProfile } from '@/components/MobilePlayerProfile';
import type { Player, PlayerGateway } from '@/app/gateways/PlayerGateway';
import { Inject, TkPlayerGateway } from '@/infra/container';

export function PlayerProfilePage() {
  const playerGateway = Inject<PlayerGateway>(TkPlayerGateway);
  const { id } = useParams();
  const [player, setPlayer] = useState<Player | null>(null);
  useEffect(() => {
    if (id) {
      playerGateway.getPlayer(id).then(setPlayer);
    }
  }, [id]);
  if (!player) return null;
  return <MobilePlayerProfile player={player} onTargetClick={() => {}} />;
}
