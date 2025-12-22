import { useEffect, useMemo, useRef, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate, useParams } from 'react-router-dom';
import type { MatchAttendanceEntry, MatchSummary } from '@/app/gateways/MatchGateway';
import type { MatchGateway } from '@/app/gateways/MatchGateway';
import { Inject, TkMatchGateway } from '@/infra/container';
import { useSession } from '@/app/context/session-context';
import { Spinner } from '@/components/Spinner';
import { QueryErrorCard } from '@/components/QueryErrorCard';
import { MatchChecklistHeader } from './_components/MatchChecklistHeader';
import { MatchChecklistStatsCard } from './_components/MatchChecklistStatsCard';
import { MatchChecklistAttendanceList } from './_components/MatchChecklistAttendanceList';
import { MatchChecklistFixedActions } from './_components/MatchChecklistFixedActions';
import {
  CancelSubscriptionDialog,
  DeleteMatchDialog,
  EditMatchDialog,
  FinalizeMatchDialog,
  RemovePlayerDialog,
  SubscribeMatchDialog,
} from './_components/MatchChecklistDialogs';

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
  const [actionsOpen, setActionsOpen] = useState(true);
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
    setActionsOpen(true);
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
  const showEditAction = canEditMatch;
  const showSubscribeAction = canSubscribe && !match.isSubscribed;
  const showCancelSubscription = canSubscribe && match.isSubscribed;
  const showAdminActions = state.isAdmin && !isFinalized;

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
        <MatchChecklistHeader name={match.name} dateLabel={dateLabel} timeLabel={timeLabel} />
        <MatchChecklistStatsCard
          subscriptionCount={match.subscriptionCount}
          rentEquipmentCount={match.rentEquipmentCount}
          isAdmin={state.isAdmin}
        />

        {!canSubscribe && match.isSubscribed ? (
          <span className="text-xs font-mono-technical uppercase text-[#00F0FF]">
            [ INSCRITO ]
          </span>
        ) : null}

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
          <MatchChecklistAttendanceList
            entries={attendanceList}
            localAttendance={localAttendance}
            isAdmin={state.isAdmin}
            isFinalized={isFinalized}
            canEdit={canEdit}
            onToggle={handleToggle}
            onRemove={(entry) => {
              setActionError(null);
              setRemoveTarget(entry);
            }}
            onPlayerClick={(playerId) => navigate(`/player/${playerId}`)}
          />
        )}
        {actionError && !subscribeOpen && !cancelOpen && !deleteOpen && !editOpen && !removeTarget ? (
          <div className="text-xs text-[#FF6B00] font-mono-technical">{actionError}</div>
        ) : null}
      </div>

      <MatchChecklistFixedActions
        isOpen={actionsOpen}
        onToggleOpen={() => setActionsOpen((prev) => !prev)}
        showEditAction={showEditAction}
        showSubscribeAction={showSubscribeAction}
        showCancelSubscription={showCancelSubscription}
        showAdminActions={showAdminActions}
        isLocked={isLocked}
        isFinalized={isFinalized}
        deletePending={deleteMatch.isPending}
        finalizePending={finalizeMatch.isPending}
        cancelPending={cancelSubscription.isPending}
        onEdit={() => {
          setActionError(null);
          setEditOpen(true);
        }}
        onSubscribe={() => {
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
        onCancelSubscription={() => {
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
        onDelete={() => setDeleteOpen(true)}
        onFinalize={() => setConfirmOpen(true)}
      />

      <FinalizeMatchDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        onConfirm={() => finalizeMatch.mutate(match)}
        isPending={finalizeMatch.isPending}
      />

      <SubscribeMatchDialog
        open={subscribeOpen}
        onOpenChange={(open) => {
          if (!open) {
            setSubscribeOpen(false);
            setRentEquipment(false);
            setActionError(null);
          } else {
            setSubscribeOpen(true);
          }
        }}
        matchName={match.name}
        dateLabel={dateLabel}
        timeLabel={timeLabel}
        rentEquipment={rentEquipment}
        onRentEquipmentChange={setRentEquipment}
        actionError={actionError}
        isPending={subscribeMatch.isPending}
        onConfirm={() => subscribeMatch.mutate()}
      />

      <CancelSubscriptionDialog
        open={cancelOpen}
        onOpenChange={(open) => {
          if (!open) {
            setCancelOpen(false);
            setActionError(null);
          } else {
            setCancelOpen(true);
          }
        }}
        matchName={match.name}
        dateLabel={dateLabel}
        timeLabel={timeLabel}
        actionError={actionError}
        isPending={cancelSubscription.isPending}
        onConfirm={() => cancelSubscription.mutate()}
      />

      <EditMatchDialog
        open={editOpen}
        onOpenChange={(open) => {
          if (!open) {
            setEditOpen(false);
            setActionError(null);
          } else {
            setEditOpen(true);
          }
        }}
        editName={editName}
        onEditNameChange={setEditName}
        editDate={editDate}
        onEditDateChange={setEditDate}
        editTime={editTime}
        onEditTimeChange={setEditTime}
        timeOptions={timeOptions}
        actionError={actionError}
        isPending={updateMatch.isPending}
        onConfirm={() => updateMatch.mutate()}
      />

      <RemovePlayerDialog
        open={Boolean(removeTarget)}
        onOpenChange={(open) => !open && setRemoveTarget(null)}
        target={removeTarget}
        actionError={actionError}
        isPending={removePlayer.isPending}
        onConfirm={() => {
          if (removeTarget) removePlayer.mutate(removeTarget);
        }}
      />

      <DeleteMatchDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        actionError={actionError}
        isPending={deleteMatch.isPending}
        onConfirm={() => deleteMatch.mutate()}
      />
    </div>
  );
}
