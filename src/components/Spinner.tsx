type SpinnerProps = {
  fullScreen?: boolean;
  label?: string;
};

export function Spinner({ fullScreen = false, label }: SpinnerProps) {
  const content = (
    <div className="flex flex-col items-center justify-center gap-3 text-[#E6F1FF]">
      <div className="relative w-12 h-12">
        <div className="absolute inset-0 border-4 border-[#2D3A52] rounded-full" />
        <div className="absolute inset-0 border-4 border-t-[#00F0FF] border-r-[#00F0FF] border-b-transparent border-l-transparent rounded-full animate-spin" />
      </div>
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
