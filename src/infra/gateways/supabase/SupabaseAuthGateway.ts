import { injectable } from 'tsyringe';
import type { AuthGateway, Session } from '@/app/gateways/AuthGateway';
import { getSupabaseClient } from '@/infra/supabase/client';

@injectable()
export class SupabaseAuthGateway implements AuthGateway {
  private readonly supabase = getSupabaseClient();

  async login(): Promise<Session | null> {
    // If already signed in, return session
    const existing = await this.supabase.auth.getSession();
    if (existing.data.session?.user) {
      return { userId: existing.data.session.user.id };
    }

    const redirectBase = (import.meta.env.VITE_AUTH_REDIRECT_URL || window.location.origin).replace(/\/$/, '');
    const redirectTo = `${redirectBase}/onboarding`;
    const { data, error } = await this.supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo },
    });
    if (error) throw error;
    // Supabase will redirect; resolve with placeholder so callers don't hang
    if (data?.url) {
      window.location.href = data.url;
    }
    // Session will be established after redirect; return placeholder for now
    return null;
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
