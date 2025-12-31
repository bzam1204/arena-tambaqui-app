import { inject, injectable } from 'tsyringe';
import type { TransmissionGateway, CreateTransmissionInput } from '@/app/gateways/TransmissionGateway';
import type { Player } from '@/app/gateways/PlayerGateway';
import type { NotificationGateway, NotificationType } from '@/app/gateways/NotificationGateway';
import { TkNotificationGateway } from '@/app/gateways/NotificationGateway';
import { getSupabaseClient } from '@/infra/supabase/client';
import { calculateReputation } from '@/domain/reputation';

function buildNotificationMessage(type: NotificationType, matchName?: string) {
  const label = type === 'praise' ? 'elogio' : 'denúncia';
  if (!matchName) {
    return `Você recebeu um ${label} em uma partida.`;
  }
  return `Você recebeu um ${label} na Partida ${matchName}`;
}

@injectable()
export class SupabaseTransmissionGateway implements TransmissionGateway {
  private readonly supabase = getSupabaseClient();
  private readonly table = 'feed';
  private readonly playersTable = 'players';
  private readonly matchesTable = 'matches';
  private readonly subscriptionsTable = 'match_subscriptions';
  private readonly attendanceTable = 'match_attendance';

  constructor(
    @inject(TkNotificationGateway) private readonly notificationGateway: NotificationGateway,
  ) {}

  async createTransmission(input: CreateTransmissionInput): Promise<void> {
    if (input.targetId === input.submitterId) {
      throw new Error('Não é possível denunciar a si mesmo.');
    }
    if (!input.matchId) {
      throw new Error('Selecione uma partida válida.');
    }
    const matchName = await this.assertEligibleMatch(input.matchId, input.submitterId);
    await this.assertUniqueTransmission(input.matchId, input.submitterId, input.targetId);
    const player = await this.fetchPlayer(input.targetId);
    if (!player) {
      throw new Error('Target player not found');
    }
    const now = new Date();

    // Insert feed entry (only target + content; submitter remains anonymous to other users)
    const { error: feedErr } = await this.supabase.from(this.table).insert({
      id: crypto.randomUUID(),
      type: input.type,
      target_player_id: input.targetId,
      content: input.content,
      created_at: now.toISOString(),
      submitter_player_id: input.submitterId,
      match_id: input.matchId,
    });
    if (feedErr) throw feedErr;

    // Update player stats + reputation
    if (player) {
      const newPraise = player.praiseCount + (input.type === 'praise' ? 1 : 0);
      const newReports = player.reportCount + (input.type === 'report' ? 1 : 0);
      const newReputation = calculateReputation({ elogios: newPraise, denuncias: newReports });
      const { error: playerErr } = await this.supabase
        .from(this.playersTable)
        .update({
          praise_count: newPraise,
          report_count: newReports,
          reputation: newReputation,
        })
        .eq('id', player.id);
      if (playerErr) throw playerErr;
    }

    await this.notificationGateway.createNotification({
      playerId: input.targetId,
      type: input.type,
      message: buildNotificationMessage(input.type, matchName),
      matchId: input.matchId,
    });
  }

  async listTransmittedTargets(input: { submitterId: string; matchId: string }): Promise<string[]> {
    const { data, error } = await this.supabase
      .from(this.table)
      .select('target_player_id')
      .eq('submitter_player_id', input.submitterId)
      .eq('match_id', input.matchId);
    if (error) throw error;
    return (data || []).map((row: any) => row.target_player_id).filter(Boolean);
  }

  private async fetchPlayer(id: string): Promise<Player | null> {
    const { data, error } = await this.supabase
      .from(this.playersTable)
      .select('id,nickname,praise_count,report_count,reputation,history, users:users(full_name,avatar,avatar_frame)')
      .eq('id', id)
      .maybeSingle();
    if (error) throw error;
    if (!data) return null;
    const praise = data.praise_count ?? 0;
    const reports = data.report_count ?? 0;
    return {
      id: data.id,
      name: data.users?.full_name ?? data.nickname ?? '',
      nickname: data.nickname,
      avatar: data.users?.avatar ?? null,
      avatarFrame: data.users?.avatar_frame ?? null,
      elogios: praise,
      denuncias: reports,
      praiseCount: praise,
      reportCount: reports,
      reputation: calculateReputation({ elogios: praise, denuncias: reports }),
      history: data.history ?? [],
    };
  }

  private async assertEligibleMatch(matchId: string, playerId: string): Promise<string | undefined> {
    const { data: match, error: matchError } = await this.supabase
      .from(this.matchesTable)
      .select('id,name,start_at,finalized_at')
      .eq('id', matchId)
      .maybeSingle();
    if (matchError) throw matchError;
    if (!match) throw new Error('Partida não encontrada.');
    if (!match.finalized_at) {
      throw new Error('Partida ainda não finalizada.');
    }
    const now = new Date();
    const finalizedAt = new Date(match.finalized_at);
    const cutoff = new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000);
    if (finalizedAt < cutoff || finalizedAt > now) {
      throw new Error('Partida fora da janela de transmissão.');
    }
    if (match.start_at && new Date(match.start_at) > new Date()) {
      throw new Error('Partida ainda não ocorreu.');
    }

    const { data: sub, error: subError } = await this.supabase
      .from(this.subscriptionsTable)
      .select('id')
      .eq('match_id', matchId)
      .eq('player_id', playerId)
      .maybeSingle();
    if (subError) throw subError;
    if (!sub) throw new Error('Inscrição não encontrada para a partida selecionada.');

    const { data: attendance, error: attendanceError } = await this.supabase
      .from(this.attendanceTable)
      .select('attended')
      .eq('match_id', matchId)
      .eq('player_id', playerId)
      .maybeSingle();
    if (attendanceError) throw attendanceError;
    if (!attendance?.attended) {
      throw new Error('Presença não confirmada para esta partida.');
    }

    return match.name ?? undefined;
  }

  private async assertUniqueTransmission(matchId: string, submitterId: string, targetId: string): Promise<void> {
    const { data, error } = await this.supabase
      .from(this.table)
      .select('id')
      .eq('match_id', matchId)
      .eq('submitter_player_id', submitterId)
      .eq('target_player_id', targetId)
      .limit(1)
      .maybeSingle();
    if (error) throw error;
    if (data) {
      throw new Error('Já existe uma transmissão para este operador nesta partida.');
    }
  }
}
