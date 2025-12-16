import type { FeedEntry } from './PlayerGateway';

export interface FeedGateway {
  listFeed(): Promise<FeedEntry[]>;
  listFeedPage(params: { page: number; pageSize?: number }): Promise<FeedEntry[]>;
  listByTarget(playerId: string): Promise<FeedEntry[]>;
  listBySubmitter(playerId: string): Promise<FeedEntry[]>;
  retract(entryId: string, submitterId: string): Promise<void>;
  prepend(entry: FeedEntry): Promise<void> | void;
}

export const TkFeedGateway = Symbol('FeedGateway');
