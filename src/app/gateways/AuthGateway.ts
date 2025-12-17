export interface Session {
  userId: string;
  isAdmin?: boolean;
}

export interface AuthGateway {
  login(): Promise<Session | null>;
  logout(): Promise<void>;
  getSession(): Promise<Session | null>;
}

export const TkAuthGateway = Symbol('AuthGateway');
