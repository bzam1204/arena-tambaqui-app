import { useEffect, useRef, useState } from 'react';
import { User, AlertTriangle, Award, MoreHorizontal } from 'lucide-react';

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
  isAdmin?: boolean;
  onRetract?: (id: string) => void;
  onRemove?: (id: string) => void;
  onEdit?: (id: string) => void;
}

export function MobileFeedCard({ entry, onTargetClick, isAdmin, onRetract, onRemove, onEdit }: MobileFeedCardProps) {
  const [expanded, setExpanded] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    if (!menuOpen) return;
    const handle = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handle);
    return () => document.removeEventListener('mousedown', handle);
  }, [menuOpen]);
  const isCyan = entry.type === 'praise';
  const borderColor = isCyan ? 'border-[#00F0FF]' : 'border-[#D4A536]';
  const accentColor = isCyan ? 'text-[#00F0FF]' : 'text-[#D4A536]';
  const bgGlow = isCyan ? 'bg-[#00F0FF]/5' : 'bg-[#D4A536]/5';
  const isLong = entry.content.length > 200;
  const displayedContent = expanded || !isLong ? entry.content : `${entry.content.slice(0, 200)}…`;

  return (
    <>
    {isAdmin ? (
        <div className="clear-both mt-3 flex items-center gap-2 text-xs font-mono-technical  p-3">
          <div className="flex items-center gap-2">
            <button
              onClick={() => onEdit?.(entry.id)}
              className="px-2 py-1 rounded bg-[#141A26] border border-[#2D3A52] text-[#E6F1FF] hover:border-[#00F0FF] transition-colors"
            >
              Editar
            </button>
            {!entry.isRetracted && (
              <button
                onClick={() => onRetract?.(entry.id)}
                className="px-2 py-1 rounded bg-[#D4A536]/15 border border-[#D4A536] text-[#D4A536] hover:bg-[#D4A536]/25 transition-colors"
              >
                Retratar
              </button>
            )}
            <button
              onClick={() => onRemove?.(entry.id)}
              className="px-2 py-1 rounded bg-[#FF6B00]/15 border border-[#FF6B00] text-[#FF6B00] hover:bg-[#FF6B00]/25 transition-colors"
            >
              Remover
            </button>
          </div>
        </div>

      ) : null}
      <div className={`clip-tactical-card relative z-30 bg-[#141A26] border-x-4  overflow-hidden ${borderColor} ${bgGlow} ${entry.isRetracted ? 'opacity-75' : ''}`}>
        {entry.isRetracted && (
          <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
            <div
              className={`px-3 py-2 rotate-[-8deg] z-50 border bg-[#0B0E14]/85 font-mono-technical text-xs uppercase tracking-wide shadow-[0_0_10px_rgba(0,0,0,0.4)] ${entry.type === 'report'
                ? 'border-[#D4A536]/70 text-[#D4A536]'
                : 'border-[#00F0FF]/70 text-[#00F0FF]'
                }`}
            >
              [ DENÚNCIA RETRATADA / ANULADA ]
            </div>
          </div>
        )}
        {/* Header - Type */}
      <div className={`px-4 py-2 ${isCyan ? 'bg-[#00F0FF]/10' : 'bg-[#D4A536]/10'} flex items-center justify-between relative`}>
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
        <div className="flex items-center gap-5">
          <span className="text-xs text-[#7F94B0] font-mono-technical">Agente Anônimo</span>
          {isAdmin ? (
            <div className="relative w-6 h-6" ref={menuRef}>
              <button
                onClick={() => setMenuOpen((p) => !p)}
                className='hover:bg-[#0B0E14]/60 text-[#7F94B0]'
              >
                <MoreHorizontal className={`w-6 h-6 ${isCyan ? 'text-[#00F0FF]' : 'text-[#D4A536]'}`} />
              </button>
              {menuOpen ? (
                <div className="absolute right-0 mt-2 w-36 bg-[#0B0E14] border border-[#2D3A52] rounded shadow-lg z-50">
                  <button
                    onClick={() => {
                      setMenuOpen(false);
                      onEdit?.(entry.id);
                    }}
                    className="w-full text-left px-3 py-2 text-xs text-[#E6F1FF] hover:bg-[#141A26]"
                  >
                    Editar
                  </button>
                  {!entry.isRetracted ? (
                    <button
                      onClick={() => {
                        setMenuOpen(false);
                        if (window.confirm('Confirmar retratação desta transmissão?')) onRetract?.(entry.id);
                      }}
                      className="w-full text-left px-3 py-2 text-xs text-[#D4A536] hover:bg-[#141A26]"
                    >
                      Retratar
                    </button>
                  ) : null}
                  <button
                    onClick={() => {
                      setMenuOpen(false);
                      if (window.confirm('Remover definitivamente esta transmissão?')) onRemove?.(entry.id);
                    }}
                    className="w-full text-left px-3 py-2 text-xs text-[#FF6B00] hover:bg-[#141A26]"
                  >
                    Remover
                  </button>
                </div>
              ) : null}
            </div>
          ) : null}
        </div>
      </div>

        {/* Content */}
        <div className="p-4">
          <div className="relative">
            {/* Target */}
            <div
              className="float-left mr-4 mb-3 cursor-pointer group"
              onClick={() => onTargetClick(entry.targetId)}
            >
              <div className={`w-20 h-22 ${isCyan ? 'bg-[#00F0FF]' : 'bg-[#D4A536]'} clip-hexagon-perfect p-[3px] transition-all group-hover:scale-105`}>
                <div className="w-full h-full bg-[#0B0E14] clip-hexagon-perfect flex items-center justify-center">
                  {entry.targetAvatar ? (
                    <img
                      src={entry.targetAvatar}
                      alt={entry.targetName}
                      className="w-full h-full object-cover clip-hexagon-perfect"
                    />
                  ) : (
                    <User className="w-6 h-6 text-[#7F94B0]" />
                  )}
                </div>
              </div>
            </div>

            {/* Text flows around avatar */}
            <div className="space-y-2">
              <div className="flex items-center gap-2 cursor-pointer group" onClick={() => onTargetClick(entry.targetId)}>
                <p className="text-xs text-[#7F94B0] font-mono-technical uppercase">Alvo:</p>
                <p className="group-hover:text-[#00F0FF] transition-colors text-xs break-words uppercase">{entry.targetName}</p>
              </div>
              <p className={`text-sm text-[#E6F1FF] ${entry.isRetracted ? 'line-through opacity-50' : ''}`}>
                {displayedContent}
              </p>
              {isLong && (
                <button
                  className={`text-xs font-semibold underline-offset-2 hover:underline transition-colors ${isCyan ? 'text-[#00F0FF]' : 'text-[#D4A536]'}`}
                  onClick={() => setExpanded((prev) => !prev)}
                >
                  {expanded ? 'Ler menos' : 'Ler mais'}
                </button>
              )}
            </div>

          </div>
        </div>
        {/* Footer */}
        <div className={`clear-both mt-3 flex items-center gap-2 text-xs font-mono-technical border-t  p-3 ${isCyan ? ' border-[#00F0FF]/40' : ' border-[#D4A536]/40'}`}>
          <span>DATA: {entry.date}</span>
          <span>//</span>
          <span>HORA: {entry.time}</span>
        </div>
      </div>
    </>
  );
}
