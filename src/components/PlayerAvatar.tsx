import { User } from 'lucide-react';
import { AvatarFrame } from './AvatarFrame';

type PlayerAvatarProps = {
  avatarUrl?: string | null;
  frameUrl?: string | null;
  alt?: string;
  wrapperClassName?: string;
  sizeClassName?: string;
  accentClassName?: string;
  paddingClassName?: string;
  imageClassName?: string;
  frameClassName?: string;
  fallbackIcon?: React.ReactNode;
};

export function PlayerAvatar({
  avatarUrl,
  frameUrl,
  alt = 'Avatar do jogador',
  wrapperClassName,
  sizeClassName = 'w-10 h-11',
  accentClassName = 'bg-[#00F0FF]',
  paddingClassName = 'p-[2px]',
  imageClassName,
  frameClassName = 'scale-[1.18]',
  fallbackIcon,
}: PlayerAvatarProps) {
  const wrapper = wrapperClassName ?? sizeClassName;

  return (
    <div className={`relative flex items-center justify-center ${wrapper}`}>
      <AvatarFrame src={frameUrl} className={frameClassName} />
      <div className={`relative z-10 ${sizeClassName} ${accentClassName} clip-hexagon-perfect ${paddingClassName}`}>
        <div className="w-full h-full bg-[#0B0E14] clip-hexagon-perfect flex items-center justify-center">
          {avatarUrl ? (
            <img
              src={avatarUrl}
              alt={alt}
              className={`w-full h-full object-cover clip-hexagon-perfect ${imageClassName ?? ''}`}
            />
          ) : (
            fallbackIcon ?? <User className="w-5 h-5 text-[#7F94B0]" />
          )}
        </div>
      </div>
    </div>
  );
}
