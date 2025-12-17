import { inject, injectable } from 'tsyringe';
import type { FeedGateway } from '@/app/gateways/FeedGateway';
import type { FeedEntry, PlayerGateway } from '@/app/gateways/PlayerGateway';
import { createFeedStore } from './mockData';
import { TkPlayerGateway } from '@/app/gateways/PlayerGateway';
import { calculateReputation } from '@/domain/reputation';

@injectable()
export class MockFeedGateway implements FeedGateway {
  private feed: Array<FeedEntry & { submitterId?: string }> = createFeedStore() as any;

  constructor(@inject(TkPlayerGateway) private readonly playerGateway: PlayerGateway) {}

  async listFeed(): Promise<FeedEntry[]> {
    return [...this.feed];
  }

  async listFeedPage(params: { page: number; pageSize?: number }): Promise<FeedEntry[]> {
    const size = params.pageSize ?? 20;
    const start = params.page * size;
    const end = start + size;
    return this.feed.slice(start, end);
  }

  prepend(entry: FeedEntry) {
    this.feed = [{ ...entry }, ...this.feed];
    return Promise.resolve();
  }

  async listByTarget(playerId: string, page = 0, pageSize = 50): Promise<FeedEntry[]> {
    return this.listByTargetPaged(playerId, page, pageSize);
  }

  async listByTargetPaged(playerId: string, page: number, pageSize = 20): Promise<FeedEntry[]> {
    const filtered = this.feed.filter((f) => f.targetId === playerId);
    const start = page * pageSize;
    return filtered.slice(start, start + pageSize);
  }

  async listBySubmitter(playerId: string): Promise<FeedEntry[]> {
    return this.feed.filter((f: any) => f.submitterId === playerId).map((f) => ({ ...f }));
  }

  async retract(entryId: string, submitterId: string): Promise<void> {
    let blocked = false;
    this.feed = this.feed.map((f: any) => {
      if (f.id === entryId && f.submitterId === submitterId) {
        if (f.type !== 'report') {
          blocked = true;
          return f;
        }
        if (f.targetId) {
          this.decrementReport(f.targetId);
        }
        return { ...f, isRetracted: true };
      }
      return f;
    });
    if (blocked) {
      throw new Error('Apenas denúncias podem ser retratadas');
    }
  }

  async adminRetract(entryId: string): Promise<void> {
    this.feed = this.feed.map((f: any) => {
      if (f.id === entryId && f.type === 'report') {
        if (f.targetId) this.decrementReport(f.targetId);
        return { ...f, isRetracted: true };
      }
      return f;
    });
  }

  async adminEdit(entryId: string, content: string): Promise<void> {
    this.feed = this.feed.map((f: any) => (f.id === entryId ? { ...f, content } : f));
  }

  async adminRemove(entryId: string): Promise<void> {
    this.feed = this.feed.filter((f) => f.id !== entryId);
  }

  private decrementReport(targetId: string) {
    const player = (this.playerGateway as any).players?.[targetId];
    if (!player) return;
    const reports = Math.max(0, (player.reportCount ?? 0) - 1);
    const praise = player.praiseCount ?? 0;
    player.reportCount = reports;
    player.denuncias = reports;
    player.reputation = calculateReputation({ elogios: praise, denuncias: reports });
  }
}
