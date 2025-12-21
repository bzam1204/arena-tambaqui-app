import { useEffect, useMemo, useRef, useState } from 'react';
import { useInfiniteQuery } from '@tanstack/react-query';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { RankingSection } from '@/components/RankingSection';
import { Spinner } from '@/components/Spinner';
import type { PlayerGateway } from '@/app/gateways/PlayerGateway';
import { Inject, TkPlayerGateway } from '@/infra/container';

export function RankingsPage() {
  const playerGateway = Inject<PlayerGateway>(TkPlayerGateway);
  const navigate = useNavigate();
  const location = useLocation();
  const { kind } = useParams();
  const sentinelRef = useRef<HTMLDivElement | null>(null);
  const [scrolled, setScrolled] = useState(false);
  const initial = kind === 'vergonha' ? 'shame' : 'prestige';
  const [tab, setTab] = useState<'prestige' | 'shame'>(initial);
  const pageSize = 25;
  const [autoScrollDone, setAutoScrollDone] = useState(false);

  const focusMeta = useMemo(() => {
    const params = new URLSearchParams(location.search);
    const focusId = params.get('focus') || null;
    const rankRaw = params.get('rank');
    const rankNum = rankRaw ? Number(rankRaw) : null;
    const focusRank = Number.isFinite(rankNum) && rankNum && rankNum > 0 ? rankNum : null;
    return { focusId, focusRank };
  }, [location.search]);

  useEffect(() => {
    const next = kind === 'vergonha' ? 'shame' : 'prestige';
    setTab(next);
    setAutoScrollDone(false);
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

  const players = useMemo(() => {
    const list = data?.pages.flatMap((p) => p) ?? [];
    const seen = new Set<string>();
    return list.filter((player) => {
      if (seen.has(player.id)) return false;
      seen.add(player.id);
      return true;
    });
  }, [data]);

  useEffect(() => {
    setAutoScrollDone(false);
  }, [focusMeta.focusId, focusMeta.focusRank, tab]);

  useEffect(() => {
    if (!focusMeta.focusRank || autoScrollDone) return;
    if (players.length >= focusMeta.focusRank) return;
    if (hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  }, [focusMeta.focusRank, players.length, hasNextPage, isFetchingNextPage, fetchNextPage, autoScrollDone]);

  useEffect(() => {
    if (autoScrollDone || players.length === 0) return;
    const targetId =
      focusMeta.focusId ??
      (focusMeta.focusRank && players[focusMeta.focusRank - 1] ? players[focusMeta.focusRank - 1].id : null);
    if (!targetId) return;
    const targetEl = document.getElementById(`ranking-player-${targetId}`);
    if (targetEl) {
      requestAnimationFrame(() => {
        targetEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
        setAutoScrollDone(true);
      });
    } else if (
      !focusMeta.focusRank ||
      players.length >= (focusMeta.focusRank ?? 0) ||
      (!hasNextPage && !isFetchingNextPage)
    ) {
      setAutoScrollDone(true);
    }
  }, [autoScrollDone, players, focusMeta.focusId, focusMeta.focusRank, hasNextPage, isFetchingNextPage]);

  const highlightId = focusMeta.focusId ?? (focusMeta.focusRank ? players[focusMeta.focusRank - 1]?.id : null);

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
              Infâmia
            </span>
          </div>
        </button>
      </div>

      {isLoading && players.length === 0 ? (
        <div className="py-10">
          <Spinner label="carregando ranking" />
        </div>
      ) : players.length === 0 ? (
        <div className="bg-[#141A26] rounded-lg border border-[#2D3A52] p-6 text-center">
          <p className="text-xs text-[#7F94B0] font-mono-technical">
            {tab === 'prestige'
              ? 'Nenhum operador com pontos de prestígio ainda. Participe de partidas e receba elogios para aparecer aqui.'
              : 'Nenhum operador com pontos de infâmia ainda. Relatos e ausências contabilizam pontos para este ranking.'}
          </p>
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
          highlightId={highlightId}
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
