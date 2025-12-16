export interface CompleteProfileInput {
  nickname: string;
  name: string;
  cpf: string;
  photo?: string;
}

export interface UpdateProfileInput {
  name: string;
  nickname: string;
  avatar?: string;
}

export interface ProfileGateway {
  isOnboarded(userId: string): Promise<boolean>;
  completeProfile(userId: string, input: CompleteProfileInput): Promise<void>;
  updateProfile(userId: string, input: UpdateProfileInput): Promise<void>;
}

export const TkProfileGateway = Symbol('ProfileGateway');
