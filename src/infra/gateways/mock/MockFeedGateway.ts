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

  prepend(entry: FeedEntry) {
    this.feed = [{ ...entry }, ...this.feed];
    return Promise.resolve();
  }

  async listByTarget(playerId: string): Promise<FeedEntry[]> {
    return this.feed.filter((f) => f.targetId === playerId).map((f) => ({ ...f }));
  }

  async listBySubmitter(playerId: string): Promise<FeedEntry[]> {
    return this.feed.filter((f: any) => f.submitterId === playerId).map((f) => ({ ...f }));
  }

  async retract(entryId: string, submitterId: string): Promise<void> {
    this.feed = this.feed.map((f: any) => {
      if (f.id === entryId && f.submitterId === submitterId) {
        if (f.type === 'report' && f.targetId) {
          this.decrementReport(f.targetId);
        }
        return { ...f, isRetracted: true };
      }
      return f;
    });
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
