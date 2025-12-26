export interface CompleteProfileInput {
  nickname: string;
  name: string;
  cpf: string;
  motto?: string | null;
  avatar?: File | string | null;
  userPhoto?: File | string | null;
  userPhotoCaptured?: boolean;
}

export interface UpdateProfileInput {
  name: string;
  nickname: string;
  avatar?: File | string | null;
  motto?: string | null;
  avatarFrame?: string | null;
  isVip?: boolean;
}

export interface OnboardingStatus {
  onboarded: boolean;
  playerId: string | null;
  isAdmin: boolean;
  isVip: boolean;
}

export interface ProfileGateway {
  isOnboarded(userId: string): Promise<OnboardingStatus>;
  checkCpfExists(cpf: string): Promise<boolean>;
  completeProfile(userId: string, input: CompleteProfileInput): Promise<string>;
  updateProfile(userId: string, input: UpdateProfileInput): Promise<void>;
  getUserPhoto(playerId: string): Promise<string | null>;
  updateUserPhoto(userId: string, input: { userPhoto: File; userPhotoCaptured: boolean }): Promise<void>;
}

export const TkProfileGateway = Symbol('ProfileGateway');
