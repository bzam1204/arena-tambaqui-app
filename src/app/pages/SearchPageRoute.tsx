import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { SearchPage } from '@/components/SearchPage';
import { Spinner } from '@/components/Spinner';
import type { PlayerGateway, Player } from '@/app/gateways/PlayerGateway';
import { Inject, TkPlayerGateway } from '@/infra/container';

export function SearchPageRoute() {
  const playerGateway = Inject<PlayerGateway>(TkPlayerGateway);
  const navigate = useNavigate();
  const { data: players = [], isLoading } = useQuery<Player[]>({
    queryKey: ['players'],
    queryFn: () => playerGateway.listPlayers(),
  });
  if (isLoading) return <Spinner fullScreen label="carregando busca" />;
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
