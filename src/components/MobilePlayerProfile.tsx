import { useCallback, useEffect, useState } from 'react';
import { User, AlertTriangle, Award, Edit, X, Check } from 'lucide-react';
import Cropper, { type Area } from 'react-easy-crop';
import 'react-easy-crop/react-easy-crop.css';
import { MobileFeedCard, type FeedEntry } from './MobileFeedCard';
import { TacticalButton } from './TacticalButton';
import { Slider } from './ui/slider';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from './ui/dialog';
import { Spinner } from './Spinner';
import { PlayerAvatar } from './PlayerAvatar';

const frameManifest = import.meta.glob('/public/frames/*.{png,jpg,jpeg,webp,svg}', {
  eager: true,
  as: 'url',
}) as Record<string, string>;

const formatFrameLabel = (path: string) => {
  const file = path.split('/').pop() || 'moldura';
  const base = file.replace(/\.[^.]+$/, '');
  const cleaned = base.replace(/[-_]+/g, ' ').trim();
  const withoutFrame = cleaned.replace(/\bframe\b/i, '').trim();
  const title = (withoutFrame || cleaned || 'Moldura')
    .split(' ')
    .filter(Boolean)
    .map((word) => word[0]?.toUpperCase() + word.slice(1))
    .join(' ');
  return `Moldura ${title}`;
};

const frameOptions = (() => {
  const entries = Object.entries(frameManifest);
  const fallback = entries.length ? entries : [['/public/frames/blue-frame.png', '/frames/blue-frame.png']];
  return fallback
    .map(([path, url]) => ({ value: url, label: formatFrameLabel(path) }))
    .sort((a, b) => a.label.localeCompare(b.label));
})();

export interface PlayerData {
  id: string;
  name: string;
  nickname: string;
  avatar?: string;
  avatarFrame?: string | null;
  motto?: string | null;
  reputation: number; // 0-10
  reportCount: number;
  praiseCount: number;
  history: FeedEntry[];
  rankPrestige?: number | null;
  rankShame?: number | null;
  matchCount?: number | null;
}

interface MobilePlayerProfileProps {
  player: PlayerData;
  onTargetClick: (targetId: string) => void;
  isOwnProfile?: boolean;
  canEditProfile?: boolean;
  onProfileUpdate?: (data: { name: string; nickname: string; avatar?: File | string | null; motto?: string | null; avatarFrame?: string | null }) => Promise<unknown> | void;
  isSaving?: boolean;
  onRetract?: (entryId: string) => void;
  isRetracting?: boolean;
  retractingId?: string | null;
  actionsAboveHistory?: React.ReactNode;
  onRankClick?: (kind: 'prestige' | 'shame') => void;
  isAdmin?: boolean;
  onAdminEdit?: (entry: FeedEntry) => void;
  onAdminRetract?: (id: string) => void;
  onAdminRemove?: (id: string) => void;
}

