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
}
