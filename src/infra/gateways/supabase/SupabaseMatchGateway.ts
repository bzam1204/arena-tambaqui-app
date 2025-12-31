import { injectable } from 'tsyringe';
import type {
  MatchGateway,
  MatchSummary,
  MatchOption,
  MatchAttendanceEntry,
  CreateMatchInput,
  MatchGuestInput,
} from '@/app/gateways/MatchGateway';
import { getSupabaseClient } from '@/infra/supabase/client';
import { calculateReputation } from '@/domain/reputation';

@injectable()
export class SupabaseMatchGateway implements MatchGateway {
  private readonly supabase = getSupabaseClient();
  private readonly matchesTable = 'matches';
  private readonly subscriptionsTable = 'match_subscriptions';
  private readonly attendanceTable = 'match_attendance';
  private readonly guestsTable = 'match_guests';

  async listMatches(params: { playerId?: string }): Promise<MatchSummary[]> {
    const { data: matches, error } = await this.supabase
      .from(this.matchesTable)
      .select('id,name,start_at,created_at,finalized_at')
      .order('start_at', { ascending: true });
    if (error) throw error;

    const { data: subs, error: subsError } = await this.supabase
      .from(this.subscriptionsTable)
      .select('match_id,player_id,rent_equipment');
    if (subsError) throw subsError;

    const { data: guests, error: guestsError } = await this.supabase
      .from(this.guestsTable)
      .select('match_id,rent_equipment');
    if (guestsError) throw guestsError;

    const subsByMatch = new Map<string, Array<{ player_id: string; rent_equipment: boolean }>>();
    (subs || []).forEach((sub: any) => {
      const list = subsByMatch.get(sub.match_id) ?? [];
      list.push({ player_id: sub.player_id, rent_equipment: Boolean(sub.rent_equipment) });
      subsByMatch.set(sub.match_id, list);
    });

    const guestsByMatch = new Map<string, Array<{ rent_equipment: boolean }>>();
    (guests || []).forEach((guest: any) => {
      const list = guestsByMatch.get(guest.match_id) ?? [];
      list.push({ rent_equipment: Boolean(guest.rent_equipment) });
      guestsByMatch.set(guest.match_id, list);
    });

    return (matches || []).map((match: any) => {
      const list = subsByMatch.get(match.id) ?? [];
      const guestList = guestsByMatch.get(match.id) ?? [];
      const subscriptionCount = list.length;
      const rentEquipmentCount =
        list.filter((s) => s.rent_equipment).length + guestList.filter((g) => g.rent_equipment).length;
      const ownSub = params.playerId ? list.find((s) => s.player_id === params.playerId) : undefined;
      return {
        id: match.id,
        name: match.name,
        startAt: match.start_at,
        createdAt: match.created_at,
        finalizedAt: match.finalized_at,
        subscriptionCount: subscriptionCount + guestList.length,
        rentEquipmentCount,
        isSubscribed: Boolean(ownSub),
        rentEquipment: ownSub?.rent_equipment,
      } satisfies MatchSummary;
    });
  }

  async createMatch(input: CreateMatchInput): Promise<void> {
    const { error } = await this.supabase.from(this.matchesTable).insert({
      id: crypto.randomUUID(),
      name: input.name,
      start_at: input.startAt,
      created_at: new Date().toISOString(),
      created_by: input.createdBy,
    });
    if (error) throw error;
  }

  async updateMatch(input: { matchId: string; name: string; startAt: string }): Promise<void> {
    const { error } = await this.supabase
      .from(this.matchesTable)
      .update({ name: input.name, start_at: input.startAt })
      .eq('id', input.matchId);
    if (error) throw error;
  }

  async subscribe(input: {
    matchId: string;
    playerId: string;
    rentEquipment: boolean;
    guests?: MatchGuestInput[];
  }): Promise<void> {
    const { data: match, error: matchError } = await this.supabase
      .from(this.matchesTable)
      .select('id,name,start_at,finalized_at')
      .eq('id', input.matchId)
      .maybeSingle();
    if (matchError) throw matchError;
    if (!match) throw new Error('Partida não encontrada.');
    if (match.finalized_at) throw new Error('Partida já finalizada.');
    if (match.start_at && new Date(match.start_at) <= new Date()) {
      throw new Error('Inscrições encerradas.');
    }

    const { error } = await this.supabase.from(this.subscriptionsTable).insert({
      id: crypto.randomUUID(),
      match_id: input.matchId,
      player_id: input.playerId,
      rent_equipment: input.rentEquipment,
      created_at: new Date().toISOString(),
    });
    if (error) throw error;

    if (input.guests && input.guests.length) {
      await this.insertGuests(input.matchId, input.playerId, input.guests);
    }
  }

