import { useRef, useState } from 'react';
import { User, AlertTriangle, Award, MoreHorizontal } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { TacticalButton } from './TacticalButton';

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
  onEdit?: (entry: FeedEntry) => void;
}

export function MobileFeedCard({ entry, onTargetClick, isAdmin, onRetract, onRemove, onEdit }: MobileFeedCardProps) {
  const [expanded, setExpanded] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [confirmAction, setConfirmAction] = useState<'retract' | 'remove' | null>(null);
  const menuRef = useRef<HTMLDivElement | null>(null);
  const isCyan = entry.type === 'praise';
  const borderColor = isCyan ? 'border-[#00F0FF]' : 'border-[#D4A536]';
  const accentColor = isCyan ? 'text-[#00F0FF]' : 'text-[#D4A536]';
  const bgGlow = isCyan ? 'bg-[#00F0FF]/5' : 'bg-[#D4A536]/5';
  const isLong = entry.content.length > 200;
  const displayedContent = expanded || !isLong ? entry.content : `${entry.content.slice(0, 200)}…`;

  return (
    <>
      <div
        className={`clip-tactical-card relative z-30 bg-[#141A26] border-x-4 overflow-hidden ${borderColor} ${bgGlow} ${entry.isRetracted ? 'opacity-75' : ''}`}
        role="button"
        tabIndex={0}
        onClick={() => onTargetClick(entry.targetId)}
        onKeyDown={(event) => {
          if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault();
            onTargetClick(entry.targetId);
          }
        }}
      >
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
              <Popover open={menuOpen} onOpenChange={setMenuOpen}>
                <PopoverTrigger asChild>
                  <button
                    className="hover:bg-[#0B0E14]/60 text-[#7F94B0] rounded p-1"
                    onClick={(event) => event.stopPropagation()}
                  >
                    <MoreHorizontal className={`w-6 h-6 ${isCyan ? 'text-[#00F0FF]' : 'text-[#D4A536]'}`} />
                  </button>
                </PopoverTrigger>
                <PopoverContent
                  className="w-40 bg-[#0B0E14] border border-[#2D3A52] shadow-[0_10px_30px_rgba(0,0,0,0.5)] rounded-md p-1"
                  align="end"
                >
                  <div ref={menuRef} className="flex flex-col gap-1">
                    {!entry.isRetracted ? (
                      <button
                        onClick={(event) => {
                          event.stopPropagation();
                          setMenuOpen(false);
                          onEdit?.(entry);
                        }}
                        className="w-full text-left px-3 py-2 text-xs text-[#E6F1FF] hover:bg-[#141A26] rounded"
                      >
                        Editar
                      </button>
                    ) : null}
                    {!entry.isRetracted ? (
                      <button
                        onClick={(event) => {
                          event.stopPropagation();
                          setMenuOpen(false);
                          setConfirmAction('retract');
                        }}
                        className="w-full text-left px-3 py-2 text-xs text-[#D4A536] hover:bg-[#141A26] rounded"
                      >
                        Retratar
                      </button>
                    ) : null}
                    <button
                      onClick={(event) => {
                        event.stopPropagation();
                        setMenuOpen(false);
                        setConfirmAction('remove');
                      }}
                      className="w-full text-left px-3 py-2 text-xs text-[#FF6B00] hover:bg-[#141A26] rounded"
                    >
                      Remover
                    </button>
                  </div>
                </PopoverContent>
              </Popover>
            ) : null}
          </div>
        </div>

        <div className="p-4">
          <div className="relative">
            <div
              className="float-left mr-4 mb-3 cursor-pointer group"
              onClick={(event) => {
                event.stopPropagation();
                onTargetClick(entry.targetId);
              }}
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

            <div className="space-y-2">
              <div
                className="flex items-center gap-2 cursor-pointer group"
                onClick={(event) => {
                  event.stopPropagation();
                  onTargetClick(entry.targetId);
                }}
              >
                <p className="text-xs text-[#7F94B0] font-mono-technical uppercase">Alvo:</p>
                <p className="group-hover:text-[#00F0FF] transition-colors text-xs wrap-break-word uppercase">{entry.targetName}</p>
              </div>
              <p className={`text-sm text-[#E6F1FF] ${entry.isRetracted ? 'line-through opacity-50' : ''}`}>
                {displayedContent}
              </p>
              {isLong && (
                <button
                  className={`text-xs font-semibold underline-offset-2 hover:underline transition-colors ${isCyan ? 'text-[#00F0FF]' : 'text-[#D4A536]'}`}
                  onClick={(event) => {
                    event.stopPropagation();
                    setExpanded((prev) => !prev);
                  }}
                >
                  {expanded ? 'Ler menos' : 'Ler mais'}
                </button>
              )}
            </div>
          </div>
        </div>

        <div className={`clear-both mt-3 flex items-center gap-2 text-xs font-mono-technical border-t p-3 ${isCyan ? ' border-[#00F0FF]/40' : ' border-[#D4A536]/40'}`}>
          <span>DATA: {entry.date}</span>
          <span>//</span>
          <span>HORA: {entry.time}</span>
        </div>
      </div>

      <Dialog open={Boolean(confirmAction)} onOpenChange={(open) => !open && setConfirmAction(null)}>
        <DialogContent className="bg-[#0B0E14] border border-[#2D3A52]">
          <DialogHeader>
            <DialogTitle className="text-[#E6F1FF] font-mono-technical uppercase">
              {confirmAction === 'retract' ? 'Retratar transmissão?' : 'Remover transmissão?'}
            </DialogTitle>
            <DialogDescription className="text-[#7F94B0]">
              Essa ação é irreversível. Confirme para continuar.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex justify-end gap-3">
            <TacticalButton variant="cyan" onClick={() => setConfirmAction(null)}>
              Cancelar
            </TacticalButton>
            <TacticalButton
              variant="amber"
              onClick={() => {
                if (confirmAction === 'retract') onRetract?.(entry.id);
                if (confirmAction === 'remove') onRemove?.(entry.id);
                setConfirmAction(null);
              }}
            >
              Confirmar
            </TacticalButton>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
