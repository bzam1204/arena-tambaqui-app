import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { MobilePlayerProfile } from '@/components/MobilePlayerProfile';
import type { Player, PlayerGateway, FeedEntry } from '@/app/gateways/PlayerGateway';
import type { FeedGateway } from '@/app/gateways/FeedGateway';
import { Inject, TkPlayerGateway, TkFeedGateway } from '@/infra/container';

export function PlayerProfilePage() {
  const playerGateway = Inject<PlayerGateway>(TkPlayerGateway);
  const feedGateway = Inject<FeedGateway>(TkFeedGateway);
  const { id } = useParams();
  const [player, setPlayer] = useState<Player | null>(null);
  const [history, setHistory] = useState<FeedEntry[]>([]);

  useEffect(() => {
    if (!id) return;
    const load = async () => {
      const [p, feed] = await Promise.all([playerGateway.getPlayer(id), feedGateway.listByTarget(id)]);
      if (p) {
        setPlayer({ ...p, history: feed });
        setHistory(feed);
      }
    };
    load();
  }, [id]);

  if (!player) return null;
  return <MobilePlayerProfile player={{ ...player, history }} onTargetClick={() => {}} />;
}
