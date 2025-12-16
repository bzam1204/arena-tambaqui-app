import { ChevronLeft } from 'lucide-react';
import { TacticalButton } from './TacticalButton';

interface MobileHeaderProps {
  title?: string;
  subtitle?: string;
  showBack?: boolean;
  onBack?: () => void;
  isLoggedIn?: boolean;
  onLogin?: () => void;
  onLogout?: () => void;
}

export function MobileHeader({ title, subtitle, showBack, onBack, isLoggedIn, onLogin, onLogout }: MobileHeaderProps) {
  return (
    <header className="bg-[#0B0E14]/95 backdrop-blur-sm px-4 py-4 border-b border-[#2D3A52]">
      {showBack ? (
        <button 
          onClick={onBack}
          className="flex items-center gap-2 text-[#00F0FF] font-mono-technical text-sm uppercase tracking-wider"
        >
          <ChevronLeft className="w-4 h-4" />
          Voltar
        </button>
      ) : (
        <div className="flex items-center justify-between">
          <h1 className="text-xl tracking-widest text-[#E6F1FF]">
            ARENA TAMBAQUI
          </h1>
          <div className="flex items-center gap-2">
            {!isLoggedIn && onLogin && (
              <TacticalButton onClick={onLogin} variant="cyan">
                [ ENTRAR ]
              </TacticalButton>
            )}
            {isLoggedIn && onLogout && (
              <TacticalButton onClick={onLogout} variant="amber">
                [ SAIR ]
              </TacticalButton>
            )}
          </div>
        </div>
      )}
      
      {title && (
        <div className="text-center mt-2">
          <h2 className="text-lg tracking-widest uppercase">{title}</h2>
          {subtitle && <p className="text-xs text-[#7F94B0] mt-1">{subtitle}</p>}
        </div>
      )}
    </header>
  );
}
