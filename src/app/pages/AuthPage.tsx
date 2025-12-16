import { useNavigate } from 'react-router-dom';
import { MobileRegister } from '@/components/MobileRegister';

type Props = {
  onLogin: () => Promise<Session | null>;
};

export function AuthPage({ onLogin }: Props) {
  const navigate = useNavigate();
  const handleLogin = async () => {
    const session = await onLogin();
    if (!session) return; // redirect in progress or no session
    navigate('/onboarding', { replace: true });
  };
  return <MobileRegister onGoogleSignIn={handleLogin} />;
}
