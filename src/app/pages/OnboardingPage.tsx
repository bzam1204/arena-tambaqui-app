import { useNavigate } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
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

  const mutation = useMutation({
    mutationFn: (data: { nickname: string; name: string; cpf: string; photo: File | null }) =>
      profile.completeProfile(userId, {
        nickname: data.nickname,
        name: data.name,
        cpf: data.cpf,
        photo: data.photo,
      }),
    onSuccess: (playerId) => {
      onComplete(playerId);
      navigate('/mural/feed', { replace: true });
    },
  });

  return (
    <ProfileCompletionStepper
      submitting={mutation.isPending}
      onComplete={(data) => mutation.mutate(data)}
      onCheckCpfExists={(cpf) => profile.checkCpfExists(cpf)}
    />
  );
}
