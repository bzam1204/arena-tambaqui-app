import { useState } from 'react';
import { Search, User, Filter } from 'lucide-react';

export interface SearchPlayer {
  id: string;
  name: string;
  nickname: string;
  avatar?: string;
  reputation: number;
  elogios: number;
  denuncias: number;
}

interface SearchPageProps {
  players: SearchPlayer[];
  onPlayerSelect: (playerId: string) => void;
}

export function SearchPage({ players, onPlayerSelect }: SearchPageProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Filter players
  const filteredPlayers = players.filter(player => 
    player.nickname.toLowerCase().includes(searchTerm.toLowerCase()) ||
    player.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Pagination
  const totalPages = Math.ceil(filteredPlayers.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedPlayers = filteredPlayers.slice(startIndex, startIndex + itemsPerPage);

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
            setSearchTerm(e.target.value);
            setCurrentPage(1);
          }}
          placeholder="Buscar operador por nome ou nickname..."
          className="w-full bg-[#141A26] border border-[#2D3A52] rounded-lg pl-12 pr-4 py-3 text-[#E6F1FF] font-mono-technical focus:border-[#00F0FF] focus:outline-none transition-colors"
        />
      </div>

      {/* Filter Hint */}
      <div className="flex items-center gap-2 text-xs text-[#7F94B0] font-mono-technical">
        <Filter className="w-3 h-3" />
        <span>{filteredPlayers.length} operador(es) encontrado(s)</span>
      </div>

      {/* Player List */}
      <div className="space-y-3">
        {paginatedPlayers.map((player) => {
          const reputationColor = getReputationColor(player.reputation);
          
          return (
            <button
              key={player.id}
              onClick={() => onPlayerSelect(player.id)}
              className="w-full bg-[#141A26] border border-[#2D3A52] rounded-lg p-4 hover:border-[#00F0FF]/50 transition-all"
            >
              <div className="flex items-center gap-4">
                {/* Avatar */}
                <div className="relative">
                  <div className={`w-14 h-14 ${reputationColor.replace('text-', 'bg-')} clip-hexagon p-[2px]`}>
                    <div className="w-full h-full bg-[#0B0E14] clip-hexagon flex items-center justify-center">
                      {player.avatar ? (
                        <img 
                          src={player.avatar} 
                          alt={player.nickname} 
                          className="w-full h-full object-cover clip-hexagon"
                        />
                      ) : (
                        <User className="w-7 h-7 text-[#7F94B0]" />
                      )}
                    </div>
                  </div>
                </div>

                {/* Player Info */}
                <div className="flex-1 text-left">
                  <div className="text-base text-[#E6F1FF] mb-1">{player.nickname}</div>
                  <div className="text-xs text-[#7F94B0] font-mono-technical mb-2">{player.name}</div>
                  
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
      {filteredPlayers.length === 0 && (
        <div className="bg-[#141A26] rounded-lg border border-[#2D3A52] p-8 text-center">
          <p className="text-[#7F94B0]">Nenhum operador encontrado</p>
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 pt-4">
          <button
            onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
            disabled={currentPage === 1}
            className="px-4 py-2 bg-[#141A26] border border-[#2D3A52] rounded text-[#00F0FF] font-mono-technical text-sm disabled:opacity-30 disabled:cursor-not-allowed hover:border-[#00F0FF] transition-colors"
          >
            {'<'}
          </button>
          
          <span className="text-sm font-mono-technical text-[#7F94B0]">
            {currentPage} / {totalPages}
          </span>
          
          <button
            onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
            disabled={currentPage === totalPages}
            className="px-4 py-2 bg-[#141A26] border border-[#2D3A52] rounded text-[#00F0FF] font-mono-technical text-sm disabled:opacity-30 disabled:cursor-not-allowed hover:border-[#00F0FF] transition-colors"
          >
            {'>'}
          </button>
        </div>
      )}
    </div>
  );
}
