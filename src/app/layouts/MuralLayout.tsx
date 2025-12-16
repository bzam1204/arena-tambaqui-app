import { Outlet, Link, useLocation } from 'react-router-dom';

function MuralTabs() {
  const location = useLocation();
  const isFeed = location.pathname.endsWith('/feed');
  return (
    <div className="px-4 pt-6 pb-4">
      <div className="flex gap-2 bg-[#141A26] p-1 rounded-lg border border-[#2D3A52]">
        <Link
          to="/mural/feed"
          className={`flex-1 text-center py-3 rounded-md transition-all font-mono-technical text-sm uppercase tracking-wider ${
            isFeed
              ? 'bg-[#00F0FF]/10 text-[#00F0FF] border border-[#00F0FF]/30 shadow-[0_0_15px_rgba(0,240,255,0.3)]'
              : 'text-[#7F94B0] hover:text-[#E6F1FF] border border-[#00F0FF]/1'
          }`}
        >
          Transmissões
        </Link>
        <Link
          to="/mural/rankings"
          className={`flex-1 text-center py-3 rounded-md transition-all font-mono-technical text-sm uppercase tracking-wider ${
            !isFeed
              ? 'bg-[#00F0FF]/10 text-[#00F0FF] border border-[#00F0FF]/30 shadow-[0_0_15px_rgba(0,240,255,0.3)]'
              : 'text-[#7F94B0] hover:text-[#E6F1FF] border border-[#00F0FF]/1'
          }`}
        >
          Rankings
        </Link>
      </div>
    </div>
  );
}

export function MuralLayout() {
  return (
    <>
      <MuralTabs />
      <Outlet />
    </>
  );
}
