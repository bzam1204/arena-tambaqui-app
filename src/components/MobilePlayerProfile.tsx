import { User, AlertTriangle, Award, Edit, X, Check } from 'lucide-react';
import { MobileFeedCard, FeedEntry } from './MobileFeedCard';
import { useState } from 'react';
import { TacticalButton } from './TacticalButton';

export interface PlayerData {
  id: string;
  name: string;
  nickname: string;
  avatar?: string;
  reputation: number; // 0-10
  reportCount: number;
  praiseCount: number;
  history: FeedEntry[];
  rankPrestige?: number | null;
  rankShame?: number | null;
}

interface MobilePlayerProfileProps {
  player: PlayerData;
  onTargetClick: (targetId: string) => void;
  isOwnProfile?: boolean;
  onProfileUpdate?: (data: { name: string; nickname: string; avatar?: string }) => void;
  onRetract?: (entryId: string) => void;
  actionsAboveHistory?: React.ReactNode;
  onRankClick?: () => void;
}

export function MobilePlayerProfile({
  player,
  onTargetClick,
  isOwnProfile = false,
  onProfileUpdate,
  onRetract,
  actionsAboveHistory,
  onRankClick,
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
  const [avatarFile, setAvatarFile] = useState<File | null>(null);

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
      setAvatarFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setEditAvatar(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = () => {
    if (onProfileUpdate) {
      onProfileUpdate({
        name: editName,
        nickname: editNickname,
        avatar: avatarFile ?? editAvatar,
      });
    }
    setIsEditing(false);
    setAvatarFile(null);
  };

  const handleCancel = () => {
    setEditName(player.name);
    setEditNickname(player.nickname);
    setEditAvatar(player.avatar);
    setAvatarFile(null);
    setIsEditing(false);
  };

  const status = getReputationStatus();
  const glowStyles = {
    ['--glow-border' as any]: hexToRgba(status.glowHex, 0.4),
    ['--glow-inner' as any]: hexToRgba(status.glowHex, 0.7),
    ['--glow-middle' as any]: hexToRgba(status.glowHex, 0.6),
    ['--glow-outer' as any]: hexToRgba(status.glowHex, 0.4),
  };

  return (
    <div className="p-6 !pt-10 space-y-6">
      {/* Player Card */}
      <div>
        {/* Edit Button (Top Right) */}
        {isOwnProfile && !isEditing && (
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
            <div className={`w-40 h-44 ${status.barColor} clip-hexagon-perfect p-[3px]`}>
              <div className="w-full h-full bg-[#0B0E14] clip-hexagon-perfect flex items-center justify-center">
                {(isEditing ? editAvatar : player.avatar) ? (
                  <img
                    src={isEditing ? editAvatar : player.avatar}
                    alt={isEditing ? editNickname : player.nickname}
                    className="w-full h-full object-cover clip-hexagon-perfect rounded-[4px]"
                  />
                ) : (
                  <User className="w-16 h-16 text-[#7F94B0]" />
                )}
              </div>
            </div>
            {isOwnProfile && isEditing && (
              <label className="absolute -bottom-2 -right-2 w-10 h-10 bg-[#00F0FF] rounded-full flex items-center justify-center border-2 border-[#0B0E14] hover:bg-[#00F0FF]/80 transition-colors cursor-pointer">
                <Edit className="w-5 h-5 text-[#0B0E14]" />
                <input
                  type="file"
                  accept="image/*"
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
            <div className="w-full mb-4">
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
          ) : (
            <div className="mb-3 space-y-1">
              <p className="text-lg mb-3 text-[#7F94B0] font-mono-technical text-center">{player.name}</p>
              {(player.rankPrestige || player.rankShame) && (
                <button
                  type="button"
                  onClick={onRankClick}
                  className="mx-auto flex items-center justify-center gap-2 text-center text-sm font-mono-technical text-[#E6F1FF] bg-[#0B0E14] border border-[#2D3A52] rounded px-3 py-1 hover:border-[#00F0FF]/60"
                >
                  {player.rankPrestige ? (
                    <span className="text-[#00F0FF] font-semibold">#{player.rankPrestige} · Prestígio</span>
                  ) : null}
                  {player.rankPrestige && player.rankShame ? <span className="text-[#7F94B0]">/</span> : null}
                  {player.rankShame ? (
                    <span className="text-[#D4A536] font-semibold">#{player.rankShame} · Vergonha</span>
                  ) : null}
                </button>
              )}
            </div>
          )}

          {/* CPF - Disabled */}
          {isEditing && (
            <div className="w-full mb-4">
              <label className="block text-xs text-[#7F94B0] font-mono-technical uppercase mb-2 text-center">
                CPF (Não Editável)
              </label>
              <input
                type="text"
                value="***.***.***-**"
                disabled
                className="w-full bg-[#141A26] border border-[#2D3A52] rounded-lg px-4 py-2 text-[#7F94B0] text-center font-mono-technical text-sm cursor-not-allowed opacity-60"
              />
            </div>
          )}

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
                className="flex items-center justify-center gap-2 px-4 py-2 bg-[#00F0FF]/10 border border-[#00F0FF]/30 rounded-lg text-[#00F0FF] font-mono-technical text-xs uppercase hover:bg-[#00F0FF]/20 transition-all shadow-[0_0_15px_rgba(0,240,255,0.3)]"
              >
                <Check className="w-4 h-4" />
                SALVAR
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
                <div className="text-sm text-[#00F0FF] uppercase font-mono-technical">Elogios<br />Recebidos</div>
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
                  Denúncias<br />Recebidas
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* History Section */}
      <div>
        {actionsAboveHistory ? <div className="mb-4">{actionsAboveHistory}</div> : null}
        <h3 className="text-sm font-mono-technical tracking-wider mb-3 text-[#7F94B0] uppercase">
          Histórico Operacional
        </h3>
        <div className="space-y-3">
          {player.history.length > 0 ? (
            player.history.map((entry) => (
              <div key={entry.id} className="relative">
                <MobileFeedCard entry={entry} onTargetClick={onTargetClick} />
                {isOwnProfile && entry.type === 'report' && !entry.isRetracted && onRetract && (
                  <div className="absolute top-2 right-2">
                    <button
                      onClick={() => onRetract(entry.id)}
                      className="text-xs font-mono-technical text-[#FF6B00] hover:text-[#FF8C33] border border-[#FF6B00]/40 rounded px-2 py-1 bg-[#0B0E14]/80"
                    >
                      [ RETRATAR ]
                    </button>
                  </div>
                )}
              </div>
            ))
          ) : (
            <div className="bg-[#141A26] rounded-lg border border-[#2D3A52] p-8 text-center">
              <p className="text-[#7F94B0] text-sm">Nenhum registro encontrado</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