  async addGuests(input: { matchId: string; playerId: string; guests: MatchGuestInput[] }): Promise<void> {
    const { data: match, error: matchError } = await this.supabase
      .from(this.matchesTable)
      .select('id,start_at,finalized_at')
      .eq('id', input.matchId)
      .maybeSingle();
    if (matchError) throw matchError;
    if (!match) throw new Error('Partida não encontrada.');
    if (match.finalized_at) throw new Error('Partida já finalizada.');
    if (match.start_at && new Date(match.start_at) <= new Date()) {
      throw new Error('Inscrições encerradas.');
    }

    const { data: existing, error: existingError } = await this.supabase
      .from(this.subscriptionsTable)
      .select('id')
      .eq('match_id', input.matchId)
      .eq('player_id', input.playerId)
      .maybeSingle();
    if (existingError) throw existingError;
    if (!existing) throw new Error('Você precisa estar inscrito para adicionar convidados.');
    if (!input.guests.length) return;

    await this.insertGuests(input.matchId, input.playerId, input.guests);
  }

  async removeGuest(input: { matchId: string; playerId: string; guestId: string }): Promise<void> {
    const { data: match, error: matchError } = await this.supabase
      .from(this.matchesTable)
      .select('id,start_at,finalized_at')
      .eq('id', input.matchId)
      .maybeSingle();
    if (matchError) throw matchError;
    if (!match) throw new Error('Partida não encontrada.');
    if (match.finalized_at) throw new Error('Partida já finalizada.');
    if (match.start_at && new Date(match.start_at) <= new Date()) {
      throw new Error('Inscrições encerradas.');
    }

    const { data: guest, error: guestError } = await this.supabase
      .from(this.guestsTable)
      .select('id')
      .eq('id', input.guestId)
      .eq('match_id', input.matchId)
      .eq('invited_by_player_id', input.playerId)
      .maybeSingle();
    if (guestError) throw guestError;
    if (!guest) throw new Error('Convidado não encontrado.');

    const { error } = await this.supabase.from(this.guestsTable).delete().eq('id', input.guestId);
    if (error) throw error;
  }

  async unsubscribe(input: { matchId: string; playerId: string }): Promise<void> {
    const { data: match, error: matchError } = await this.supabase
      .from(this.matchesTable)
      .select('id,start_at,finalized_at')
      .eq('id', input.matchId)
      .maybeSingle();
    if (matchError) throw matchError;
    if (!match) throw new Error('Partida não encontrada.');
    if (match.finalized_at) throw new Error('Partida já finalizada.');
    if (match.start_at && new Date(match.start_at) <= new Date()) {
      throw new Error('Inscrições encerradas.');
    }

    const { data: guests, error: guestError } = await this.supabase
      .from(this.guestsTable)
      .select('id')
      .eq('match_id', input.matchId)
      .eq('invited_by_player_id', input.playerId)
      .limit(1);
    if (guestError) throw guestError;
    if (guests && guests.length > 0) {
      throw new Error('Remova seus convidados antes de cancelar.');
    }

    const { error } = await this.supabase
      .from(this.subscriptionsTable)
      .delete()
      .eq('match_id', input.matchId)
      .eq('player_id', input.playerId);
    if (error) throw error;
  }

  async removePlayer(input: { matchId: string; playerId: string }): Promise<void> {
    const { data: guest, error: guestError } = await this.supabase
      .from(this.guestsTable)
      .select('id')
      .eq('id', input.playerId)
      .eq('match_id', input.matchId)
      .maybeSingle();
    if (guestError) throw guestError;
    if (guest) {
      const { error } = await this.supabase.from(this.guestsTable).delete().eq('id', input.playerId);
      if (error) throw error;
      return;
    }

    const { error: attendanceError } = await this.supabase
      .from(this.attendanceTable)
      .delete()
      .eq('match_id', input.matchId)
      .eq('player_id', input.playerId);
    if (attendanceError) throw attendanceError;

    const { error: guestRemoveError } = await this.supabase
      .from(this.guestsTable)
      .delete()
      .eq('match_id', input.matchId)
      .eq('invited_by_player_id', input.playerId);
    if (guestRemoveError) throw guestRemoveError;

    const { error } = await this.supabase
      .from(this.subscriptionsTable)
      .delete()
      .eq('match_id', input.matchId)
      .eq('player_id', input.playerId);
    if (error) throw error;
  }

