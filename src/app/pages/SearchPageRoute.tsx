import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { SearchPage } from '@/components/SearchPage';
import type { PlayerGateway, Player } from '@/app/gateways/PlayerGateway';
import { Inject, TkPlayerGateway } from '@/infra/container';

export function SearchPageRoute() {
  const playerGateway = Inject<PlayerGateway>(TkPlayerGateway);
  const [players, setPlayers] = useState<Player[]>([]);
  const navigate = useNavigate();
  useEffect(() => {
    playerGateway.listPlayers().then(setPlayers);
  }, [playerGateway]);
  return (
    <SearchPage
      players={players.map((p) => ({
        id: p.id,
        name: p.name,
        nickname: p.nickname,
        avatar: p.avatar,
        reputation: p.reputation,
        elogios: p.elogios,
        denuncias: p.denuncias,
      }))}
      onPlayerSelect={(id) => navigate(`/player/${id}`)}
    />
  );
}
