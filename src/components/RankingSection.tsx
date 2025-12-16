import { useState } from 'react';
import { Trophy, Skull, User } from 'lucide-react';

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
  onPlayerClick: (playerId: string) => void;
}

export function RankingSection({ players, onPlayerClick }: RankingSectionProps) {
  const [activeTab, setActiveTab] = useState<'prestige' | 'shame'>('prestige');

  // Sort players by elogios (prestige) or denuncias (shame)
  const sortedPlayers = [...players].sort((a, b) => {
    if (activeTab === 'prestige') {
      return b.elogios - a.elogios;
    } else {
      return b.denuncias - a.denuncias;
    }
  });

  // Take top 10
  const topPlayers = sortedPlayers.slice(0, 10);

  return (
    <div className="bg-[#141A26] rounded-lg border border-[#2D3A52] p-4 mb-6">
      {/* Title */}
      <h2 className="text-lg font-mono-technical tracking-wider uppercase text-center mb-4 text-[#E6F1FF]">
        [ RANKING ]
      </h2>

      {/* Tabs */}
      <div className="grid grid-cols-2 gap-2 mb-4">
        <button
          onClick={() => setActiveTab('prestige')}
          className={`clip-tactical p-3 border-2 transition-all rounded-lg ${
            activeTab === 'prestige'
              ? 'border-[#00F0FF] bg-[#00F0FF]/20'
              : 'border-[#2D3A52] bg-[#0B0E14] hover:border-[#00F0FF]/50'
          }`}
        >
          <div className="flex items-center justify-center gap-2">
            <Trophy className={`w-4 h-4 ${activeTab === 'prestige' ? 'text-[#00F0FF]' : 'text-[#7F94B0]'}`} />
            <span className={`font-mono-technical text-xs uppercase ${activeTab === 'prestige' ? 'text-[#00F0FF]' : 'text-[#7F94B0]'}`}>
              Prestígio
            </span>
          </div>
        </button>

        <button
          onClick={() => setActiveTab('shame')}
          className={`clip-tactical p-3 border-2 transition-all rounded-lg ${
            activeTab === 'shame'
              ? 'border-[#D4A536] bg-[#D4A536]/20'
              : 'border-[#2D3A52] bg-[#0B0E14] hover:border-[#D4A536]/50'
          }`}
        >
          <div className="flex items-center justify-center gap-2">
            <Skull className={`w-4 h-4 ${activeTab === 'shame' ? 'text-[#D4A536]' : 'text-[#7F94B0]'}`} />
            <span className={`font-mono-technical text-xs uppercase ${activeTab === 'shame' ? 'text-[#D4A536]' : 'text-[#7F94B0]'}`}>
              Vergonha
            </span>
          </div>
        </button>
      </div>

      {/* Player List */}
      <div className="space-y-2">
        {topPlayers.map((player, index) => {
          const count = activeTab === 'prestige' ? player.elogios : player.denuncias;
          const rankColor = index === 0 ? 'text-[#D4A536]' : index === 1 ? 'text-[#7F94B0]' : index === 2 ? 'text-[#B87333]' : 'text-[#4A5568]';
          
          return (
            <button
              key={player.id}
              onClick={() => onPlayerClick(player.id)}
              className="w-full bg-[#0B0E14] border border-[#2D3A52] rounded-lg p-3 hover:border-[#00F0FF]/50 transition-all flex items-center gap-3"
            >
              {/* Rank Number */}
              <div className={`font-mono-technical text-lg w-8 ${rankColor}`}>
                #{index + 1}
              </div>

              {/* Avatar */}
              <div className="relative">
                <div className={`w-10 h-10 ${activeTab === 'prestige' ? 'bg-[#00F0FF]' : 'bg-[#D4A536]'} clip-hexagon p-[2px]`}>
                  <div className="w-full h-full bg-[#0B0E14] clip-hexagon flex items-center justify-center">
                    {player.avatar ? (
                      <img 
                        src={player.avatar} 
                        alt={player.nickname} 
                        className="w-full h-full object-cover clip-hexagon"
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
              <div className={`font-mono-technical text-xl ${activeTab === 'prestige' ? 'text-[#00F0FF]' : 'text-[#D4A536]'}`}>
                {count.toString().padStart(2, '0')}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