export function MobilePlayerProfile({
  player,
  onTargetClick,
  isOwnProfile = false,
  canEditProfile = false,
  onProfileUpdate,
  onRetract,
  isRetracting = false,
  retractingId = null,
  actionsAboveHistory,
  onRankClick,
  isAdmin = false,
  onAdminEdit,
  onAdminRetract,
  onAdminRemove,
  isSaving = false,
}: MobilePlayerProfileProps) {
  const hexToRgba = (hex: string, alpha: number) => {
    const clean = hex.replace('#', '');
    const bigint = parseInt(clean, 16);
    const r = (bigint >> 16) & 255;
    const g = (bigint >> 8) & 255;
    const b = bigint & 255;
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  };

  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState(player.name);
  const [editNickname, setEditNickname] = useState(player.nickname);
  const [editAvatar, setEditAvatar] = useState(player.avatar);
  const [editAvatarFrame, setEditAvatarFrame] = useState<string | null>(player.avatarFrame ?? null);
  const [editMotto, setEditMotto] = useState(player.motto ?? '');
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [rawPhoto, setRawPhoto] = useState<File | null>(null);
  const [rawPhotoPreview, setRawPhotoPreview] = useState('');
  const [cropperOpen, setCropperOpen] = useState(false);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);
  const [cropping, setCropping] = useState(false);
  const [confirmRetractId, setConfirmRetractId] = useState<string | null>(null);
  const [historyTab, setHistoryTab] = useState<'feed' | 'stats'>('feed');
  const openRecropFromCurrent = useCallback(async () => {
    if (!isEditing) return;
    let sourceFile: File | null = avatarFile;

    const buildFromUrl = async (url: string) => {
      const response = await fetch(url);
      const blob = await response.blob();
      const name = url.split('/').pop() || 'avatar';
      return new File([blob], name, { type: blob.type || 'image/jpeg' });
    };

    if (!sourceFile && editAvatar) {
      try {
        sourceFile = await buildFromUrl(editAvatar);
      } catch {
        sourceFile = null;
      }
    }

    if (!sourceFile && player.avatar) {
      try {
        sourceFile = await buildFromUrl(player.avatar);
      } catch {
        sourceFile = null;
      }
    }

    if (!sourceFile) return;
    const previewUrl = URL.createObjectURL(sourceFile);
    setRawPhoto(sourceFile);
    setRawPhotoPreview(previewUrl);
    setCropperOpen(true);
    setCrop({ x: 0, y: 0 });
    setZoom(1);
    setCroppedAreaPixels(null);
  }, [avatarFile, editAvatar, isEditing, player.avatar]);

  const getReputationStatus = () => {
    if (player.reputation >= 8) {
      return { text: 'ESTÁVEL', color: 'text-[#00F0FF]', barColor: 'bg-[#00F0FF]', glowHex: '#00F0FF' };
    } else if (player.reputation >= 4) {
      return { text: 'SOB VIGILÂNCIA', color: 'text-[#D4A536]', barColor: 'bg-[#D4A536]', glowHex: '#D4A536' };
    } else {
      return { text: 'CRÍTICO', color: 'text-[#FF6B00]', barColor: 'bg-[#FF6B00]', glowHex: '#FF6B00' };
    }
  };

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setRawPhoto(file);
      const previewUrl = URL.createObjectURL(file);
      setRawPhotoPreview(previewUrl);
      setCropperOpen(true);
      setCrop({ x: 0, y: 0 });
      setZoom(1);
      setCroppedAreaPixels(null);
    }
  };

  const onCropComplete = useCallback((_: Area, areaPixels: Area) => {
    setCroppedAreaPixels(areaPixels);
  }, []);

  const getCroppedPhoto = useCallback(async (): Promise<File | null> => {
    if (!rawPhoto || !rawPhotoPreview || !croppedAreaPixels) return rawPhoto ?? null;

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
        const baseName = rawPhoto.name.replace(/\.[^.]+$/, '');
        const file = new File([blob], `${baseName}-cropped.jpeg`, { type: 'image/jpeg' });
        resolve(file);
      }, 'image/jpeg');
    });
  }, [croppedAreaPixels, rawPhoto, rawPhotoPreview]);

  const handleConfirmCrop = useCallback(async () => {
    setCropping(true);
    const cropped = await getCroppedPhoto();
    if (cropped) {
      if (editAvatar && editAvatar.startsWith('blob:')) URL.revokeObjectURL(editAvatar);
      const url = URL.createObjectURL(cropped);
      setAvatarFile(cropped);
      setEditAvatar(url);
    }
    setCropping(false);
    setCropperOpen(false);
    setRawPhoto(null);
    setRawPhotoPreview('');
  }, [editAvatar, getCroppedPhoto]);

  useEffect(() => {
    return () => {
      if (rawPhotoPreview) URL.revokeObjectURL(rawPhotoPreview);
      if (editAvatar && editAvatar.startsWith('blob:')) URL.revokeObjectURL(editAvatar);
    };
  }, [editAvatar, rawPhotoPreview]);

  const handleSave = async () => {
    if (onProfileUpdate) {
      await onProfileUpdate({
        name: editName,
        nickname: editNickname,
        avatar: avatarFile ?? editAvatar,
        motto: editMotto.trim().slice(0, 100) || null,
        avatarFrame: editAvatarFrame || null,
      });
    }
    setIsEditing(false);
    setAvatarFile(null);
    setRawPhoto(null);
    setRawPhotoPreview('');
  };

  const handleCancel = () => {
    setEditName(player.name);
    setEditNickname(player.nickname);
    setEditAvatar(player.avatar);
    setEditAvatarFrame(player.avatarFrame ?? null);
    setEditMotto(player.motto ?? '');
    setAvatarFile(null);
    setRawPhoto(null);
    setRawPhotoPreview('');
    setIsEditing(false);
  };

  const status = getReputationStatus();
  const activeFrame = (isEditing ? editAvatarFrame : player.avatarFrame) ?? null;
  const glowStyles = {
    ['--glow-border' as any]: hexToRgba(status.glowHex, 0.4),
    ['--glow-inner' as any]: hexToRgba(status.glowHex, 0.7),
    ['--glow-middle' as any]: hexToRgba(status.glowHex, 0.6),
    ['--glow-outer' as any]: hexToRgba(status.glowHex, 0.4),
  };

  return (
    <>
      <div className="p-6 !pt-10 space-y-6">
        {/* Player Card */}
        <div>
          {/* Edit Button (Top Right) */}
          {canEditProfile && !isEditing && (
            <div className="flex justify-end mb-4">
              <button
                onClick={() => setIsEditing(true)}
                className="flex items-center gap-2 px-4 py-2 bg-[#00F0FF]/10 border border-[#00F0FF]/30 rounded-lg text-[#00F0FF] font-mono-technical text-xs uppercase hover:bg-[#00F0FF]/20 transition-all"
              >
                <Edit className="w-4 h-4" />
                [ EDITAR PERFIL ]
              </button>
            </div>
          )}

          {/* Avatar */}
          <div className="flex flex-col items-center mb-2">
            <div className="relative mb-4">
              <PlayerAvatar
                avatarUrl={isEditing ? editAvatar : player.avatar}
                frameUrl={activeFrame}
                alt={isEditing ? editNickname : player.nickname}
                wrapperClassName="w-[250px] h-[200px]"
                sizeClassName="w-40 h-44"
                accentClassName={status.barColor}
                paddingClassName="p-[3px]"
                frameClassName="scale-[1.12]"
                imageClassName="rounded-[4px]"
                fallbackIcon={<User className="w-16 h-16 text-[#7F94B0]" />}
              />
              {canEditProfile && isEditing && (
                <label className="absolute -bottom-2 -right-2 w-10 h-10 bg-[#00F0FF] rounded-full flex items-center justify-center border-2 border-[#0B0E14] hover:bg-[#00F0FF]/80 transition-colors cursor-pointer">
                  <Edit className="w-5 h-5 text-[#0B0E14]" />
                  <input
                    type="file"
                    accept="image/*;capture=camera"
                    capture="user"
                    onChange={handleAvatarChange}
                    className="hidden"
                  />
                </label>
              )}
            </div>

            {/* Nickname - Editable */}
            {isEditing ? (
              <div className="w-full mb-4">
                <label className="block text-xs text-[#7F94B0] font-mono-technical uppercase mb-2 text-center">
                  Codinome Operacional
                </label>
                <input
                  type="text"
                  value={editNickname}
                  onChange={(e) => setEditNickname(e.target.value)}
                  className="w-full bg-[#0B0E14] border border-[#2D3A52] rounded-lg px-4 py-2 text-[#E6F1FF] text-center font-mono-technical text-sm focus:border-[#00F0FF] focus:outline-none transition-colors"
                  placeholder='Ex: Carlos "Raptor" Silva'
                />
              </div>
            ) : (
              <h2 className="text-4xl break-words w-full max-w-full text-center mb-2 text-[#E6F1FF]">{player.nickname}</h2>
            )}

            {/* Full Name - Editable */}
            {isEditing ? (
              <div className="w-full mb-4 space-y-4">
                <div>
                  <label className="block text-xs text-[#7F94B0] font-mono-technical uppercase mb-2 text-center">
                    Nome Completo
                  </label>
                  <input
                    type="text"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className="w-full bg-[#0B0E14] border border-[#2D3A52] rounded-lg px-4 py-2 text-[#E6F1FF] text-center font-mono-technical text-sm focus:border-[#00F0FF] focus:outline-none transition-colors"
                    placeholder="Nome completo"
                  />
                </div>
                <div>
                  <label className="block text-xs text-[#7F94B0] font-mono-technical uppercase mb-2 text-center">
                    Bordão
                  </label>
                  <input
                    type="text"
                    value={editMotto}
                    onChange={(e) => setEditMotto(e.target.value.slice(0, 100))}
                    className="w-full bg-[#0B0E14] border border-[#2D3A52] rounded-lg px-4 py-2 text-[#E6F1FF] text-center font-mono-technical text-sm focus:border-[#00F0FF] focus:outline-none transition-colors"
                    placeholder="Frase curta (opcional)"
                    maxLength={100}
                  />
                </div>
                <div>
                  <label className="block text-xs text-[#7F94B0] font-mono-technical uppercase mb-2 text-center">
                    Moldura do Perfil
                  </label>
                  <select
                    value={editAvatarFrame ?? ''}
                    onChange={(e) => setEditAvatarFrame(e.target.value || null)}
                    className="w-full bg-[#0B0E14] border border-[#2D3A52] rounded-lg px-4 py-2 text-[#E6F1FF] text-center font-mono-technical text-sm focus:border-[#00F0FF] focus:outline-none transition-colors"
                  >
                    <option value="">Sem moldura</option>
                    {frameOptions.map((frame) => (
                      <option key={frame.value} value={frame.value}>
                        {frame.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            ) : (
              <div className="mb-3 space-y-1">
                <p className="text-lg mb-3 text-[#7F94B0] font-mono-technical text-center">{player.name}</p>
              {player.motto ? (
                <p
                  className={`text-md w-full text-[#7F94B0] font-mono-technical text-center glitch-text ${player.motto.length > 60 && "text-justify!"}`}
                  data-text={`"${player.motto}"`}
                >
                  "{player.motto}"
                </p>
              ) : null}
              </div>
            )}
            {(player.rankPrestige || player.rankShame) ? (
              <div className="mb-3 space-y-2">
                <div className="mx-auto flex flex-wrap items-center justify-center gap-2 text-center text-sm font-mono-technical text-[#E6F1FF]">
                  {player.rankPrestige ? (
                    <TacticalButton
                      variant="cyan"
                      onClick={() => onRankClick?.('prestige')}
                      className="text-xs !px-3 !py-1"
                    >
                      <span className="text-[#00F0FF] font-semibold">#{player.rankPrestige}</span>
                      <span className="text-[#7F94B0]">·</span>
                      <span className="text-[#00F0FF]">Prestígio</span>
                    </TacticalButton>
                  ) : null}
                  {player.rankShame ? (
                    <TacticalButton
                      variant="amber"
                      onClick={() => onRankClick?.('shame')}
                      className="text-xs !px-3 !py-1"
                    >
                      <span className="text-[#D4A536] font-semibold">#{player.rankShame}</span>
                      <span className="text-[#7F94B0]">·</span>
                      <span className="text-[#D4A536]">Infâmia</span>
                    </TacticalButton>
                  ) : null}
                </div>
              </div>
            ) : null}

            {/* Save/Cancel Buttons */}
            {isEditing && (
              <div className="w-full grid grid-cols-2 gap-3 mt-4">
                <button
                  onClick={handleCancel}
                  className="flex items-center justify-center gap-2 px-4 py-2 bg-[#FF6B00]/10 border border-[#FF6B00]/30 rounded-lg text-[#FF6B00] font-mono-technical text-xs uppercase hover:bg-[#FF6B00]/20 transition-all"
                >
                  <X className="w-4 h-4" />
                  CANCELAR
                </button>
                <button
                  onClick={handleSave}
                  disabled={isSaving}
                  className="flex items-center justify-center gap-2 px-4 py-2 bg-[#00F0FF]/10 border border-[#00F0FF]/30 rounded-lg text-[#00F0FF] font-mono-technical text-xs uppercase hover:bg-[#00F0FF]/20 transition-all shadow-[0_0_15px_rgba(0,240,255,0.3)]"
                >
                  {isSaving ? <Spinner inline size="sm" /> : <Check className="w-4 h-4" />}
                  {isSaving ? 'SALVANDO...' : 'SALVAR'}
                </button>
              </div>
            )}
          </div>

          {/* Reputation Status */}
          <div className="mb-6 flex flex-col justify-center items-center gap-1">
            <span className="text-lg text-[#7F94B0] tracking-normal font-mono-technical uppercase">Status de Reputação</span>
            <div className="flex gap-1.5 w-full border border-[#2D3A52] p-1.5 rounded-md h-fit justify-around">
              {Array.from({ length: 10 }).map((_, i) => (
                <div
                  key={i}
                  style={i < player.reputation ? glowStyles : undefined}
                  className={` rounded w-7 sm:flex-1 h-10 ${i < player.reputation ? status.barColor + ' luminescent-div bg-gray-100! ' : 'bg-[#384d61]'}`}
                />
              ))}
            </div>
            <span className={`text-lg tracking-normal [word-spacing:0px] font-mono-technical ${status.color}`}>
              [{player.reputation}/10] {status.text}
            </span>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 gap-3">
            {/* Reports */}


            {/* Praises */}
            <div className='container-arrow'>
              <svg className='arrow-up blue-arrow' width="24" height="23" viewBox="0 0 24 23" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M2.41422 22H22.4142V2L2.41422 22Z" stroke="currentColor" strokeWidth="4" strokeLinecap="round" />
              </svg>
              <svg className='arrow-down blue-arrow' width="24" height="23" viewBox="0 0 24 23" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M2.41422 22H22.4142V2L2.41422 22Z" stroke="currentColor" strokeWidth="4" strokeLinecap="round" />
              </svg>
              <div className="clip-tactical-stats bg-[#2ad4e0] rounded-md p-[2px] text-center">
                <div className="clip-tactical-stats inner-shadow-blue bg-[#092c2e] rounded-md p-2 text-center">
                  <div className="text-5xl text-[#00F0FF] font-mono-technical mb-1">{player.praiseCount.toString().padStart(2, '0')}</div>
                  <div className="text-sm text-[#00F0FF] uppercase font-mono-technical">Pontos de<br />Prestígio</div>
                </div>
              </div>
            </div>
            <div className='container-arrow'>
              <svg className='arrow-up ambar-arrow' width="24" height="23" viewBox="0 0 24 23" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M2.41422 22H22.4142V2L2.41422 22Z" stroke="currentColor" strokeWidth="4" strokeLinecap="round" />
              </svg>
              <svg className='arrow-down ambar-arrow' width="24" height="23" viewBox="0 0 24 23" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M2.41422 22H22.4142V2L2.41422 22Z" stroke="currentColor" strokeWidth="4" strokeLinecap="round" />
              </svg>
              <div className="clip-tactical-stats bg-[#D4A536] rounded-md p-[2px] text-center">
                <div className="clip-tactical-stats  inner-shadow-ambar bg-[#2e2509] rounded-md p-2 text-center">
                  <div className="text-5xl text-[#D4A536] font-mono-technical mb-1">
                    {player.reportCount.toString().padStart(2, '0')}
                  </div>
                  <div className="text-sm text-[#D4A536] uppercase font-mono-technical">
                    Pontos de<br />Infâmia
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Cropper Dialog */}
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
              <div className="relative h-[320px] w-full rounded-xl overflow-hidden border border-[#2D3A52] bg-[#0B0E14]">
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
                    clipPath: 'polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)',
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
              >
                [ CANCELAR ]
              </button>
              <button
                type="button"
                onClick={() => void handleConfirmCrop()}
                className={`px-4 py-2 bg-[#00F0FF]/10 border-2 border-[#00F0FF] rounded-lg text-[#00F0FF] font-mono-technical text-xs uppercase hover:bg-[#00F0FF]/20 transition-all flex items-center justify-center ${cropping ? 'opacity-70 cursor-not-allowed' : ''}`}
                disabled={cropping}
              >
                {cropping ? <Spinner inline size="sm" label="cortando" /> : '[ CORTAR ]'}
              </button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

      {/* History Section */}
      <div>
        {actionsAboveHistory ? <div className="mb-4">{actionsAboveHistory}</div> : null}
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-mono-technical tracking-wider text-[#7F94B0] uppercase">
            Histórico Operacional
          </h3>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setHistoryTab('feed')}
              className={`clip-tactical px-3 py-1 border transition-all text-[10px] uppercase font-mono-technical ${
                historyTab === 'feed'
                  ? 'border-[#00F0FF] bg-[#00F0FF]/15 text-[#00F0FF]'
                  : 'border-[#2D3A52] bg-[#0B0E14] text-[#7F94B0] hover:border-[#00F0FF]/40'
              }`}
            >
              Transmissões
            </button>
            <button
              type="button"
              onClick={() => setHistoryTab('stats')}
              className={`clip-tactical px-3 py-1 border transition-all text-[10px] uppercase font-mono-technical ${
                historyTab === 'stats'
                  ? 'border-[#D4A536] bg-[#D4A536]/15 text-[#D4A536]'
                  : 'border-[#2D3A52] bg-[#0B0E14] text-[#7F94B0] hover:border-[#D4A536]/40'
              }`}
            >
              Stats
            </button>
          </div>
        </div>
        <div className="space-y-3">
          {historyTab === 'feed' ? (
            player.history.length > 0 ? (
              player.history.map((entry) => (
                <div key={entry.id} className="relative">
                  <MobileFeedCard
                    entry={entry}
                    onTargetClick={onTargetClick}
                    isAdmin={isAdmin}
                    onEdit={onAdminEdit ? () => onAdminEdit(entry) : undefined}
                    onRetract={onAdminRetract}
                    onRemove={onAdminRemove}
                  />
                  {isOwnProfile && entry.type === 'report' && !entry.isRetracted && onRetract && (
                    <div className="absolute z-50 top-2 right-2">
                      <button
                        onClick={() => setConfirmRetractId(entry.id)}
                        disabled={isRetracting}
                        className="text-xs font-mono-technical text-[#FF6B00] hover:text-[#FF8C33] border border-[#FF6B00]/40 rounded px-2 py-1 bg-[#0B0E14]/80 disabled:opacity-60 disabled:cursor-not-allowed"
                      >
                        {isRetracting && retractingId === entry.id ? (
                          <Spinner inline size="sm" label="retratando" />
                        ) : (
                          '[ RETRATAR ]'
                        )}
                      </button>
                    </div>
                  )}
                </div>
              ))
            ) : (
              <div className="bg-[#141A26] rounded-lg border border-[#2D3A52] p-8 text-center">
                <p className="text-[#7F94B0] text-sm">Nenhum registro encontrado</p>
              </div>
            )
          ) : (
            <div className="clip-tactical-card bg-[#141A26] border-x-4 border-[#2D3A52] p-5 space-y-4">
              <div className="text-[10px] text-[#7F94B0] font-mono-technical uppercase">
                // Estatísticas do Operador
              </div>
              {player.matchCount !== null && player.matchCount !== undefined ? (
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-xs text-[#7F94B0] font-mono-technical uppercase">Partidas</div>
                    <div className="text-[10px] text-[#7F94B0] font-mono-technical">
                      Presenças confirmadas
                    </div>
                  </div>
                  <div className="text-3xl text-[#00F0FF] font-mono-technical">
                    {String(player.matchCount).padStart(2, '0')}
                  </div>
                </div>
              ) : (
                <div className="text-xs text-[#7F94B0] font-mono-technical">
                  Estatísticas indisponíveis no momento.
                </div>
              )}
              <div className="text-[10px] text-[#7F94B0] font-mono-technical uppercase">
                // Novos indicadores serão adicionados aqui.
              </div>
            </div>
          )}
        </div>
      </div>
      </div>

      <Dialog open={Boolean(confirmRetractId)} onOpenChange={(open) => !open && setConfirmRetractId(null)}>
        <DialogContent className="bg-[#0B0E14] border border-[#2D3A52] text-[#E6F1FF]">
          <DialogHeader>
            <DialogTitle className="text-[#E6F1FF] font-mono-technical uppercase">
              Retratar transmissão?
            </DialogTitle>
            <DialogDescription className="text-[#7F94B0]">
              Essa ação removerá seu relato. Confirme para continuar.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex justify-end gap-3">
            <TacticalButton variant="cyan" onClick={() => setConfirmRetractId(null)} disabled={isRetracting}>
              Cancelar
            </TacticalButton>
            <TacticalButton
              variant="amber"
              disabled={isRetracting}
              onClick={() => {
                if (confirmRetractId && onRetract) {
                  onRetract(confirmRetractId);
                }
                setConfirmRetractId(null);
              }}
            >
              {isRetracting ? <Spinner inline size="sm" label="retratando" /> : 'Confirmar'}
            </TacticalButton>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