  async deleteMatch(input: { matchId: string }): Promise<void> {
    const { error } = await this.supabase.from(this.matchesTable).delete().eq('id', input.matchId);
    if (error) throw error;
  }

  async listAttendance(matchId: string): Promise<MatchAttendanceEntry[]> {
    const { data: subs, error } = await this.supabase
      .from(this.subscriptionsTable)
      .select(
        'id,match_id,player_id,rent_equipment,paid,paid_marked_at,created_at,players:players(id,nickname,is_vip,users:users(full_name,avatar,avatar_frame))',
      )
      .eq('match_id', matchId)
      .order('created_at', { ascending: true });
    if (error) throw error;

    const { data: guests, error: guestsError } = await this.supabase
      .from(this.guestsTable)
      .select(
        'id,match_id,invited_by_player_id,full_name,age,rent_equipment,guardian_confirmed,attended,marked_at,paid,paid_marked_at,created_at,inviter:players(id,nickname,users:users(full_name))',
      )
      .eq('match_id', matchId)
      .order('created_at', { ascending: true });
    if (guestsError) throw guestsError;

    const { data: attendance, error: attendanceError } = await this.supabase
      .from(this.attendanceTable)
      .select('player_id,attended')
      .eq('match_id', matchId);
    if (attendanceError) throw attendanceError;

    const attendanceByPlayer = new Map<string, boolean>();
    const attendanceMarked = new Set<string>();
    (attendance || []).forEach((row: any) => {
      attendanceByPlayer.set(row.player_id, Boolean(row.attended));
      attendanceMarked.add(row.player_id);
    });

    const playerEntries = (subs || []).map((row: any) => {
      const player = row.players ?? {};
      return {
        id: row.id,
        matchId: row.match_id,
        playerId: row.player_id,
        playerName: player.users?.full_name ?? player.nickname ?? 'Operador',
        playerNickname: player.nickname ?? player.users?.full_name ?? 'Operador',
        playerAvatar: player.users?.avatar ?? null,
        playerAvatarFrame: player.users?.avatar_frame ?? null,
        playerIsVip: player.is_vip ?? false,
        rentEquipment: Boolean(row.rent_equipment),
        attended: attendanceByPlayer.get(row.player_id) ?? false,
        marked: attendanceMarked.has(row.player_id),
        paid: Boolean(row.paid),
        paymentMarked: Boolean(row.paid_marked_at),
      } satisfies MatchAttendanceEntry;
    });

    const guestEntries = (guests || []).map((row: any) => {
      const inviter = row.inviter ?? {};
      return {
        id: row.id,
        matchId: row.match_id,
        playerId: row.id,
        playerName: row.full_name,
        playerNickname: row.full_name,
        playerAvatar: null,
        playerAvatarFrame: null,
        playerIsVip: false,
        rentEquipment: Boolean(row.rent_equipment),
        attended: Boolean(row.attended),
        marked: Boolean(row.marked_at),
        paid: Boolean(row.paid),
        paymentMarked: Boolean(row.paid_marked_at),
        isGuest: true,
        guestAge: typeof row.age === 'number' ? row.age : null,
        guardianConfirmed: Boolean(row.guardian_confirmed),
        invitedByPlayerId: row.invited_by_player_id,
        invitedByName: inviter.users?.full_name ?? inviter.nickname ?? 'Operador',
        invitedByNickname: inviter.nickname ?? inviter.users?.full_name ?? 'Operador',
        responsiblePlayerId: row.invited_by_player_id,
      } satisfies MatchAttendanceEntry;
    });

    const combined = [
      ...playerEntries.map((entry: MatchAttendanceEntry, index: number) => ({
        entry,
        sortAt: subs?.[index]?.created_at,
      })),
      ...guestEntries.map((entry: MatchAttendanceEntry, index: number) => ({
        entry,
        sortAt: guests?.[index]?.created_at,
      })),
    ];

    return combined
      .sort((a, b) => {
        const aTime = a.sortAt ? new Date(a.sortAt).getTime() : 0;
        const bTime = b.sortAt ? new Date(b.sortAt).getTime() : 0;
        return aTime - bTime;
      })
      .map((row) => row.entry);
  }

