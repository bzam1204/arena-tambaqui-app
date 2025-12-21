import { useEffect, useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { CalendarDays, Clock, Shield, Users } from 'lucide-react';
import type { MatchSummary } from '@/app/gateways/MatchGateway';
import type { MatchGateway } from '@/app/gateways/MatchGateway';
import { Inject, TkMatchGateway } from '@/infra/container';
import { useSession } from '@/app/context/session-context';
import { TacticalButton } from '@/components/TacticalButton';
import { Spinner } from '@/components/Spinner';
import { QueryErrorCard } from '@/components/QueryErrorCard';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

function formatDateTime(value: string) {
  const date = new Date(value);
  const dateLabel = date
    .toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: '2-digit' })
    .replace(/\//g, '.');
  const timeLabel = date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  return { dateLabel, timeLabel };
}

export function MatchesPage() {
  const matchGateway = Inject<MatchGateway>(TkMatchGateway);
  const { state } = useSession();
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const [createOpen, setCreateOpen] = useState(false);
  const [subscribeMatch, setSubscribeMatch] = useState<MatchSummary | null>(null);
  const [rentEquipment, setRentEquipment] = useState(false);
  const [matchName, setMatchName] = useState('');
  const [matchDate, setMatchDate] = useState<Date | null>(null);
  const [matchTime, setMatchTime] = useState('');
  const [actionError, setActionError] = useState<string | null>(null);
  const [tab, setTab] = useState<'open' | 'mine' | 'pending' | 'finalized'>('open');
  const [mineTab, setMineTab] = useState<'upcoming' | 'finalized'>('upcoming');
  const [finalizedPage, setFinalizedPage] = useState(1);
  const finalizedPageSize = 6;

  useEffect(() => {
    if (!state.isAdmin && (tab === 'pending' || tab === 'finalized')) {
      setTab('open');
    }
  }, [state.isAdmin, tab]);

  useEffect(() => {
    if (tab !== 'finalized') {
      setFinalizedPage(1);
    }
  }, [tab]);

  const {
    data: matches = [],
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery({
    queryKey: ['matches', state.playerId],
    queryFn: () => matchGateway.listMatches({ playerId: state.playerId ?? undefined }),
  });

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

  const createMatch = useMutation({
    mutationFn: async () => {
      if (!state.userId) throw new Error('Faça login para criar partidas.');
      if (!state.isAdmin) throw new Error('Apenas administradores podem criar partidas.');
      const trimmedName = matchName.trim();
      if (!trimmedName) throw new Error('Informe o nome da partida.');
      if (!matchDate || !matchTime) throw new Error('Informe data e horário de início.');
      const [hoursRaw, minutesRaw] = matchTime.split(':');
      const hours = Number(hoursRaw);
      const minutes = Number(minutesRaw);
      if (Number.isNaN(hours) || Number.isNaN(minutes)) throw new Error('Horário inválido.');
      const startAt = new Date(
        matchDate.getFullYear(),
        matchDate.getMonth(),
        matchDate.getDate(),
        hours,
        minutes,
        0,
        0,
      );
      if (Number.isNaN(startAt.getTime())) throw new Error('Data inválida.');
      await matchGateway.createMatch({
        name: trimmedName,
        startAt: startAt.toISOString(),
        createdBy: state.userId,
      });
    },
    onSuccess: async () => {
      setCreateOpen(false);
      setMatchName('');
      setMatchDate(null);
      setMatchTime('');
      setActionError(null);
      await queryClient.invalidateQueries({ queryKey: ['matches'] });
    },
    onError: (err) => setActionError((err as Error).message),
  });

  const subscribe = useMutation({
    mutationFn: async () => {
      if (!state.playerId) throw new Error('Complete seu perfil para participar.');
      if (!subscribeMatch) throw new Error('Selecione uma partida.');
      await matchGateway.subscribe({
        matchId: subscribeMatch.id,
        playerId: state.playerId,
        rentEquipment,
      });
    },
    onSuccess: async () => {
      setSubscribeMatch(null);
      setRentEquipment(false);
      setActionError(null);
      await queryClient.invalidateQueries({ queryKey: ['matches'] });
    },
    onError: (err) => setActionError((err as Error).message),
  });

  const matchCards = useMemo(() => {
    const now = new Date();
    return matches
      .map((match) => {
      const startAt = new Date(match.startAt);
      const isClosed = startAt <= now;
      const isFinalized = Boolean(match.finalizedAt);
      const { dateLabel, timeLabel } = formatDateTime(match.startAt);
      const statusLabel = isFinalized
        ? 'Finalizada'
        : isClosed
          ? 'Inscrições encerradas'
          : 'Inscrições abertas';
      return {
        match,
        dateLabel,
        timeLabel,
        isClosed,
        isFinalized,
        statusLabel,
      };
    })
      .sort((a, b) => new Date(b.match.startAt).getTime() - new Date(a.match.startAt).getTime());
  }, [matches]);

  const openMatches = useMemo(
    () => matchCards.filter(({ isClosed, isFinalized }) => !isClosed && !isFinalized),
    [matchCards],
  );
  const pendingMatches = useMemo(
    () => matchCards.filter(({ isClosed, isFinalized }) => isClosed && !isFinalized),
    [matchCards],
  );
  const myMatches = useMemo(
    () => matchCards.filter(({ match }) => match.isSubscribed),
    [matchCards],
  );
  const myUpcomingMatches = useMemo(
    () => myMatches.filter(({ isFinalized }) => !isFinalized),
    [myMatches],
  );
  const myFinalizedMatches = useMemo(
    () => myMatches.filter(({ isFinalized }) => isFinalized),
    [myMatches],
  );
  const adminFinalizedMatches = useMemo(
    () => matchCards.filter(({ isFinalized }) => isFinalized),
    [matchCards],
  );
  const finalizedTotalPages = useMemo(
    () => Math.max(1, Math.ceil(adminFinalizedMatches.length / finalizedPageSize)),
    [adminFinalizedMatches.length, finalizedPageSize],
  );
  const paginatedFinalizedMatches = useMemo(() => {
    const start = (finalizedPage - 1) * finalizedPageSize;
    return adminFinalizedMatches.slice(start, start + finalizedPageSize);
  }, [adminFinalizedMatches, finalizedPage, finalizedPageSize]);

  const visibleMatches = useMemo(() => {
    if (tab === 'open') return openMatches;
    if (tab === 'pending') return pendingMatches;
    if (tab === 'finalized') return paginatedFinalizedMatches;
    return mineTab === 'finalized' ? myFinalizedMatches : myUpcomingMatches;
  }, [tab, mineTab, openMatches, pendingMatches, paginatedFinalizedMatches, myFinalizedMatches, myUpcomingMatches]);

  const emptyMessage = useMemo(() => {
    if (tab === 'open') return 'Nenhuma partida com inscrições abertas.';
    if (tab === 'pending') return 'Nenhuma partida pendente de chamada.';
    if (tab === 'finalized') return 'Nenhuma partida finalizada.';
    if (!state.playerId) return 'Complete seu perfil para ver suas partidas.';
    return mineTab === 'finalized'
      ? 'Nenhuma partida finalizada.'
      : 'Nenhuma partida inscrita.';
  }, [tab, mineTab, state.playerId]);

  if (isError) {
    return (
      <div className="p-6">
        <QueryErrorCard
          message={(error as Error)?.message || 'Falha ao carregar partidas.'}
          action={
            <button
              className="px-4 py-2 bg-[#00F0FF]/10 border-2 border-[#00F0FF] rounded-lg text-[#00F0FF] font-mono-technical text-xs uppercase hover:bg-[#00F0FF]/20 transition-all"
              onClick={() => void refetch()}
            >
              [ TENTAR NOVAMENTE ]
            </button>
          }
        />
      </div>
    );
  }

  return (
    <div className="px-4 py-6 space-y-4">
      <div className="flex flex-col gap-4 items-start justify-between">
        <div>
          <h2 className="text-sm font-mono-technical tracking-wider uppercase text-[#7F94B0]">Partidas</h2>
          <p className="text-xs text-[#7F94B0]">Controle de presença e reputação.</p>
        </div>
        {state.isAdmin ? (
          <TacticalButton fullWidth variant="cyan" onClick={() => {
            setActionError(null);
            setCreateOpen(true);
          }}>
            [ CRIAR PARTIDA ]
          </TacticalButton>
        ) : null}
      </div>

      <div className={`grid gap-2 ${state.isAdmin ? 'grid-cols-4' : 'grid-cols-2'}`}>
        <button
          onClick={() => setTab('open')}
          className={`clip-tactical p-3 border-2 transition-all rounded-lg ${
            tab === 'open'
              ? 'border-[#00F0FF] bg-[#00F0FF]/20'
              : 'border-[#2D3A52] bg-[#0B0E14] hover:border-[#00F0FF]/50'
          }`}
        >
          <span className={`font-mono-technical text-xs uppercase ${tab === 'open' ? 'text-[#00F0FF]' : 'text-[#7F94B0]'}`}>
            Abertas
          </span>
        </button>
        <button
          onClick={() => setTab('mine')}
          className={`clip-tactical p-3 border-2 transition-all rounded-lg ${
            tab === 'mine'
              ? 'border-[#D4A536] bg-[#D4A536]/20'
              : 'border-[#2D3A52] bg-[#0B0E14] hover:border-[#D4A536]/50'
          }`}
        >
          <span className={`font-mono-technical text-xs uppercase ${tab === 'mine' ? 'text-[#D4A536]' : 'text-[#7F94B0]'}`}>
            Minhas Partidas
          </span>
        </button>
        {state.isAdmin ? (
          <button
            onClick={() => setTab('finalized')}
            className={`clip-tactical p-3 border-2 transition-all rounded-lg ${
              tab === 'finalized'
                ? 'border-[#00F0FF] bg-[#00F0FF]/20'
                : 'border-[#2D3A52] bg-[#0B0E14] hover:border-[#00F0FF]/50'
            }`}
          >
            <span className={`font-mono-technical text-xs uppercase ${tab === 'finalized' ? 'text-[#00F0FF]' : 'text-[#7F94B0]'}`}>
              Finalizadas
            </span>
          </button>
        ) : null}
        {state.isAdmin ? (
          <button
            onClick={() => setTab('pending')}
            className={`clip-tactical p-3 border-2 transition-all rounded-lg ${
              tab === 'pending'
                ? 'border-[#D4A536] bg-[#D4A536]/20'
                : 'border-[#2D3A52] bg-[#0B0E14] hover:border-[#D4A536]/50'
            }`}
          >
            <span className={`font-mono-technical text-xs uppercase ${tab === 'pending' ? 'text-[#D4A536]' : 'text-[#7F94B0]'}`}>
              Pendentes
            </span>
          </button>
        ) : null}
      </div>

      {tab === 'mine' ? (
        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={() => setMineTab('upcoming')}
            className={`clip-tactical p-2 border transition-all rounded-lg ${
              mineTab === 'upcoming'
                ? 'border-[#00F0FF] bg-[#00F0FF]/15'
                : 'border-[#2D3A52] bg-[#0B0E14] hover:border-[#00F0FF]/50'
            }`}
          >
            <span className={`font-mono-technical text-[10px] uppercase ${mineTab === 'upcoming' ? 'text-[#00F0FF]' : 'text-[#7F94B0]'}`}>
              Próximas Missões
            </span>
          </button>
          <button
            onClick={() => setMineTab('finalized')}
            className={`clip-tactical p-2 border transition-all rounded-lg ${
              mineTab === 'finalized'
                ? 'border-[#00F0FF] bg-[#00F0FF]/15'
                : 'border-[#2D3A52] bg-[#0B0E14] hover:border-[#00F0FF]/50'
            }`}
          >
            <span className={`font-mono-technical text-[10px] uppercase ${mineTab === 'finalized' ? 'text-[#00F0FF]' : 'text-[#7F94B0]'}`}>
              Finalizadas
            </span>
          </button>
        </div>
      ) : null}

      {isLoading ? (
        <Spinner label="carregando partidas" />
      ) : (
        <div className="space-y-4">
          {(tab === 'mine' && !state.playerId ? [] : visibleMatches).map(({ match, dateLabel, timeLabel, isClosed, isFinalized, statusLabel }) => (
            <div
              key={match.id}
              className={`clip-tactical-card bg-[#141A26] border-x-4 border-[#2D3A52] p-4 space-y-3 ${
                state.isAdmin ? 'cursor-pointer hover:shadow-[0_0_18px_rgba(0,240,255,0.15)] transition-shadow' : ''
              }`}
              role={state.isAdmin ? 'button' : undefined}
              tabIndex={state.isAdmin ? 0 : undefined}
              onClick={state.isAdmin ? () => navigate(`/partidas/${match.id}`) : undefined}
              onKeyDown={state.isAdmin ? (event) => {
                if (event.key === 'Enter' || event.key === ' ') {
                  event.preventDefault();
                  navigate(`/partidas/${match.id}`);
                }
              } : undefined}
            >
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm text-[#E6F1FF] uppercase">{match.name}</div>
                  <div className="text-xs text-[#7F94B0] font-mono-technical">
                    DATA: {dateLabel} // HORA: {timeLabel}
                  </div>
                </div>
                <span
                  className={`text-xs font-mono-technical uppercase ${
                    isFinalized
                      ? 'text-[#00F0FF]'
                      : isClosed
                        ? 'text-[#D4A536]'
                        : 'text-[#7F94B0]'
                  }`}
                >
                  {statusLabel}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs text-[#7F94B0] font-mono-technical">
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4 text-[#00F0FF]" />
                  {match.subscriptionCount} inscritos
                </div>
                <div className="flex items-center gap-2">
                  <Shield className="w-4 h-4 text-[#D4A536]" />
                  {match.rentEquipmentCount} aluguel
                </div>
              </div>

              <div className="flex flex-wrap gap-2">
                <TacticalButton
                  variant="amber"
                  disabled={isClosed || isFinalized || match.isSubscribed}
                  onClick={(event) => {
                    event.stopPropagation();
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
                    setSubscribeMatch(match);
                  }}
                >
                  {match.isSubscribed ? '[ INSCRITO ]' : '[ PARTICIPAR ]'}
                </TacticalButton>

                {state.isAdmin && !isFinalized && isClosed ? (
                  <TacticalButton
                    variant="cyan"
                    onClick={(event) => {
                      event.stopPropagation();
                      navigate(`/partidas/${match.id}`);
                    }}
                  >
                    [ CHAMADA ]
                  </TacticalButton>
                ) : null}
              </div>
            </div>
          ))}

          {(tab === 'mine' && !state.playerId ? true : visibleMatches.length === 0) && (
            <div className="bg-[#141A26] border border-[#2D3A52] rounded-lg p-6 text-center text-xs text-[#7F94B0]">
              {emptyMessage}
            </div>
          )}

          {tab === 'finalized' && adminFinalizedMatches.length > 0 && (
            <div className="flex items-center justify-center gap-2 pt-2">
              <button
                onClick={() => setFinalizedPage(Math.max(1, finalizedPage - 1))}
                disabled={finalizedPage === 1}
                className="px-3 py-1 bg-[#141A26] border border-[#2D3A52] rounded text-[#00F0FF] font-mono-technical text-xs disabled:opacity-30 disabled:cursor-not-allowed hover:border-[#00F0FF] transition-colors"
              >
                {'<'}
              </button>
              <span className="text-xs font-mono-technical text-[#7F94B0]">
                {finalizedPage} / {finalizedTotalPages}
              </span>
              <button
                onClick={() => setFinalizedPage(Math.min(finalizedTotalPages, finalizedPage + 1))}
                disabled={finalizedPage >= finalizedTotalPages}
                className="px-3 py-1 bg-[#141A26] border border-[#2D3A52] rounded text-[#00F0FF] font-mono-technical text-xs disabled:opacity-30 disabled:cursor-not-allowed hover:border-[#00F0FF] transition-colors"
              >
                {'>'}
              </button>
            </div>
          )}
        </div>
      )}

      <Dialog open={createOpen} onOpenChange={(open) => {
        if (!open) {
          setMatchName('');
          setMatchDate(null);
          setMatchTime('');
          setActionError(null);
        }
        setCreateOpen(open);
      }}>
        <DialogContent className="bg-[#0B0E14] border border-[#2D3A52]">
          <DialogHeader>
            <DialogTitle className="text-[#E6F1FF] font-mono-technical uppercase">[ Nova Partida ]</DialogTitle>
            <DialogDescription className="text-[#7F94B0]">
              Defina o nome, a data e o horário de início.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <label className="block text-xs text-[#7F94B0] font-mono-technical uppercase mb-2">
                Nome da Partida
              </label>
              <input
                value={matchName}
                onChange={(e) => setMatchName(e.target.value)}
                className="w-full bg-[#141A26] border border-[#2D3A52] rounded-lg px-4 py-3 text-[#E6F1FF] font-mono-technical text-sm focus:border-[#00F0FF] focus:outline-none"
                placeholder="Operação Trovão"
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
                      {matchDate
                        ? matchDate.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' })
                        : 'Selecionar data'}
                    </span>
                    <CalendarDays className="w-4 h-4 text-[#7F94B0]" />
                  </PopoverTrigger>
                  <PopoverContent className="bg-[#0B0E14] border border-[#2D3A52] p-0 z-[60]" align="start">
                    <Calendar
                      mode="single"
                      selected={matchDate ?? undefined}
                      onSelect={(date) => setMatchDate(date ?? null)}
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
                <Select value={matchTime} onValueChange={setMatchTime}>
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
            <TacticalButton variant="cyan" onClick={() => setCreateOpen(false)}>
              Cancelar
            </TacticalButton>
            <TacticalButton
              variant="amber"
              onClick={() => createMatch.mutate()}
              disabled={createMatch.isPending}
              leftIcon={
                createMatch.isPending ? (
                  <span className="inline-block w-4 h-4 border-2 border-current border-t-transparent border-l-transparent rounded-full animate-spin" />
                ) : undefined
              }
            >
              {createMatch.isPending ? '[ CRIANDO... ]' : '[ CRIAR PARTIDA ]'}
            </TacticalButton>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={Boolean(subscribeMatch)} onOpenChange={(open) => {
        if (!open) {
          setSubscribeMatch(null);
          setRentEquipment(false);
          setActionError(null);
        }
      }}>
        <DialogContent className="bg-[#0B0E14] border border-[#2D3A52]">
          <DialogHeader>
            <DialogTitle className="text-[#E6F1FF] font-mono-technical uppercase">[ Confirmar Participação ]</DialogTitle>
            <DialogDescription className="text-[#7F94B0]">
              Confirme sua inscrição para a partida.
            </DialogDescription>
          </DialogHeader>

          {subscribeMatch ? (
            <div className="space-y-4">
              <div className="bg-[#141A26] border border-[#2D3A52] rounded-lg p-3 space-y-2">
                <div className="text-sm text-[#E6F1FF] uppercase">{subscribeMatch.name}</div>
                <div className="text-xs text-[#7F94B0] font-mono-technical">
                  DATA: {formatDateTime(subscribeMatch.startAt).dateLabel} // HORA:{' '}
                  {formatDateTime(subscribeMatch.startAt).timeLabel}
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
          ) : null}

          <DialogFooter>
            <TacticalButton variant="cyan" onClick={() => setSubscribeMatch(null)}>
              Cancelar
            </TacticalButton>
            <TacticalButton
              variant="amber"
              onClick={() => subscribe.mutate()}
              disabled={subscribe.isPending}
              leftIcon={
                subscribe.isPending ? (
                  <span className="inline-block w-4 h-4 border-2 border-current border-t-transparent border-l-transparent rounded-full animate-spin" />
                ) : undefined
              }
            >
              {subscribe.isPending ? '[ CONFIRMANDO... ]' : '[ CONFIRMAR PARTICIPAÇÃO ]'}
            </TacticalButton>
          </DialogFooter>
        </DialogContent>
      </Dialog>

    </div>
  );
}
