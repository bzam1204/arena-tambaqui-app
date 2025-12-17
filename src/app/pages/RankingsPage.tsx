import { useEffect, useRef, useState } from 'react';
import { useInfiniteQuery } from '@tanstack/react-query';
import { useNavigate, useParams } from 'react-router-dom';
import { RankingSection } from '@/components/RankingSection';
import { Spinner } from '@/components/Spinner';
import type { PlayerGateway, Player } from '@/app/gateways/PlayerGateway';
import { Inject, TkPlayerGateway } from '@/infra/container';

export function RankingsPage() {
  const playerGateway = Inject<PlayerGateway>(TkPlayerGateway);
  const navigate = useNavigate();
  const { kind } = useParams();
  const sentinelRef = useRef<HTMLDivElement | null>(null);
  const [scrolled, setScrolled] = useState(false);
  const initial = kind === 'vergonha' ? 'shame' : 'prestige';
  const [tab, setTab] = useState<'prestige' | 'shame'>(initial);
  const pageSize = 25;

  useEffect(() => {
    const next = kind === 'vergonha' ? 'shame' : 'prestige';
    setTab(next);
  }, [kind]);

  const {
    data,
    isLoading,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useInfiniteQuery({
    queryKey: ['players', 'ranking', tab],
    queryFn: ({ pageParam = 0 }) => playerGateway.listPlayersPaged({ page: pageParam as number, pageSize, kind: tab }),
    getNextPageParam: (lastPage, allPages) => (lastPage.length < pageSize ? undefined : allPages.length),
  });

  const players = data?.pages.flatMap((p) => p) ?? [];

  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel) return;
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && hasNextPage && !isFetchingNextPage) {
            fetchNextPage();
          }
        });
      },
      { rootMargin: '200px' },
    );
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  useEffect(() => {
    const onScroll = () => {
      setScrolled(window.scrollY > 300);
    };
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <div className="px-4 pb-20">
      <div className="grid grid-cols-2 gap-2 mb-4">
        <button
          onClick={() => navigate('/mural/rankings/prestigio')}
          className={`clip-tactical p-3 border-2 transition-all rounded-lg ${
            tab === 'prestige'
              ? 'border-[#00F0FF] bg-[#00F0FF]/20'
              : 'border-[#2D3A52] bg-[#0B0E14] hover:border-[#00F0FF]/50'
          }`}
        >
          <div className="flex items-center justify-center gap-2">
            <span className={`font-mono-technical text-xs uppercase ${tab === 'prestige' ? 'text-[#00F0FF]' : 'text-[#7F94B0]'}`}>
              Prestígio
            </span>
          </div>
        </button>

        <button
          onClick={() => navigate('/mural/rankings/vergonha')}
          className={`clip-tactical p-3 border-2 transition-all rounded-lg ${
            tab === 'shame'
              ? 'border-[#D4A536] bg-[#D4A536]/20'
              : 'border-[#2D3A52] bg-[#0B0E14] hover:border-[#D4A536]/50'
          }`}
        >
          <div className="flex items-center justify-center gap-2">
            <span className={`font-mono-technical text-xs uppercase ${tab === 'shame' ? 'text-[#D4A536]' : 'text-[#7F94B0]'}`}>
              Vergonha
            </span>
          </div>
        </button>
      </div>

      {isLoading && players.length === 0 ? (
        <div className="py-10">
          <Spinner label="carregando ranking" />
        </div>
      ) : (
        <RankingSection
          players={players.map((p) => ({
            id: p.id,
            name: p.name,
            nickname: p.nickname,
            avatar: p.avatar,
            elogios: tab === 'prestige' ? p.elogios : p.denuncias,
            denuncias: p.denuncias,
          }))}
          variant={tab}
          onPlayerClick={(id) => navigate(`/player/${id}`)}
        />
      )}
      <div ref={sentinelRef} />
      {isFetchingNextPage && <Spinner label="carregando mais" />}
      {!hasNextPage && players.length > 0 && (
        <div className="py-4 text-center text-xs text-[#7F94B0] font-mono-technical">[ fim do ranking ]</div>
      )}
      {scrolled && (
        <button
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          className="fixed bottom-24 right-6 w-12 h-12 rounded-full bg-[#00F0FF] text-[#0B0E14] font-mono-technical text-xs shadow-[0_0_20px_rgba(0,240,255,0.5)] hover:shadow-[0_0_25px_rgba(0,240,255,0.7)] transition-all z-40"
        >
          ↑
        </button>
      )}
    </div>
  );
}
