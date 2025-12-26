export interface MatchSummary {
  id: string;
  name: string;
  startAt: string;
  createdAt: string;
  finalizedAt?: string | null;
  subscriptionCount: number;
  rentEquipmentCount: number;
  isSubscribed: boolean;
  rentEquipment?: boolean;
}

export interface MatchOption {
  id: string;
  name: string;
  startAt: string;
}

export interface MatchAttendanceEntry {
  id: string;
  matchId: string;
  playerId: string;
  playerName: string;
  playerNickname: string;
  playerAvatar?: string;
  playerAvatarFrame?: string | null;
  playerIsVip?: boolean;
  rentEquipment: boolean;
  attended: boolean;
  marked: boolean;
}

export interface CreateMatchInput {
  name: string;
  startAt: string;
  createdBy: string;
}

export interface MatchGateway {
  listMatches(params: { playerId?: string }): Promise<MatchSummary[]>;
  createMatch(input: CreateMatchInput): Promise<void>;
  updateMatch(input: { matchId: string; name: string; startAt: string }): Promise<void>;
  subscribe(input: { matchId: string; playerId: string; rentEquipment: boolean }): Promise<void>;
  unsubscribe(input: { matchId: string; playerId: string }): Promise<void>;
  removePlayer(input: { matchId: string; playerId: string }): Promise<void>;
  deleteMatch(input: { matchId: string }): Promise<void>;
  listAttendance(matchId: string): Promise<MatchAttendanceEntry[]>;
  updateAttendance(input: { matchId: string; playerId: string; attended: boolean }): Promise<void>;
  finalizeMatch(input: { matchId: string; adminId: string }): Promise<void>;
  listEligibleMatchesForTransmission(input: { playerId: string }): Promise<MatchOption[]>;
  countPlayerMatches(input: { playerId: string }): Promise<number>;
}

export const TkMatchGateway = Symbol('MatchGateway');
