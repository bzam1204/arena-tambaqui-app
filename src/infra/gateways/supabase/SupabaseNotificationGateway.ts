import { injectable } from 'tsyringe';
import type {
  NotificationGateway,
  Notification,
  CreateNotificationInput,
} from '@/app/gateways/NotificationGateway';
import { getSupabaseClient } from '@/infra/supabase/client';

@injectable()
export class SupabaseNotificationGateway implements NotificationGateway {
  private readonly supabase = getSupabaseClient();
  private readonly table = 'notifications';

  async createNotification(input: CreateNotificationInput): Promise<void> {
    const createdAt = input.createdAt ?? new Date().toISOString();
    const { error } = await this.supabase.from(this.table).insert({
      id: crypto.randomUUID(),
      player_id: input.playerId,
      type: input.type,
      message: input.message,
      match_id: input.matchId ?? null,
      created_at: createdAt,
      read_at: null,
    });
    if (error) throw error;
  }

  async listNotifications(input: { playerId: string; read?: boolean }): Promise<Notification[]> {
    let query = this.supabase
      .from(this.table)
      .select('id,type,message,match_id,created_at,read_at')
      .eq('player_id', input.playerId)
      .order('created_at', { ascending: false });

    if (input.read === true) {
      query = query.not('read_at', 'is', null);
    }
    if (input.read === false) {
      query = query.is('read_at', null);
    }

    const { data, error } = await query;
    if (error) throw error;
    return (data || []).map((row: any) => ({
      id: row.id,
      type: row.type,
      message: row.message,
      matchId: row.match_id,
      createdAt: row.created_at,
      readAt: row.read_at,
    }));
  }

  async countUnread(input: { playerId: string }): Promise<number> {
    const { count, error } = await this.supabase
      .from(this.table)
      .select('id', { count: 'exact', head: true })
      .eq('player_id', input.playerId)
      .is('read_at', null);
    if (error) throw error;
    return count ?? 0;
  }

  async markAsRead(input: { playerId: string; notificationId: string }): Promise<void> {
    const { error } = await this.supabase
      .from(this.table)
      .update({ read_at: new Date().toISOString() })
      .eq('id', input.notificationId)
      .eq('player_id', input.playerId);
    if (error) throw error;
  }

  async markAllAsRead(input: { playerId: string }): Promise<void> {
    const { error } = await this.supabase
      .from(this.table)
      .update({ read_at: new Date().toISOString() })
      .eq('player_id', input.playerId)
      .is('read_at', null);
    if (error) throw error;
  }
}
