import { injectable } from 'tsyringe';
import type { FeedGateway } from '@/app/gateways/FeedGateway';
import type { FeedEntry } from '@/app/gateways/PlayerGateway';
import { createFeedStore } from './mockData';

@injectable()
export class MockFeedGateway implements FeedGateway {
  private feed: Array<FeedEntry & { submitterId?: string }> = createFeedStore() as any;

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
    this.feed = this.feed.map((f: any) =>
      f.id === entryId && f.submitterId === submitterId ? { ...f, isRetracted: true } : f,
    );
  }
}
