export interface Player {
  id: string;
  name: string;
  nickname: string;
  avatar?: string;
  elogios: number;
  denuncias: number;
  reputation: number;
  reportCount: number;
  praiseCount: number;
  history: FeedEntry[];
}

export interface FeedEntry {
  id: string;
  type: 'report' | 'praise';
  targetId: string;
  targetName: string;
  targetAvatar?: string;
  content: string;
  date: string;
  time: string;
  isRetracted?: boolean;
}

export interface PlayerGateway {
  getPlayer(id: string): Promise<Player | null>;
  listPlayers(): Promise<Player[]>;
  listPlayersPaged(params: { page: number; pageSize?: number; kind?: 'prestige' | 'shame' }): Promise<Player[]>;
  searchPlayers(term: string): Promise<Player[]>;
  getPlayerRank(playerId: string): Promise<{ prestige: number | null; shame: number | null }>;
}

export const TkPlayerGateway = Symbol('PlayerGateway');
