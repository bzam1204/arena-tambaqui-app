import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { SearchPage } from '@/components/SearchPage';
import { Spinner } from '@/components/Spinner';
import { QueryErrorCard } from '@/components/QueryErrorCard';
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

  const { data, isFetching, isError, error, refetch } = useQuery({
    queryKey: ['players-search', debouncedTerm, page],
    queryFn: () => playerGateway.searchPlayersPaged({ term: debouncedTerm, page: page - 1, pageSize }),
  });

  const players = data?.players ?? [];
  const total = data?.total ?? 0;

  if (isError) {
    return (
      <div className="p-6">
        <QueryErrorCard
          message={(error as Error)?.message || 'Falha ao buscar operadores.'}
          action={
            <button
              className="px-4 py-2 bg-[#00F0FF]/10 border-2 border-[#00F0FF] rounded-lg text-[#00F0FF] font-mono-technical text-xs uppercase hover:bg-[#00F0FF]/20 transition-all"
              onClick={() => void refetch()}
            >
              [ TENTAR NOVAMENTE ]
            </button>
          }
        />
      </div>
    );
  }

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
          motto: p.motto ?? null,
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
