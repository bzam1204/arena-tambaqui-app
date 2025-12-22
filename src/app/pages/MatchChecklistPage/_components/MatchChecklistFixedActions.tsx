import { ChevronUp } from 'lucide-react';
import { TacticalButton } from '@/components/TacticalButton';

type MatchChecklistFixedActionsProps = {
  isOpen: boolean;
  onToggleOpen: () => void;
  showEditAction: boolean;
  showSubscribeAction: boolean;
  showCancelSubscription: boolean;
  showAdminActions: boolean;
  isLocked: boolean;
  isFinalized: boolean;
  deletePending: boolean;
  finalizePending: boolean;
  cancelPending: boolean;
  onEdit: () => void;
  onSubscribe: () => void;
  onCancelSubscription: () => void;
  onDelete: () => void;
  onFinalize: () => void;
};

export function MatchChecklistFixedActions({
  isOpen,
  onToggleOpen,
  showEditAction,
  showSubscribeAction,
  showCancelSubscription,
  showAdminActions,
  isLocked,
  isFinalized,
  deletePending,
  finalizePending,
  cancelPending,
  onEdit,
  onSubscribe,
  onCancelSubscription,
  onDelete,
  onFinalize,
}: MatchChecklistFixedActionsProps) {
  const hasActions = showEditAction || showSubscribeAction || showCancelSubscription || showAdminActions;
  if (!hasActions) return null;

  return (
    <div
      className="fixed bottom-14 left-0 right-0 px-4 z-40 transition-transform duration-300 ease-out"
      style={{ transform: isOpen ? 'translateY(0)' : 'translateY(calc(100% - 52px))' }}
    >
      <div className="flex justify-center">
        <button
          type="button"
          onClick={onToggleOpen}
          className={`h-10 clip-tactical-card border-x-3 border-[#2D3A52] bg-[#0B0E14]/90 backdrop-blur-md px-4 text-[10px] font-mono-technical uppercase text-[#7F94B0] hover:text-[#00F0FF] hover:border-[#00F0FF]/50 transition-all ${
            isOpen
              ? 'bg-[#D4A536]/20 border border-[#D4A536] text-[#D4A536] shadow-[0_0_10px_rgba(212,165,54,0.3)] hover:bg-[#D4A536]/30 hover:shadow-[0_0_20px_rgba(212,165,54,0.6)]'
              : ''
          }`}
          aria-expanded={isOpen}
        >
          <span className="inline-flex items-center gap-2">
            <ChevronUp className={`w-3 h-3 transition-transform duration-300 ${isOpen ? '' : 'rotate-180'}`} />
            {isOpen ? 'Ocultar ações' : 'Mostrar ações'}
          </span>
        </button>
      </div>
      <div className="mt-2 bg-[#0B0E14]/90 backdrop-blur-md border-t border-[#2D3A52] pt-4 pb-6 space-y-3">
          {(showEditAction || showSubscribeAction || showCancelSubscription) ? (
            <div className="space-y-2">
              {showSubscribeAction ? (
                <TacticalButton variant="amber" fullWidth onClick={onSubscribe}>
                  [ PARTICIPAR ]
                </TacticalButton>
              ) : null}
              {showEditAction ? (
                <TacticalButton variant="cyan" fullWidth onClick={onEdit}>
                  [ EDITAR PARTIDA ]
                </TacticalButton>
              ) : null}
              {showCancelSubscription ? (
                <TacticalButton variant="cyan" fullWidth disabled={cancelPending} onClick={onCancelSubscription}>
                  [ CANCELAR INSCRICAO ]
                </TacticalButton>
              ) : null}
            </div>
          ) : null}

          {showAdminActions ? (
            <div className="space-y-2">
              <TacticalButton variant="cyan" fullWidth disabled={deletePending} onClick={onDelete}>
                {deletePending ? '[ CANCELANDO... ]' : '[ CANCELAR PARTIDA ]'}
              </TacticalButton>
              <TacticalButton
                variant="amber"
                fullWidth
                disabled={!isLocked || isFinalized || finalizePending}
                onClick={onFinalize}
              >
                {finalizePending ? '[ PROCESSANDO... ]' : '[ FINALIZAR PARTIDA E PROCESSAR ]'}
              </TacticalButton>
              <p className="text-[10px] text-[#D4A536] font-mono-technical text-center">
                // ATENCAO: Ação irreversivel. Penalidades por ausência serão aplicadas automaticamente após confirmação.
              </p>
            </div>
          ) : null}
      </div>
    </div>
  );
}
