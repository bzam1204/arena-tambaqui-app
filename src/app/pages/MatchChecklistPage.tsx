import { useEffect, useMemo, useRef, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate, useParams } from 'react-router-dom';
import { Check, Crosshair, Minus, Shield, Users, X } from 'lucide-react';
import type { MatchAttendanceEntry, MatchSummary } from '@/app/gateways/MatchGateway';
import type { MatchGateway } from '@/app/gateways/MatchGateway';
import { Inject, TkMatchGateway } from '@/infra/container';
import { useSession } from '@/app/context/session-context';
import { Spinner } from '@/components/Spinner';
import { QueryErrorCard } from '@/components/QueryErrorCard';
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
  const [subscribeOpen, setSubscribeOpen] = useState(false);
  const [cancelOpen, setCancelOpen] = useState(false);
  const [rentEquipment, setRentEquipment] = useState(false);
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
    setRentEquipment(false);
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
    <div className="relative pb-36">
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

        <div className="flex flex-wrap gap-2">
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

          {!canSubscribe && match.isSubscribed ? (
            <span className="text-xs font-mono-technical uppercase text-[#00F0FF]">
              [ INSCRITO ]
            </span>
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
                const isPending = displayState === null;
                return (
                  <div
                    key={entry.playerId}
                    className="clip-tactical-card bg-[#141A26] border-x-4 border-[#2D3A52] p-4 flex flex-col gap-3"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-13 bg-[#00F0FF] clip-hexagon-perfect p-[2px]">
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
                        <div className="text-sm text-[#E6F1FF] uppercase">{entry.playerNickname}</div>
                        <div className="text-xs text-[#7F94B0] font-mono-technical">{entry.playerName}</div>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleToggle(entry)}
                        className="flex flex-col items-center gap-2"
                        disabled={!canEdit}
                      >
                        <span
                          className={`relative w-20 h-10 clip-tactical-sm border transition-all ${
                            isPresent
                              ? 'border-[#00F0FF] bg-[#00F0FF]/15 shadow-[0_0_15px_rgba(0,240,255,0.4)]'
                              : 'border-[#2D3A52] bg-[#0F1729]'
                          }`}
                        >
                          <span
                            className={`absolute top-1 left-1 w-8 h-8 clip-tactical-sm flex items-center justify-center transition-all ${
                              isPresent
                                ? 'bg-[#00F0FF] text-[#0B0E14] translate-x-9'
                                : 'bg-[#1F2937] text-[#7F94B0]'
                            }`}
                          >
                            {isPresent ? <Check className="w-4 h-4" /> : isPending ? <Minus className="w-4 h-4" /> : <X className="w-4 h-4" />}
                          </span>
                        </span>
                        <span
                          className={`text-[10px] font-mono-technical uppercase ${
                            isPresent ? 'text-[#00F0FF]' : 'text-[#7F94B0]'
                          }`}
                        >
                          [ {isPresent ? 'PRESENTE' : isPending ? 'PENDENTE' : 'AUSENTE'} ]
                        </span>
                      </button>
                    </div>
                    {state.isAdmin ? (
                      <div className="text-xs font-mono-technical">
                        {entry.rentEquipment ? (
                          <span className="flex items-center gap-2 text-[#00F0FF]">
                            <Crosshair className="w-3 h-3" />
                            &gt; REQUER KIT (ALUGUEL)
                          </span>
                        ) : (
                          <span className="text-[#7F94B0]">&gt; Equipamento proprio</span>
                        )}
                      </div>
                    ) : null}
                  </div>
                );
              })
            )}
          </div>
        )}
        {actionError && !subscribeOpen && !cancelOpen ? (
          <div className="text-xs text-[#FF6B00] font-mono-technical">{actionError}</div>
        ) : null}
      </div>

      {state.isAdmin ? (
        <>
          <div className="fixed bottom-20 left-0 right-0 px-4 z-40">
            <div className="bg-[#0B0E14]/95 backdrop-blur-sm border-t border-[#2D3A52] pt-4 pb-6">
              <TacticalButton
                variant="amber"
                fullWidth
                disabled={!isLocked || isFinalized || finalizeMatch.isPending}
                onClick={() => setConfirmOpen(true)}
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
            <label className="flex items-center gap-3 text-xs text-[#7F94B0] font-mono-technical">
              <Checkbox checked={rentEquipment} onCheckedChange={(value) => setRentEquipment(Boolean(value))} />
              Vou alugar equipamento
            </label>
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
    </div>
  );
}
