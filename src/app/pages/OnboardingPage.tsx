import { useNavigate } from 'react-router-dom';
import { ProfileCompletionStepper } from '@/components/ProfileCompletionStepper';
import { Inject, TkProfileGateway } from '@/infra/container';
import type { ProfileGateway } from '@/app/gateways/ProfileGateway';

type Props = {
  userId: string;
  onComplete: (playerId: string) => void;
};

export function OnboardingPage({ userId, onComplete }: Props) {
  const navigate = useNavigate();
  const profile = Inject<ProfileGateway>(TkProfileGateway);

  const handleComplete = async (data: { nickname: string; name: string; cpf: string; photo: File | null }) => {
    const playerId = await profile.completeProfile(userId, {
      nickname: data.nickname,
      name: data.name,
      cpf: data.cpf,
      photo: data.photo,
    });
    onComplete(playerId);
    navigate('/mural/feed', { replace: true });
  };

  return <ProfileCompletionStepper onComplete={handleComplete} />;
}
