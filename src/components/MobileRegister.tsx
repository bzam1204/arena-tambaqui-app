import { Shield, Chrome } from 'lucide-react';
import { useState } from 'react';

interface MobileRegisterProps {
  onGoogleSignIn: () => void;
}

export function MobileRegister({ onGoogleSignIn }: MobileRegisterProps) {
  const [isLoading, setIsLoading] = useState(false);

  const handleGoogleSignIn = () => {
    setIsLoading(true);
    // Simulate Google OAuth delay
    setTimeout(() => {
      onGoogleSignIn();
    }, 1500);
  };

  return (
    <div className="min-h-screen bg-[#0B0E14] flex flex-col items-center justify-center px-6 py-12">
      {/* Scanlines Effect */}
      <div className="fixed inset-0 pointer-events-none opacity-[0.03]">
        <div className="h-full w-full" style={{
          backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 2px, #00F0FF 2px, #00F0FF 4px)'
        }} />
      </div>

      {/* Logo/Shield Icon */}
      <div className="relative mb-8">
        <div className="w-24 h-24 bg-[#00F0FF] clip-hexagon p-[3px]">
          <div className="w-full h-full bg-[#0B0E14] clip-hexagon flex items-center justify-center">
            <Shield className="w-12 h-12 text-[#00F0FF]" />
          </div>
        </div>
        <div className="absolute inset-0 bg-[#00F0FF] blur-xl opacity-20 clip-hexagon" />
      </div>

      {/* Title */}
      <div className="text-center mb-12">
        <h1 className="text-3xl mb-2 text-[#E6F1FF] tracking-wider">
          ARENA TAMBAQUI
        </h1>
        <div className="h-[2px] w-32 mx-auto bg-gradient-to-r from-transparent via-[#00F0FF] to-transparent mb-4" />
        <p className="text-sm text-[#7F94B0] font-mono-technical uppercase">
          Protocolo Sombra // v2.0
        </p>
      </div>

      {/* Main Card */}
      <div className="w-full max-w-md bg-[#141A26] rounded-lg border border-[#2D3A52] p-8 relative overflow-hidden">
        {/* Corner Accents */}
        <div className="absolute top-0 left-0 w-16 h-16 border-l-2 border-t-2 border-[#00F0FF]/30" />
        <div className="absolute top-0 right-0 w-16 h-16 border-r-2 border-t-2 border-[#00F0FF]/30" />
        <div className="absolute bottom-0 left-0 w-16 h-16 border-l-2 border-b-2 border-[#00F0FF]/30" />
        <div className="absolute bottom-0 right-0 w-16 h-16 border-r-2 border-b-2 border-[#00F0FF]/30" />

        <div className="relative z-10">
          {/* Header */}
          <div className="text-center mb-8">
            <h2 className="text-xl mb-2 text-[#E6F1FF]">
              [ CRIAR CONTA ]
            </h2>
            <p className="text-xs text-[#7F94B0] font-mono-technical">
              Inicie sua operação na plataforma
            </p>
          </div>

          {/* Google Sign-In Button */}
          <button
            onClick={handleGoogleSignIn}
            disabled={isLoading}
            className="w-full bg-[#00F0FF]/10 border-2 border-[#00F0FF] rounded-lg p-4 hover:bg-[#00F0FF]/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed relative overflow-hidden group"
          >
            <div className="flex items-center justify-center gap-3">
              <Chrome className="w-6 h-6 text-[#00F0FF]" />
              <span className="text-[#00F0FF] font-mono-technical uppercase tracking-wider">
                {isLoading ? '[ CONECTANDO... ]' : '[ ENTRAR COM GOOGLE ]'}
              </span>
            </div>
            
            {/* Glow Effect */}
            {!isLoading && (
              <div className="absolute inset-0 bg-[#00F0FF] opacity-0 group-hover:opacity-10 transition-opacity" />
            )}
            
            {/* Loading Animation */}
            {isLoading && (
              <div className="absolute bottom-0 left-0 right-0 h-1 bg-[#00F0FF]/30 overflow-hidden">
                <div className="h-full bg-[#00F0FF] animate-loading-bar" />
              </div>
            )}
          </button>

          {/* Divider */}
          <div className="flex items-center gap-3 my-6">
            <div className="flex-1 h-[1px] bg-gradient-to-r from-transparent to-[#2D3A52]" />
            <span className="text-xs text-[#7F94B0] font-mono-technical">SEGURO</span>
            <div className="flex-1 h-[1px] bg-gradient-to-l from-transparent to-[#2D3A52]" />
          </div>

          {/* Info Text */}
          <div className="text-center text-xs text-[#7F94B0] space-y-2">
            <p className="font-mono-technical">
              Autenticação segura via Google OAuth
            </p>
            <p className="text-[10px] opacity-70">
              Após autenticação, você completará seu perfil operacional
            </p>
          </div>
        </div>
      </div>

      {/* Footer Notice */}
      <div className="mt-8 text-center max-w-md">
        <p className="text-xs text-[#7F94B0] font-mono-technical leading-relaxed">
          Ao criar uma conta, você concorda em manter a integridade<br/>
          do esporte airsoft e reportar apenas informações verdadeiras.
        </p>
      </div>
    </div>
  );
}
