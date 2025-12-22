import { Search, User, Filter } from 'lucide-react';
import { PlayerAvatar } from './PlayerAvatar';

export interface SearchPlayer {
  id: string;
  name: string;
  nickname: string;
  avatar?: string;
  avatarFrame?: string | null;
  motto?: string | null;
  reputation: number;
  elogios: number;
  denuncias: number;
}

interface SearchPageProps {
  players: SearchPlayer[];
  searchTerm: string;
  onSearchTermChange: (term: string) => void;
  isLoading?: boolean;
  minChars?: number;
  page: number;
  pageSize: number;
  total: number;
  onPageChange: (page: number) => void;
  onPlayerSelect: (playerId: string) => void;
}

export function SearchPage({
  players,
  searchTerm,
  onSearchTermChange,
  isLoading,
  minChars = 0,
  page,
  pageSize,
  total,
  onPageChange,
  onPlayerSelect,
}: SearchPageProps) {
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const canSearch = searchTerm.trim().length >= minChars;

  const getReputationColor = (reputation: number) => {
    if (reputation >= 8) return 'text-[#00F0FF]';
    if (reputation >= 4) return 'text-[#D4A536]';
    return 'text-[#FF6B00]';
  };

  return (
    <div className="px-4 py-6 space-y-4">
      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#7F94B0]" />
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => {
            onSearchTermChange(e.target.value);
          }}
          placeholder="Buscar operador por nome ou nickname..."
          className="w-full bg-[#141A26] border border-[#2D3A52] rounded-lg pl-12 pr-4 py-3 text-[#E6F1FF] font-mono-technical focus:border-[#00F0FF] focus:outline-none transition-colors"
        />
      </div>

      {/* Filter Hint */}
      <div className="flex items-center gap-2 text-xs text-[#7F94B0] font-mono-technical">
        <Filter className="w-3 h-3" />
        <span>
          {canSearch ? `${total} operador(es) encontrado(s)` : `Digite ao menos ${minChars} caracteres`}
        </span>
      </div>

      {isLoading ? (
        <div className="text-center text-sm text-[#7F94B0] font-mono-technical">Buscando operadores...</div>
      ) : (
        <>
          {/* Player List */}
          <div className="space-y-3">
            {players.map((player) => {
              const reputationColor = getReputationColor(player.reputation);
              
              return (
                <button
                  key={player.id}
                  onClick={() => onPlayerSelect(player.id)}
                  className="w-full clip-tactical-card bg-[#141A26] border-x-3 border-[#2D3A52] p-4 hover:border-[#00F0FF]/50 transition-all"
                >
                  <div className="flex items-center gap-4">
                    {/* Avatar */}
                    <PlayerAvatar
                      avatarUrl={player.avatar}
                      frameUrl={player.avatarFrame}
                      alt={player.nickname}
                      wrapperClassName="w-22 h-24"
                      sizeClassName="w-full h-full"
                      accentClassName={reputationColor.replace('text-', 'bg-')}
                      paddingClassName="p-[2px]"
                      fallbackIcon={<User className="w-7 h-7 text-[#7F94B0]" />}
                    />

                    {/* Player Info */}
                    <div className="flex-1 text-left">
                      <div className="text-sm text-[#E6F1FF] mb-1 uppercase">{player.nickname}</div>
                      <div className="text-xs text-[#7F94B0] font-mono-technical mb-1">{player.name}</div>
                      <div
                        className="text-[10px] text-[#7F94B0] font-mono-technical mb-2 min-h-[14px] glitch-text text-justify"
                        data-text={player.motto ? `"${player.motto}"` : ''}
                      >
                        {player.motto ? `"${player.motto}"` : ''}
                      </div>
                      
                      {/* Stats */}
                      <div className="flex items-center gap-3">
                        <div className="flex items-center gap-1">
                          <span className="text-xs font-mono-technical text-[#00F0FF]">{player.elogios}</span>
                          <span className="text-xs text-[#7F94B0]">elogios</span>
                        </div>
                        <span className="text-[#7F94B0]">•</span>
                        <div className="flex items-center gap-1">
                          <span className="text-xs font-mono-technical text-[#D4A536]">{player.denuncias}</span>
                          <span className="text-xs text-[#7F94B0]">denúncias</span>
                        </div>
                      </div>
                    </div>

                    {/* Reputation Badge */}
                    <div className={`font-mono-technical text-sm ${reputationColor}`}>
                      {player.reputation}/10
                    </div>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Empty State */}
          {players.length === 0 && (
            <div className="bg-[#141A26] rounded-lg border border-[#2D3A52] p-8 text-center">
              <p className="text-[#7F94B0]">Nenhum operador encontrado</p>
            </div>
          )}
        </>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 pt-4">
          <button
            onClick={() => onPageChange(Math.max(1, page - 1))}
            disabled={page === 1}
            className="px-4 py-2 bg-[#141A26] border border-[#2D3A52] rounded text-[#00F0FF] font-mono-technical text-sm disabled:opacity-30 disabled:cursor-not-allowed hover:border-[#00F0FF] transition-colors"
          >
            {'<'}
          </button>
          
          <span className="text-sm font-mono-technical text-[#7F94B0]">
            {page} / {totalPages}
          </span>
          
          <button
            onClick={() => onPageChange(Math.min(totalPages, page + 1))}
            disabled={page === totalPages}
            className="px-4 py-2 bg-[#141A26] border border-[#2D3A52] rounded text-[#00F0FF] font-mono-technical text-sm disabled:opacity-30 disabled:cursor-not-allowed hover:border-[#00F0FF] transition-colors"
          >
            {'>'}
          </button>
        </div>
      )}
    </div>
  );
}
