import type { FeedEntry } from './PlayerGateway';

export interface FeedGateway {
  listFeed(): Promise<FeedEntry[]>;
  prepend(entry: FeedEntry): Promise<void> | void;
}

export const TkFeedGateway = Symbol('FeedGateway');
