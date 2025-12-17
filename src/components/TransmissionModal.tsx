import { useEffect, useState, useTransition } from 'react';
import { X, Lock, AlertTriangle, Award, Search, User } from 'lucide-react';
import { TacticalButton } from './TacticalButton';
import { Spinner } from './Spinner';

export interface TransmissionPlayer {
  id: string;
  name: string;
  nickname: string;
  avatar?: string;
}

interface TransmissionModalProps {
  isOpen: boolean;
  onClose: () => void;
  players: TransmissionPlayer[];
  preSelectedPlayerId?: string | null;
  onSubmit: (data: {
    targetId: string;
    type: 'report' | 'praise';
    content: string;
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
  lockedType?: 'report' | 'praise';
  initialContent?: string;
}

export function TransmissionModal({
  isOpen,
  onClose,
  players,
  preSelectedPlayerId,
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
  lockedType,
  initialContent,
}: TransmissionModalProps) {
  const [step, setStep] = useState<'select' | 'type' | 'details'>('select');
  const [selectedTarget, setSelectedTarget] = useState<TransmissionPlayer | null>(null);
  const [reportType, setReportType] = useState<'report' | 'praise' | null>(null);
  const [content, setContent] = useState('');
  const canSearch = searchTerm.trim().length >= minChars;
  const [, startTransition] = useTransition();
  // Initialize with pre-selected/locked player if provided
  useEffect(() => {
    if (isOpen && (preSelectedPlayerId || lockedTargetId)) {
      const targetId = lockedTargetId || preSelectedPlayerId;
      const player = players.find((p) => p.id === targetId);
      if (player) {
        setSelectedTarget(player);
        setStep(lockedType ? 'details' : 'type');
      }
    }
  }, [isOpen, preSelectedPlayerId, lockedTargetId, players, lockedType]);

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

  // Reset on close
  useEffect(() => {
    if (!isOpen) {
      setStep('select');
      setSelectedTarget(null);
      setReportType(null);
      setContent('');
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSelectPlayer = (player: TransmissionPlayer) => {
    if (lockedTargetId) return;
    setSelectedTarget(player);
    setStep('type');
  };

  const handleSelectType = (type: 'report' | 'praise') => {
    if (lockedType) return;
    if (reportType === type && step === 'details') return;
    startTransition(() => {
      setReportType(type);
      setStep('details');
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedTarget && reportType && content.trim() && !submitting) {
      onSubmit({
        targetId: selectedTarget.id,
        type: reportType,
        content: content.trim(),
      });
    }
  };

  const canSubmit = selectedTarget && reportType && content.trim() && !submitting;

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 sm:p-0">
      <div className="w-full max-w-lg bg-[#0B0E14] border sm:border border-[#2D3A52] rounded-lg max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-[#0B0E14] border-b border-[#2D3A52] p-4 flex items-center justify-between">
          <h2 className="font-mono-technical tracking-wider uppercase text-[#E6F1FF]">
            [ Nova Transmissão ]
          </h2>
          <button
            onClick={onClose}
            className="text-[#7F94B0] hover:text-[#E6F1FF] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 space-y-4">
          {/* Security Notice */}
          <div className="bg-[#00F0FF]/10 border border-[#00F0FF]/30 rounded-lg p-3 flex items-start gap-3">
            <Lock className="w-4 h-4 text-[#00F0FF] flex-shrink-0 mt-0.5" />
            <p className="text-xs text-[#E6F1FF]">
              Sua identidade está protegida. A transmissão é anônima.
            </p>
          </div>

          {/* Step 1: Select Player (or show selected) */}
          {step === 'select' ? (
            <div>
              <label className="block text-xs text-[#7F94B0] font-mono-technical uppercase mb-2">
                Selecione o Operador Alvo
              </label>

              {/* Search */}
              <div className="relative mb-3">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#7F94B0]" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => onSearchTermChange(e.target.value)}
                  disabled={Boolean(lockedTargetId)}
                  placeholder="Buscar..."
                  className="w-full bg-[#141A26] border border-[#2D3A52] rounded-lg pl-10 pr-4 py-2 text-[#E6F1FF] font-mono-technical text-sm focus:border-[#00F0FF] focus:outline-none transition-colors"
                />
              </div>

              {/* Player List */}
              {lockedTargetId && selectedTarget ? (
                <div className="bg-[#141A26] border border-[#00F0FF] rounded-lg p-3 flex items-center gap-3">
                  <div className="w-10 h-11 bg-[#00F0FF] clip-hexagon-perfect p-[2px]">
                    <div className="w-full h-full bg-[#0B0E14] clip-hexagon-perfect flex items-center justify-center">
                      {selectedTarget.avatar ? (
                        <img src={selectedTarget.avatar} alt={selectedTarget.nickname} className="w-full h-full object-cover clip-hexagon-perfect" />
                      ) : (
                        <User className="w-5 h-5 text-[#7F94B0]" />
                      )}
                    </div>
                  </div>
                  <div>
                    <div className="text-sm text-[#E6F1FF]">{selectedTarget.nickname}</div>
                    <div className="text-xs text-[#7F94B0] font-mono-technical">{selectedTarget.name}</div>
                  </div>
                  <div className="ml-auto text-xs text-[#7F94B0] font-mono-technical">Alvo bloqueado</div>
                </div>
              ) : canSearch ? (
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {isLoading
                    ? <Spinner />
                    : players.length ? (
                      players.map((player) => (
                        <button
                          key={player.id}
                          onClick={() => handleSelectPlayer(player)}
                          className="w-full  clip-tactical-card bg-[#141A26] border-x-3 border-[#2D3A52] p-3 hover:border-[#00F0FF]/50 transition-all flex items-center gap-3 text-left"
                        >
                          <div className="w-16 h-18 bg-[#00F0FF] clip-hexagon-perfect p-[2px]">
                            <div className="w-full h-full bg-[#0B0E14] clip-hexagon-perfect flex items-center justify-center">
                              {player.avatar ? (
                                <img src={player.avatar} alt={player.nickname} className="w-full h-full object-cover clip-hexagon-perfect" />
                              ) : (
                                <User className="w-5 h-5 text-[#7F94B0]" />
                              )}
                            </div>
                          </div>
                          <div>
                            <div className="text-sm text-[#E6F1FF]">{player.nickname}</div>
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
              {canSearch && total > pageSize ? (
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
            </div>
          ) : (
            <div>
              <label className="block text-xs text-[#7F94B0] font-mono-technical uppercase mb-2">
                Operador Selecionado
              </label>
              <div className="bg-[#141A26] border border-[#00F0FF] rounded-lg p-3 flex items-center gap-3">
                <div className="w-10 h-11 bg-[#00F0FF] clip-hexagon-perfect p-[2px]">
                  <div className="w-full h-full bg-[#0B0E14] clip-hexagon-perfect flex items-center justify-center">
                    {selectedTarget?.avatar ? (
                      <img src={selectedTarget.avatar} alt={selectedTarget.nickname} className="w-full h-full object-cover clip-hexagon-perfect" />
                    ) : (
                      <User className="w-5 h-5 text-[#7F94B0]" />
                    )}
                  </div>
                </div>
                <div className="flex-1">
                  <div className="text-sm text-[#E6F1FF]">{selectedTarget?.nickname}</div>
                  <div className="text-xs text-[#7F94B0] font-mono-technical">{selectedTarget?.name}</div>
                </div>
                <button
                  onClick={() => {
                    setSelectedTarget(null);
                    setStep('select');
                    setReportType(null);
                  }}
                  className="text-[#FF6B00] hover:text-[#FF6B00]/80 font-mono-technical text-xs"
                >
                  [ TROCAR ]
                </button>
              </div>
            </div>
          )}

          {/* Step 2: Select Type */}
          {selectedTarget && step !== 'select' && (
            <div>
              <label className="block text-xs text-[#7F94B0] font-mono-technical uppercase mb-2">
                Tipo de Transmissão
              </label>
              <div className="grid grid-cols-2 gap-3">
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
