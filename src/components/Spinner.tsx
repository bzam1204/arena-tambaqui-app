type SpinnerProps = {
  fullScreen?: boolean;
  label?: string;
  size?: 'sm' | 'md';
  inline?: boolean;
};

export function Spinner({ fullScreen = false, label, size = 'md', inline = false }: SpinnerProps) {
  const ringSize = size === 'sm' ? 'w-4 h-4' : 'w-12 h-12';
  const borderSize = size === 'sm' ? 'border-2' : 'border-4';

  const spinnerCircle = (
    <div className={`relative ${ringSize}`}>
      <div className={`absolute inset-0 ${borderSize} border-[#2D3A52] rounded-full`} />
      <div className={`absolute inset-0 ${borderSize} border-t-[#00F0FF] border-r-[#00F0FF] border-b-transparent border-l-transparent rounded-full animate-spin`} />
    </div>
  );

  if (inline) {
    return (
      <div className="inline-flex items-center justify-center gap-2 text-[#E6F1FF]">
        {spinnerCircle}
        {label ? <span className="text-xs font-mono-technical tracking-wide uppercase text-[#7F94B0]">{label}</span> : null}
      </div>
    );
  }

  const content = (
    <div className="flex flex-col items-center justify-center gap-3 text-[#E6F1FF]">
      {spinnerCircle}
      {label ? <span className="text-xs font-mono-technical tracking-wide uppercase text-[#7F94B0]">{label}</span> : null}
    </div>
  );

  if (fullScreen) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0B0E14]">
        {content}
      </div>
    );
  }

  return <div className="py-10 flex items-center justify-center">{content}</div>;
}
