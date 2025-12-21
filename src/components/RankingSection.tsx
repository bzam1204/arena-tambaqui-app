import { User } from 'lucide-react';

export interface RankingPlayer {
  id: string;
  name: string;
  nickname: string;
  avatar?: string;
  elogios: number;
  denuncias: number;
}

interface RankingSectionProps {
  players: RankingPlayer[];
  variant: 'prestige' | 'shame';
  onPlayerClick: (playerId: string) => void;
  highlightId?: string | null;
}

export function RankingSection({ players, variant, onPlayerClick, highlightId }: RankingSectionProps) {
  const badgeColor = variant === 'prestige' ? 'bg-[#00F0FF]' : 'bg-[#D4A536]';
  const countColor = variant === 'prestige' ? 'text-[#00F0FF]' : 'text-[#D4A536]';
  return (
    <div className="bg-[#141A26] rounded-lg border border-[#2D3A52] p-4 mb-6">
      <div className="space-y-2">
        {players.map((player, index) => {
          const borderColor = index === 0 ? 'border-[#D4A536]' : index === 1 ? 'border-[#7F94B0]' : index === 2 ? 'border-[#B87333]' : 'border-[#2D3A52]'
          const rankColor = index === 0 ? 'text-[#D4A536]' : index === 1 ? 'text-[#7F94B0]' : index === 2 ? 'text-[#B87333]' : 'text-[#4A5568]';
          const isHighlighted = highlightId === player.id;

          return (
            <button
              key={player.id}
              id={`ranking-player-${player.id}`}
              onClick={() => onPlayerClick(player.id)}
              className={`w-full clip-tactical-card bg-[#0B0E14] border-x-2 ${borderColor} p-3 hover:border-[#00F0FF]/50 transition-all flex items-center gap-3 ${
                isHighlighted ? 'ring-2 ring-[#00F0FF]/70 shadow-[0_0_18px_rgba(0,240,255,0.35)]' : ''
              }`}
            >
              {/* Rank Number */}
              <div className={`font-mono-technical text-lg w-8 ${rankColor}`}>
                #{index + 1}
              </div>

              {/* Avatar */}
              <div className="relative">
                <div className={`w-10 h-11 ${badgeColor} clip-hexagon-perfect p-[2px]`}>
                  <div className="w-full h-full bg-[#0B0E14] clip-hexagon-perfect flex items-center justify-center">
                    {player.avatar ? (
                      <img
                        src={player.avatar}
                        alt={player.nickname}
                        className="w-full h-full object-cover clip-hexagon-perfect"
                      />
                    ) : (
                      <User className="w-5 h-5 text-[#7F94B0]" />
                    )}
                  </div>
                </div>
              </div>

              {/* Player Info */}
              <div className="flex-1 text-left">
                <div className="text-sm text-[#E6F1FF]">{player.nickname}</div>
                <div className="text-xs text-[#7F94B0] font-mono-technical">{player.name}</div>
              </div>

              {/* Count */}
              <div className={`font-mono-technical text-xl ${countColor}`}>
                {player.elogios.toString().padStart(2, '0')}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
