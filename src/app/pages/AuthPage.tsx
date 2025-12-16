import { useNavigate } from 'react-router-dom';
import { MobileRegister } from '@/components/MobileRegister';

type Props = {
  onLogin: () => Promise<void>;
};

export function AuthPage({ onLogin }: Props) {
  const navigate = useNavigate();
  const handleLogin = async () => {
    await onLogin();
    navigate('/onboarding', { replace: true });
  };
  return <MobileRegister onGoogleSignIn={handleLogin} />;
}
