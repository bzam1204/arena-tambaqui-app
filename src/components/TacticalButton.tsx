interface TacticalButtonProps {
  children: React.ReactNode;
  variant?: 'cyan' | 'amber';
  onClick?: () => void;
  type?: 'button' | 'submit';
  fullWidth?: boolean;
  disabled?: boolean;
}

export function TacticalButton({ 
  children, 
  variant = 'cyan', 
  onClick, 
  type = 'button',
  fullWidth = false,
  disabled = false
}: TacticalButtonProps) {
  const baseClasses = "clip-tactical font-mono-technical uppercase tracking-wider transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed";
  
  const variantClasses = {
    cyan: "bg-[#00F0FF15] border border-[#00F0FF] text-[#00F0FF] glow-cyan hover:bg-[#00F0FF30] hover:glow-cyan-intense",
    amber: "bg-[#D4A536]/20 border border-[#D4A536] text-[#D4A536] shadow-[0_0_10px_rgba(212,165,54,0.3)] hover:bg-[#D4A536]/30 hover:shadow-[0_0_20px_rgba(212,165,54,0.6)]"
  };

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`${baseClasses} ${variantClasses[variant]} ${fullWidth ? 'w-full' : ''} px-6 py-3`}
    >
      {children}
    </button>
  );
}