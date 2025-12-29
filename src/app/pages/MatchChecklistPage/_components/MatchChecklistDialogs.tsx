import { CalendarDays, Clock, Shield } from 'lucide-react';
import type { MatchAttendanceEntry } from '@/app/gateways/MatchGateway';
import { TacticalButton } from '@/components/TacticalButton';
import { Checkbox } from '@/components/ui/checkbox';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

type BaseDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

type FinalizeMatchDialogProps = BaseDialogProps & {
  onConfirm: () => void;
  isPending: boolean;
};

export function FinalizeMatchDialog({ open, onOpenChange, onConfirm, isPending }: FinalizeMatchDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-[#0B0E14] border border-[#2D3A52]">
        <DialogHeader>
          <DialogTitle className="text-[#E6F1FF] font-mono-technical uppercase">
            Confirmar finalizacao?
          </DialogTitle>
          <DialogDescription className="text-[#7F94B0]">
            Isso aplicara penalidades aos ausentes e nao pode ser desfeito.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <TacticalButton variant="cyan" onClick={() => onOpenChange(false)}>
            Cancelar
          </TacticalButton>
          <TacticalButton variant="amber" onClick={onConfirm} disabled={isPending}>
            {isPending ? '[ PROCESSANDO... ]' : '[ CONFIRMAR ]'}
          </TacticalButton>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

type SubscribeMatchDialogProps = BaseDialogProps & {
  matchName: string;
  dateLabel: string;
  timeLabel: string;
  rentEquipment: boolean;
  onRentEquipmentChange: (next: boolean) => void;
  benefits?: string[];
  actionError?: string | null;
  isPending: boolean;
  onConfirm: () => void;
};

export function SubscribeMatchDialog({
  open,
  onOpenChange,
  matchName,
  dateLabel,
  timeLabel,
  rentEquipment,
  onRentEquipmentChange,
  benefits = [],
  actionError,
  isPending,
  onConfirm,
}: SubscribeMatchDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-[#0B0E14] border border-[#2D3A52]">
        <DialogHeader>
          <DialogTitle className="text-[#E6F1FF] font-mono-technical uppercase">[ Confirmar Participação ]</DialogTitle>
          <DialogDescription className="text-[#7F94B0]">
            Escolha o aluguel e avance para o pagamento.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="bg-[#141A26] border border-[#2D3A52] rounded-lg p-3 space-y-2">
            <div className="text-sm text-[#E6F1FF] uppercase">{matchName}</div>
            <div className="text-xs text-[#7F94B0] font-mono-technical">
              DATA: {dateLabel} // HORA: {timeLabel}
            </div>
          </div>
          <div
            role="button"
            tabIndex={0}
            aria-pressed={rentEquipment}
            onClick={() => onRentEquipmentChange(!rentEquipment)}
            onKeyDown={(event) => {
              if (event.key === 'Enter' || event.key === ' ') {
                event.preventDefault();
                onRentEquipmentChange(!rentEquipment);
              }
            }}
            className={`w-full cursor-pointer clip-tactical-card border-x-4 p-3 text-left transition-all ${
              rentEquipment
                ? 'border-[#00F0FF] bg-[#00F0FF]/10 shadow-[0_0_18px_rgba(0,240,255,0.35)]'
                : 'border-[#2D3A52] bg-[#141A26] hover:border-[#00F0FF]/40'
            }`}
          >
            <div className="flex items-center gap-3">
              <div
                className={`w-10 h-10 rounded-md border flex items-center justify-center ${
                  rentEquipment
                    ? 'border-[#00F0FF] bg-[#00F0FF]/20 text-[#00F0FF]'
                    : 'border-[#2D3A52] bg-[#0B0E14] text-[#7F94B0]'
                }`}
              >
                <Shield className="w-4 h-4" />
              </div>
              <div className="flex-1">
                <div className="text-xs text-[#E6F1FF] font-mono-technical uppercase">Aluguel de equipamento</div>
                <div className="text-[10px] text-[#7F94B0] font-mono-technical">
                  Precisa do kit do campo para jogar?
                </div>
              </div>
              <Checkbox checked={rentEquipment} className="pointer-events-none" />
            </div>
          </div>
          {benefits.length > 0 ? (
            <div className="bg-[#0F1E2B] border border-[#00F0FF] text-[#00F0FF] text-[10px] font-mono-technical uppercase rounded-lg p-3 space-y-1">
              {benefits.map((benefit) => (
                <div key={benefit}>{benefit}</div>
              ))}
            </div>
          ) : null}
          {actionError ? (
            <div className="text-xs text-[#FF6B00] font-mono-technical">{actionError}</div>
          ) : null}
        </div>

        <DialogFooter>
          <TacticalButton variant="cyan" onClick={() => onOpenChange(false)}>
            Cancelar
          </TacticalButton>
          <TacticalButton
            variant="amber"
            className="px-3! py4! text-[14px]"
            onClick={onConfirm}
            disabled={isPending}
            leftIcon={
              isPending ? (
                <span className="inline-block w-4 h-4 border-2 border-current border-t-transparent border-l-transparent rounded-full animate-spin" />
              ) : undefined
            }
          >
            {isPending ? '[ PROCESSANDO... ]' : '[ CONTINUAR PARA PAGAMENTO ]'}
          </TacticalButton>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

type CancelSubscriptionDialogProps = BaseDialogProps & {
  matchName: string;
  dateLabel: string;
  timeLabel: string;
  actionError?: string | null;
  isPending: boolean;
  onConfirm: () => void;
};

export function CancelSubscriptionDialog({
  open,
  onOpenChange,
  matchName,
  dateLabel,
  timeLabel,
  actionError,
  isPending,
  onConfirm,
}: CancelSubscriptionDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-[#0B0E14] border border-[#2D3A52]">
        <DialogHeader>
          <DialogTitle className="text-[#E6F1FF] font-mono-technical uppercase">[ Cancelar Inscricao ]</DialogTitle>
          <DialogDescription className="text-[#7F94B0]">
            Confirme o cancelamento da sua participação.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="bg-[#141A26] border border-[#2D3A52] rounded-lg p-3 space-y-2">
            <div className="text-sm text-[#E6F1FF] uppercase">{matchName}</div>
            <div className="text-xs text-[#7F94B0] font-mono-technical">
              DATA: {dateLabel} // HORA: {timeLabel}
            </div>
          </div>
          {actionError ? (
            <div className="text-xs text-[#FF6B00] font-mono-technical">{actionError}</div>
          ) : null}
        </div>
        <DialogFooter>
          <TacticalButton variant="cyan" onClick={() => onOpenChange(false)}>
            Manter inscrição
          </TacticalButton>
          <TacticalButton
            variant="amber"
            onClick={onConfirm}
            disabled={isPending}
            leftIcon={
              isPending ? (
                <span className="inline-block w-4 h-4 border-2 border-current border-t-transparent border-l-transparent rounded-full animate-spin" />
              ) : undefined
            }
          >
            {isPending ? '[ CANCELANDO... ]' : '[ CONFIRMAR CANCELAMENTO ]'}
          </TacticalButton>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

type EditMatchDialogProps = BaseDialogProps & {
  editName: string;
  onEditNameChange: (value: string) => void;
  editDate: Date | null;
  onEditDateChange: (next: Date | null) => void;
  editTime: string;
  onEditTimeChange: (value: string) => void;
  timeOptions: string[];
  actionError?: string | null;
  isPending: boolean;
  onConfirm: () => void;
};

export function EditMatchDialog({
  open,
  onOpenChange,
  editName,
  onEditNameChange,
  editDate,
  onEditDateChange,
  editTime,
  onEditTimeChange,
  timeOptions,
  actionError,
  isPending,
  onConfirm,
}: EditMatchDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-[#0B0E14] border border-[#2D3A52]">
        <DialogHeader>
          <DialogTitle className="text-[#E6F1FF] font-mono-technical uppercase">[ Editar Partida ]</DialogTitle>
          <DialogDescription className="text-[#7F94B0]">
            Atualize o nome e o horário da partida.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <label className="block text-xs text-[#7F94B0] font-mono-technical uppercase mb-2">
              Nome da Partida
            </label>
            <input
              value={editName}
              onChange={(event) => onEditNameChange(event.target.value)}
              className="w-full bg-[#141A26] border border-[#2D3A52] rounded-lg px-4 py-3 text-[#E6F1FF] font-mono-technical text-sm focus:border-[#00F0FF] focus:outline-none"
              placeholder="Nome da missão"
            />
          </div>
          <div className="space-y-3">
            <div>
              <label className="block text-xs text-[#7F94B0] font-mono-technical uppercase mb-2">
                Data de Início
              </label>
              <Popover>
                <PopoverTrigger
                  type="button"
                  className="flex w-full items-center justify-between rounded-md border border-[#2D3A52] bg-[#141A26] px-3 py-2 text-sm text-[#E6F1FF] font-mono-technical transition-colors hover:bg-[#1B2434] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#00F0FF]/40"
                >
                  <span>
                    {editDate
                      ? editDate.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' })
                      : 'Selecionar data'}
                  </span>
                  <CalendarDays className="w-4 h-4 text-[#7F94B0]" />
                </PopoverTrigger>
                <PopoverContent className="bg-[#0B0E14] border border-[#2D3A52] p-0 z-[60]" align="start">
                  <Calendar
                    mode="single"
                    selected={editDate ?? undefined}
                    onSelect={(date) => onEditDateChange(date ?? null)}
                    className="bg-[#0B0E14] text-[#E6F1FF] font-mono-technical uppercase"
                    classNames={{
                      months: 'flex flex-col gap-3',
                      month: 'flex flex-col gap-3',
                      caption: 'relative flex items-center justify-center px-2 py-1',
                      caption_label: 'text-sm tracking-[0.2em] text-[#E6F1FF]',
                      nav: 'flex items-center gap-2',
                      nav_button:
                        'clip-tactical-sm size-7 border border-[#2D3A52] bg-[#0F1729] p-0 text-[#7F94B0] opacity-80 hover:opacity-100 hover:border-[#00F0FF]/50 hover:text-[#E6F1FF]',
                      nav_button_previous: 'absolute left-2',
                      nav_button_next: 'absolute right-2',
                      table: 'w-full border-collapse',
                      head_row: 'grid grid-cols-7',
                      head_cell: 'text-[0.7rem] text-[#7F94B0] tracking-[0.2em] text-center',
                      row: 'grid grid-cols-7 gap-y-2',
                      cell: 'flex items-center justify-center',
                      day: 'clip-tactical-sm size-9 border border-[#1F2A3A] bg-[#0F1729] text-[#E6F1FF] font-normal aria-selected:opacity-100 hover:border-[#00F0FF]/50 hover:bg-[#00F0FF]/10',
                      day_today: 'border-[#00F0FF] text-[#00F0FF]',
                      day_selected: 'bg-[#00F0FF] text-[#0B0E14] border-[#00F0FF]',
                      day_outside: 'text-[#2D3A52] border-transparent bg-transparent',
                      day_disabled: 'text-[#2D3A52] opacity-50',
                    }}
                  />
                </PopoverContent>
              </Popover>
            </div>
            <div>
              <label className="block text-xs text-[#7F94B0] font-mono-technical uppercase mb-2">
                Horário de Início
              </label>
              <Select value={editTime} onValueChange={onEditTimeChange}>
                <SelectTrigger className="bg-[#141A26] border-[#2D3A52] text-[#E6F1FF] font-mono-technical text-sm hover:bg-[#1B2434]">
                  <SelectValue placeholder="Selecionar horário" />
                </SelectTrigger>
                <SelectContent className="bg-[#0B0E14] border-[#2D3A52] text-[#E6F1FF]">
                  {timeOptions.map((time) => (
                    <SelectItem key={time} value={time} className="text-[#E6F1FF]">
                      <span className="inline-flex items-center gap-2 font-mono-technical">
                        <Clock className="w-3 h-3 text-[#7F94B0]" />
                        {time}
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          {actionError ? (
            <div className="text-xs text-[#FF6B00] font-mono-technical">{actionError}</div>
          ) : null}
        </div>

        <DialogFooter>
          <TacticalButton variant="cyan" onClick={() => onOpenChange(false)}>
            Cancelar
          </TacticalButton>
          <TacticalButton
            variant="amber"
            onClick={onConfirm}
            disabled={isPending}
            leftIcon={
              isPending ? (
                <span className="inline-block w-4 h-4 border-2 border-current border-t-transparent border-l-transparent rounded-full animate-spin" />
              ) : undefined
            }
          >
            {isPending ? '[ SALVANDO... ]' : '[ SALVAR ALTERACOES ]'}
          </TacticalButton>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

type RemovePlayerDialogProps = BaseDialogProps & {
  target: MatchAttendanceEntry | null;
  actionError?: string | null;
  isPending: boolean;
  onConfirm: () => void;
};

export function RemovePlayerDialog({
  open,
  onOpenChange,
  target,
  actionError,
  isPending,
  onConfirm,
}: RemovePlayerDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-[#0B0E14] border border-[#2D3A52]">
        <DialogHeader>
          <DialogTitle className="text-[#E6F1FF] font-mono-technical uppercase">
            Remover operador?
          </DialogTitle>
          <DialogDescription className="text-[#7F94B0]">
            {target ? `Confirmar remoção de ${target.playerNickname}.` : 'Esta ação retira o jogador da lista desta partida.'}
          </DialogDescription>
        </DialogHeader>
        {actionError ? (
          <div className="text-xs text-[#FF6B00] font-mono-technical">{actionError}</div>
        ) : null}
        <DialogFooter>
          <TacticalButton variant="cyan" onClick={() => onOpenChange(false)}>
            Voltar
          </TacticalButton>
          <TacticalButton variant="amber" onClick={onConfirm} disabled={isPending}>
            {isPending ? '[ REMOVENDO... ]' : '[ CONFIRMAR REMOCAO ]'}
          </TacticalButton>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

type DeleteMatchDialogProps = BaseDialogProps & {
  actionError?: string | null;
  isPending: boolean;
  onConfirm: () => void;
};

export function DeleteMatchDialog({ open, onOpenChange, actionError, isPending, onConfirm }: DeleteMatchDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-[#0B0E14] border border-[#2D3A52]">
        <DialogHeader>
          <DialogTitle className="text-[#E6F1FF] font-mono-technical uppercase">
            Cancelar partida?
          </DialogTitle>
          <DialogDescription className="text-[#7F94B0]">
            Esta ação remove a partida das listagens e não pode ser desfeita.
          </DialogDescription>
        </DialogHeader>
        {actionError ? (
          <div className="text-xs text-[#FF6B00] font-mono-technical">{actionError}</div>
        ) : null}
        <DialogFooter>
          <TacticalButton variant="cyan" onClick={() => onOpenChange(false)}>
            Voltar
          </TacticalButton>
          <TacticalButton variant="amber" onClick={onConfirm} disabled={isPending}>
            {isPending ? '[ CANCELANDO... ]' : '[ CONFIRMAR CANCELAMENTO ]'}
          </TacticalButton>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
