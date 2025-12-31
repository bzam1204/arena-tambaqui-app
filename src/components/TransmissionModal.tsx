import { useCallback, useEffect, useMemo, useState, useTransition } from 'react';
import { X, Lock, AlertTriangle, Award, Search, User, CalendarDays } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { TacticalButton } from './TacticalButton';
import { Spinner } from './Spinner';
import { PlayerAvatar } from './PlayerAvatar';
import { VipBadge } from './VipBadge';
import type { MatchGateway, MatchOption } from '@/app/gateways/MatchGateway';
import type { TransmissionGateway } from '@/app/gateways/TransmissionGateway';
import { Inject, TkMatchGateway, TkTransmissionGateway } from '@/infra/container';

export interface TransmissionPlayer {
  id: string;
  targetId?: string;
  name: string;
  nickname: string;
  avatar?: string;
  avatarFrame?: string | null;
  isVip?: boolean;
}

interface TransmissionModalProps {
  isOpen: boolean;
  onClose: () => void;
  players: TransmissionPlayer[];
  preSelectedPlayerId?: string | null;
  submitterId?: string | null;
  onSubmit: (data: {
    targetId: string;
    type: 'report' | 'praise';
    content: string;
    matchId?: string | null;
  }) => void;
  submitting?: boolean;
  searchTerm: string;
  onSearchTermChange: (term: string) => void;
  isLoading?: boolean;
  minChars?: number;
  page: number;
  pageSize: number;
  total: number;
  onPageChange: (page: number) => void;
  lockedTargetId?: string | null;
  lockedTarget?: TransmissionPlayer | null;
  lockedType?: 'report' | 'praise';
  initialContent?: string;
  prefillLoading?: boolean;
  eligibleMatches?: MatchOption[];
  eligibleMatchesLoading?: boolean;
  requireMatch?: boolean;
}

