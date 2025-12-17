import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';

export default function AuthCallbackPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { handleOAuthToken } = useAuth();

  useEffect(() => {
    const token = searchParams.get('token');
    const error = searchParams.get('error');

    if (error) {
      navigate('/login?error=' + error, { replace: true });
      return;
    }

    if (token) {
      handleOAuthToken(token).then(() => {
        navigate('/documents', { replace: true });
      });
    } else {
      navigate('/login', { replace: true });
    }
  }, [searchParams, navigate, handleOAuthToken]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#32292f]">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#99e1d9] mx-auto"></div>
        <p className="mt-4 text-[#f2f2f2]">Signing you in...</p>
      </div>
    </div>
  );
}
