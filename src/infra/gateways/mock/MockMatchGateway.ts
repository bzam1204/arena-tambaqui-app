import { inject, injectable } from 'tsyringe';
import type {
  MatchGateway,
  MatchSummary,
  MatchOption,
  MatchAttendanceEntry,
  CreateMatchInput,
} from '@/app/gateways/MatchGateway';
import type { PlayerGateway } from '@/app/gateways/PlayerGateway';
import { TkPlayerGateway } from '@/app/gateways/PlayerGateway';
import type { FeedGateway } from '@/app/gateways/FeedGateway';
import { TkFeedGateway } from '@/app/gateways/FeedGateway';

interface MatchRecord {
  id: string;
  name: string;
  startAt: string;
  createdAt: string;
  createdBy: string;
  finalizedAt?: string | null;
  finalizedBy?: string | null;
}

interface SubscriptionRecord {
  id: string;
  matchId: string;
  playerId: string;
  rentEquipment: boolean;
  createdAt: string;
}

interface AttendanceRecord {
  matchId: string;
  playerId: string;
  attended: boolean;
  markedAt: string;
}

function iso(date: Date) {
  return date.toISOString();
}

@injectable()
export class MockMatchGateway implements MatchGateway {
  private matches: MatchRecord[] = [];
  private subscriptions: SubscriptionRecord[] = [];
  private attendance: AttendanceRecord[] = [];

  constructor(
    @inject(TkPlayerGateway) private readonly playerGateway: PlayerGateway,
    @inject(TkFeedGateway) private readonly feedGateway: FeedGateway,
  ) {
    const now = new Date();
    const inTwoHours = new Date(now.getTime() + 2 * 60 * 60 * 1000);
    const inTwoDays = new Date(now.getTime() + 2 * 24 * 60 * 60 * 1000);
    const lastWeek = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    this.matches = [
      {
        id: 'match-1',
        name: 'Operação Trovão',
        startAt: inTwoHours.toISOString(),
        createdAt: iso(now),
        createdBy: 'admin-1',
        finalizedAt: null,
      },
      {
        id: 'match-2',
        name: 'Missão Noturna',
        startAt: inTwoDays.toISOString(),
        createdAt: iso(now),
        createdBy: 'admin-1',
        finalizedAt: null,
      },
      {
        id: 'match-3',
        name: 'Treino Tático',
        startAt: lastWeek.toISOString(),
        createdAt: iso(lastWeek),
        createdBy: 'admin-1',
        finalizedAt: lastWeek.toISOString(),
      },
    ];
  }

  async listMatches(params: { playerId?: string }): Promise<MatchSummary[]> {
    return this.matches
      .slice()
      .sort((a, b) => new Date(a.startAt).getTime() - new Date(b.startAt).getTime())
      .map((match) => {
        const subs = this.subscriptions.filter((s) => s.matchId === match.id);
        const own = params.playerId ? subs.find((s) => s.playerId === params.playerId) : undefined;
        return {
          id: match.id,
          name: match.name,
          startAt: match.startAt,
          createdAt: match.createdAt,
          finalizedAt: match.finalizedAt ?? null,
          subscriptionCount: subs.length,
          rentEquipmentCount: subs.filter((s) => s.rentEquipment).length,
          isSubscribed: Boolean(own),
          rentEquipment: own?.rentEquipment,
        } satisfies MatchSummary;
      });
  }

  async createMatch(input: CreateMatchInput): Promise<void> {
    this.matches = [
      ...this.matches,
      {
        id: `match-${Date.now()}`,
        name: input.name,
        startAt: input.startAt,
        createdAt: iso(new Date()),
        createdBy: input.createdBy,
        finalizedAt: null,
      },
    ];
  }

  async subscribe(input: { matchId: string; playerId: string; rentEquipment: boolean }): Promise<void> {
    const match = this.matches.find((m) => m.id === input.matchId);
    if (!match) throw new Error('Partida não encontrada.');
    if (match.finalizedAt) throw new Error('Partida já finalizada.');
    if (new Date(match.startAt) <= new Date()) throw new Error('Inscrições encerradas.');
    if (this.subscriptions.some((s) => s.matchId === input.matchId && s.playerId === input.playerId)) {
      throw new Error('Você já está inscrito.');
    }

    this.subscriptions = [
      ...this.subscriptions,
      {
        id: `sub-${Date.now()}`,
        matchId: input.matchId,
        playerId: input.playerId,
        rentEquipment: input.rentEquipment,
        createdAt: iso(new Date()),
      },
    ];
  }

