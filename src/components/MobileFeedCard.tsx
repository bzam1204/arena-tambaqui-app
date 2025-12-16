import { User, AlertTriangle, Award } from 'lucide-react';

export interface FeedEntry {
  id: string;
  type: 'report' | 'praise';
  targetId: string;
  targetName: string;
  targetAvatar?: string;
  content: string;
  date: string;
  time: string;
  isRetracted?: boolean;
}

interface MobileFeedCardProps {
  entry: FeedEntry;
  onTargetClick: (targetId: string) => void;
}

export function MobileFeedCard({ entry, onTargetClick }: MobileFeedCardProps) {
  const isCyan = entry.type === 'praise';
  const borderColor = isCyan ? 'border-l-[#00F0FF]' : 'border-l-[#D4A536]';
  const accentColor = isCyan ? 'text-[#00F0FF]' : 'text-[#D4A536]';
  const bgGlow = isCyan ? 'bg-[#00F0FF]/5' : 'bg-[#D4A536]/5';

  return (
    <div
      className={`relative bg-[#141A26] border-l-4 ${borderColor} ${bgGlow} rounded-r-lg overflow-hidden ${
        entry.isRetracted ? 'opacity-50' : ''
      }`}
    >
      {entry.isRetracted && (
        <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
          <div
            className={`px-3 py-2 rotate-[-8deg] border bg-[#0B0E14]/85 font-mono-technical text-xs uppercase tracking-wide shadow-[0_0_10px_rgba(0,0,0,0.4)] ${
              entry.type === 'report'
                ? 'border-[#D4A536]/70 text-[#D4A536]'
                : 'border-[#00F0FF]/70 text-[#00F0FF]'
            }`}
          >
            [ DENÚNCIA RETRATADA / ANULADA ]
          </div>
        </div>
      )}
      {/* Header - Type */}
      <div className={`px-4 py-2 ${isCyan ? 'bg-[#00F0FF]/10' : 'bg-[#D4A536]/10'} flex items-center justify-between`}>
        <div className="flex items-center gap-2">
          {entry.type === 'report' ? (
            <>
              <AlertTriangle className={`w-4 h-4 ${accentColor}`} />
              <span className={`text-sm uppercase tracking-wide ${accentColor} font-mono-technical`}>
                Denúncia
              </span>
            </>
          ) : (
            <>
              <Award className={`w-4 h-4 ${accentColor}`} />
              <span className={`text-sm uppercase tracking-wide ${accentColor} font-mono-technical`}>
                Elogio
              </span>
            </>
          )}
        </div>
        <span className="text-xs text-[#7F94B0] font-mono-technical">Agente Anônimo</span>
      </div>

      {/* Content */}
      <div className="p-4">
        {/* Target */}
        <div 
          className="flex items-center gap-3 mb-3 cursor-pointer group"
          onClick={() => onTargetClick(entry.targetId)}
        >
          <div className={`w-12 h-12 ${isCyan ? 'bg-[#00F0FF]' : 'bg-[#D4A536]'} clip-hexagon p-[2px] transition-all group-hover:scale-105`}>
            <div className="w-full h-full bg-[#0B0E14] clip-hexagon flex items-center justify-center">
              {entry.targetAvatar ? (
                <img 
                  src={entry.targetAvatar} 
                  alt={entry.targetName} 
                  className="w-full h-full object-cover clip-hexagon"
                />
              ) : (
                <User className="w-6 h-6 text-[#7F94B0]" />
              )}
            </div>
          </div>
          <div>
            <p className="text-xs text-[#7F94B0] font-mono-technical uppercase mb-1">Alvo:</p>
            <p className="group-hover:text-[#00F0FF] transition-colors">{entry.targetName}</p>
          </div>
        </div>

        {/* Description */}
        <p className={`text-sm text-[#E6F1FF] mb-3 ${entry.isRetracted ? 'line-through opacity-50' : ''}`}>
          {entry.content}
        </p>

        {/* Footer */}
        <div className="flex items-center gap-2 text-xs text-[#7F94B0] font-mono-technical">
          <span>DATA: {entry.date}</span>
          <span>//</span>
          <span>HORA: {entry.time}</span>
        </div>
      </div>
    </div>
  );
}
