import { injectable } from 'tsyringe';
import { calculateReputation } from '@/domain/reputation';
import type { PlayerGateway, Player } from '@/app/gateways/PlayerGateway';
import { createPlayerStore, type MockPlayerStore } from './mockData';

@injectable()
export class MockPlayerGateway implements PlayerGateway {
  private players: MockPlayerStore = createPlayerStore();

  async getPlayer(id: string): Promise<Player | null> {
    const player = this.players[id];
    return player ? { ...player } : null;
  }

  async listPlayers(): Promise<Player[]> {
    return Object.values(this.players).map((p) => ({ ...p }));
  }

  async listPlayersPaged(params: { page: number; pageSize?: number; kind?: 'prestige' | 'shame' }): Promise<Player[]> {
    const filtered = Object.values(this.players).filter((player) => {
      if (params.kind === 'prestige') return player.praiseCount > 0;
      if (params.kind === 'shame') return player.reportCount > 0;
      return true;
    });
    const arr = filtered.sort((a, b) => {
      if (params.kind === 'shame') {
        return b.reportCount - a.reportCount;
      }
      return b.praiseCount - a.praiseCount;
    });
    const size = params.pageSize ?? 20;
    const start = params.page * size;
    return arr.slice(start, start + size).map((p) => ({ ...p }));
  }

  async searchPlayers(term: string): Promise<Player[]> {
    const lower = term.toLowerCase();
    return Object.values(this.players)
      .filter(
        (p) =>
          p.nickname.toLowerCase().includes(lower) ||
          p.name.toLowerCase().includes(lower),
      )
      .map((p) => ({ ...p }));
  }

  async searchPlayersPaged(params: { term: string; page: number; pageSize: number }): Promise<{ players: Player[]; total: number }> {
    const lower = params.term.toLowerCase();
    const filtered = Object.values(this.players).filter(
      (p) => !params.term || p.nickname.toLowerCase().includes(lower) || p.name.toLowerCase().includes(lower),
    );
    const start = params.page * params.pageSize;
    const slice = filtered.slice(start, start + params.pageSize).map((p) => ({ ...p }));
    return { players: slice, total: filtered.length };
  }

  updateStats(id: string, praiseCount: number, reportCount: number) {
    const player = this.players[id];
    if (!player) return;
    player.praiseCount = praiseCount;
    player.reportCount = reportCount;
    player.elogios = praiseCount;
    player.denuncias = reportCount;
    player.reputation = calculateReputation({ elogios: praiseCount, denuncias: reportCount });
  }

  updateProfile(id: string, input: { name: string; nickname: string; avatar?: string; motto?: string | null; avatarFrame?: string | null; isVip?: boolean }) {
    const player = this.players[id];
    if (!player) return;
    player.name = input.name;
    player.nickname = input.nickname;
    player.motto = input.motto ?? player.motto ?? null;
    if (input.isVip !== undefined) {
      player.isVip = input.isVip;
    }
    if (input.avatarFrame !== undefined) {
      player.avatarFrame = input.avatarFrame;
    }
    if (input.avatar) {
      player.avatar = input.avatar;
    }
  }

  async updatePlayerProfile(input: {
    playerId: string;
    name: string;
    nickname: string;
    avatar?: File | string | null;
    motto?: string | null;
    avatarFrame?: string | null;
    isVip?: boolean;
  }): Promise<void> {
    const player = this.players[input.playerId];
    if (!player) throw new Error('Jogador não encontrado.');
    player.name = input.name;
    player.nickname = input.nickname;
    player.motto = input.motto ?? null;
    if (input.isVip !== undefined) {
      player.isVip = input.isVip;
    }
    if (input.avatarFrame !== undefined) {
      player.avatarFrame = input.avatarFrame;
    }
    if (input.avatar) {
      player.avatar = typeof input.avatar === 'string' ? input.avatar : URL.createObjectURL(input.avatar);
    }
  }

  upsertFromProfile(id: string, input: { name: string; nickname: string; avatar?: string; motto?: string | null; avatarFrame?: string | null; isVip?: boolean }): string {
    const existing = this.players[id];
    const praiseCount = existing?.praiseCount ?? 0;
    const reportCount = existing?.reportCount ?? 0;
    const reputation = calculateReputation({ elogios: praiseCount, denuncias: reportCount });
    this.players[id] = {
      id,
      name: input.name,
      nickname: input.nickname,
      motto: input.motto ?? existing?.motto ?? null,
      avatar: input.avatar ?? existing?.avatar,
      avatarFrame: input.avatarFrame ?? existing?.avatarFrame ?? null,
      isVip: input.isVip ?? existing?.isVip ?? false,
      elogios: praiseCount,
      denuncias: reportCount,
      praiseCount,
      reportCount,
      reputation,
      history: existing?.history ?? [],
    };
    return id;
  }

  async getPlayerRank(playerId: string): Promise<{ prestige: number | null; shame: number | null }> {
    const arr = Object.values(this.players);
    const player = this.players[playerId];
    if (!player) return { prestige: null, shame: null };
    const prestige =
      player.praiseCount > 0 ? arr.filter((p) => p.praiseCount > player.praiseCount).length + 1 : null;
    const shame =
      player.reportCount > 0 ? arr.filter((p) => p.reportCount > player.reportCount).length + 1 : null;
    return { prestige, shame };
  }
}
