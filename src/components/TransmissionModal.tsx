import { useState, useEffect } from 'react';
import { X, Lock, AlertTriangle, Award, Search, User } from 'lucide-react';
import { TacticalButton } from './TacticalButton';

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
    submitterName: string;
    submitterCPF: string;
    submitterPhoto: File | null;
  }) => void;
  onSuccess: () => void;
}

export function TransmissionModal({ isOpen, onClose, players, preSelectedPlayerId, onSubmit, onSuccess }: TransmissionModalProps) {
  const [step, setStep] = useState<'select' | 'type' | 'details'>('select');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTarget, setSelectedTarget] = useState<TransmissionPlayer | null>(null);
  const [reportType, setReportType] = useState<'report' | 'praise' | null>(null);
  const [content, setContent] = useState('');
  const [submitterName, setSubmitterName] = useState('');
  const [submitterCPF, setSubmitterCPF] = useState('');
  const [submitterPhoto, setSubmitterPhoto] = useState<File | null>(null);

  // Initialize with pre-selected player if provided
  useEffect(() => {
    if (isOpen && preSelectedPlayerId) {
      const player = players.find(p => p.id === preSelectedPlayerId);
      if (player) {
        setSelectedTarget(player);
        setStep('type');
      }
    }
  }, [isOpen, preSelectedPlayerId, players]);

  // Reset on close
  useEffect(() => {
    if (!isOpen) {
      setStep('select');
      setSearchTerm('');
      setSelectedTarget(null);
      setReportType(null);
      setContent('');
      setSubmitterName('');
      setSubmitterCPF('');
      setSubmitterPhoto(null);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const filteredPlayers = players.filter(p => 
    p.nickname.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSelectPlayer = (player: TransmissionPlayer) => {
    setSelectedTarget(player);
    setStep('type');
  };

  const handleSelectType = (type: 'report' | 'praise') => {
    setReportType(type);
    setStep('details');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedTarget && reportType && content.trim() && submitterName.trim() && submitterCPF.trim() && submitterPhoto) {
      onSubmit({
        targetId: selectedTarget.id,
        type: reportType,
        content: content.trim(),
        submitterName: submitterName.trim(),
        submitterCPF: submitterCPF.trim(),
        submitterPhoto,
      });
      onSuccess();
      onClose();
    }
  };

  const canSubmit = selectedTarget && reportType && content.trim() && submitterName.trim() && submitterCPF.trim() && submitterPhoto;

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
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Buscar..."
                  className="w-full bg-[#141A26] border border-[#2D3A52] rounded-lg pl-10 pr-4 py-2 text-[#E6F1FF] font-mono-technical text-sm focus:border-[#00F0FF] focus:outline-none transition-colors"
                />
              </div>

              {/* Player List */}
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {filteredPlayers.map((player) => (
                  <button
                    key={player.id}
                    onClick={() => handleSelectPlayer(player)}
                    className="w-full bg-[#141A26] border border-[#2D3A52] rounded-lg p-3 hover:border-[#00F0FF]/50 transition-all flex items-center gap-3 text-left"
                  >
                    <div className="w-10 h-10 bg-[#00F0FF] clip-hexagon p-[2px]">
                      <div className="w-full h-full bg-[#0B0E14] clip-hexagon flex items-center justify-center">
                        {player.avatar ? (
                          <img src={player.avatar} alt={player.nickname} className="w-full h-full object-cover clip-hexagon" />
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
                ))}
              </div>
            </div>
          ) : (
            <div>
              <label className="block text-xs text-[#7F94B0] font-mono-technical uppercase mb-2">
                Operador Selecionado
              </label>
              <div className="bg-[#141A26] border border-[#00F0FF] rounded-lg p-3 flex items-center gap-3">
                <div className="w-10 h-10 bg-[#00F0FF] clip-hexagon p-[2px]">
                  <div className="w-full h-full bg-[#0B0E14] clip-hexagon flex items-center justify-center">
                    {selectedTarget?.avatar ? (
                      <img src={selectedTarget.avatar} alt={selectedTarget.nickname} className="w-full h-full object-cover clip-hexagon" />
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
                <button
                  type="button"
                  onClick={() => handleSelectType('report')}
                  className={`clip-tactical p-4 border-2 transition-all rounded-lg ${
                    reportType === 'report'
                      ? 'border-[#D4A536] bg-[#D4A536]/20'
                      : 'border-[#2D3A52] bg-[#141A26] hover:border-[#D4A536]'
                  }`}
                >
                  <div className="flex items-center justify-center gap-2 mb-2">
                    <AlertTriangle className={`w-5 h-5 ${reportType === 'report' ? 'text-[#D4A536]' : 'text-[#7F94B0]'}`} />
                  </div>
                  <div className={`font-mono-technical text-xs uppercase ${reportType === 'report' ? 'text-[#D4A536]' : 'text-[#7F94B0]'}`}>
                    Denúncia
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => handleSelectType('praise')}
                  className={`clip-tactical p-4 border-2 transition-all rounded-lg ${
                    reportType === 'praise'
                      ? 'border-[#00F0FF] bg-[#00F0FF]/20'
                      : 'border-[#2D3A52] bg-[#141A26] hover:border-[#00F0FF]'
                  }`}
                >
                  <div className="flex items-center justify-center gap-2 mb-2">
                    <Award className={`w-5 h-5 ${reportType === 'praise' ? 'text-[#00F0FF]' : 'text-[#7F94B0]'}`} />
                  </div>
                  <div className={`font-mono-technical text-xs uppercase ${reportType === 'praise' ? 'text-[#00F0FF]' : 'text-[#7F94B0]'}`}>
                    Elogio
                  </div>
                </button>
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
              >
                [ TRANSMITIR REGISTRO ]
              </TacticalButton>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}