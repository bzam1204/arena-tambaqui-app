import { CalendarDays, Home, Search, User } from 'lucide-react';

interface BottomNavProps {
  currentView: 'matches' | 'feed' | 'search' | 'profile';
  onNavigate: (view: 'matches' | 'feed' | 'search' | 'profile') => void;
  isLoggedIn: boolean;
}

export function BottomNav({ currentView, onNavigate, isLoggedIn }: BottomNavProps) {
  const navItems = [
    { id: 'feed' as const, icon: Home, label: 'Mural' },
    { id: 'matches' as const, icon: CalendarDays, label: 'Partidas' },
    { id: 'search' as const, icon: Search, label: 'Busca' },
    { id: 'profile' as const, icon: User, label: 'Perfil' },
  ];
  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-[#0B0E14]/95 backdrop-blur-sm border-t border-[#2D3A52] z-50">
      <div className="flex items-center justify-around px-4 py-3">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentView === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onNavigate(item.id)}
              className={`flex flex-col items-center gap-1 transition-colors ${
                isActive 
                  ? 'text-[#00F0FF]' 
                  : 'text-[#7F94B0] hover:text-[#E6F1FF]'
              }`}
            >
              <Icon className="w-5 h-5" />
              <span className="text-xs font-mono-technical uppercase">{item.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
