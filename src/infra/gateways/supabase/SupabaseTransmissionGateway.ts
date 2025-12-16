import { injectable } from 'tsyringe';
import type { TransmissionGateway, CreateTransmissionInput } from '@/app/gateways/TransmissionGateway';
import type { Player } from '@/app/gateways/PlayerGateway';
import { getSupabaseClient } from '@/infra/supabase/client';
import { calculateReputation } from '@/domain/reputation';

@injectable()
export class SupabaseTransmissionGateway implements TransmissionGateway {
  private readonly supabase = getSupabaseClient();
  private readonly table = 'feed';
  private readonly playersTable = 'players';

  async createTransmission(input: CreateTransmissionInput): Promise<void> {
    if (input.targetId === input.submitterId) {
      throw new Error('Não é possível denunciar a si mesmo.');
    }
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
  }

  private async fetchPlayer(id: string): Promise<Player | null> {
    const { data, error } = await this.supabase
      .from(this.playersTable)
      .select('id,nickname,praise_count,report_count,reputation,history, users:users(full_name,avatar)')
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
      elogios: praise,
      denuncias: reports,
      praiseCount: praise,
      reportCount: reports,
      reputation: calculateReputation({ elogios: praise, denuncias: reports }),
      history: data.history ?? [],
    };
  }
}
