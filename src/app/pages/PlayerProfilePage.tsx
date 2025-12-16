import { useQuery } from '@tanstack/react-query';
import { useParams } from 'react-router-dom';
import { MobilePlayerProfile } from '@/components/MobilePlayerProfile';
import type { Player, PlayerGateway, FeedEntry } from '@/app/gateways/PlayerGateway';
import type { FeedGateway } from '@/app/gateways/FeedGateway';
import { Inject, TkPlayerGateway, TkFeedGateway } from '@/infra/container';

export function PlayerProfilePage() {
  const playerGateway = Inject<PlayerGateway>(TkPlayerGateway);
  const feedGateway = Inject<FeedGateway>(TkFeedGateway);
  const { id } = useParams();
  const { data: player } = useQuery({
    queryKey: ['player', id],
    queryFn: () => (id ? playerGateway.getPlayer(id) : Promise.resolve(null)),
    enabled: Boolean(id),
  });

  const { data: history = [] } = useQuery<FeedEntry[]>({
    queryKey: ['feed', 'target', id],
    queryFn: () => (id ? feedGateway.listByTarget(id) : Promise.resolve([])),
    enabled: Boolean(id),
  });

  if (!player) return null;
  return <MobilePlayerProfile player={{ ...player, history }} onTargetClick={() => {}} />;
}
