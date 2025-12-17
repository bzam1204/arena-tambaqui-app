export interface CompleteProfileInput {
  nickname: string;
  name: string;
  cpf: string;
  photo?: File | string | null;
}

export interface UpdateProfileInput {
  name: string;
  nickname: string;
  avatar?: File | string | null;
}

export interface OnboardingStatus {
  onboarded: boolean;
  playerId: string | null;
  isAdmin: boolean;
}

export interface ProfileGateway {
  isOnboarded(userId: string): Promise<OnboardingStatus>;
  completeProfile(userId: string, input: CompleteProfileInput): Promise<string>;
  updateProfile(userId: string, input: UpdateProfileInput): Promise<void>;
}

export const TkProfileGateway = Symbol('ProfileGateway');
