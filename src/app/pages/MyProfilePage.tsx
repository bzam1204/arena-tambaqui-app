import { useEffect, useState } from 'react';
import { MobilePlayerProfile } from '@/components/MobilePlayerProfile';
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
  const [player, setPlayer] = useState<Player | null>(null);
  const [history, setHistory] = useState<FeedEntry[]>([]);

  useEffect(() => {
    const load = async () => {
      const [p, feed] = await Promise.all([playerGateway.getPlayer(playerId), feedGateway.listBySubmitter(playerId)]);
      if (p) {
        setPlayer({ ...p, history: feed });
        setHistory(feed);
      }
    };
    load();
  }, [playerId]);

  const handleRetract = async (entryId: string) => {
    await feedGateway.retract(entryId, playerId);
    const [updatedPlayer, updatedFeed] = await Promise.all([
      playerGateway.getPlayer(playerId),
      feedGateway.listBySubmitter(playerId),
    ]);
    if (updatedPlayer) {
      setPlayer({ ...updatedPlayer, history: updatedFeed });
    }
    setHistory(updatedFeed);
  };

  if (!player) return null;
  return (
    <MobilePlayerProfile
      player={{ ...player, history }}
      onTargetClick={() => {}}
      isOwnProfile
      onProfileUpdate={(data) => {
        profileGateway.updateProfile(userId, data);
      }}
      onRetract={handleRetract}
    />
  );
}
