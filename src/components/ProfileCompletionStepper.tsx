import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ChevronRight, User, FileText, CreditCard, Check, Camera, Upload } from 'lucide-react';
import Cropper, { type Area } from 'react-easy-crop';
import 'react-easy-crop/react-easy-crop.css';
import { Cpf } from '@/domain/Cpf';
import { Spinner } from './Spinner';
import { Slider } from './ui/slider';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from './ui/dialog';

interface ProfileCompletionStepperProps {
  onComplete: (data: { nickname: string; name: string; cpf: string; photo: File | null }) => void;
  submitting?: boolean;
  onCheckCpfExists?: (cpf: string) => Promise<boolean>;
}

export function ProfileCompletionStepper({ onComplete, submitting = false, onCheckCpfExists }: ProfileCompletionStepperProps) {
  const [currentStep, setCurrentStep] = useState(1);
  const [nickname, setNickname] = useState('');
  const [name, setName] = useState('');
  const [cpf, setCpf] = useState('');
  const [cpfError, setCpfError] = useState('');
  const [cpfExistsError, setCpfExistsError] = useState('');
  const [checkingCpf, setCheckingCpf] = useState(false);
  const [photo, setPhoto] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string>('');
  const [sourcePhoto, setSourcePhoto] = useState<File | null>(null);
  const [sourcePhotoPreview, setSourcePhotoPreview] = useState<string>('');
  const [rawPhoto, setRawPhoto] = useState<File | null>(null);
  const [rawPhotoPreview, setRawPhotoPreview] = useState<string>('');
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);
  const [cropperOpen, setCropperOpen] = useState(false);
  const [cropping, setCropping] = useState(false);
  const hexClipPath = 'polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)';
  const recropFromExisting = () => {
    if (!sourcePhoto) return;
    const freshRawUrl = URL.createObjectURL(sourcePhoto);
    setRawPhoto(sourcePhoto);
    setRawPhotoPreview((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return freshRawUrl;
    });
    setCropperOpen(true);
    setCrop({ x: 0, y: 0 });
    setZoom(1);
    setCroppedAreaPixels(null);
  };

  const cpfDigits = useMemo(() => cpf.replace(/\D/g, ''), [cpf]);
  const cpfCheckSeq = useRef(0);

  const isCpfValid = (value = cpfDigits) => {
    try {
      new Cpf(value);
      return true;
    } catch (err: unknown) {
      return false;
    }
  };

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
    const digits = formatted.replace(/\D/g, '');
    if (digits.length === 11) {
      setCpfError(isCpfValid(digits) ? '' : 'CPF inválido');
    } else {
      setCpfError('');
    }
    setCpfExistsError('');
  };

  useEffect(() => {
    if (!onCheckCpfExists) return;
    if (cpfDigits.length !== 11 || cpfError || !isCpfValid(cpfDigits)) {
      setCpfExistsError('');
      setCheckingCpf(false);
      return;
    }
    const seq = ++cpfCheckSeq.current;
    setCheckingCpf(true);
    const timer = setTimeout(() => {
      onCheckCpfExists(cpfDigits)
        .then((exists) => {
          if (seq !== cpfCheckSeq.current) return;
          setCpfExistsError(exists ? 'CPF já cadastrado' : '');
        })
        .catch(() => {
          if (seq !== cpfCheckSeq.current) return;
          setCpfExistsError('Falha ao verificar CPF');
        })
        .finally(() => {
          if (seq === cpfCheckSeq.current) setCheckingCpf(false);
        });
    }, 400);
    return () => clearTimeout(timer);
  }, [cpfDigits, cpfError, onCheckCpfExists]);

  const onCropComplete = useCallback((_: Area, areaPixels: Area) => {
    setCroppedAreaPixels(areaPixels);
  }, []);

  useEffect(() => {
    return () => {
      if (photoPreview) URL.revokeObjectURL(photoPreview);
    };
  }, [photoPreview]);

  useEffect(() => {
    return () => {
      if (rawPhotoPreview) URL.revokeObjectURL(rawPhotoPreview);
    };
  }, [rawPhotoPreview]);

  useEffect(() => {
    return () => {
      if (sourcePhotoPreview) URL.revokeObjectURL(sourcePhotoPreview);
    };
  }, [sourcePhotoPreview]);

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (sourcePhotoPreview) URL.revokeObjectURL(sourcePhotoPreview);
      if (rawPhotoPreview) URL.revokeObjectURL(rawPhotoPreview);
      const sourceUrl = URL.createObjectURL(file);
      const rawUrl = URL.createObjectURL(file);
      setSourcePhoto(file);
      setSourcePhotoPreview(sourceUrl);
      setRawPhoto(file);
      setRawPhotoPreview(rawUrl);
      setCropperOpen(true);
      setCrop({ x: 0, y: 0 });
      setZoom(1);
      setCroppedAreaPixels(null);
    }
  };

  const canProceed = () => {
    if (currentStep === 1) return nickname.trim().length >= 3;
    if (currentStep === 2) return name.trim().length >= 3;
    if (currentStep === 3) return cpfDigits.length === 11 && isCpfValid() && !cpfError && !cpfExistsError && !checkingCpf;
    if (currentStep === 4) return photo !== null;
    return false;
  };

  const getCroppedPhoto = useCallback(async (): Promise<File | null> => {
    const sourceFile = rawPhoto ?? sourcePhoto ?? photo;
    const sourcePreview = rawPhotoPreview || sourcePhotoPreview || photoPreview;
    if (!croppedAreaPixels || !sourcePreview || !sourceFile) return sourceFile ?? null;

    const image = await new Promise<HTMLImageElement>((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = reject;
      img.src = sourcePreview;
    });

    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    if (!context) return photo;

    canvas.width = croppedAreaPixels.width;
    canvas.height = croppedAreaPixels.height;

    context.drawImage(
      image,
      croppedAreaPixels.x,
      croppedAreaPixels.y,
      croppedAreaPixels.width,
      croppedAreaPixels.height,
      0,
      0,
      croppedAreaPixels.width,
      croppedAreaPixels.height,
    );

    return new Promise((resolve) => {
      canvas.toBlob((blob) => {
        if (!blob) return resolve(photo);
        const baseName = sourceFile?.name ? sourceFile.name.replace(/\.[^.]+$/, '') : 'avatar';
        const file = new File([blob], `${baseName}-cropped.jpeg`, { type: 'image/jpeg' });
        resolve(file);
      }, 'image/jpeg');
    });
  }, [croppedAreaPixels, photo, photoPreview, rawPhoto, rawPhotoPreview, sourcePhoto, sourcePhotoPreview]);

  const handleNext = async () => {
    if (submitting) return;
    if (currentStep < 4) {
      if (currentStep === 3 && (!isCpfValid() || cpfError || cpfExistsError || checkingCpf)) {
        setCpfError('CPF inválido');
        return;
      }
      setCurrentStep(currentStep + 1);
    } else if (currentStep === 4 && canProceed()) {
      if (!isCpfValid()) {
        setCpfError('CPF inválido');
        setCurrentStep(3);
        return;
      }
      const finalPhoto = await getCroppedPhoto();
      onComplete({ nickname, name, cpf, photo: finalPhoto ?? photo });
    }
  };

  const handleConfirmCrop = useCallback(async () => {
    setCropping(true);
    const cropped = await getCroppedPhoto();
    if (cropped) {
      if (photoPreview && photoPreview !== rawPhotoPreview) URL.revokeObjectURL(photoPreview);
      const url = URL.createObjectURL(cropped);
      setPhoto(cropped);
      setPhotoPreview(url);
    }
    setCropping(false);
    setCropperOpen(false);
    setRawPhoto(null);
    setRawPhotoPreview('');
  }, [getCroppedPhoto, photoPreview]);

  const steps = [
    { number: 1, title: 'Codinome', icon: User, field: 'nickname' },
    { number: 2, title: 'Nome', icon: FileText, field: 'name' },
    { number: 3, title: 'CPF', icon: CreditCard, field: 'cpf' },
    { number: 4, title: 'Foto', icon: Camera, field: 'photo' },
  ];

  return (
    <>
      <section
        className="relative min-h-screen w-full bg-[#0B0E14] flex flex-col items-center"
        style={{ WebkitOverflowScrolling: 'touch' }}
      >
        <div className="flex-1 flex flex-col px-6 py-8 items-center w-full">
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
          <div className="flex items-center justify-center gap-2 mb-12 ">
            {steps.map((step, index) => (
              <div key={step.number} className="flex items-center">
                <div className="flex flex-col items-center ">
                  <div
                    className={`w-10 h-10 rounded-full border-2 flex items-center justify-center transition-all ${currentStep > step.number
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
                  <span className={`text-[10px] font-mono-technical mt-1 ${currentStep >= step.number ? 'text-[#00F0FF]' : 'text-[#7F94B0]'
                    }`}>
                    {step.title}
                  </span>
                </div>
                {index < steps.length - 1 && (
                  <div className={`w-8 h-[2px] mx-2 mb-5 ${currentStep > step.number ? 'bg-[#00F0FF]' : 'bg-[#2D3A52]'
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
                        className={`w-full bg-[#0B0E14] border rounded-lg px-4 py-3 text-[#E6F1FF] font-mono-technical text-sm focus:outline-none transition-colors ${cpfError || cpfExistsError
                          ? 'border-[#D4A536] focus:border-[#D4A536]'
                          : 'border-[#2D3A52] focus:border-[#00F0FF]'
                          }`}
                        aria-invalid={cpfError || cpfExistsError ? 'true' : 'false'}
                        autoFocus
                      />
                      {cpfError || cpfExistsError ? (
                        <p className="text-xs text-[#D4A536] font-mono-technical mt-2">
                          {cpfError || cpfExistsError}
                        </p>
                      ) : null}
                      {checkingCpf ? (
                        <p className="text-xs text-[#7F94B0] font-mono-technical mt-2">Validando CPF...</p>
                      ) : null}
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
                          <div className="w-48 h-52 mx-auto bg-[#00F0FF] clip-hexagon-perfect p-[3px]">
                            <div className="w-full h-full bg-[#0B0E14] clip-hexagon-perfect overflow-hidden">
                              <img
                                src={photoPreview}
                                alt="Preview"
                                className="w-full h-full object-cover"
                              />
                            </div>
                          </div>
                          <div className="absolute inset-0 bg-[#00F0FF] blur-xl opacity-10 clip-hexagon-perfect mx-auto w-48" />
                        </div>

                        <div className="text-center flex items-center justify-center">
                          <label className="inline-flex items-center gap-2 px-4 py-2 bg-[#141A26] border border-[#2D3A52] rounded-lg text-[#7F94B0] font-mono-technical text-xs uppercase hover:bg-[#1A2332] transition-all cursor-pointer">
                            <Upload className="w-4 h-4" />
                            [ ALTERAR FOTO ]
                            <input
                              type="file"
                              accept="image/*;capture=camera"
                              capture="user"
                              onChange={handlePhotoChange}
                              className="hidden"
                            />
                          </label>
                          <button
                            type="button"
                            onClick={recropFromExisting}
                            className="ml-3 inline-flex items-center gap-2 px-4 py-2 bg-[#0B0E14] border border-[#2D3A52] rounded-lg text-[#7F94B0] font-mono-technical text-xs uppercase hover:bg-[#1A2332] transition-all disabled:opacity-50"
                            disabled={!photoPreview}
                          >
                            [ RECORTAR NOVAMENTE ]
                          </button>
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
                          accept="image/*;capture=camera"
                          capture="user"
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
                onClick={() => void handleNext()}
                disabled={!canProceed() || submitting}
                className="px-4 text-center py-4 text-nowrap bg-[#00F0FF]/10 border-2 border-[#00F0FF] rounded-lg text-[#00F0FF] font-mono-technical text-sm uppercase hover:bg-[#00F0FF]/20 transition-all disabled:opacity-30 disabled:cursor-not-allowed disabled:border-[#2D3A52] disabled:text-[#7F94B0] flex items-center justify-center gap-2 shadow-[0_0_15px_rgba(0,240,255,0.3)]"
              >
                {currentStep === 4 ? (
                  submitting
                    ? <Spinner inline size="sm" />
                    : '[ FINALIZAR ]'
                ) : (
                  <>
                    <span>[ AVANÇAR ]</span>
                    <ChevronRight className="w-4 h-4" />
                  </>
                )}
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
      </section>

      <Dialog
        open={cropperOpen}
        onOpenChange={(open) => {
          setCropperOpen(open);
          if (!open) {
            setRawPhoto(null);
            setRawPhotoPreview('');
          }
        }}
      >
        <DialogContent className="bg-[#0B0E14] border border-[#2D3A52] text-[#E6F1FF] max-w-xl w-[90vw]">
          <DialogHeader>
            <DialogTitle className="text-[#E6F1FF] font-mono-technical uppercase text-sm">
              [ RECORTAR FOTO ]
            </DialogTitle>
            <DialogDescription className="sr-only">
              Ajuste o corte e o zoom para salvar a nova foto de perfil.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="relative h-[360px] w-full rounded-xl overflow-hidden border border-[#2D3A52] bg-[#0B0E14]">
              <Cropper
                image={rawPhotoPreview || photoPreview}
                crop={crop}
                zoom={zoom}
                aspect={1}
                cropShape="rect"
                showGrid={false}
                onCropChange={setCrop}
                onCropComplete={onCropComplete}
                onZoomChange={setZoom}
                objectFit="cover"
                cropAreaStyle={{
                  clipPath: hexClipPath,
                  border: '2px solid #00F0FF',
                  boxShadow: '0 0 0 9999px rgba(11,14,20,0.85)',
                  background: 'rgba(0,240,255,0.06)',
                }}
              />
              <div className="pointer-events-none absolute inset-6 clip-hexagon-perfect border border-[#00F0FF]/30" />
            </div>

            <div className="flex items-center gap-3">
              <span className="text-xs text-[#7F94B0] font-mono-technical uppercase">Zoom</span>
              <div className="flex-1">
                <Slider
                  min={1}
                  max={3}
                  step={0.05}
                  value={[zoom]}
                  onValueChange={(values) => setZoom(values[0] ?? 1)}
                />
              </div>
              <span className="text-xs text-[#7F94B0] font-mono-technical w-10 text-right">{zoom.toFixed(1)}x</span>
            </div>
          </div>

          <DialogFooter className="mt-2 flex gap-3">
            <button
              type="button"
              onClick={() => {
                setCropperOpen(false);
                setRawPhoto(null);
                setRawPhotoPreview('');
              }}
              className="px-4 py-2 bg-[#141A26] border border-[#2D3A52] rounded-lg text-[#7F94B0] font-mono-technical text-xs uppercase hover:bg-[#1A2332] transition-all"
              disabled={cropping}
            >
              [ CANCELAR ]
            </button>
            <button
              type="button"
              onClick={() => void handleConfirmCrop()}
              className={`px-4 py-2 bg-[#00F0FF]/10 border-2 border-[#00F0FF] rounded-lg text-[#00F0FF] font-mono-technical text-xs uppercase hover:bg-[#00F0FF]/20 transition-all disabled:opacity-50 flex items-center justify-center ${cropping ? 'gap-2' : ''}`}
              disabled={cropping}
            >
              {cropping ? (
                <>
                  <Spinner inline size="sm" />
                  <span>[ CORTANDO... ]</span>
                </>
              ) : (
                <span>[ CORTAR ]</span>
              )}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
