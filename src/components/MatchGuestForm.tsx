import { useEffect, useMemo, useState } from 'react';
import { Shield, UserPlus, Trash2 } from 'lucide-react';
import { TacticalButton } from '@/components/TacticalButton';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

export type MatchGuestDraft = {
  id: string;
  fullName: string;
  age: number | null;
  rentEquipment: boolean;
  guardianConfirmed: boolean;
};

type MatchGuestFormProps = {
  pendingGuests: MatchGuestDraft[];
  onPendingGuestsChange: (next: MatchGuestDraft[]) => void;
  existingGuests?: MatchGuestDraft[];
  onRemoveExistingGuest?: (guestId: string) => void;
  removingGuestId?: string | null;
  disabled?: boolean;
};

export function MatchGuestForm({
  pendingGuests,
  onPendingGuestsChange,
  existingGuests = [],
  onRemoveExistingGuest,
  removingGuestId = null,
  disabled = false,
}: MatchGuestFormProps) {
  const [fullName, setFullName] = useState('');
  const [age, setAge] = useState('');
  const [rentEquipment, setRentEquipment] = useState(false);
  const [guardianConfirmed, setGuardianConfirmed] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmGuest, setConfirmGuest] = useState<MatchGuestDraft | null>(null);
  const [pendingRemovalId, setPendingRemovalId] = useState<string | null>(null);
  const [inFlightRemoval, setInFlightRemoval] = useState(false);
  const isRemoving = pendingRemovalId !== null;

  const ageValue = useMemo(() => {
    if (!age.trim()) return null;
    const parsed = Number(age);
    return Number.isNaN(parsed) ? null : parsed;
  }, [age]);

  const isMinor = typeof ageValue === 'number' && ageValue < 18;

  const handleAddGuest = () => {
    if (disabled) return;
    const trimmedName = fullName.trim();
    if (!trimmedName) {
      setError('Informe o nome completo do convidado.');
      return;
    }
    if (ageValue === null) {
      setError('Informe a idade do convidado.');
      return;
    }
    if (isMinor && !guardianConfirmed) {
      setError('Confirme a responsabilidade legal.');
      return;
    }

    const newGuest: MatchGuestDraft = {
      id: typeof crypto !== 'undefined' && 'randomUUID' in crypto ? crypto.randomUUID() : `guest-${Date.now()}`,
      fullName: trimmedName,
      age: ageValue,
      rentEquipment,
      guardianConfirmed: Boolean(guardianConfirmed),
    };

    onPendingGuestsChange([...pendingGuests, newGuest]);
    setFullName('');
    setAge('');
    setRentEquipment(false);
    setGuardianConfirmed(false);
    setError(null);
  };

  const handleRemovePending = (guestId: string) => {
    if (disabled) return;
    onPendingGuestsChange(pendingGuests.filter((guest) => guest.id !== guestId));
  };

  const handleConfirmRemove = () => {
    if (!confirmGuest || !onRemoveExistingGuest) return;
    setPendingRemovalId(confirmGuest.id);
    onRemoveExistingGuest(confirmGuest.id);
  };

  useEffect(() => {
    if (pendingRemovalId && removingGuestId === pendingRemovalId) {
      setInFlightRemoval(true);
    }
  }, [pendingRemovalId, removingGuestId]);

  useEffect(() => {
    if (pendingRemovalId && inFlightRemoval && removingGuestId === null) {
      setConfirmGuest(null);
      setPendingRemovalId(null);
      setInFlightRemoval(false);
    }
  }, [pendingRemovalId, inFlightRemoval, removingGuestId]);

  const formatGuestLabel = (guest: MatchGuestDraft) => {
    const rentLabel = guest.rentEquipment ? 'Com aluguel' : 'Sem aluguel';
    const ageLabel = typeof guest.age === 'number' ? `${guest.age} anos` : 'Idade não informada';
    return `${rentLabel} • ${ageLabel}`;
  };

  return (
    <>
      <div className="space-y-4">
      <div className="bg-[#141A26] border border-[#2D3A52] rounded-lg p-4 space-y-3">
        <div className="flex items-center gap-2 text-[11px] text-[#E6F1FF] font-mono-technical uppercase">
          <UserPlus className="w-4 h-4 text-[#00F0FF]" />
          convidado
        </div>
        <div className="space-y-2">
          <label className="block text-[10px] text-[#7F94B0] font-mono-technical uppercase">
            Nome completo
          </label>
          <input
            value={fullName}
            onChange={(event) => setFullName(event.target.value)}
            disabled={disabled}
            className="w-full bg-[#0B0E14] border border-[#2D3A52] rounded-md px-3 py-2 text-sm text-[#E6F1FF] focus:border-[#00F0FF] focus:outline-none"
            placeholder="Ex: João Silva"
          />
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="space-y-2">
            <label className="block text-[10px] text-[#7F94B0] font-mono-technical uppercase">
              Idade
            </label>
            <input
              type="number"
              value={age}
              onChange={(event) => setAge(event.target.value)}
              disabled={disabled}
              className="w-full bg-[#0B0E14] border border-[#2D3A52] rounded-md px-3 py-2 text-sm text-[#E6F1FF] focus:border-[#00F0FF] focus:outline-none"
              min={0}
              max={120}
            />
          </div>
          <div
            role="button"
            tabIndex={0}
            aria-pressed={rentEquipment}
            onClick={() => setRentEquipment((prev) => !prev)}
            onKeyDown={(event) => {
              if (event.key === 'Enter' || event.key === ' ') {
                event.preventDefault();
                setRentEquipment((prev) => !prev);
              }
            }}
            className={`w-full cursor-pointer clip-tactical-card border-x-4 p-3 text-left transition-all ${
              rentEquipment
                ? 'border-[#00F0FF] bg-[#00F0FF]/10 shadow-[0_0_18px_rgba(0,240,255,0.35)]'
                : 'border-[#2D3A52] bg-[#0B0E14] hover:border-[#00F0FF]/40'
            } ${disabled ? 'pointer-events-none opacity-70' : ''}`}
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
                <div className="text-xs text-[#E6F1FF] font-mono-technical uppercase">Alugar equipamento</div>
                <div className="text-[10px] text-[#7F94B0] font-mono-technical">
                  R$ 50 (isenta inscrição)
                </div>
              </div>
              <Checkbox checked={rentEquipment} className="pointer-events-none" />
            </div>
          </div>
        </div>
        {isMinor ? (
          <label className="flex items-start gap-2 text-[10px] text-[#7F94B0] font-mono-technical uppercase">
            <Checkbox
              checked={guardianConfirmed}
              onCheckedChange={(value) => setGuardianConfirmed(Boolean(value))}
              disabled={disabled}
            />
            Confirmo ser o responsável legal e estarei presente
          </label>
        ) : null}
        {error ? <div className="text-xs text-[#FF6B00] font-mono-technical">{error}</div> : null}
        <TacticalButton variant="cyan" fullWidth onClick={handleAddGuest} disabled={disabled}>
          [ <UserPlus className="w-4 h-4" /> CONVIDADO ]
        </TacticalButton>
      </div>

      {existingGuests.length > 0 ? (
        <div className="space-y-2">
          <div className="text-[10px] text-[#7F94B0] font-mono-technical uppercase">Convidados inscritos</div>
          <div className="space-y-2">
            {existingGuests.map((guest) => (
              <div
                key={guest.id}
                className="flex items-center justify-between gap-3 bg-[#0F1729] border border-[#2D3A52] rounded-lg px-3 py-2"
              >
                <div>
                  <div className="text-xs text-[#E6F1FF] font-mono-technical">{guest.fullName}</div>
                  <div className="text-[10px] text-[#7F94B0] font-mono-technical">
                    {formatGuestLabel(guest)}
                  </div>
                </div>
                {onRemoveExistingGuest ? (
                  <button
                    type="button"
                    disabled={disabled || removingGuestId === guest.id}
                    onClick={() => setConfirmGuest(guest)}
                    className="text-[10px] text-[#FF6B00] font-mono-technical uppercase flex items-center gap-1 hover:text-[#FF9150] transition-colors"
                  >
                    <Trash2 className="w-3 h-3" />
                    Remover
                  </button>
                ) : null}
              </div>
            ))}
          </div>
        </div>
      ) : null}

      {pendingGuests.length > 0 ? (
        <div className="space-y-2">
          <div className="text-[10px] text-[#7F94B0] font-mono-technical uppercase">Novos convidados</div>
          <div className="space-y-2">
            {pendingGuests.map((guest) => (
              <div
                key={guest.id}
                className="flex items-center justify-between gap-3 bg-[#0F1729] border border-[#2D3A52] rounded-lg px-3 py-2"
              >
                <div>
                  <div className="text-xs text-[#E6F1FF] font-mono-technical">{guest.fullName}</div>
                  <div className="text-[10px] text-[#7F94B0] font-mono-technical">
                    {formatGuestLabel(guest)}
                  </div>
                </div>
                <button
                  type="button"
                  disabled={disabled}
                  onClick={() => handleRemovePending(guest.id)}
                  className="text-[10px] text-[#FF6B00] font-mono-technical uppercase flex items-center gap-1 hover:text-[#FF9150] transition-colors"
                >
                  <Trash2 className="w-3 h-3" />
                  Remover
                </button>
              </div>
            ))}
          </div>
        </div>
      ) : null}
    </div>
    <Dialog
      open={Boolean(confirmGuest)}
      onOpenChange={(open) => {
        if (!open) {
          setConfirmGuest(null);
          setPendingRemovalId(null);
          setInFlightRemoval(false);
        }
      }}
    >
      <DialogContent className="bg-[#0B0E14] border border-[#2D3A52]">
          <DialogHeader>
            <DialogTitle className="text-[#E6F1FF] font-mono-technical uppercase">
              Remover convidado?
            </DialogTitle>
            <DialogDescription className="text-[#7F94B0]">
              {confirmGuest
                ? `Confirmar remoção de ${confirmGuest.fullName}.`
                : 'Esta ação remove o convidado da lista da partida.'}
            </DialogDescription>
          </DialogHeader>
        <DialogFooter>
          <TacticalButton
            variant="cyan"
            onClick={() => setConfirmGuest(null)}
            disabled={isRemoving}
          >
            Voltar
          </TacticalButton>
          <TacticalButton
            variant="amber"
            onClick={handleConfirmRemove}
            disabled={disabled || isRemoving}
            leftIcon={
              isRemoving ? (
                <span className="inline-block w-4 h-4 border-2 border-current border-t-transparent border-l-transparent rounded-full animate-spin" />
              ) : undefined
            }
          >
            {isRemoving ? '[ REMOVENDO... ]' : '[ CONFIRMAR REMOCAO ]'}
          </TacticalButton>
        </DialogFooter>
      </DialogContent>
    </Dialog>
    </>
  );
}
