import { useEffect, useRef, useState } from 'react';
import { useInfiniteQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { RankingSection } from '@/components/RankingSection';
import { Spinner } from '@/components/Spinner';
import type { PlayerGateway, Player } from '@/app/gateways/PlayerGateway';
import { Inject, TkPlayerGateway } from '@/infra/container';

export function RankingsPage() {
  const playerGateway = Inject<PlayerGateway>(TkPlayerGateway);
  const navigate = useNavigate();
  const sentinelRef = useRef<HTMLDivElement | null>(null);
  const [scrolled, setScrolled] = useState(false);

  const {
    data,
    isLoading,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useInfiniteQuery({
    queryKey: ['players', 'ranking'],
    queryFn: ({ pageParam = 0 }) => playerGateway.listPlayersPaged({ page: pageParam as number, pageSize: 25 }),
    getNextPageParam: (lastPage, allPages) => (lastPage.length < 25 ? undefined : allPages.length),
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

  if (isLoading && players.length === 0) return <Spinner fullScreen label="carregando ranking" />;
  return (
    <div className="px-4 pb-20">
      <RankingSection
        players={players.map((p) => ({
          id: p.id,
          name: p.name,
          nickname: p.nickname,
          avatar: p.avatar,
          elogios: p.elogios,
          denuncias: p.denuncias,
        }))}
        onPlayerClick={(id) => navigate(`/player/${id}`)}
      />
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
