import { injectable } from 'tsyringe';
import type { AuthGateway, Session } from '@/app/gateways/AuthGateway';
import { getSupabaseClient } from '@/infra/supabase/client';

@injectable()
export class SupabaseAuthGateway implements AuthGateway {
  private readonly supabase = getSupabaseClient();

  async login(): Promise<Session> {
    // Placeholder: choose OAuth provider Google for now
    const { data, error } = await this.supabase.auth.signInWithOAuth({ provider: 'google' });
    if (error) throw error;
    if (!data?.user) throw new Error('No user returned from Supabase auth');
    return { userId: data.user.id };
  }

  async logout(): Promise<void> {
    const { error } = await this.supabase.auth.signOut();
    if (error) throw error;
  }

  async getSession(): Promise<Session | null> {
    const { data, error } = await this.supabase.auth.getSession();
    if (error) throw error;
    if (!data.session?.user) return null;
    return { userId: data.session.user.id };
  }
}
