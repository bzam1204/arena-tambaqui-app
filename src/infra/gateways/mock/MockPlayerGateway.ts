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
    const arr = Object.values(this.players).sort((a, b) => {
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

  updateStats(id: string, praiseCount: number, reportCount: number) {
    const player = this.players[id];
    if (!player) return;
    player.praiseCount = praiseCount;
    player.reportCount = reportCount;
    player.elogios = praiseCount;
    player.denuncias = reportCount;
    player.reputation = calculateReputation({ elogios: praiseCount, denuncias: reportCount });
  }

  updateProfile(id: string, input: { name: string; nickname: string; avatar?: string }) {
    const player = this.players[id];
    if (!player) return;
    player.name = input.name;
    player.nickname = input.nickname;
    if (input.avatar) {
      player.avatar = input.avatar;
    }
  }

  upsertFromProfile(id: string, input: { name: string; nickname: string; avatar?: string }): string {
    const existing = this.players[id];
    const praiseCount = existing?.praiseCount ?? 0;
    const reportCount = existing?.reportCount ?? 0;
    const reputation = calculateReputation({ elogios: praiseCount, denuncias: reportCount });
    this.players[id] = {
      id,
      name: input.name,
      nickname: input.nickname,
      avatar: input.avatar ?? existing?.avatar,
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
    const prestige = arr.filter((p) => p.praiseCount > player.praiseCount).length + 1;
    const shame = arr.filter((p) => p.reportCount > player.reportCount).length + 1;
    return { prestige, shame };
  }
}
