import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { RankingSection } from '@/components/RankingSection';
import type { PlayerGateway, Player } from '@/app/gateways/PlayerGateway';
import { Inject, TkPlayerGateway } from '@/infra/container';

export function RankingsPage() {
  const playerGateway = Inject<PlayerGateway>(TkPlayerGateway);
  const [players, setPlayers] = useState<Player[]>([]);
  const navigate = useNavigate();
  useEffect(() => {
    playerGateway.listPlayers().then(setPlayers);
  }, [playerGateway]);
  return (
    <div className="px-4 pb-6">
      <RankingSection
        players={players.map((p) => ({
          id: p.id,
          name: p.name,
          nickname: p.nickname,
          avatar: p.avatar,
          elogios: p.elogios,
          denuncias: p.denuncias,
        }))}
        onPlayerClick={(id) => navigate(`/player/${id}`)}
      />
    </div>
  );
}