  async updateAttendance(input: { matchId: string; playerId: string; attended: boolean }): Promise<void> {
    const { data: match, error: matchError } = await this.supabase
      .from(this.matchesTable)
      .select('start_at,finalized_at')
      .eq('id', input.matchId)
      .maybeSingle();
    if (matchError) throw matchError;
    if (!match) throw new Error('Partida não encontrada.');
    if (match.finalized_at) throw new Error('Partida já finalizada.');
    if (match.start_at && new Date(match.start_at) > new Date()) {
      throw new Error('Partida ainda não iniciou.');
    }

    const { data: guest, error: guestError } = await this.supabase
      .from(this.guestsTable)
      .select('id')
      .eq('id', input.playerId)
      .eq('match_id', input.matchId)
      .maybeSingle();
    if (guestError) throw guestError;
    if (guest) {
      const { error } = await this.supabase
        .from(this.guestsTable)
        .update({ attended: input.attended, marked_at: new Date().toISOString() })
        .eq('id', input.playerId);
      if (error) throw error;
      return;
    }

    const { error } = await this.supabase.from(this.attendanceTable).upsert(
      {
        match_id: input.matchId,
        player_id: input.playerId,
        attended: input.attended,
        marked_at: new Date().toISOString(),
      },
      { onConflict: 'match_id,player_id' },
    );
    if (error) throw error;
  }

  async updatePayment(input: { matchId: string; playerId: string; paid: boolean }): Promise<void> {
    const { data: match, error: matchError } = await this.supabase
      .from(this.matchesTable)
      .select('start_at,finalized_at')
      .eq('id', input.matchId)
      .maybeSingle();
    if (matchError) throw matchError;
    if (!match) throw new Error('Partida não encontrada.');
    if (match.finalized_at) throw new Error('Partida já finalizada.');

    const { data: guest, error: guestError } = await this.supabase
      .from(this.guestsTable)
      .select('id')
      .eq('id', input.playerId)
      .eq('match_id', input.matchId)
      .maybeSingle();
    if (guestError) throw guestError;
    if (guest) {
      const { error } = await this.supabase
        .from(this.guestsTable)
        .update({ paid: input.paid, paid_marked_at: new Date().toISOString() })
        .eq('id', input.playerId);
      if (error) throw error;
      return;
    }

    const { error } = await this.supabase
      .from(this.subscriptionsTable)
      .update({ paid: input.paid, paid_marked_at: new Date().toISOString() })
      .eq('match_id', input.matchId)
      .eq('player_id', input.playerId);
    if (error) throw error;
  }

  async finalizeMatch(input: { matchId: string; adminId: string }): Promise<void> {
    const now = new Date().toISOString();
    const { data: match, error: matchError } = await this.supabase
      .from(this.matchesTable)
      .select('id,name,start_at,finalized_at')
      .eq('id', input.matchId)
      .maybeSingle();
    if (matchError) throw matchError;
    if (!match) throw new Error('Partida não encontrada.');
    if (match.finalized_at) throw new Error('Partida já finalizada.');
    if (match.start_at && new Date(match.start_at) > new Date()) {
      throw new Error('Partida ainda não iniciou.');
    }

    const { data: subs, error: subsError } = await this.supabase
      .from(this.subscriptionsTable)
      .select('player_id')
      .eq('match_id', input.matchId);
    if (subsError) throw subsError;

    const playerIds = (subs || []).map((s: any) => s.player_id).filter(Boolean);
    if (playerIds.length === 0) {
      const { error: finalizeError } = await this.supabase
        .from(this.matchesTable)
        .update({ finalized_at: now, finalized_by: input.adminId })
        .eq('id', input.matchId);
      if (finalizeError) throw finalizeError;
      return;
    }

    const { data: attendance, error: attendanceError } = await this.supabase
      .from(this.attendanceTable)
      .select('player_id,attended')
      .eq('match_id', input.matchId);
    if (attendanceError) throw attendanceError;

    const attendedSet = new Set(
      (attendance || []).filter((row: any) => row.attended).map((row: any) => row.player_id),
    );

    const { data: players, error: playersError } = await this.supabase
      .from('players')
      .select('id,praise_count,report_count')
      .in('id', playerIds);
    if (playersError) throw playersError;

    const updates = (players || []).map(async (player: any) => {
      const attended = attendedSet.has(player.id);
      const praise = (player.praise_count ?? 0) + (attended ? 1 : 0);
      const reports = (player.report_count ?? 0) + (attended ? 0 : 5);
      const reputation = calculateReputation({ elogios: praise, denuncias: reports });
      const { error } = await this.supabase
        .from('players')
        .update({ praise_count: praise, report_count: reports, reputation })
        .eq('id', player.id);
      if (error) throw error;
      return { id: player.id, attended };
    });

    const updateResults = await Promise.all(updates);
    const absentPlayers = updateResults.filter((p) => !p.attended).map((p) => p.id);
    if (absentPlayers.length > 0) {
      const feedRows = absentPlayers.map((playerId) => ({
        id: crypto.randomUUID(),
        type: 'report',
        target_player_id: playerId,
        submitter_player_id: null,
        content: `Ausência não justificada na operação ${match.name}.`,
        created_at: now,
        match_id: input.matchId,
      }));
      const { error: feedError } = await this.supabase.from('feed').insert(feedRows);
      if (feedError) throw feedError;
    }

    const { error: finalizeError } = await this.supabase
      .from(this.matchesTable)
      .update({ finalized_at: now, finalized_by: input.adminId })
      .eq('id', input.matchId);
    if (finalizeError) throw finalizeError;

    const { error: guestAnonymizeError } = await this.supabase
      .from(this.guestsTable)
      .update({ full_name: 'Convidado', age: null, guardian_confirmed: false })
      .eq('match_id', input.matchId);
    if (guestAnonymizeError) throw guestAnonymizeError;
  }

