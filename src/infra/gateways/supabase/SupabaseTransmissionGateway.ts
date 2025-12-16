import { injectable } from 'tsyringe';
import type { TransmissionGateway, CreateTransmissionInput } from '@/app/gateways/TransmissionGateway';
import type { Player } from '@/app/gateways/PlayerGateway';
import { getSupabaseClient } from '@/infra/supabase/client';
import { calculateReputation } from '@/domain/reputation';
import { format } from './date';

@injectable()
export class SupabaseTransmissionGateway implements TransmissionGateway {
  private readonly supabase = getSupabaseClient();
  private readonly table = 'feed';
  private readonly playersTable = 'players';

  async createTransmission(input: CreateTransmissionInput): Promise<void> {
    const player = await this.fetchPlayer(input.targetId);
    const now = new Date();

    // Insert feed entry
    const { error: feedErr } = await this.supabase.from(this.table).insert({
      id: crypto.randomUUID(),
      type: input.type,
      target_id: input.targetId,
      target_name: player?.nickname ?? 'Jogador Desconhecido',
      target_avatar: player?.avatar ?? null,
      content: input.content,
      created_at: now.toISOString(),
      submitter_name: input.submitterName,
      submitter_cpf: input.submitterCPF,
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
    const { data, error } = await this.supabase.from(this.playersTable).select('*').eq('id', id).maybeSingle();
    if (error) throw error;
    if (!data) return null;
    const praise = data.praise_count ?? 0;
    const reports = data.report_count ?? 0;
    return {
      id: data.id,
      name: data.name,
      nickname: data.nickname,
      avatar: data.avatar,
      elogios: praise,
      denuncias: reports,
      praiseCount: praise,
      reportCount: reports,
      reputation: calculateReputation({ elogios: praise, denuncias: reports }),
      history: data.history ?? [],
    };
  }
}
