import { injectable } from 'tsyringe';
import type { FeedGateway } from '@/app/gateways/FeedGateway';
import type { FeedEntry } from '@/app/gateways/PlayerGateway';
import { getSupabaseClient } from '@/infra/supabase/client';
import { format } from '@/infra/gateways/supabase/date';

@injectable()
export class SupabaseFeedGateway implements FeedGateway {
  private readonly supabase = getSupabaseClient();
  private readonly table = 'feed';

  async listFeed(): Promise<FeedEntry[]> {
    const { data, error } = await this.supabase.from(this.table).select('*').order('created_at', { ascending: false });
    if (error) throw error;
    return (data || []).map((row: any) => {
      const created = row.created_at ? new Date(row.created_at) : new Date();
      return {
        id: row.id,
        type: row.type,
        targetId: row.target_id,
        targetName: row.target_name,
        targetAvatar: row.target_avatar,
        content: row.content,
        date: format(created, 'date'),
        time: format(created, 'time'),
        isRetracted: row.is_retracted ?? false,
      } satisfies FeedEntry;
    });
  }

  async prepend(entry: FeedEntry): Promise<void> {
    const { error } = await this.supabase.from(this.table).insert({
      id: entry.id || crypto.randomUUID(),
      type: entry.type,
      target_id: entry.targetId,
      target_name: entry.targetName,
      target_avatar: entry.targetAvatar,
      content: entry.content,
      created_at: new Date().toISOString(),
      is_retracted: entry.isRetracted ?? false,
    });
    if (error) throw error;
  }
}
