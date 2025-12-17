import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { SearchPage } from '@/components/SearchPage';
import { Spinner } from '@/components/Spinner';
import type { PlayerGateway } from '@/app/gateways/PlayerGateway';
import { Inject, TkPlayerGateway } from '@/infra/container';
import { useSession } from '@/app/context/session-context';

export function SearchPageRoute() {
  const playerGateway = Inject<PlayerGateway>(TkPlayerGateway);
  const navigate = useNavigate();
  const { state } = useSession();
  const pageSize = 10;
  const minChars = 0;
  const [searchTermInput, setSearchTermInput] = useState('');
  const [debouncedTerm, setDebouncedTerm] = useState('');
  const [page, setPage] = useState(1);

  useEffect(() => {
    const id = setTimeout(() => setDebouncedTerm(searchTermInput), 1300);
    return () => clearTimeout(id);
  }, [searchTermInput]);

  const { data, isFetching } = useQuery({
    queryKey: ['players-search', debouncedTerm, page],
    queryFn: () => playerGateway.searchPlayersPaged({ term: debouncedTerm, page: page - 1, pageSize }),
  });

  const players = data?.players ?? [];
  const total = data?.total ?? 0;

  if (!data && isFetching) return <Spinner label="carregando busca" />;
  return (
    <SearchPage
      players={players
        .filter((p) => p.id !== state.playerId)
        .map((p) => ({
          id: p.id,
          name: p.name,
          nickname: p.nickname,
          avatar: p.avatar,
          reputation: p.reputation,
          elogios: p.elogios,
          denuncias: p.denuncias,
        }))}
      searchTerm={searchTermInput}
      onSearchTermChange={(term) => {
        setSearchTermInput(term);
        setPage(1);
      }}
      isLoading={isFetching}
      minChars={minChars}
      page={page}
      pageSize={pageSize}
      total={total}
      onPageChange={setPage}
      onPlayerSelect={(id) => navigate(`/player/${id}`)}
    />
  );
}
