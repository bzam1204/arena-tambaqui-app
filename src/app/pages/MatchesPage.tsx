import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { ClipboardCheck, Shield, Users } from 'lucide-react';
import type { MatchAttendanceEntry, MatchSummary } from '@/app/gateways/MatchGateway';
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
  const [attendanceMatch, setAttendanceMatch] = useState<MatchSummary | null>(null);
  const [rentEquipment, setRentEquipment] = useState(false);
  const [matchName, setMatchName] = useState('');
  const [matchDate, setMatchDate] = useState('');
  const [matchTime, setMatchTime] = useState('');
  const [actionError, setActionError] = useState<string | null>(null);

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

  const createMatch = useMutation({
    mutationFn: async () => {
      if (!state.userId) throw new Error('Faça login para criar partidas.');
      if (!state.isAdmin) throw new Error('Apenas administradores podem criar partidas.');
      const trimmedName = matchName.trim();
      if (!trimmedName) throw new Error('Informe o nome da partida.');
      if (!matchDate || !matchTime) throw new Error('Informe data e horário de início.');
      const startAt = new Date(`${matchDate}T${matchTime}`);
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
      setMatchDate('');
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

  const {
    data: attendanceList = [],
    isLoading: attendanceLoading,
    isError: attendanceIsError,
    error: attendanceError,
    refetch: refetchAttendance,
  } = useQuery({
    queryKey: ['matches', 'attendance', attendanceMatch?.id],
    queryFn: () => matchGateway.listAttendance(attendanceMatch?.id as string),
    enabled: Boolean(attendanceMatch?.id),
  });

  const updateAttendance = useMutation({
    mutationFn: (input: { matchId: string; playerId: string; attended: boolean }) =>
      matchGateway.updateAttendance(input),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['matches', 'attendance', attendanceMatch?.id] });
    },
    onError: (err) => setActionError((err as Error).message),
  });

  const finalizeMatch = useMutation({
    mutationFn: async () => {
      if (!attendanceMatch) throw new Error('Selecione uma partida.');
      if (!state.userId) throw new Error('Faça login para finalizar.');
      await matchGateway.finalizeMatch({ matchId: attendanceMatch.id, adminId: state.userId });
    },
    onSuccess: async () => {
      setAttendanceMatch(null);
      setActionError(null);
      await queryClient.invalidateQueries({ queryKey: ['matches'] });
      await queryClient.invalidateQueries({ queryKey: ['matches', 'attendance'] });
    },
    onError: (err) => setActionError((err as Error).message),
  });

  const matchCards = useMemo(() => {
    const now = new Date();
    return matches.map((match) => {
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
    });
  }, [matches]);

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
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-sm font-mono-technical tracking-wider uppercase text-[#7F94B0]">Partidas</h2>
          <p className="text-xs text-[#7F94B0]">Controle de presença e reputação.</p>
        </div>
        {state.isAdmin ? (
          <TacticalButton variant="cyan" onClick={() => {
            setActionError(null);
            setCreateOpen(true);
          }}>
            [ CRIAR PARTIDA ]
          </TacticalButton>
        ) : null}
      </div>

      {isLoading ? (
        <Spinner label="carregando partidas" />
      ) : (
        <div className="space-y-4">
          {matchCards.map(({ match, dateLabel, timeLabel, isClosed, isFinalized, statusLabel }) => (
            <div
              key={match.id}
              className="clip-tactical-card bg-[#141A26] border-x-4 border-[#2D3A52] p-4 space-y-3"
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
                    setSubscribeMatch(match);
                  }}
                >
                  {match.isSubscribed ? '[ INSCRITO ]' : '[ PARTICIPAR ]'}
                </TacticalButton>

                {state.isAdmin && !isFinalized && isClosed ? (
                  <TacticalButton
                    variant="cyan"
                    onClick={() => {
                      setActionError(null);
                      setAttendanceMatch(match);
                    }}
                  >
                    [ CHAMADA ]
                  </TacticalButton>
                ) : null}
              </div>
            </div>
          ))}

          {matchCards.length === 0 && (
            <div className="bg-[#141A26] border border-[#2D3A52] rounded-lg p-6 text-center text-xs text-[#7F94B0]">
              Nenhuma partida cadastrada.
            </div>
          )}
        </div>
      )}

      <Dialog open={createOpen} onOpenChange={(open) => {
        if (!open) {
          setMatchName('');
          setMatchDate('');
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
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-[#7F94B0] font-mono-technical uppercase mb-2">
                  Data de Início
                </label>
                <input
                  type="date"
                  value={matchDate}
                  onChange={(e) => setMatchDate(e.target.value)}
                  className="w-full bg-[#141A26] border border-[#2D3A52] rounded-lg px-4 py-3 text-[#E6F1FF] font-mono-technical text-sm focus:border-[#00F0FF] focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs text-[#7F94B0] font-mono-technical uppercase mb-2">
                  Horário de Início
                </label>
                <input
                  type="time"
                  value={matchTime}
                  onChange={(e) => setMatchTime(e.target.value)}
                  className="w-full bg-[#141A26] border border-[#2D3A52] rounded-lg px-4 py-3 text-[#E6F1FF] font-mono-technical text-sm focus:border-[#00F0FF] focus:outline-none"
                />
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

      <Dialog open={Boolean(attendanceMatch)} onOpenChange={(open) => {
        if (!open) {
          setAttendanceMatch(null);
          setActionError(null);
        }
      }}>
        <DialogContent className="bg-[#0B0E14] border border-[#2D3A52] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-[#E6F1FF] font-mono-technical uppercase">[ Chamada ]</DialogTitle>
            <DialogDescription className="text-[#7F94B0]">
              Marque quem compareceu antes de finalizar.
            </DialogDescription>
          </DialogHeader>

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
                <div className="text-xs text-[#7F94B0] font-mono-technical">
                  Nenhum inscrito para esta partida.
                </div>
              ) : (
                attendanceList.map((entry: MatchAttendanceEntry) => (
                  <div
                    key={entry.playerId}
                    className="bg-[#141A26] border border-[#2D3A52] rounded-lg p-3 flex items-center gap-3"
                  >
                    <div className="w-10 h-11 bg-[#00F0FF] clip-hexagon-perfect p-[2px]">
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
                      {entry.rentEquipment ? (
                        <div className="text-[10px] text-[#D4A536] font-mono-technical">Alugar equipamento</div>
                      ) : null}
                    </div>
                    <label className="flex items-center gap-2 text-xs text-[#7F94B0] font-mono-technical">
                      <Checkbox
                        checked={entry.attended}
                        onCheckedChange={(value) =>
                          updateAttendance.mutate({
                            matchId: entry.matchId,
                            playerId: entry.playerId,
                            attended: Boolean(value),
                          })
                        }
                      />
                      Compareceu?
                    </label>
                  </div>
                ))
              )}
              {actionError ? (
                <div className="text-xs text-[#FF6B00] font-mono-technical">{actionError}</div>
              ) : null}
            </div>
          )}

          <DialogFooter>
            <TacticalButton variant="cyan" onClick={() => setAttendanceMatch(null)}>
              Cancelar
            </TacticalButton>
            <TacticalButton
              variant="amber"
              onClick={() => finalizeMatch.mutate()}
              disabled={finalizeMatch.isPending || attendanceList.length === 0}
              leftIcon={
                finalizeMatch.isPending ? (
                  <span className="inline-block w-4 h-4 border-2 border-current border-t-transparent border-l-transparent rounded-full animate-spin" />
                ) : (
                  <ClipboardCheck className="w-4 h-4" />
                )
              }
            >
              {finalizeMatch.isPending ? '[ FINALIZANDO... ]' : '[ FINALIZAR PARTIDA ]'}
            </TacticalButton>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
