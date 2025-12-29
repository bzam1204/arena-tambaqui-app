import { Check, Minus, Users, X } from 'lucide-react';
import type { MatchAttendanceEntry } from '@/app/gateways/MatchGateway';
import { TacticalButton } from '@/components/TacticalButton';
import { PlayerAvatar } from '@/components/PlayerAvatar';
import { VipBadge } from '@/components/VipBadge';

type MatchChecklistAttendanceListProps = {
  entries: MatchAttendanceEntry[];
  localAttendance: Record<string, boolean>;
  localPayments: Record<string, boolean>;
  isAdmin: boolean;
  isFinalized: boolean;
  canEdit: boolean;
  canEditPayment: boolean;
  onToggle: (entry: MatchAttendanceEntry) => void;
  onTogglePayment: (entry: MatchAttendanceEntry) => void;
  onRemove: (entry: MatchAttendanceEntry) => void;
  onPlayerClick: (playerId: string) => void;
};

export function MatchChecklistAttendanceList({
  entries,
  localAttendance,
  localPayments,
  isAdmin,
  isFinalized,
  canEdit,
  canEditPayment,
  onToggle,
  onTogglePayment,
  onRemove,
  onPlayerClick,
}: MatchChecklistAttendanceListProps) {
  if (entries.length === 0) {
    return (
      <div className="bg-[#141A26] border border-[#2D3A52] rounded-lg p-6 text-center text-xs text-[#7F94B0]">
        Nenhum inscrito para esta partida.
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {entries.map((entry) => {
        const displayState = isAdmin
          ? (localAttendance[entry.playerId] ?? (entry.marked ? entry.attended : true))
          : (entry.marked ? entry.attended : null);
        const isPresent = displayState === true;
        const isAbsent = displayState === false;
        const isPending = displayState === null;
        const paymentState = isAdmin
          ? (localPayments[entry.playerId] ?? (entry.paymentMarked ? entry.paid : null))
          : null;
        const isPaid = paymentState === true;
        const isUnpaid = paymentState === false;
        const isPaymentPending = paymentState === null;
        const rentalLabel = entry.rentEquipment ? 'ALUGUEL' : 'EQUIPAMENTO PRÓPRIO';
        const rentalClass = entry.rentEquipment
          ? 'border-[#00F0FF]/50 text-[#00F0FF] bg-[#00F0FF]/10'
          : 'border-[#2D3A52] text-[#7F94B0] bg-[#0B0E14]';

        return (
          <div
            key={entry.playerId}
            role="button"
            tabIndex={0}
            onClick={() => onPlayerClick(entry.playerId)}
            onKeyDown={(event) => {
              if (event.key === 'Enter' || event.key === ' ') {
                event.preventDefault();
                onPlayerClick(entry.playerId);
              }
            }}
            className="clip-tactical-card bg-[#141A26] border-x-4 border-[#2D3A52] p-4 flex flex-col gap-3 cursor-pointer group"
          >
            <div className="flex items-start gap-4">
              <PlayerAvatar
                avatarUrl={entry.playerAvatar}
                frameUrl={entry.playerAvatarFrame}
                alt={entry.playerNickname}
                sizeClassName="w-16 h-18"
                accentClassName="bg-[#00F0FF]"
                paddingClassName="p-[2px]"
                fallbackIcon={<Users className="w-4 h-4 text-[#7F94B0]" />}
              />
              <div className="flex-1">
                <div className="flex flex-col flex-wrap items-start justify-start gap-2 mb-3">
                  <div className="flex flex-wrap items-center gap-2 text-sm text-[#E6F1FF] uppercase group-hover:text-[#00F0FF]">
                    <span>{entry.playerNickname}</span>
                    {entry.playerIsVip ? <VipBadge size="xs" /> : null}
                  </div>
                  <div className="text-xs text-[#7F94B0] font-mono-technical">{entry.playerName}</div>
                  <span className={`px-2 py-0.5 text-[9px] font-mono-technical uppercase border rounded-full ${rentalClass}`}>
                    {rentalLabel}
                  </span>
                </div>
              </div>
            </div>
            <hr className="mb-1! border-[#2D3A52]" />

            <div className="flex flex-wrap items-center justify-end gap-3">
              {isAdmin && !isFinalized ? (
                <TacticalButton
                  variant="cyan"
                  className="px-3! py-1! h-10 text-[10px] border-[#FF3B3B]! text-[#FF3B3B]! bg-[#FF3B3B]/10! hover:bg-[#FF3B3B]/20! hover:shadow-[0_0_20px_rgba(255,59,59,0.6)]!"
                  onClick={(event) => {
                    event.stopPropagation();
                    onRemove(entry);
                  }}
                >
                  [ - REMOVER ]
                </TacticalButton>
              ) : null}
              <div className="flex flex-wrap items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={(event) => {
                    event.stopPropagation();
                    onToggle(entry);
                  }}
                  className="flex items-center gap-2"
                  disabled={!canEdit}
                >
                  <span
                    className={`text-[10px] font-mono-technical uppercase ${
                      isPresent
                        ? 'text-[#00F0FF]'
                        : isAbsent
                          ? 'text-[#FF3B3B]'
                          : 'text-[#7F94B0]'
                    }`}
                  >
                    [ {isPresent ? 'PRESENTE' : isPending ? 'PENDENTE' : 'AUSENTE'} ]
                  </span>
                  <span
                    className={`relative w-20 h-10 clip-tactical-sm border transition-all ${
                      isPresent
                        ? 'border-[#00F0FF] bg-[#00F0FF]/15 shadow-[0_0_15px_rgba(0,240,255,0.4)]'
                        : isAbsent
                          ? 'border-[#FF3B3B] bg-[#FF3B3B]/10 shadow-[0_0_15px_rgba(255,59,59,0.45)]'
                          : 'border-[#2D3A52] bg-[#0F1729]'
                    }`}
                  >
                    <span
                      className={`absolute top-[3px] left-[6px] w-8 h-8 clip-tactical-sm flex items-center justify-center transition-all ${
                        isPresent
                          ? 'bg-[#00F0FF] text-[#0B0E14] translate-x-9'
                          : isAbsent
                            ? 'bg-[#FF3B3B] text-[#0B0E14]'
                            : 'bg-[#1F2937] text-[#7F94B0]'
                      }`}
                    >
                      {isPresent ? <Check className="w-4 h-4" /> : isPending ? <Minus className="w-4 h-4" /> : <X className="w-4 h-4" />}
                    </span>
                  </span>
                </button>
                {isAdmin ? (
                  <button
                    type="button"
                    onClick={(event) => {
                      event.stopPropagation();
                      onTogglePayment(entry);
                    }}
                    className="flex items-center gap-2"
                    disabled={!canEditPayment}
                  >
                    <span
                      className={`text-[10px] font-mono-technical uppercase ${
                        isPaid
                          ? 'text-[#2EEB77]'
                          : isUnpaid
                            ? 'text-[#FF3B3B]'
                            : 'text-[#7F94B0]'
                      }`}
                    >
                      [ {isPaid ? 'PAGO' : isPaymentPending ? 'PENDENTE' : 'NAO PAGO'} ]
                    </span>
                    <span
                      className={`relative w-20 h-10 clip-tactical-sm border transition-all ${
                        isPaid
                          ? 'border-[#2EEB77] bg-[#2EEB77]/15 shadow-[0_0_15px_rgba(46,235,119,0.4)]'
                          : isUnpaid
                            ? 'border-[#FF3B3B] bg-[#FF3B3B]/10 shadow-[0_0_15px_rgba(255,59,59,0.45)]'
                            : 'border-[#2D3A52] bg-[#0F1729]'
                      }`}
                    >
                      <span
                        className={`absolute top-[3px] left-[6px] w-8 h-8 clip-tactical-sm flex items-center justify-center transition-all ${
                          isPaid
                            ? 'bg-[#2EEB77] text-[#0B0E14] translate-x-9'
                            : isUnpaid
                              ? 'bg-[#FF3B3B] text-[#0B0E14]'
                              : 'bg-[#1F2937] text-[#7F94B0]'
                        }`}
                      >
                        {isPaid ? <Check className="w-4 h-4" /> : isPaymentPending ? <Minus className="w-4 h-4" /> : <X className="w-4 h-4" />}
                      </span>
                    </span>
                  </button>
                ) : null}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
