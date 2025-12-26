import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ChevronRight, User, FileText, CreditCard, Check, Camera, Upload } from 'lucide-react';
import Cropper, { type Area } from 'react-easy-crop';
import 'react-easy-crop/react-easy-crop.css';
import { Cpf } from '@/domain/Cpf';
import { Spinner } from './Spinner';
import { Slider } from './ui/slider';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from './ui/dialog';

interface ProfileCompletionStepperProps {
  onComplete: (data: {
    nickname: string;
    name: string;
    cpf: string;
    motto?: string;
    avatar: File | null;
    userPhoto: File | null;
    userPhotoCaptured: boolean;
  }) => void;
  submitting?: boolean;
  onCheckCpfExists?: (cpf: string) => Promise<boolean>;
}

export function ProfileCompletionStepper({ onComplete, submitting = false, onCheckCpfExists }: ProfileCompletionStepperProps) {
  const [currentStep, setCurrentStep] = useState(1);
  const [nickname, setNickname] = useState('');
  const [name, setName] = useState('');
  const [motto, setMotto] = useState('');
  const [cpf, setCpf] = useState('');
  const [cpfError, setCpfError] = useState('');
  const [cpfExistsError, setCpfExistsError] = useState('');
  const [checkingCpf, setCheckingCpf] = useState(false);
  const [avatar, setAvatar] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState('');
  const [avatarSourceFile, setAvatarSourceFile] = useState<File | null>(null);
  const [userPhoto, setUserPhoto] = useState<File | null>(null);
  const [userPhotoPreview, setUserPhotoPreview] = useState('');
  const [userPhotoCaptured, setUserPhotoCaptured] = useState(false);
  const [userPhotoSourceFile, setUserPhotoSourceFile] = useState<File | null>(null);
  const [rawPhoto, setRawPhoto] = useState<File | null>(null);
  const [rawPhotoPreview, setRawPhotoPreview] = useState<string>('');
  const [cropTarget, setCropTarget] = useState<'avatar' | 'userPhoto' | null>(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);
  const [cropperOpen, setCropperOpen] = useState(false);
  const [cropping, setCropping] = useState(false);
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);
  const [cameraError, setCameraError] = useState('');
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const avatarCameraInputRef = useRef<HTMLInputElement | null>(null);
  const avatarGalleryInputRef = useRef<HTMLInputElement | null>(null);
  const hexClipPath = 'polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)';
  const openCropper = (target: 'avatar' | 'userPhoto', file: File) => {
    if (rawPhotoPreview) URL.revokeObjectURL(rawPhotoPreview);
    const rawUrl = URL.createObjectURL(file);
    setRawPhoto(file);
    setRawPhotoPreview(rawUrl);
    setCropTarget(target);
    setCropperOpen(true);
    setCrop({ x: 0, y: 0 });
    setZoom(1);
    setCroppedAreaPixels(null);
  };
  const recropFromExisting = (target: 'avatar' | 'userPhoto') => {
    const file = target === 'avatar' ? avatarSourceFile : userPhotoSourceFile;
    if (!file) return;
    openCropper(target, file);
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
      if (avatarPreview) URL.revokeObjectURL(avatarPreview);
    };
  }, [avatarPreview]);

  useEffect(() => {
    return () => {
      if (userPhotoPreview) URL.revokeObjectURL(userPhotoPreview);
    };
  }, [userPhotoPreview]);

  useEffect(() => {
    return () => {
      if (rawPhotoPreview) URL.revokeObjectURL(rawPhotoPreview);
    };
  }, [rawPhotoPreview]);

  useEffect(() => {
    return () => {
      if (cameraStream) {
        cameraStream.getTracks().forEach((track) => track.stop());
      }
    };
  }, [cameraStream]);

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setAvatarSourceFile(file);
    openCropper('avatar', file);
  };

  const stopCamera = useCallback(() => {
    if (!cameraStream) return;
    cameraStream.getTracks().forEach((track) => track.stop());
    setCameraStream(null);
  }, [cameraStream]);

  const startCamera = useCallback(async () => {
    setCameraError('');
    if (cameraStream) return;
    if (!navigator.mediaDevices?.getUserMedia) {
      setCameraError('Câmera indisponível neste dispositivo.');
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user' },
        audio: false,
      });
      setCameraStream(stream);
    } catch (err) {
      stopCamera();
      setCameraError('Permissão da câmera negada. A foto é obrigatória para verificação de identidade.');
    }
  }, [cameraStream, stopCamera]);

  const captureUserPhoto = async () => {
    const video = videoRef.current;
    if (!video) return;
    const canvas = document.createElement('canvas');
    const width = video.videoWidth || 720;
    const height = video.videoHeight || 720;
    canvas.width = width;
    canvas.height = height;
    const context = canvas.getContext('2d');
    if (!context) return;
    context.drawImage(video, 0, 0, width, height);
    const blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob((item) => resolve(item), 'image/jpeg', 0.92),
    );
    if (!blob) return;
    const file = new File([blob], `user-photo-${Date.now()}.jpeg`, { type: 'image/jpeg' });
    setCameraError('');
    setUserPhotoCaptured(true);
    stopCamera();
    setUserPhotoSourceFile(file);
    openCropper('userPhoto', file);
  };

  const handleRetakeUserPhoto = () => {
    if (userPhotoPreview) URL.revokeObjectURL(userPhotoPreview);
    setUserPhoto(null);
    setUserPhotoPreview('');
    setUserPhotoCaptured(false);
    setUserPhotoSourceFile(null);
    void startCamera();
  };

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    if (cameraStream) {
      video.srcObject = cameraStream;
      void video.play().catch(() => undefined);
      return;
    }
    video.srcObject = null;
  }, [cameraStream]);

  const nicknameStep = 1;
  const avatarStep = 2;
  const userPhotoStep = 3;
  const nameStep = 4;
  const mottoStep = 5;
  const cpfStep = 6;
  const finalStep = cpfStep;

  const canProceed = () => {
    if (currentStep === nicknameStep) return nickname.trim().length >= 3;
    if (currentStep === avatarStep) return avatar !== null;
    if (currentStep === userPhotoStep) return userPhoto !== null && userPhotoCaptured && !cameraError;
    if (currentStep === nameStep) return name.trim().length >= 3;
    if (currentStep === mottoStep) return true;
    if (currentStep === cpfStep) return cpfDigits.length === 11 && isCpfValid() && !cpfError && !cpfExistsError && !checkingCpf;
    return false;
  };

  useEffect(() => {
    if (currentStep !== userPhotoStep) {
      stopCamera();
    }
  }, [currentStep, stopCamera, userPhotoStep]);

  const getCroppedPhoto = useCallback(async (): Promise<File | null> => {
    if (!rawPhoto || !rawPhotoPreview) return rawPhoto ?? null;
    if (!croppedAreaPixels) return rawPhoto;

    const image = await new Promise<HTMLImageElement>((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = reject;
      img.src = rawPhotoPreview;
    });

    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    if (!context) return rawPhoto;

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
        if (!blob) return resolve(rawPhoto);
        const baseName = rawPhoto?.name ? rawPhoto.name.replace(/\.[^.]+$/, '') : 'photo';
        const file = new File([blob], `${baseName}-cropped.jpeg`, { type: 'image/jpeg' });
        resolve(file);
      }, 'image/jpeg');
    });
  }, [croppedAreaPixels, rawPhoto, rawPhotoPreview]);

  const handleNext = async () => {
    if (submitting) return;
    if (currentStep < finalStep) {
      setCurrentStep(currentStep + 1);
    } else if (currentStep === finalStep && canProceed()) {
      if (!isCpfValid()) {
        setCpfError('CPF inválido');
        setCurrentStep(cpfStep);
        return;
      }
      const finalPhoto = await getCroppedPhoto();
      onComplete({
        nickname,
        name,
        cpf,
        motto: motto.trim().slice(0, 100) || undefined,
        avatar,
        userPhoto: finalPhoto ?? userPhoto,
        userPhotoCaptured,
      });
    }
  };

  const handleConfirmCrop = useCallback(async () => {
    setCropping(true);
    const cropped = await getCroppedPhoto();
    if (cropped && cropTarget) {
      const url = URL.createObjectURL(cropped);
      if (cropTarget === 'avatar') {
        if (avatarPreview) URL.revokeObjectURL(avatarPreview);
        setAvatar(cropped);
        setAvatarPreview(url);
      } else {
        if (userPhotoPreview) URL.revokeObjectURL(userPhotoPreview);
        setUserPhoto(cropped);
        setUserPhotoPreview(url);
        setUserPhotoCaptured(true);
        setCameraError('');
      }
    }
    setCropping(false);
    setCropperOpen(false);
    setRawPhoto(null);
    setRawPhotoPreview('');
    setCropTarget(null);
  }, [avatarPreview, cropTarget, getCroppedPhoto, userPhotoPreview]);

  const steps = [
    { number: 1, title: 'Codinome', icon: User, field: 'nickname' },
    { number: 2, title: 'Avatar', icon: User, field: 'avatar' },
    { number: 3, title: 'Identidade', icon: Camera, field: 'userPhoto' },
    { number: 4, title: 'Nome', icon: FileText, field: 'name' },
    { number: 5, title: 'Bordão', icon: FileText, field: 'motto' },
    { number: 6, title: 'CPF', icon: CreditCard, field: 'cpf' },
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
          <div className="flex flex-wrap items-center justify-center gap-x-2 gap-y-4 mb-12">
            {steps.map((step, index) => (
              <div key={step.number} className="flex items-center">
                <div className="flex flex-col items-center ">
                  <div
                    className={`w-8 h-8 sm:w-10 sm:h-10 rounded-full border-2 flex items-center justify-center transition-all ${currentStep > step.number
                      ? 'bg-[#00F0FF] border-[#00F0FF] text-[#0B0E14]'
                      : currentStep === step.number
                        ? 'bg-[#00F0FF]/20 border-[#00F0FF] text-[#00F0FF] shadow-[0_0_20px_rgba(0,240,255,0.4)]'
                        : 'bg-[#141A26] border-[#2D3A52] text-[#7F94B0]'
                      }`}
                  >
                    {currentStep > step.number ? (
                      <Check className="w-5 h-5" />
                    ) : (
                      <span className="text-xs sm:text-sm font-mono-technical">{step.number}</span>
                    )}
                  </div>
                  <span className={`text-[10px] font-mono-technical mt-1 ${currentStep >= step.number ? 'text-[#00F0FF]' : 'text-[#7F94B0]'
                    }`}>
                    {step.title}
                  </span>
                </div>
                {index < steps.length - 1 && (
                  <div className={`hidden sm:block w-8 h-[2px] mx-2 mb-5 ${currentStep > step.number ? 'bg-[#00F0FF]' : 'bg-[#2D3A52]'
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
                {currentStep === nicknameStep && (
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

                {/* Step 4: Full Name */}
                {currentStep === nameStep && (
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

                {/* Step 5: Motto */}
                {currentStep === mottoStep && (
                  <div className="space-y-6">
                    <div className="flex flex-col items-center mb-6">
                      <div className="w-16 h-16 bg-[#00F0FF]/10 border border-[#00F0FF]/30 rounded-full flex items-center justify-center mb-4">
                        <FileText className="w-8 h-8 text-[#00F0FF]" />
                      </div>
                      <h2 className="text-lg text-[#E6F1FF] mb-2">Bordão</h2>
                      <p className="text-xs text-[#7F94B0] font-mono-technical text-center">
                        Frase curta para marcar sua identidade (opcional)
                      </p>
                    </div>

                    <div>
                      <label className="block text-xs text-[#7F94B0] font-mono-technical uppercase mb-2">
                        Bordão
                      </label>
                      <input
                        type="text"
                        value={motto}
                        onChange={(e) => setMotto(e.target.value.slice(0, 100))}
                        placeholder='Ex: "Disciplina antes do disparo."'
                        className="w-full bg-[#0B0E14] border border-[#2D3A52] rounded-lg px-4 py-3 text-[#E6F1FF] font-mono-technical text-sm focus:border-[#00F0FF] focus:outline-none transition-colors"
                        autoFocus
                        maxLength={100}
                      />
                      <p className="text-xs text-[#7F94B0]/70 font-mono-technical mt-2">
                        Campo opcional
                      </p>
                    </div>
                  </div>
                )}

                {/* Step 6: CPF */}
                {currentStep === cpfStep && (
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

                {/* Step 2: Avatar */}
                {currentStep === avatarStep && (
                  <div className="space-y-6">
                    <div className="flex flex-col items-center mb-6">
                      <div className="w-16 h-16 bg-[#00F0FF]/10 border border-[#00F0FF]/30 rounded-full flex items-center justify-center mb-4">
                        <User className="w-8 h-8 text-[#00F0FF]" />
                      </div>
                      <h2 className="text-lg text-[#E6F1FF] mb-2">Avatar do Operador</h2>
                      <p className="text-xs text-[#7F94B0] font-mono-technical text-center">
                        Imagem pública exibida em todo o app
                      </p>
                    </div>

                    {/* Photo Preview or Upload Area */}
                    {avatarPreview ? (
                      <div className="space-y-4">
                        <div className="relative">
                          <div className="w-48 h-52 mx-auto bg-[#00F0FF] clip-hexagon-perfect p-[3px]">
                            <div className="w-full h-full bg-[#0B0E14] clip-hexagon-perfect overflow-hidden">
                              <img
                                src={avatarPreview}
                                alt="Avatar selecionado"
                                className="w-full h-full object-cover"
                              />
                            </div>
                          </div>
                          <div className="absolute inset-0 bg-[#00F0FF] blur-xl opacity-10 clip-hexagon-perfect mx-auto w-48" />
                        </div>

                        <div className="flex flex-wrap items-center justify-center gap-3">
                          <button
                            type="button"
                            onClick={() => avatarCameraInputRef.current?.click()}
                            className="inline-flex items-center gap-2 px-4 py-2 bg-[#00F0FF]/10 border-2 border-[#00F0FF] rounded-lg text-[#00F0FF] font-mono-technical text-xs uppercase hover:bg-[#00F0FF]/20 transition-all"
                          >
                            <Camera className="w-4 h-4" />
                            [ CÂMERA ]
                          </button>
                          <button
                            type="button"
                            onClick={() => avatarGalleryInputRef.current?.click()}
                            className="inline-flex items-center gap-2 px-4 py-2 bg-[#141A26] border border-[#2D3A52] rounded-lg text-[#7F94B0] font-mono-technical text-xs uppercase hover:bg-[#1A2332] transition-all"
                          >
                            <Upload className="w-4 h-4" />
                            [ GALERIA ]
                          </button>
                          <button
                            type="button"
                            onClick={() => recropFromExisting('avatar')}
                            className="inline-flex items-center gap-2 px-4 py-2 bg-[#0B0E14] border border-[#2D3A52] rounded-lg text-[#7F94B0] font-mono-technical text-xs uppercase hover:bg-[#1A2332] transition-all disabled:opacity-50"
                            disabled={!avatarSourceFile}
                          >
                            [ RECORTAR NOVAMENTE ]
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="block">
                        <div className="border-2 border-dashed border-[#2D3A52] rounded-lg p-8 hover:border-[#00F0FF]/50 transition-all bg-[#0B0E14]/50">
                          <div className="flex flex-col items-center gap-4">
                            <div className="w-20 h-20 bg-[#00F0FF]/10 border border-[#00F0FF]/30 rounded-full flex items-center justify-center">
                              <Upload className="w-10 h-10 text-[#00F0FF]" />
                            </div>
                            <div className="text-center">
                              <p className="text-sm text-[#E6F1FF] font-mono-technical mb-1">
                                [ SELECIONAR AVATAR ]
                              </p>
                              <p className="text-xs text-[#7F94B0] font-mono-technical">
                                Escolha como enviar sua foto
                              </p>
                            </div>
                            <div className="flex flex-wrap items-center justify-center gap-3">
                              <button
                                type="button"
                                onClick={() => avatarCameraInputRef.current?.click()}
                                className="inline-flex items-center gap-2 px-4 py-2 bg-[#00F0FF]/10 border-2 border-[#00F0FF] rounded-lg text-[#00F0FF] font-mono-technical text-xs uppercase hover:bg-[#00F0FF]/20 transition-all"
                              >
                                <Camera className="w-4 h-4" />
                                [ CÂMERA ]
                              </button>
                              <button
                                type="button"
                                onClick={() => avatarGalleryInputRef.current?.click()}
                                className="inline-flex items-center gap-2 px-4 py-2 bg-[#141A26] border border-[#2D3A52] rounded-lg text-[#7F94B0] font-mono-technical text-xs uppercase hover:bg-[#1A2332] transition-all"
                              >
                                <Upload className="w-4 h-4" />
                                [ GALERIA ]
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                    <input
                      ref={avatarCameraInputRef}
                      type="file"
                      accept="image/*"
                      capture="user"
                      onChange={handleAvatarChange}
                      className="hidden"
                    />
                    <input
                      ref={avatarGalleryInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleAvatarChange}
                      className="hidden"
                    />

                    {/* Info Notice */}
                    <div className="bg-[#00F0FF]/10 border border-[#00F0FF]/30 rounded-lg p-4 mt-4">
                      <p className="text-xs text-[#00F0FF] font-mono-technical leading-relaxed">
                        ℹ DICA: Este avatar é público e pode ser estilizado ou real.
                      </p>
                    </div>
                  </div>
                )}

                {/* Step 3: User Photo */}
                {currentStep === userPhotoStep && (
                  <div className="space-y-6">
                    <div className="flex flex-col items-center mb-6">
                      <div className="w-16 h-16 bg-[#D4A536]/10 border border-[#D4A536]/30 rounded-full flex items-center justify-center mb-4">
                        <Camera className="w-8 h-8 text-[#D4A536]" />
                      </div>
                      <h2 className="text-lg text-[#E6F1FF] mb-2">Verificação de identidade</h2>
                      <p className="text-xs text-[#7F94B0] font-mono-technical text-center">
                        Foto em tempo real obrigatória para verificação de identidade
                      </p>
                    </div>

                    {userPhotoPreview ? (
                      <div className="space-y-4">
                        <div className="relative">
                          <div className="w-48 h-52 mx-auto bg-[#D4A536] clip-hexagon-perfect p-[3px]">
                            <div className="w-full h-full bg-[#0B0E14] clip-hexagon-perfect overflow-hidden">
                              <img
                                src={userPhotoPreview}
                                alt="Foto de identidade"
                                className="w-full h-full object-cover"
                              />
                            </div>
                          </div>
                          <div className="absolute inset-0 bg-[#D4A536] blur-xl opacity-10 clip-hexagon-perfect mx-auto w-48" />
                        </div>

                        <div className="text-center flex flex-wrap items-center justify-center gap-3">
                          <button
                            type="button"
                            onClick={handleRetakeUserPhoto}
                            className="inline-flex items-center gap-2 px-4 py-2 bg-[#141A26] border border-[#2D3A52] rounded-lg text-[#7F94B0] font-mono-technical text-xs uppercase hover:bg-[#1A2332] transition-all"
                          >
                            <Camera className="w-4 h-4" />
                            [ CAPTURAR NOVAMENTE ]
                          </button>
                          <button
                            type="button"
                            onClick={() => recropFromExisting('userPhoto')}
                            className="inline-flex items-center gap-2 px-4 py-2 bg-[#0B0E14] border border-[#2D3A52] rounded-lg text-[#7F94B0] font-mono-technical text-xs uppercase hover:bg-[#1A2332] transition-all disabled:opacity-50"
                            disabled={!userPhotoSourceFile}
                          >
                            [ RECORTAR NOVAMENTE ]
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        <div className="border-2 border-dashed border-[#2D3A52] rounded-lg p-4 bg-[#0B0E14]/50">
                          {cameraStream ? (
                            <div className="space-y-3">
                              <div className="relative w-full overflow-hidden rounded-lg border border-[#2D3A52]">
                                <video
                                  ref={videoRef}
                                  className="w-full h-[240px] object-cover"
                                  autoPlay
                                  playsInline
                                  muted
                                />
                              </div>
                              <div className="flex flex-wrap items-center justify-center gap-3">
                                <button
                                  type="button"
                                  onClick={() => void captureUserPhoto()}
                                  className="inline-flex items-center gap-2 px-4 py-2 bg-[#D4A536]/10 border-2 border-[#D4A536] rounded-lg text-[#D4A536] font-mono-technical text-xs uppercase hover:bg-[#D4A536]/20 transition-all"
                                >
                                  [ CAPTURAR ]
                                </button>
                                <button
                                  type="button"
                                  onClick={stopCamera}
                                  className="inline-flex items-center gap-2 px-4 py-2 bg-[#141A26] border border-[#2D3A52] rounded-lg text-[#7F94B0] font-mono-technical text-xs uppercase hover:bg-[#1A2332] transition-all"
                                >
                                  [ CANCELAR ]
                                </button>
                              </div>
                            </div>
                          ) : (
                            <div className="flex flex-col items-center gap-3 py-6">
                              <div className="w-20 h-20 bg-[#D4A536]/10 border border-[#D4A536]/30 rounded-full flex items-center justify-center">
                                <Camera className="w-10 h-10 text-[#D4A536]" />
                              </div>
                              <div className="text-center">
                                <p className="text-sm text-[#E6F1FF] font-mono-technical mb-1">
                                  [ FOTO EM TEMPO REAL ]
                                </p>
                                <p className="text-xs text-[#7F94B0] font-mono-technical">
                                  A galeria não é permitida nesta etapa
                                </p>
                              </div>
                              <button
                                type="button"
                                onClick={() => void startCamera()}
                                className="inline-flex items-center gap-2 px-4 py-2 bg-[#D4A536]/10 border-2 border-[#D4A536] rounded-lg text-[#D4A536] font-mono-technical text-xs uppercase hover:bg-[#D4A536]/20 transition-all"
                              >
                                [ ATIVAR CÂMERA ]
                              </button>
                            </div>
                          )}
                        </div>
                        {cameraError ? (
                          <p className="text-xs text-[#D4A536] font-mono-technical text-center">
                            {cameraError}
                          </p>
                        ) : null}
                      </div>
                    )}

                    <div className="bg-[#D4A536]/10 border border-[#D4A536]/30 rounded-lg p-4">
                      <p className="text-xs text-[#D4A536] font-mono-technical leading-relaxed">
                        Foto em tempo real • Obrigatória para verificação de identidade • Privada • Apenas câmera
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Navigation Buttons */}
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => setCurrentStep(Math.max(nicknameStep, currentStep - 1))}
                disabled={currentStep === nicknameStep}
                className="px-6 py-4 bg-[#141A26] border border-[#2D3A52] rounded-lg text-[#7F94B0] font-mono-technical text-sm uppercase hover:bg-[#1A2332] transition-all disabled:opacity-30 disabled:cursor-not-allowed"
              >
                [ VOLTAR ]
              </button>
              <button
                onClick={() => void handleNext()}
                disabled={!canProceed() || submitting}
                className="px-4 text-center py-4 text-nowrap bg-[#00F0FF]/10 border-2 border-[#00F0FF] rounded-lg text-[#00F0FF] font-mono-technical text-sm uppercase hover:bg-[#00F0FF]/20 transition-all disabled:opacity-30 disabled:cursor-not-allowed disabled:border-[#2D3A52] disabled:text-[#7F94B0] flex items-center justify-center gap-2 shadow-[0_0_15px_rgba(0,240,255,0.3)]"
              >
                {currentStep === finalStep ? (
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
              PASSO {currentStep} DE {steps.length} // {Math.round((currentStep / steps.length) * 100)}% COMPLETO
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
            setCropTarget(null);
          }
        }}
      >
        <DialogContent className="bg-[#0B0E14] border border-[#2D3A52] text-[#E6F1FF] max-w-xl w-[90vw]">
          <DialogHeader>
            <DialogTitle className="text-[#E6F1FF] font-mono-technical uppercase text-sm">
              [ RECORTAR FOTO ]
            </DialogTitle>
            <DialogDescription className="sr-only">
              Ajuste o corte e o zoom para salvar a imagem.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="relative h-[360px] w-full rounded-xl overflow-hidden border border-[#2D3A52] bg-[#0B0E14]">
              <Cropper
                image={rawPhotoPreview || undefined}
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
