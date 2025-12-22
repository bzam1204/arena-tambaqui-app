import { useEffect, useMemo, useRef, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate, useParams } from 'react-router-dom';
import { CalendarDays, Check, Clock, Minus, Shield, Users, X } from 'lucide-react';
import type { MatchAttendanceEntry, MatchSummary } from '@/app/gateways/MatchGateway';
import type { MatchGateway } from '@/app/gateways/MatchGateway';
import { Inject, TkMatchGateway } from '@/infra/container';
import { useSession } from '@/app/context/session-context';
import { Spinner } from '@/components/Spinner';
import { QueryErrorCard } from '@/components/QueryErrorCard';
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

function formatDateTime(value: string) {
  const date = new Date(value);
  const dateLabel = date
    .toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: '2-digit' })
    .replace(/\//g, '.');
  const timeLabel = date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  return { dateLabel, timeLabel };
}

export function MatchChecklistPage() {
  const matchGateway = Inject<MatchGateway>(TkMatchGateway);
  const { state } = useSession();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { id } = useParams();
  const matchId = id ?? '';

  const [confirmOpen, setConfirmOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [editName, setEditName] = useState('');
  const [editDate, setEditDate] = useState<Date | null>(null);
  const [editTime, setEditTime] = useState('');
  const [subscribeOpen, setSubscribeOpen] = useState(false);
  const [cancelOpen, setCancelOpen] = useState(false);
  const [rentEquipment, setRentEquipment] = useState(false);
  const [removeTarget, setRemoveTarget] = useState<MatchAttendanceEntry | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [localAttendance, setLocalAttendance] = useState<Record<string, boolean>>({});
  const autoMarkedRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior });
    autoMarkedRef.current = new Set();
    setLocalAttendance({});
    setActionError(null);
    setSubscribeOpen(false);
    setCancelOpen(false);
    setDeleteOpen(false);
    setEditOpen(false);
    setRentEquipment(false);
    setEditName('');
    setEditDate(null);
    setEditTime('');
    setRemoveTarget(null);
  }, [matchId]);

  const {
    data: matches = [],
    isLoading: matchesLoading,
    isError: matchesIsError,
    error: matchesError,
    refetch: refetchMatches,
  } = useQuery({
    queryKey: ['matches', 'detail', matchId, state.playerId],
    queryFn: () => matchGateway.listMatches({ playerId: state.playerId ?? undefined }),
    enabled: Boolean(matchId),
  });

  const match = useMemo(() => matches.find((item) => item.id === matchId) ?? null, [matches, matchId]);
  const timeOptions = useMemo(() => {
    const options: string[] = [];
    for (let hour = 0; hour < 24; hour += 1) {
      for (let minute = 0; minute < 60; minute += 30) {
        const h = String(hour).padStart(2, '0');
        const m = String(minute).padStart(2, '0');
        options.push(`${h}:${m}`);
      }
    }
    return options;
  }, []);

  useEffect(() => {
    if (!match) return;
    setEditName(match.name);
    const start = new Date(match.startAt);
    setEditDate(start);
    setEditTime(start.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }));
  }, [match]);

  const {
    data: attendanceList = [],
    isLoading: attendanceLoading,
    isError: attendanceIsError,
    error: attendanceError,
    refetch: refetchAttendance,
  } = useQuery({
    queryKey: ['matches', 'attendance', matchId],
    queryFn: () => matchGateway.listAttendance(matchId),
    enabled: Boolean(matchId),
  });

  const updateAttendance = useMutation({
    mutationFn: (input: { matchId: string; playerId: string; attended: boolean }) => {
      if (!state.isAdmin) throw new Error('Apenas administradores podem marcar presença.');
      return matchGateway.updateAttendance(input);
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['matches', 'attendance', matchId] });
    },
    onError: (err) => setActionError((err as Error).message),
  });

  useEffect(() => {
    if (!state.isAdmin) return;
    if (!attendanceList.length || !match) return;
    const startAt = new Date(match.startAt);
    if (startAt > new Date() || match.finalizedAt) return;
    const pending = attendanceList.filter((entry) => !entry.marked && !autoMarkedRef.current.has(entry.playerId));
    if (!pending.length) return;

    pending.forEach((entry) => {
      autoMarkedRef.current.add(entry.playerId);
      setLocalAttendance((prev) => ({ ...prev, [entry.playerId]: true }));
      updateAttendance.mutate(
        { matchId: entry.matchId, playerId: entry.playerId, attended: true },
        {
          onError: () => {
            autoMarkedRef.current.delete(entry.playerId);
          },
        },
      );
    });
  }, [attendanceList, match, updateAttendance]);

  const finalizeMatch = useMutation({
    mutationFn: async (target: MatchSummary) => {
      if (!state.userId) throw new Error('Faça login para finalizar.');
      if (!state.isAdmin) throw new Error('Apenas administradores podem finalizar.');
      await matchGateway.finalizeMatch({ matchId: target.id, adminId: state.userId });
    },
    onSuccess: async () => {
      setConfirmOpen(false);
      setActionError(null);
      await queryClient.invalidateQueries({ queryKey: ['matches'] });
      await queryClient.invalidateQueries({ queryKey: ['matches', 'attendance', matchId] });
      navigate('/partidas');
    },
    onError: (err) => setActionError((err as Error).message),
  });

  const deleteMatch = useMutation({
    mutationFn: async () => {
      if (!state.userId) throw new Error('Faça login para cancelar.');
      if (!state.isAdmin) throw new Error('Apenas administradores podem cancelar.');
      if (match?.finalizedAt) throw new Error('Partida já finalizada.');
      await matchGateway.deleteMatch({ matchId });
    },
    onSuccess: async () => {
      setDeleteOpen(false);
      setActionError(null);
      await queryClient.invalidateQueries({ queryKey: ['matches'] });
      await queryClient.invalidateQueries({ queryKey: ['matches', 'attendance', matchId] });
      navigate('/partidas');
    },
    onError: (err) => setActionError((err as Error).message),
  });

  const subscribeMatch = useMutation({
    mutationFn: async () => {
      if (!state.userId) {
        navigate('/auth');
        return;
      }
      if (!state.playerId) {
        navigate('/onboarding');
        return;
      }
      await matchGateway.subscribe({
        matchId,
        playerId: state.playerId,
        rentEquipment,
      });
    },
    onSuccess: async () => {
      setSubscribeOpen(false);
      setRentEquipment(false);
      setActionError(null);
      await queryClient.invalidateQueries({ queryKey: ['matches'] });
      await queryClient.invalidateQueries({ queryKey: ['matches', 'attendance', matchId] });
    },
    onError: (err) => setActionError((err as Error).message),
  });

  const updateMatch = useMutation({
    mutationFn: async () => {
      if (!state.userId) throw new Error('Faça login para editar.');
      if (!state.isAdmin) throw new Error('Apenas administradores podem editar.');
      if (match?.finalizedAt) throw new Error('Partida já finalizada.');
      const trimmedName = editName.trim();
      if (!trimmedName) throw new Error('Informe o nome da partida.');
      if (!editDate || !editTime) throw new Error('Informe data e horário de início.');
      const [hoursRaw, minutesRaw] = editTime.split(':');
      const hours = Number(hoursRaw);
      const minutes = Number(minutesRaw);
      if (Number.isNaN(hours) || Number.isNaN(minutes)) throw new Error('Horário inválido.');
      const startAt = new Date(
        editDate.getFullYear(),
        editDate.getMonth(),
        editDate.getDate(),
        hours,
        minutes,
        0,
        0,
      );
      if (Number.isNaN(startAt.getTime())) throw new Error('Data inválida.');
      await matchGateway.updateMatch({ matchId, name: trimmedName, startAt: startAt.toISOString() });
    },
    onSuccess: async () => {
      setEditOpen(false);
      setActionError(null);
      await queryClient.invalidateQueries({ queryKey: ['matches'] });
      await queryClient.invalidateQueries({ queryKey: ['matches', 'detail', matchId] });
    },
    onError: (err) => setActionError((err as Error).message),
  });

  const removePlayer = useMutation({
    mutationFn: async (target: MatchAttendanceEntry) => {
      if (!state.userId) throw new Error('Faça login para remover.');
      if (!state.isAdmin) throw new Error('Apenas administradores podem remover jogadores.');
      await matchGateway.removePlayer({ matchId: target.matchId, playerId: target.playerId });
    },
    onSuccess: async () => {
      setRemoveTarget(null);
      setActionError(null);
      await queryClient.invalidateQueries({ queryKey: ['matches'] });
      await queryClient.invalidateQueries({ queryKey: ['matches', 'attendance', matchId] });
    },
    onError: (err) => setActionError((err as Error).message),
  });

  const cancelSubscription = useMutation({
    mutationFn: async () => {
      if (!state.userId) {
        navigate('/auth');
        return;
      }
      if (!state.playerId) {
        navigate('/onboarding');
        return;
      }
      await matchGateway.unsubscribe({ matchId, playerId: state.playerId });
    },
    onSuccess: async () => {
      setCancelOpen(false);
      setActionError(null);
      await queryClient.invalidateQueries({ queryKey: ['matches'] });
      await queryClient.invalidateQueries({ queryKey: ['matches', 'attendance', matchId] });
    },
    onError: (err) => setActionError((err as Error).message),
  });

  if (matchesIsError) {
    return (
      <div className="p-6">
        <QueryErrorCard
          message={(matchesError as Error)?.message || 'Falha ao carregar partida.'}
          action={
            <button
              className="px-4 py-2 bg-[#00F0FF]/10 border-2 border-[#00F0FF] rounded-lg text-[#00F0FF] font-mono-technical text-xs uppercase hover:bg-[#00F0FF]/20 transition-all"
              onClick={() => void refetchMatches()}
            >
              [ TENTAR NOVAMENTE ]
            </button>
          }
        />
      </div>
    );
  }

  if (matchesLoading) {
    return <Spinner fullScreen label="carregando checklist" />;
  }

  if (!match) {
    return (
      <div className="p-6">
        <QueryErrorCard
          message="Partida nao encontrada."
          action={
            <button
              className="px-4 py-2 bg-[#00F0FF]/10 border-2 border-[#00F0FF] rounded-lg text-[#00F0FF] font-mono-technical text-xs uppercase hover:bg-[#00F0FF]/20 transition-all"
              onClick={() => navigate('/partidas')}
            >
              [ VOLTAR PARA PARTIDAS ]
            </button>
          }
        />
      </div>
    );
  }

  const { dateLabel, timeLabel } = formatDateTime(match.startAt);
  const now = new Date();
  const startAt = new Date(match.startAt);
  const isLocked = startAt <= now && !match.finalizedAt;
  const isFinalized = Boolean(match.finalizedAt);
  const canEdit = state.isAdmin && isLocked && !isFinalized;
  const canEditMatch = state.isAdmin && !isFinalized;
  const canSubscribe = !isLocked && !isFinalized;

  const statusMessage = isFinalized
    ? 'Partida já finalizada.'
    : !isLocked
      ? 'Partida ainda não iniciou.'
      : null;

  const handleToggle = (entry: MatchAttendanceEntry) => {
    if (!canEdit) return;
    const current = localAttendance[entry.playerId] ?? (entry.marked ? entry.attended : true);
    const next = !current;
    setLocalAttendance((prev) => ({ ...prev, [entry.playerId]: next }));
    updateAttendance.mutate(
      { matchId: entry.matchId, playerId: entry.playerId, attended: next },
      {
        onError: () => {
          setLocalAttendance((prev) => ({ ...prev, [entry.playerId]: current }));
        },
      },
    );
  };

  return (
    <div className="relative pb-52">
      <div className="px-4 pt-6 pb-8 space-y-4">
        <div className="space-y-2">
          <div className="text-xs font-mono-technical uppercase text-[#7F94B0]">
            // Checklist Operacional
          </div>
          <div
            className="text-lg sm:text-xl font-mono-technical tracking-wider uppercase text-[#E6F1FF] glitch-text"
            data-text={`// CHECKLIST OPERACIONAL: ${match.name}`}
          >
            // CHECKLIST OPERACIONAL: {match.name}
          </div>
          <div className="text-xs text-[#7F94B0] font-mono-technical">
            DATA: {dateLabel} // HORA: {timeLabel}
          </div>
        </div>

        <div className="clip-tactical-card bg-[#141A26] border-x-4 border-[#2D3A52]">
          <div className="flex flex-col">
            <div className="p-4 flex items-center gap-2">
              <Users className="w-4 h-4 text-[#E6F1FF]" />
              <span className="text-xs text-nowrap font-mono-technical text-[#E6F1FF]">
                [ TOTAL INSCRITOS: {match.subscriptionCount} ]
              </span>
            </div>
            {state.isAdmin ? (
              <>
                <hr className="border-[#2D3A52]" />
                <div className="p-4 flex items-center gap-2">
                  <Shield className="w-4 h-4 text-[#00F0FF]" />
                  <span className="text-xs font-mono-technical text-[#00F0FF]">
                    [ EQUIPAMENTO SOLICITADO: {match.rentEquipmentCount} ]
                  </span>
                </div>
              </>
            ) : null}
          </div>
        </div>

        <div className="flex flex-col flex-wrap gap-2">
          {!canSubscribe && match.isSubscribed ? (
            <span className="text-xs font-mono-technical uppercase text-[#00F0FF]">
              [ INSCRITO ]
            </span>
          ) : null}
          {canEditMatch ? (
            <TacticalButton
              variant="cyan"
              onClick={() => {
                setActionError(null);
                setEditOpen(true);
              }}
            >
              [ EDITAR PARTIDA ]
            </TacticalButton>
          ) : null}
          {canSubscribe && !match.isSubscribed ? (
            <TacticalButton
              variant="amber"
              onClick={() => {
                if (!state.userId) {
                  navigate('/auth');
                  return;
                }
                if (!state.playerId) {
                  navigate('/onboarding');
                  return;
                }
                setRentEquipment(Boolean(match.rentEquipment));
                setActionError(null);
                setSubscribeOpen(true);
              }}
            >
              [ PARTICIPAR ]
            </TacticalButton>
          ) : null}

          {canSubscribe && match.isSubscribed ? (
            <TacticalButton
              variant="cyan"
              disabled={cancelSubscription.isPending}
              onClick={() => {
                if (!state.userId) {
                  navigate('/auth');
                  return;
                }
                if (!state.playerId) {
                  navigate('/onboarding');
                  return;
                }
                setActionError(null);
                setCancelOpen(true);
              }}
            >
              [ CANCELAR INSCRICAO ]
            </TacticalButton>
          ) : null}

        </div>

        {statusMessage ? (
          <div className="bg-[#2E2819] border border-[#D4A536] text-[#D4A536] text-xs font-mono-technical rounded-lg p-3">
            {statusMessage}
          </div>
        ) : null}

        {attendanceIsError ? (
          <QueryErrorCard
            message={(attendanceError as Error)?.message || 'Falha ao carregar inscritos.'}
            action={
              <button
                className="px-4 py-2 bg-[#00F0FF]/10 border-2 border-[#00F0FF] rounded-lg text-[#00F0FF] font-mono-technical text-xs uppercase hover:bg-[#00F0FF]/20 transition-all"
                onClick={() => void refetchAttendance()}
              >
                [ TENTAR NOVAMENTE ]
              </button>
            }
          />
        ) : attendanceLoading ? (
          <Spinner label="carregando inscritos" />
        ) : (
          <div className="space-y-3">
            {attendanceList.length === 0 ? (
              <div className="bg-[#141A26] border border-[#2D3A52] rounded-lg p-6 text-center text-xs text-[#7F94B0]">
                Nenhum inscrito para esta partida.
              </div>
            ) : (
              attendanceList.map((entry) => {
                const displayState = state.isAdmin
                  ? (localAttendance[entry.playerId] ?? (entry.marked ? entry.attended : true))
                  : (entry.marked ? entry.attended : null);
                const isPresent = displayState === true;
                const isAbsent = displayState === false;
                const isPending = displayState === null;
                const rentalLabel = entry.rentEquipment ? 'ALUGUEL' : 'EQUIPAMENTO PRÓPRIO';
                const rentalClass = entry.rentEquipment
                  ? 'border-[#00F0FF]/50 text-[#00F0FF] bg-[#00F0FF]/10'
                  : 'border-[#2D3A52] text-[#7F94B0] bg-[#0B0E14]';
                const canViewProfile = isFinalized;
                const identityContent = (
                  <>
                    <div className="w-16 h-18 bg-[#00F0FF] clip-hexagon-perfect p-[2px]">
                      <div className="w-full h-full bg-[#0B0E14] clip-hexagon-perfect flex items-center justify-center">
                        {entry.playerAvatar ? (
                          <img
                            src={entry.playerAvatar}
                            alt={entry.playerNickname}
                            className="w-full h-full object-cover clip-hexagon-perfect"
                          />
                        ) : (
                          <Users className="w-4 h-4 text-[#7F94B0]" />
                        )}
                      </div>
                    </div>
                    <div className="flex-1">
                      <div className="flex flex-col flex-wrap items-start justify-start gap-2 mb-3">
                        <div className={`text-sm text-[#E6F1FF] uppercase ${canViewProfile ? 'group-hover:text-[#00F0FF]' : ''}`}>
                          {entry.playerNickname}
                        </div>
                        <div className="text-xs text-[#7F94B0] font-mono-technical">{entry.playerName}</div>
                        <span className={`px-2 py-0.5 text-[9px] font-mono-technical uppercase border rounded-full ${rentalClass}`}>
                          {rentalLabel}
                        </span>
                      </div>
                    </div>
                  </>
                );
                return (
                  <div
                    key={entry.playerId}
                    className="clip-tactical-card bg-[#141A26] border-x-4 border-[#2D3A52] p-4 flex flex-col gap-3"
                  >
                    {canViewProfile ? (
                      <button
                        type="button"
                        onClick={() => navigate(`/player/${entry.playerId}`)}
                        className="flex gap-4 text-left group"
                      >
                        {identityContent}
                      </button>
                    ) : (
                      <div className="flex items-start gap-4">{identityContent}</div>
                    )}
                    <hr className='mb-1! border-[#2D3A52]'/>

                    <div className="flex flex-wrap items-center justify-between gap-3">
                      {state.isAdmin && !isFinalized ? (
                        <TacticalButton
                          variant="cyan"
                          className="!px-3 !py-1 h-10 text-[10px] !border-[#FF3B3B] !text-[#FF3B3B] !bg-[#FF3B3B]/10 hover:!bg-[#FF3B3B]/20 hover:!shadow-[0_0_20px_rgba(255,59,59,0.6)]"
                          onClick={() => {
                            setActionError(null);
                            setRemoveTarget(entry);
                          }}
                        >
                          [ - REMOVER ]
                        </TacticalButton>
                      ) : null}
                      <button
                        type="button"
                        onClick={() => handleToggle(entry)}
                        className="flex items-center gap-2"
                        disabled={!canEdit}
                      >
                        <span
                          className={`relative w-20 h-11 clip-tactical-sm border transition-all ${isPresent
                            ? 'border-[#00F0FF] bg-[#00F0FF]/15 shadow-[0_0_15px_rgba(0,240,255,0.4)]'
                            : isAbsent
                              ? 'border-[#FF3B3B] bg-[#FF3B3B]/10 shadow-[0_0_15px_rgba(255,59,59,0.45)]'
                              : 'border-[#2D3A52] bg-[#0F1729]'
                            }`}
                        >
                          <span
                            className={`absolute top-[5px] left-1 w-8 h-8 clip-tactical-sm flex items-center justify-center transition-all ${isPresent
                              ? 'bg-[#00F0FF] text-[#0B0E14] translate-x-9'
                              : isAbsent
                                ? 'bg-[#FF3B3B] text-[#0B0E14]'
                                : 'bg-[#1F2937] text-[#7F94B0]'
                              }`}
                          >
                            {isPresent ? <Check className="w-4 h-4" /> : isPending ? <Minus className="w-4 h-4" /> : <X className="w-4 h-4" />}
                          </span>
                        </span>
                        <span
                          className={`text-[10px] font-mono-technical uppercase ${isPresent
                            ? 'text-[#00F0FF]'
                            : isAbsent
                              ? 'text-[#FF3B3B]'
                              : 'text-[#7F94B0]'
                            }`}
                        >
                          [ {isPresent ? 'PRESENTE' : isPending ? 'PENDENTE' : 'AUSENTE'} ]
                        </span>
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}
        {actionError && !subscribeOpen && !cancelOpen && !deleteOpen && !editOpen && !removeTarget ? (
          <div className="text-xs text-[#FF6B00] font-mono-technical">{actionError}</div>
        ) : null}
      </div>

      {state.isAdmin && !isFinalized ? (
        <>
          <div className="fixed bottom-20 left-0 right-0 px-4 z-40">
            <div className="bg-[#0B0E14]/95 backdrop-blur-sm border-t border-[#2D3A52] pt-4 pb-6">
              <TacticalButton
                variant="cyan"
                fullWidth
                disabled={deleteMatch.isPending}
                onClick={() => setDeleteOpen(true)}
              >
                {deleteMatch.isPending ? '[ CANCELANDO... ]' : '[ CANCELAR PARTIDA ]'}
              </TacticalButton>
              <TacticalButton
                variant="amber"
                fullWidth
                disabled={!isLocked || isFinalized || finalizeMatch.isPending}
                onClick={() => setConfirmOpen(true)}
                className="mt-3"
              >
                {finalizeMatch.isPending
                  ? '[ PROCESSANDO... ]'
                  : '[ FINALIZAR PARTIDA E PROCESSAR ]'}
              </TacticalButton>
              <p className="mt-3 text-[10px] text-[#D4A536] font-mono-technical text-center">
                // ATENCAO: Acao irreversivel. Penalidades por ausencia serao aplicadas automaticamente apos confirmacao.
              </p>
            </div>
          </div>

          <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
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
                <TacticalButton variant="cyan" onClick={() => setConfirmOpen(false)}>
                  Cancelar
                </TacticalButton>
                <TacticalButton
                  variant="amber"
                  onClick={() => finalizeMatch.mutate(match)}
                  disabled={finalizeMatch.isPending}
                >
                  {finalizeMatch.isPending ? '[ PROCESSANDO... ]' : '[ CONFIRMAR ]'}
                </TacticalButton>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </>
      ) : null}

      <Dialog open={subscribeOpen} onOpenChange={(open) => {
        if (!open) {
          setSubscribeOpen(false);
          setRentEquipment(false);
          setActionError(null);
        } else {
          setSubscribeOpen(true);
        }
      }}>
        <DialogContent className="bg-[#0B0E14] border border-[#2D3A52]">
          <DialogHeader>
            <DialogTitle className="text-[#E6F1FF] font-mono-technical uppercase">[ Confirmar Participação ]</DialogTitle>
            <DialogDescription className="text-[#7F94B0]">
              Confirme sua inscrição para a partida.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="bg-[#141A26] border border-[#2D3A52] rounded-lg p-3 space-y-2">
              <div className="text-sm text-[#E6F1FF] uppercase">{match.name}</div>
              <div className="text-xs text-[#7F94B0] font-mono-technical">
                DATA: {dateLabel} // HORA: {timeLabel}
              </div>
            </div>
            <button
              type="button"
              onClick={() => setRentEquipment((prev) => !prev)}
              className={`w-full clip-tactical-card border-x-4 p-3 text-left transition-all ${rentEquipment
                ? 'border-[#00F0FF] bg-[#00F0FF]/10 shadow-[0_0_18px_rgba(0,240,255,0.35)]'
                : 'border-[#2D3A52] bg-[#141A26] hover:border-[#00F0FF]/40'
                }`}
            >
              <div className="flex items-center gap-3">
                <div
                  className={`w-10 h-10 rounded-md border flex items-center justify-center ${rentEquipment
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
            </button>
            {actionError ? (
              <div className="text-xs text-[#FF6B00] font-mono-technical">{actionError}</div>
            ) : null}
          </div>

          <DialogFooter>
            <TacticalButton variant="cyan" onClick={() => setSubscribeOpen(false)}>
              Cancelar
            </TacticalButton>
            <TacticalButton
              variant="amber"
              onClick={() => subscribeMatch.mutate()}
              disabled={subscribeMatch.isPending}
              leftIcon={
                subscribeMatch.isPending ? (
                  <span className="inline-block w-4 h-4 border-2 border-current border-t-transparent border-l-transparent rounded-full animate-spin" />
                ) : undefined
              }
            >
              {subscribeMatch.isPending ? '[ CONFIRMANDO... ]' : '[ CONFIRMAR PARTICIPAÇÃO ]'}
            </TacticalButton>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={cancelOpen} onOpenChange={(open) => {
        if (!open) {
          setCancelOpen(false);
          setActionError(null);
        } else {
          setCancelOpen(true);
        }
      }}>
        <DialogContent className="bg-[#0B0E14] border border-[#2D3A52]">
          <DialogHeader>
            <DialogTitle className="text-[#E6F1FF] font-mono-technical uppercase">[ Cancelar Inscricao ]</DialogTitle>
            <DialogDescription className="text-[#7F94B0]">
              Confirme o cancelamento da sua participação.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="bg-[#141A26] border border-[#2D3A52] rounded-lg p-3 space-y-2">
              <div className="text-sm text-[#E6F1FF] uppercase">{match.name}</div>
              <div className="text-xs text-[#7F94B0] font-mono-technical">
                DATA: {dateLabel} // HORA: {timeLabel}
              </div>
            </div>
            {actionError ? (
              <div className="text-xs text-[#FF6B00] font-mono-technical">{actionError}</div>
            ) : null}
          </div>
          <DialogFooter>
            <TacticalButton variant="cyan" onClick={() => setCancelOpen(false)}>
              Manter inscrição
            </TacticalButton>
            <TacticalButton
              variant="amber"
              onClick={() => cancelSubscription.mutate()}
              disabled={cancelSubscription.isPending}
              leftIcon={
                cancelSubscription.isPending ? (
                  <span className="inline-block w-4 h-4 border-2 border-current border-t-transparent border-l-transparent rounded-full animate-spin" />
                ) : undefined
              }
            >
              {cancelSubscription.isPending ? '[ CANCELANDO... ]' : '[ CONFIRMAR CANCELAMENTO ]'}
            </TacticalButton>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={editOpen} onOpenChange={(open) => {
        if (!open) {
          setEditOpen(false);
          setActionError(null);
        } else {
          setEditOpen(true);
        }
      }}>
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
                onChange={(event) => setEditName(event.target.value)}
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
                      onSelect={(date) => setEditDate(date ?? null)}
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
                <Select value={editTime} onValueChange={setEditTime}>
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
            <TacticalButton variant="cyan" onClick={() => setEditOpen(false)}>
              Cancelar
            </TacticalButton>
            <TacticalButton
              variant="amber"
              onClick={() => updateMatch.mutate()}
              disabled={updateMatch.isPending}
              leftIcon={
                updateMatch.isPending ? (
                  <span className="inline-block w-4 h-4 border-2 border-current border-t-transparent border-l-transparent rounded-full animate-spin" />
                ) : undefined
              }
            >
              {updateMatch.isPending ? '[ SALVANDO... ]' : '[ SALVAR ALTERACOES ]'}
            </TacticalButton>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={Boolean(removeTarget)} onOpenChange={(open) => !open && setRemoveTarget(null)}>
        <DialogContent className="bg-[#0B0E14] border border-[#2D3A52]">
          <DialogHeader>
            <DialogTitle className="text-[#E6F1FF] font-mono-technical uppercase">
              Remover operador?
            </DialogTitle>
            <DialogDescription className="text-[#7F94B0]">
              {removeTarget
                ? `Confirmar remoção de ${removeTarget.playerNickname}.`
                : 'Esta ação retira o jogador da lista desta partida.'}
            </DialogDescription>
          </DialogHeader>
          {actionError ? (
            <div className="text-xs text-[#FF6B00] font-mono-technical">{actionError}</div>
          ) : null}
          <DialogFooter>
            <TacticalButton variant="cyan" onClick={() => setRemoveTarget(null)}>
              Voltar
            </TacticalButton>
            <TacticalButton
              variant="amber"
              onClick={() => {
                if (removeTarget) removePlayer.mutate(removeTarget);
              }}
              disabled={removePlayer.isPending}
            >
              {removePlayer.isPending ? '[ REMOVENDO... ]' : '[ CONFIRMAR REMOCAO ]'}
            </TacticalButton>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
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
            <TacticalButton variant="cyan" onClick={() => setDeleteOpen(false)}>
              Voltar
            </TacticalButton>
            <TacticalButton
              variant="amber"
              onClick={() => deleteMatch.mutate()}
              disabled={deleteMatch.isPending}
            >
              {deleteMatch.isPending ? '[ CANCELANDO... ]' : '[ CONFIRMAR CANCELAMENTO ]'}
            </TacticalButton>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
