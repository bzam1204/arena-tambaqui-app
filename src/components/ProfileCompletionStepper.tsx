import { useState } from 'react';
import { ChevronRight, User, FileText, CreditCard, Check, Camera, Upload } from 'lucide-react';

interface ProfileCompletionStepperProps {
  onComplete: (data: { nickname: string; name: string; cpf: string; photo: File | null }) => void;
}

export function ProfileCompletionStepper({ onComplete }: ProfileCompletionStepperProps) {
  const [currentStep, setCurrentStep] = useState(1);
  const [nickname, setNickname] = useState('');
  const [name, setName] = useState('');
  const [cpf, setCpf] = useState('');
  const [photo, setPhoto] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string>('');

  const formatCPF = (value: string) => {
    const numbers = value.replace(/\D/g, '');
    if (numbers.length <= 3) return numbers;
    if (numbers.length <= 6) return `${numbers.slice(0, 3)}.${numbers.slice(3)}`;
    if (numbers.length <= 9) return `${numbers.slice(0, 3)}.${numbers.slice(3, 6)}.${numbers.slice(6)}`;
    return `${numbers.slice(0, 3)}.${numbers.slice(3, 6)}.${numbers.slice(6, 9)}-${numbers.slice(9, 11)}`;
  };

  const handleCPFChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatCPF(e.target.value);
    setCpf(formatted);
  };

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setPhoto(file);
      setPhotoPreview(URL.createObjectURL(file));
    }
  };

  const canProceed = () => {
    if (currentStep === 1) return nickname.trim().length >= 3;
    if (currentStep === 2) return name.trim().length >= 3;
    if (currentStep === 3) return cpf.replace(/\D/g, '').length === 11;
    if (currentStep === 4) return photo !== null;
    return false;
  };

  const handleNext = () => {
    if (currentStep < 4) {
      setCurrentStep(currentStep + 1);
    } else if (currentStep === 4 && canProceed()) {
      onComplete({ nickname, name, cpf, photo });
    }
  };

  const steps = [
    { number: 1, title: 'Codinome', icon: User, field: 'nickname' },
    { number: 2, title: 'Nome', icon: FileText, field: 'name' },
    { number: 3, title: 'CPF', icon: CreditCard, field: 'cpf' },
    { number: 4, title: 'Foto', icon: Camera, field: 'photo' },
  ];

  return (
    <div className="min-h-screen bg-[#0B0E14] flex flex-col px-6 py-8">
      {/* Scanlines Effect */}
      <div className="fixed inset-0 pointer-events-none opacity-[0.03]">
        <div className="h-full w-full" style={{
          backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 2px, #00F0FF 2px, #00F0FF 4px)'
        }} />
      </div>

      {/* Header */}
      <div className="mb-8">
        <h1 className="text-xl text-[#E6F1FF] mb-2 text-center">
          [ COMPLETAR PERFIL ]
        </h1>
        <p className="text-xs text-[#7F94B0] font-mono-technical text-center uppercase">
          Configure seu dossiê operacional
        </p>
      </div>

      {/* Progress Steps */}
      <div className="flex items-center justify-center gap-2 mb-12">
        {steps.map((step, index) => (
          <div key={step.number} className="flex items-center">
            <div className="flex flex-col items-center">
              <div
                className={`w-10 h-10 rounded-full border-2 flex items-center justify-center transition-all ${
                  currentStep > step.number
                    ? 'bg-[#00F0FF] border-[#00F0FF] text-[#0B0E14]'
                    : currentStep === step.number
                    ? 'bg-[#00F0FF]/20 border-[#00F0FF] text-[#00F0FF] shadow-[0_0_20px_rgba(0,240,255,0.4)]'
                    : 'bg-[#141A26] border-[#2D3A52] text-[#7F94B0]'
                }`}
              >
                {currentStep > step.number ? (
                  <Check className="w-5 h-5" />
                ) : (
                  <span className="text-sm font-mono-technical">{step.number}</span>
                )}
              </div>
              <span className={`text-[10px] font-mono-technical mt-1 ${
                currentStep >= step.number ? 'text-[#00F0FF]' : 'text-[#7F94B0]'
              }`}>
                {step.title}
              </span>
            </div>
            {index < steps.length - 1 && (
              <div className={`w-12 h-[2px] mx-2 mb-5 ${
                currentStep > step.number ? 'bg-[#00F0FF]' : 'bg-[#2D3A52]'
              }`} />
            )}
          </div>
        ))}
      </div>

      {/* Main Card */}
      <div className="flex-1 flex flex-col">
        <div className="bg-[#141A26] rounded-lg border border-[#2D3A52] p-8 mb-6 relative overflow-hidden">
          {/* Corner Accents */}
          <div className="absolute top-0 left-0 w-12 h-12 border-l-2 border-t-2 border-[#00F0FF]/30" />
          <div className="absolute top-0 right-0 w-12 h-12 border-r-2 border-t-2 border-[#00F0FF]/30" />
          <div className="absolute bottom-0 left-0 w-12 h-12 border-l-2 border-b-2 border-[#00F0FF]/30" />
          <div className="absolute bottom-0 right-0 w-12 h-12 border-r-2 border-b-2 border-[#00F0FF]/30" />

          <div className="relative z-10">
            {/* Step 1: Nickname */}
            {currentStep === 1 && (
              <div className="space-y-6">
                <div className="flex flex-col items-center mb-6">
                  <div className="w-16 h-16 bg-[#00F0FF]/10 border border-[#00F0FF]/30 rounded-full flex items-center justify-center mb-4">
                    <User className="w-8 h-8 text-[#00F0FF]" />
                  </div>
                  <h2 className="text-lg text-[#E6F1FF] mb-2">Codinome Operacional</h2>
                  <p className="text-xs text-[#7F94B0] font-mono-technical text-center">
                    Como você é conhecido no campo de batalha?
                  </p>
                </div>

                <div>
                  <label className="block text-xs text-[#7F94B0] font-mono-technical uppercase mb-2">
                    Seu Codinome
                  </label>
                  <input
                    type="text"
                    value={nickname}
                    onChange={(e) => setNickname(e.target.value)}
                    placeholder='Ex: Carlos "Raptor" Silva'
                    className="w-full bg-[#0B0E14] border border-[#2D3A52] rounded-lg px-4 py-3 text-[#E6F1FF] font-mono-technical text-sm focus:border-[#00F0FF] focus:outline-none transition-colors"
                    autoFocus
                  />
                  <p className="text-xs text-[#7F94B0]/70 font-mono-technical mt-2">
                    Mínimo 3 caracteres
                  </p>
                </div>
              </div>
            )}

            {/* Step 2: Full Name */}
            {currentStep === 2 && (
              <div className="space-y-6">
                <div className="flex flex-col items-center mb-6">
                  <div className="w-16 h-16 bg-[#00F0FF]/10 border border-[#00F0FF]/30 rounded-full flex items-center justify-center mb-4">
                    <FileText className="w-8 h-8 text-[#00F0FF]" />
                  </div>
                  <h2 className="text-lg text-[#E6F1FF] mb-2">Nome Completo</h2>
                  <p className="text-xs text-[#7F94B0] font-mono-technical text-center">
                    Seu nome real para identificação oficial
                  </p>
                </div>

                <div>
                  <label className="block text-xs text-[#7F94B0] font-mono-technical uppercase mb-2">
                    Nome Completo
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Ex: Carlos Roberto Silva"
                    className="w-full bg-[#0B0E14] border border-[#2D3A52] rounded-lg px-4 py-3 text-[#E6F1FF] font-mono-technical text-sm focus:border-[#00F0FF] focus:outline-none transition-colors"
                    autoFocus
                  />
                  <p className="text-xs text-[#7F94B0]/70 font-mono-technical mt-2">
                    Nome completo como no documento
                  </p>
                </div>
              </div>
            )}

            {/* Step 3: CPF */}
            {currentStep === 3 && (
              <div className="space-y-6">
                <div className="flex flex-col items-center mb-6">
                  <div className="w-16 h-16 bg-[#00F0FF]/10 border border-[#00F0FF]/30 rounded-full flex items-center justify-center mb-4">
                    <CreditCard className="w-8 h-8 text-[#00F0FF]" />
                  </div>
                  <h2 className="text-lg text-[#E6F1FF] mb-2">CPF</h2>
                  <p className="text-xs text-[#7F94B0] font-mono-technical text-center">
                    Documento para verificação de identidade
                  </p>
                </div>

                <div>
                  <label className="block text-xs text-[#7F94B0] font-mono-technical uppercase mb-2">
                    Número do CPF
                  </label>
                  <input
                    type="text"
                    value={cpf}
                    onChange={handleCPFChange}
                    placeholder="000.000.000-00"
                    maxLength={14}
                    className="w-full bg-[#0B0E14] border border-[#2D3A52] rounded-lg px-4 py-3 text-[#E6F1FF] font-mono-technical text-sm focus:border-[#00F0FF] focus:outline-none transition-colors"
                    autoFocus
                  />
                  <p className="text-xs text-[#7F94B0]/70 font-mono-technical mt-2">
                    Seus dados são criptografados e protegidos
                  </p>
                </div>

                {/* Privacy Notice */}
                <div className="bg-[#D4A536]/10 border border-[#D4A536]/30 rounded-lg p-4 mt-4">
                  <p className="text-xs text-[#D4A536] font-mono-technical leading-relaxed">
                    ⚠ AVISO: O CPF é necessário para verificação de identidade e não será exibido publicamente.
                  </p>
                </div>
              </div>
            )}

            {/* Step 4: Photo */}
            {currentStep === 4 && (
              <div className="space-y-6">
                <div className="flex flex-col items-center mb-6">
                  <div className="w-16 h-16 bg-[#00F0FF]/10 border border-[#00F0FF]/30 rounded-full flex items-center justify-center mb-4">
                    <Camera className="w-8 h-8 text-[#00F0FF]" />
                  </div>
                  <h2 className="text-lg text-[#E6F1FF] mb-2">Foto do Rosto</h2>
                  <p className="text-xs text-[#7F94B0] font-mono-technical text-center">
                    Foto clara do seu rosto para identificação
                  </p>
                </div>

                {/* Photo Preview or Upload Area */}
                {photoPreview ? (
                  <div className="space-y-4">
                    <div className="relative">
                      <div className="w-48 h-48 mx-auto bg-[#00F0FF] clip-hexagon p-[3px]">
                        <div className="w-full h-full bg-[#0B0E14] clip-hexagon overflow-hidden">
                          <img
                            src={photoPreview}
                            alt="Preview"
                            className="w-full h-full object-cover"
                          />
                        </div>
                      </div>
                      <div className="absolute inset-0 bg-[#00F0FF] blur-xl opacity-10 clip-hexagon mx-auto w-48" />
                    </div>
                    
                    <div className="text-center">
                      <label className="inline-flex items-center gap-2 px-4 py-2 bg-[#141A26] border border-[#2D3A52] rounded-lg text-[#7F94B0] font-mono-technical text-xs uppercase hover:bg-[#1A2332] transition-all cursor-pointer">
                        <Upload className="w-4 h-4" />
                        [ ALTERAR FOTO ]
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handlePhotoChange}
                          className="hidden"
                        />
                      </label>
                    </div>
                  </div>
                ) : (
                  <label className="block cursor-pointer">
                    <div className="border-2 border-dashed border-[#2D3A52] rounded-lg p-8 hover:border-[#00F0FF]/50 transition-all bg-[#0B0E14]/50">
                      <div className="flex flex-col items-center gap-4">
                        <div className="w-20 h-20 bg-[#00F0FF]/10 border border-[#00F0FF]/30 rounded-full flex items-center justify-center">
                          <Upload className="w-10 h-10 text-[#00F0FF]" />
                        </div>
                        <div className="text-center">
                          <p className="text-sm text-[#E6F1FF] font-mono-technical mb-1">
                            [ SELECIONAR FOTO ]
                          </p>
                          <p className="text-xs text-[#7F94B0] font-mono-technical">
                            Toque para escolher uma imagem
                          </p>
                        </div>
                      </div>
                    </div>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handlePhotoChange}
                      className="hidden"
                    />
                  </label>
                )}

                {/* Info Notice */}
                <div className="bg-[#00F0FF]/10 border border-[#00F0FF]/30 rounded-lg p-4 mt-4">
                  <p className="text-xs text-[#00F0FF] font-mono-technical leading-relaxed">
                    ℹ DICA: Use uma foto clara e recente do seu rosto. Essa foto será usada no seu perfil operacional.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Navigation Buttons */}
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={() => setCurrentStep(Math.max(1, currentStep - 1))}
            disabled={currentStep === 1}
            className="px-6 py-4 bg-[#141A26] border border-[#2D3A52] rounded-lg text-[#7F94B0] font-mono-technical text-sm uppercase hover:bg-[#1A2332] transition-all disabled:opacity-30 disabled:cursor-not-allowed"
          >
            [ VOLTAR ]
          </button>
          <button
            onClick={handleNext}
            disabled={!canProceed()}
            className="px-6 py-4 bg-[#00F0FF]/10 border-2 border-[#00F0FF] rounded-lg text-[#00F0FF] font-mono-technical text-sm uppercase hover:bg-[#00F0FF]/20 transition-all disabled:opacity-30 disabled:cursor-not-allowed disabled:border-[#2D3A52] disabled:text-[#7F94B0] flex items-center justify-center gap-2 shadow-[0_0_15px_rgba(0,240,255,0.3)]"
          >
            {currentStep === 4 ? '[ FINALIZAR ]' : '[ AVANÇAR ]'}
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Step Info */}
      <div className="mt-6 text-center">
        <p className="text-xs text-[#7F94B0] font-mono-technical">
          PASSO {currentStep} DE 4 // {Math.round((currentStep / 4) * 100)}% COMPLETO
        </p>
      </div>
    </div>
  );
}