export function TransmissionModal({
  isOpen,
  onClose,
  players,
  preSelectedPlayerId,
  submitterId,
  onSubmit,
  submitting = false,
  searchTerm,
  onSearchTermChange,
  isLoading,
  minChars = 2,
  page,
  pageSize,
  total,
  onPageChange,
  lockedTargetId,
  lockedTarget,
  lockedType,
  initialContent,
  prefillLoading = false,
  eligibleMatches = [],
  eligibleMatchesLoading = false,
  requireMatch = false,
}: TransmissionModalProps) {
  const matchGateway = Inject<MatchGateway>(TkMatchGateway);
  const transmissionGateway = Inject<TransmissionGateway>(TkTransmissionGateway);
  const [step, setStep] = useState<'match' | 'player' | 'type' | 'details'>(requireMatch ? 'match' : 'player');
  const [selectedTarget, setSelectedTarget] = useState<TransmissionPlayer | null>(null);
  const [reportType, setReportType] = useState<'report' | 'praise' | null>(null);
  const [content, setContent] = useState('');
  const [selectedMatchId, setSelectedMatchId] = useState<string | null>(null);
  const canSearch = !lockedTargetId && (requireMatch ? true : searchTerm.trim().length >= minChars);
  const [, startTransition] = useTransition();
  const isVisible = isOpen || submitting; // keep mounted while submitting to show loading state

  const handleSelectMatch = useCallback(
    (value: string | null) => {
      setSelectedMatchId(value);
      setSelectedTarget(null);
      setReportType(null);
      setContent('');
      setStep(value ? 'player' : 'match');
      if (searchTerm) onSearchTermChange('');
    },
    [onSearchTermChange, searchTerm],
  );

  // Initialize type/content when locked or provided
  useEffect(() => {
    if (!isOpen) return;
    if (lockedType) {
      setReportType(lockedType);
      setStep('details');
    }
    if (typeof initialContent === 'string') {
      setContent(initialContent);
    }
  }, [isOpen, lockedType, initialContent]);

  useEffect(() => {
    if (!isOpen) return;
    setStep(requireMatch ? 'match' : 'player');
  }, [isOpen, requireMatch]);

  // Reset on close (but keep state while submitting to show loading)
  useEffect(() => {
    if (!isOpen && !submitting) {
      setStep(requireMatch ? 'match' : 'player');
      setSelectedTarget(null);
      setReportType(null);
      setContent('');
      setSelectedMatchId(null);
    }
  }, [isOpen, submitting, requireMatch]);

  useEffect(() => {
    if (!isOpen || !requireMatch) return;
    if (!selectedMatchId) return;
    const stillValid = eligibleMatches.some((match) => match.id === selectedMatchId);
    if (!stillValid) {
      handleSelectMatch(null);
    }
  }, [eligibleMatches, handleSelectMatch, isOpen, requireMatch, selectedMatchId]);

  const { data: matchAttendance = [], isLoading: matchPlayersLoading, isError: matchPlayersIsError, error: matchPlayersError } = useQuery({
    queryKey: ['matches', 'attendance', selectedMatchId],
    queryFn: () => matchGateway.listAttendance(selectedMatchId as string),
    enabled: isOpen && requireMatch && Boolean(selectedMatchId),
  });
  const {
    data: transmittedTargets = [],
    isLoading: transmittedLoading,
    isError: transmittedIsError,
    error: transmittedError,
  } = useQuery({
    queryKey: ['transmissions', 'targets', submitterId, selectedMatchId],
    queryFn: () =>
      transmissionGateway.listTransmittedTargets({
        submitterId: submitterId as string,
        matchId: selectedMatchId as string,
      }),
    enabled: isOpen && requireMatch && Boolean(selectedMatchId) && Boolean(submitterId),
  });

  const matchRoster = useMemo(() => {
    if (!requireMatch) return players;
    return (matchAttendance ?? [])
      .map((entry) => {
        const isGuest = Boolean(entry.isGuest);
        const invitedBy = entry.invitedByNickname || entry.invitedByName;
        const targetId = isGuest ? entry.responsiblePlayerId ?? entry.invitedByPlayerId ?? entry.playerId : undefined;
        return {
          id: entry.playerId,
          targetId,
          name: isGuest && invitedBy ? `Convidado de ${invitedBy}` : entry.playerName,
          nickname: entry.playerNickname,
          avatar: entry.playerAvatar ?? undefined,
          avatarFrame: entry.playerAvatarFrame ?? null,
          isVip: entry.playerIsVip ?? false,
        };
      })
      .filter((player) => (player.targetId ?? player.id) !== submitterId);
  }, [matchAttendance, players, requireMatch, submitterId]);
  const transmittedTargetSet = useMemo(() => new Set(transmittedTargets), [transmittedTargets]);
  const resolveTargetId = useCallback((player: TransmissionPlayer) => player.targetId ?? player.id, []);
  const availablePlayers = useMemo(() => {
    if (!requireMatch) return matchRoster;
    return matchRoster.filter((player) => !transmittedTargetSet.has(resolveTargetId(player)));
  }, [matchRoster, requireMatch, resolveTargetId, transmittedTargetSet]);
  const playerListLoading = requireMatch ? (matchPlayersLoading || transmittedLoading) : isLoading;
  const playerListError = requireMatch ? (matchPlayersIsError || transmittedIsError) : false;
  const playerListErrorMessage = (matchPlayersError as Error)?.message || (transmittedError as Error)?.message;

  const filteredPlayers = useMemo(() => {
    const base = availablePlayers;
    const term = searchTerm.trim().toLowerCase();
    if (!term) return base;
    return base.filter((player) =>
      player.nickname.toLowerCase().includes(term) || player.name.toLowerCase().includes(term),
    );
  }, [availablePlayers, searchTerm]);

  const selectedMatch = useMemo(
    () => eligibleMatches.find((match) => match.id === selectedMatchId) ?? null,
    [eligibleMatches, selectedMatchId],
  );
  const lockedTargetKey = lockedTargetId ?? lockedTarget?.id ?? null;
  const lockedTargetInMatch = useMemo(() => {
    if (!requireMatch || !lockedTargetKey) return true;
    if (!selectedMatchId) return true;
    return matchRoster.some((player) => player.id === lockedTargetKey);
  }, [lockedTargetKey, matchRoster, requireMatch, selectedMatchId]);
  const lockedTargetAlreadyTransmitted = Boolean(lockedTargetKey && transmittedTargetSet.has(lockedTargetKey));
  const lockedTargetDisplay = selectedTarget ?? lockedTarget ?? null;
  const showLockedTargetCard = Boolean(lockedTargetKey) && (!requireMatch || Boolean(selectedTarget));

  // Initialize with pre-selected/locked player if provided
  useEffect(() => {
    if (!isOpen) return;
    if (requireMatch) return;
    if (step !== 'player') return;
    if (lockedTarget) {
      setSelectedTarget(lockedTarget);
      setStep(lockedType ? 'details' : 'type');
      return;
    }
    if (preSelectedPlayerId || lockedTargetId) {
      const targetId = lockedTargetId || preSelectedPlayerId;
      const player = players.find((p) => p.id === targetId);
      if (player) setSelectedTarget(player);
      setStep(lockedType ? 'details' : 'type');
    }
  }, [isOpen, preSelectedPlayerId, lockedTargetId, lockedTarget, players, lockedType, step, requireMatch]);

  useEffect(() => {
    if (!isOpen || !requireMatch) return;
    if (step !== 'player') return;
    if (!selectedMatchId || !matchRoster.length) return;
    const targetId = lockedTargetKey || preSelectedPlayerId;
    if (!targetId || selectedTarget) return;
    const candidate = matchRoster.find((player) => player.id === targetId);
    if (!candidate) return;
    if (transmittedTargetSet.has(candidate.id)) return;
    setSelectedTarget(candidate);
    setStep(lockedType ? 'details' : 'type');
  }, [
    isOpen,
    requireMatch,
    step,
    selectedMatchId,
    matchRoster,
    lockedTargetKey,
    preSelectedPlayerId,
    selectedTarget,
    lockedType,
    transmittedTargetSet,
  ]);

  if (!isVisible) return null;

  const handleSelectPlayer = (player: TransmissionPlayer) => {
    if (lockedTargetId) return;
    if (requireMatch && !selectedMatchId) return;
    if (requireMatch && transmittedTargetSet.has(resolveTargetId(player))) return;
    setSelectedTarget(player);
    setStep('type');
  };

  const selectedTargetAlreadyTransmitted = Boolean(
    selectedTarget && transmittedTargetSet.has(resolveTargetId(selectedTarget)),
  );

  const handleSelectType = (type: 'report' | 'praise') => {
    if (lockedType) return;
    if (selectedTargetAlreadyTransmitted) return;
    if (reportType === type && step === 'details') return;
    startTransition(() => {
      setReportType(type);
      setStep('details');
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedTarget && reportType && content.trim() && !submitting) {
      if (requireMatch && !selectedMatchId) return;
      onSubmit({
        targetId: resolveTargetId(selectedTarget),
        type: reportType,
        content: content.trim(),
        matchId: selectedMatchId,
      });
    }
  };

  const canSubmit =
    selectedTarget &&
    reportType &&
    content.trim() &&
    (!requireMatch || selectedMatchId) &&
    !selectedTargetAlreadyTransmitted &&
    !submitting;
  const matchOptionsEmpty = requireMatch && eligibleMatches.length === 0;
  const formatMatchOption = (match: MatchOption) => {
    const date = new Date(match.startAt);
    const dateLabel = date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: '2-digit' }).replace(/\//g, '.');
    const timeLabel = date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    return `${match.name} - ${dateLabel} / ${timeLabel}`;
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 sm:p-0">
      <div className="w-full max-w-lg bg-[#0B0E14] border sm:border border-[#2D3A52] rounded-lg max-h-[calc(100svh-8rem)] sm:max-h-[calc(100vh-8rem)] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-[#0B0E14] border-b border-[#2D3A52] p-4 flex items-center justify-between">
          <h2 className="font-mono-technical tracking-wider uppercase text-[#E6F1FF]">
            [ Nova Transmissão ]
          </h2>
          <button
            onClick={() => {
              if (submitting) return;
              onClose();
            }}
            disabled={submitting}
            className="text-[#7F94B0] hover:text-[#E6F1FF] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 space-y-4 relative">
          {prefillLoading ? (
            <div className="absolute inset-0 z-20 flex items-center justify-center bg-[#0B0E14]/80">
              <Spinner />
            </div>
          ) : null}
          {/* Security Notice */}
          <div className="bg-[#00F0FF]/10 border border-[#00F0FF]/30 rounded-lg p-3 flex items-start gap-3">
            <Lock className="w-4 h-4 text-[#00F0FF] flex-shrink-0 mt-0.5" />
            <p className="text-xs text-[#E6F1FF]">
              Sua identidade está protegida. A transmissão é anônima.
            </p>
          </div>

          {/* Step 1: Select Match */}
          {requireMatch ? (
            <div>
              <label className="block text-xs text-[#7F94B0] font-mono-technical uppercase mb-2">
                Selecionar Partida (Obrigatorio)
              </label>
              {step === 'match' ? (
                eligibleMatchesLoading ? (
                  <div className="py-6">
                    <Spinner />
                  </div>
                ) : matchOptionsEmpty ? (
                  <div className="flex items-start gap-2 bg-[#2E2819] border border-[#D4A536] text-[#D4A536] text-xs font-mono-technical rounded-lg p-3">
                    <CalendarDays className="w-4 h-4 mt-0.5" />
                    <div>
                      Nenhuma partida elegível encontrada. Só é possível transmitir após comparecer e finalizar a partida.
                    </div>
                  </div>
                ) : (
                  <div className="relative">
                    <select
                      value={selectedMatchId ?? ''}
                      onChange={(e) => handleSelectMatch(e.target.value || null)}
                      className="w-full bg-[#141A26] border border-[#2D3A52] rounded-lg px-4 py-3 text-[#E6F1FF] font-mono-technical text-sm focus:border-[#00F0FF] focus:outline-none transition-colors"
                      required={requireMatch}
                    >
                      <option value="" disabled>
                        Selecionar partida...
                      </option>
                      {eligibleMatches.map((match) => (
                        <option key={match.id} value={match.id}>
                          {formatMatchOption(match)}
                        </option>
                      ))}
                    </select>
                  </div>
                )
              ) : (
                <div className="bg-[#141A26] border border-[#00F0FF] rounded-lg p-3 flex items-center gap-3">
                  <CalendarDays className="w-5 h-5 text-[#00F0FF]" />
                  <div className="flex-1">
                    <div className="text-sm text-[#E6F1FF]">{selectedMatch?.name ?? 'Partida selecionada'}</div>
                    <div className="text-xs text-[#7F94B0] font-mono-technical">
                      {selectedMatch ? formatMatchOption(selectedMatch) : 'Nenhuma partida selecionada'}
                    </div>
                  </div>
                  <button
                    onClick={() => handleSelectMatch(null)}
                    className="text-[#00F0FF] hover:text-[#00F0FF]/80 font-mono-technical text-xs"
                  >
                    [ TROCAR ]
                  </button>
                </div>
              )}
            </div>
          ) : null}

          {/* Step 2: Select Player (or show selected) */}
          {step === 'player' ? (
            <div>
              <label className="block text-xs text-[#7F94B0] font-mono-technical uppercase mb-2">
                Selecione o Operador Alvo
              </label>

              {requireMatch && !selectedMatchId ? (
                <div className="text-center text-xs text-[#7F94B0] font-mono-technical py-4">
                  Selecione uma partida para carregar a chamada.
                </div>
              ) : (
                <>
                  {/* Search */}
                  <div className="relative mb-3">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#7F94B0]" />
                    <input
                      type="text"
                      value={searchTerm}
                      onChange={(e) => onSearchTermChange(e.target.value)}
                      disabled={Boolean(lockedTargetId) || (requireMatch && !selectedMatchId)}
                      placeholder="Buscar..."
                      className={`w-full border rounded-lg pl-10 pr-4 py-2 text-[#E6F1FF] font-mono-technical text-sm focus:border-[#00F0FF] focus:outline-none transition-colors ${lockedTargetId || (requireMatch && !selectedMatchId)
                        ? 'bg-[#111827] border-[#2D3A52]/50 text-[#7F94B0]'
                        : 'bg-[#141A26] border-[#2D3A52]'
                        }`}
                    />
                  </div>

                  {/* Player List */}
                  {showLockedTargetCard && lockedTargetDisplay ? (
                    <div className="bg-[#0F1729] border border-[#2D3A52] rounded-lg p-3 flex items-center gap-3 opacity-80">
                      <PlayerAvatar
                        avatarUrl={lockedTargetDisplay?.avatar}
                        frameUrl={lockedTargetDisplay?.avatarFrame}
                        alt={lockedTargetDisplay?.nickname ?? 'Operador'}
                        sizeClassName="w-10 h-11"
                        accentClassName="bg-[#2D3A52]"
                        paddingClassName="p-[2px]"
                        fallbackIcon={<User className="w-5 h-5 text-[#7F94B0]" />}
                      />
                      <div className="flex-1">
                        <div className="flex flex-wrap items-center gap-2 text-sm text-[#9CA3AF]">
                          <span>{lockedTargetDisplay.nickname}</span>
                          {lockedTargetDisplay.isVip ? <VipBadge size="xs" /> : null}
                        </div>
                        <div className="text-xs text-[#6B7280] font-mono-technical">{lockedTargetDisplay.name}</div>
                      </div>
                      <div className="ml-auto text-xs text-[#6B7280] font-mono-technical">Alvo bloqueado</div>
                    </div>
                  ) : playerListLoading ? (
                    <Spinner />
                  ) : playerListError ? (
                    <div className="text-center text-xs text-[#7F94B0] font-mono-technical py-6">
                      {playerListErrorMessage || 'Falha ao carregar chamada.'}
                    </div>
                  ) : lockedTargetKey && requireMatch && selectedMatchId && lockedTargetAlreadyTransmitted ? (
                    <div className="flex items-start gap-2 bg-[#2E2819] border border-[#D4A536] text-[#D4A536] text-xs font-mono-technical rounded-lg p-3">
                      <AlertTriangle className="w-4 h-4 mt-0.5" />
                      <div>Voce ja transmitiu este operador nesta partida.</div>
                    </div>
                  ) : lockedTargetKey && requireMatch && selectedMatchId && !lockedTargetInMatch ? (
                    <div className="flex items-start gap-2 bg-[#2E2819] border border-[#D4A536] text-[#D4A536] text-xs font-mono-technical rounded-lg p-3">
                      <AlertTriangle className="w-4 h-4 mt-0.5" />
                      <div>Operador nao consta na chamada desta partida.</div>
                    </div>
                  ) : selectedMatchId && requireMatch && availablePlayers.length === 0 ? (
                    <div className="text-center text-xs text-[#7F94B0] font-mono-technical py-6">
                      Nenhum operador disponivel. Voce ja transmitiu todos desta partida.
                    </div>
                  ) : canSearch ? (
                    <div className="space-y-2 max-h-64 overflow-y-auto">
                      {filteredPlayers.length ? (
                        filteredPlayers.map((player) => (
                          <button
                            key={player.id}
                            onClick={() => handleSelectPlayer(player)}
                            className="w-full  clip-tactical-card bg-[#141A26] border-x-3 border-[#2D3A52] p-3 hover:border-[#00F0FF]/50 transition-all flex items-center gap-3 text-left"
                          >
                            <PlayerAvatar
                              avatarUrl={player.avatar}
                              frameUrl={player.avatarFrame}
                              alt={player.nickname}
                              sizeClassName="w-16 h-18"
                              accentClassName="bg-[#00F0FF]"
                              paddingClassName="p-[2px]"
                              fallbackIcon={<User className="w-5 h-5 text-[#7F94B0]" />}
                            />
                            <div>
                              <div className="flex flex-wrap items-center gap-2 text-sm text-[#E6F1FF]">
                                <span>{player.nickname}</span>
                                {player.isVip ? <VipBadge size="xs" /> : null}
                              </div>
                              <div className="text-xs text-[#7F94B0] font-mono-technical">{player.name}</div>
                            </div>
                          </button>
                        ))
                      ) : (
                        <div className="text-center text-xs text-[#7F94B0] font-mono-technical py-6">Nenhum operador encontrado</div>
                      )}
                    </div>
                  ) : (
                    <div className="text-center text-xs text-[#7F94B0] font-mono-technical py-6">
                      Digite ao menos {minChars} caracteres para buscar
                    </div>
                  )}

                  {/* Pagination */}
                  {!requireMatch && canSearch && total > pageSize ? (
                    <div className="flex items-center justify-center gap-2 pt-2">
                      <button
                        onClick={() => onPageChange(Math.max(1, page - 1))}
                        disabled={page === 1}
                        className="px-3 py-1 bg-[#141A26] border border-[#2D3A52] rounded text-[#00F0FF] font-mono-technical text-xs disabled:opacity-30 disabled:cursor-not-allowed hover:border-[#00F0FF] transition-colors"
                      >
                        {'<'}
                      </button>
                      <span className="text-xs font-mono-technical text-[#7F94B0]">
                        {page} / {Math.max(1, Math.ceil(total / pageSize))}
                      </span>
                      <button
                        onClick={() => onPageChange(Math.min(Math.max(1, Math.ceil(total / pageSize)), page + 1))}
                        disabled={page >= Math.max(1, Math.ceil(total / pageSize))}
                        className="px-3 py-1 bg-[#141A26] border border-[#2D3A52] rounded text-[#00F0FF] font-mono-technical text-xs disabled:opacity-30 disabled:cursor-not-allowed hover:border-[#00F0FF] transition-colors"
                      >
                        {'>'}
                      </button>
                    </div>
                  ) : null}
                </>
              )}
            </div>
          ) : selectedTarget ? (
            <div>
              <label className="block text-xs text-[#7F94B0] font-mono-technical uppercase mb-2">
                Operador Selecionado
              </label>
              <div className="bg-[#141A26] border border-[#00F0FF] rounded-lg p-3 flex items-center gap-3">
                <PlayerAvatar
                  avatarUrl={selectedTarget?.avatar}
                  frameUrl={selectedTarget?.avatarFrame}
                  alt={selectedTarget?.nickname ?? 'Operador'}
                  sizeClassName="w-10 h-11"
                  accentClassName="bg-[#00F0FF]"
                  paddingClassName="p-[2px]"
                  fallbackIcon={<User className="w-5 h-5 text-[#7F94B0]" />}
                />
                <div className="flex-1">
                  <div className="flex flex-wrap items-center gap-2 text-sm text-[#E6F1FF]">
                    <span>{selectedTarget?.nickname}</span>
                    {selectedTarget?.isVip ? <VipBadge size="xs" /> : null}
                  </div>
                  <div className="text-xs text-[#7F94B0] font-mono-technical">{selectedTarget?.name}</div>
                </div>
                {!lockedTarget && !lockedTargetId && (
                  <button
                    onClick={() => {
                      setSelectedTarget(null);
                      setStep('player');
                      setReportType(null);
                    }}
                    className="text-[#FF6B00] hover:text-[#FF6B00]/80 font-mono-technical text-xs"
                  >
                    [ TROCAR ]
                  </button>
                )}
              </div>
            </div>
          ) : null}

          {/* Step 2: Select Type */}
          {selectedTarget && step !== 'player' && (
            <div>
              <label className="block text-xs text-[#7F94B0] font-mono-technical uppercase mb-2">
                Tipo de Transmissão
              </label>
              <div className={`grid grid-cols-2 gap-3 ${lockedType ? 'opacity-60' : ''}`}>
                <div className='container-arrow'>
                  {reportType === 'report' && (<> <svg className='arrow-up ambar-arrow' width="24" height="23" viewBox="0 0 24 23" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M2.41422 22H22.4142V2L2.41422 22Z" stroke="currentColor" strokeWidth="4" strokeLinecap="round" />
                  </svg>
                    <svg className='arrow-down ambar-arrow' width="24" height="23" viewBox="0 0 24 23" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M2.41422 22H22.4142V2L2.41422 22Z" stroke="currentColor" strokeWidth="4" strokeLinecap="round" />
                    </svg></>
                  )}
                  <div className={`clip-tactical-stats ${reportType === 'report' ? 'bg-[#D4A536]  ' : 'text-[#7F94B0] '} rounded-md p-[2px] text-center`}>
                    <div className={`clip-tactical-stats transition-all ${reportType === 'report' ? 'inner-shadow-ambar bg-[#2e2819]!' : 'text-[#7F94B0] bg-[#141A26]'} rounded-md p-2 flex flex-col items-center justify-center h-20 text-center`}>
                      <button type="button" onClick={() => handleSelectType('report')} disabled={Boolean(lockedType)}>
                        <div className={`flex items-center justify-center gap-2 mb-2  ${reportType === 'report' ? 'text-[#D4A536]' : 'text-[#7F94B0]'}`}>
                          [<AlertTriangle className={`w-5 h-5 ${reportType === 'report' ? 'text-[#D4A536]' : 'text-[#7F94B0]'}`} />]
                        </div>
                        <div className={`font-mono-technical text-xs uppercase ${reportType === 'report' ? 'text-[#D4A536]' : 'text-[#7F94B0]'}`}>Denúncia</div>
                      </button>
                    </div>
                  </div>
                </div>
                <div className='container-arrow'>
                  {reportType === 'praise' && (<> <svg className='arrow-up blue-arrow' width="24" height="23" viewBox="0 0 24 23" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M2.41422 22H22.4142V2L2.41422 22Z" stroke="currentColor" strokeWidth="4" strokeLinecap="round" />
                  </svg>
                    <svg className='arrow-down blue-arrow' width="24" height="23" viewBox="0 0 24 23" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M2.41422 22H22.4142V2L2.41422 22Z" stroke="currentColor" strokeWidth="4" strokeLinecap="round" />
                    </svg></>
                  )}
                  <div className={`clip-tactical-stats ${reportType === 'praise' ? 'bg-[#2ad4e0]  ' : 'text-[#7F94B0] '} rounded-md p-[2px] text-center`}>
                    <div className={`clip-tactical-stats transition-all ${reportType === 'praise' ? 'inner-shadow-blue bg-[#153b42]!' : 'text-[#7F94B0] bg-[#141A26]'} rounded-md p-2 flex flex-col items-center justify-center h-20 text-center`}>
                      <button type="button" onClick={() => handleSelectType('praise')} disabled={Boolean(lockedType)}>
                        <div className={`flex items-center justify-center gap-2 mb-2  ${reportType === 'praise' ? 'text-[#00F0FF]' : 'text-[#7F94B0]'}`}>
                          [<Award className={`w-5 h-5 ${reportType === 'praise' ? 'text-[#00F0FF]' : 'text-[#7F94B0]'}`} />]
                        </div>
                        <div className={`font-mono-technical text-xs uppercase ${reportType === 'praise' ? 'text-[#00F0FF]' : 'text-[#7F94B0]'}`}>Elogio</div>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Step 3: Details */}
          {reportType && step === 'details' && (
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Description */}
              <div>
                <label className="block text-xs text-[#7F94B0] font-mono-technical uppercase mb-2">
                  Descrição da Ocorrência
                </label>
                <textarea
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="// Digite os detalhes de forma objetiva..."
                  rows={5}
                  className="w-full bg-[#141A26] border border-[#2D3A52] rounded-lg px-4 py-3 text-[#E6F1FF] font-mono-technical text-sm focus:border-[#00F0FF] focus:outline-none transition-colors resize-none"
                  required
                />
              </div>

              {/* Submit Button */}
              <TacticalButton
                type="submit"
                variant="amber"
                fullWidth
                disabled={!canSubmit}
                leftIcon={
                  submitting ? (
                    <span className="inline-block w-4 h-4 border-2 border-current border-t-transparent border-l-transparent rounded-full animate-spin" />
                  ) : undefined
                }
              >
                {submitting ? '[ TRANSMITINDO... ]' : '[ TRANSMITIR REGISTRO ]'}
              </TacticalButton>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