  async unsubscribe(input: { matchId: string; playerId: string }): Promise<void> {
    const match = this.matches.find((m) => m.id === input.matchId);
    if (!match) throw new Error('Partida não encontrada.');
    if (match.finalizedAt) throw new Error('Partida já finalizada.');
    if (new Date(match.startAt) <= new Date()) throw new Error('Inscrições encerradas.');

    const existingIndex = this.subscriptions.findIndex(
      (s) => s.matchId === input.matchId && s.playerId === input.playerId,
    );
    if (existingIndex === -1) throw new Error('Você não está inscrito.');
    this.subscriptions = this.subscriptions.filter((_, index) => index !== existingIndex);
  }

  async listAttendance(matchId: string): Promise<MatchAttendanceEntry[]> {
    const subs = this.subscriptions.filter((s) => s.matchId === matchId);
    const attendanceMap = new Map(
      this.attendance.filter((a) => a.matchId === matchId).map((a) => [a.playerId, a.attended]),
    );
    const markedSet = new Set(this.attendance.filter((a) => a.matchId === matchId).map((a) => a.playerId));

    const players = await Promise.all(subs.map((s) => this.playerGateway.getPlayer(s.playerId)));
    return subs.map((sub, index) => {
      const player = players[index];
      return {
        id: sub.id,
        matchId: sub.matchId,
        playerId: sub.playerId,
        playerName: player?.name ?? 'Operador',
        playerNickname: player?.nickname ?? 'Operador',
        playerAvatar: player?.avatar ?? null,
        rentEquipment: sub.rentEquipment,
        attended: attendanceMap.get(sub.playerId) ?? false,
        marked: markedSet.has(sub.playerId),
      } satisfies MatchAttendanceEntry;
    });
  }

  async updateAttendance(input: { matchId: string; playerId: string; attended: boolean }): Promise<void> {
    const match = this.matches.find((m) => m.id === input.matchId);
    if (!match) throw new Error('Partida não encontrada.');
    if (match.finalizedAt) throw new Error('Partida já finalizada.');
    if (new Date(match.startAt) > new Date()) throw new Error('Partida ainda não iniciou.');

    const existing = this.attendance.find((a) => a.matchId === input.matchId && a.playerId === input.playerId);
    if (existing) {
      existing.attended = input.attended;
      existing.markedAt = iso(new Date());
    } else {
      this.attendance = [
        ...this.attendance,
        {
          matchId: input.matchId,
          playerId: input.playerId,
          attended: input.attended,
          markedAt: iso(new Date()),
        },
      ];
    }
  }

  async finalizeMatch(input: { matchId: string; adminId: string }): Promise<void> {
    const match = this.matches.find((m) => m.id === input.matchId);
    if (!match) throw new Error('Partida não encontrada.');
    if (match.finalizedAt) throw new Error('Partida já finalizada.');
    if (new Date(match.startAt) > new Date()) throw new Error('Partida ainda não iniciou.');

    const subs = this.subscriptions.filter((s) => s.matchId === input.matchId);
    const attendanceMap = new Map(
      this.attendance.filter((a) => a.matchId === input.matchId).map((a) => [a.playerId, a.attended]),
    );

    for (const sub of subs) {
      const player = await this.playerGateway.getPlayer(sub.playerId);
      if (!player) continue;
      const attended = attendanceMap.get(sub.playerId) ?? false;
      const praise = player.praiseCount + (attended ? 1 : 0);
      const reports = player.reportCount + (attended ? 0 : 5);
      (this.playerGateway as any).updateStats?.(player.id, praise, reports);

      if (!attended) {
        await this.feedGateway.prepend({
          id: `auto-${Date.now()}-${player.id}`,
          type: 'report',
          targetId: player.id,
          targetName: player.nickname,
          targetAvatar: player.avatar,
          content: `Ausência não justificada na operação ${match.name}.`,
          date: new Date().toLocaleDateString('pt-BR').replace(/\//g, '.'),
          time: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
        } as any);
      }
    }

    match.finalizedAt = iso(new Date());
    match.finalizedBy = input.adminId;
  }

  async listEligibleMatchesForTransmission(input: { playerId: string }): Promise<MatchOption[]> {
    const now = new Date();
    const cutoff = new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000);
    const subs = this.subscriptions.filter((s) => s.playerId === input.playerId);
    if (!subs.length) return [];
    const attendanceSet = new Set(
      this.attendance.filter((a) => a.playerId === input.playerId && a.attended).map((a) => a.matchId),
    );
    if (!attendanceSet.size) return [];

    return this.matches
      .filter((match) => {
        if (!match.finalizedAt) return false;
        const finalizedAt = new Date(match.finalizedAt);
        return finalizedAt >= cutoff && finalizedAt <= now;
      })
      .filter((match) => attendanceSet.has(match.id))
      .map((match) => ({ id: match.id, name: match.name, startAt: match.startAt }));
  }
}
