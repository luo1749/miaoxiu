import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router';
import { useAuth } from '../auth';
import { toast } from 'sonner';

export default function OAuthCallback() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { setAuthFromToken, isLoggedIn } = useAuth();

  useEffect(() => {
    const token = searchParams.get('token');
    if (!token) {
      toast.error('第三方登录失败');
      navigate('/login');
      return;
    }
    setAuthFromToken(token).then((ok) => {
      if (ok) {
        toast.success('登录成功');
        navigate('/');
      } else {
        navigate('/login');
      }
    });
  }, [searchParams, navigate, setAuthFromToken]);

  if (isLoggedIn) return null;

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#0B0E14' }}>
      <div className="text-center">
        <div className="w-10 h-10 rounded-full border-2 border-t-[#2441A9] border-r-transparent border-b-[#E84A3A] border-l-transparent animate-spin mx-auto mb-4" />
        <p className="text-[#F0EDE0] opacity-50 text-sm">登录中...</p>
      </div>
    </div>
  );
}
