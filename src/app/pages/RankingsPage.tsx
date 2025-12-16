import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { RankingSection } from '@/components/RankingSection';
import { Spinner } from '@/components/Spinner';
import type { PlayerGateway, Player } from '@/app/gateways/PlayerGateway';
import { Inject, TkPlayerGateway } from '@/infra/container';

export function RankingsPage() {
  const playerGateway = Inject<PlayerGateway>(TkPlayerGateway);
  const navigate = useNavigate();
  const { data: players = [], isLoading } = useQuery<Player[]>({
    queryKey: ['players'],
    queryFn: () => playerGateway.listPlayers(),
  });
  if (isLoading) return <Spinner fullScreen label="carregando ranking" />;
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