  async listEligibleMatchesForTransmission(input: { playerId: string }): Promise<MatchOption[]> {
    const now = new Date();
    const cutoff = new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000);
    const { data: subs, error: subsError } = await this.supabase
      .from(this.subscriptionsTable)
      .select('match_id')
      .eq('player_id', input.playerId);
    if (subsError) throw subsError;
    const matchIds = (subs || []).map((s: any) => s.match_id).filter(Boolean);
    if (matchIds.length === 0) return [];

    const { data: attendance, error: attendanceError } = await this.supabase
      .from(this.attendanceTable)
      .select('match_id,attended')
      .eq('player_id', input.playerId)
      .eq('attended', true);
    if (attendanceError) throw attendanceError;
    const attendedSet = new Set((attendance || []).map((row: any) => row.match_id));
    if (attendedSet.size === 0) return [];

    const { data: matches, error: matchesError } = await this.supabase
      .from(this.matchesTable)
      .select('id,name,start_at,finalized_at')
      .in('id', matchIds)
      .not('finalized_at', 'is', null);
    if (matchesError) throw matchesError;

    return (matches || [])
      .filter((match: any) => attendedSet.has(match.id))
      .filter((match: any) => !match.start_at || new Date(match.start_at) <= new Date())
      .filter((match: any) => {
        if (!match.finalized_at) return false;
        const finalizedAt = new Date(match.finalized_at);
        return finalizedAt >= cutoff && finalizedAt <= now;
      })
      .map((match: any) => ({
        id: match.id,
        name: match.name,
        startAt: match.start_at,
      }));
  }

  async countPlayerMatches(input: { playerId: string }): Promise<number> {
    const { count, error } = await this.supabase
      .from(this.attendanceTable)
      .select('match_id', { count: 'exact', head: true })
      .eq('player_id', input.playerId)
      .eq('attended', true);
    if (error) throw error;
    return typeof count === 'number' ? count : 0;
  }

  private async insertGuests(matchId: string, playerId: string, guests: MatchGuestInput[]) {
    const payload = guests.map((guest) => {
      const fullName = guest.fullName?.trim() ?? '';
      if (!fullName) {
        throw new Error('Informe o nome do convidado.');
      }
      const age = typeof guest.age === 'number' && !Number.isNaN(guest.age) ? guest.age : null;
      const isMinor = typeof age === 'number' && age < 18;
      if (isMinor && !guest.guardianConfirmed) {
        throw new Error('Confirme a responsabilidade legal para convidados menores de idade.');
      }
      return {
        id: crypto.randomUUID(),
        match_id: matchId,
        invited_by_player_id: playerId,
        full_name: fullName,
        age,
        rent_equipment: guest.rentEquipment,
        guardian_confirmed: Boolean(guest.guardianConfirmed),
        created_at: new Date().toISOString(),
        attended: false,
        paid: false,
      };
    });

    const { error } = await this.supabase.from(this.guestsTable).insert(payload);
    if (error) throw error;
  }
}
