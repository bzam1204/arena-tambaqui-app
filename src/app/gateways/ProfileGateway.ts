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

export interface OnboardingStatus {
  onboarded: boolean;
  playerId: string | null;
}

export interface ProfileGateway {
  isOnboarded(userId: string): Promise<OnboardingStatus>;
  completeProfile(userId: string, input: CompleteProfileInput): Promise<string>;
  updateProfile(userId: string, input: UpdateProfileInput): Promise<void>;
}

export const TkProfileGateway = Symbol('ProfileGateway');
