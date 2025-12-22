type AvatarFrameProps = {
  src?: string | null;
  className?: string;
};

export function AvatarFrame({ src, className }: AvatarFrameProps) {
  if (!src) return null;
  return (
    <img
      src={src}
      alt="Moldura do perfil"
      className={`absolute inset-0 w-full h-full object-contain pointer-events-none z-20 ${className ?? ''}`}
    />
  );
}
