import { injectable } from 'tsyringe';
import type { FeedGateway } from '@/app/gateways/FeedGateway';
import type { FeedEntry } from '@/app/gateways/PlayerGateway';
import { createFeedStore } from './mockData';

@injectable()
export class MockFeedGateway implements FeedGateway {
  private feed: FeedEntry[] = createFeedStore();

  async listFeed(): Promise<FeedEntry[]> {
    return [...this.feed];
  }

  prepend(entry: FeedEntry) {
    this.feed = [entry, ...this.feed];
    return Promise.resolve();
  }
}
