import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useBills } from '@/contexts/BillContext';

const Index = () => {
  const navigate = useNavigate();
  const { hasCompletedOnboarding, loading } = useBills();

  useEffect(() => {
    console.log('Index - Loading:', loading, 'Onboarding completed:', hasCompletedOnboarding);
    
    if (!loading) {
      if (hasCompletedOnboarding) {
        console.log('Redirecting to dashboard');
        navigate('/dashboard', { replace: true });
      } else {
        console.log('Redirecting to onboarding');
        navigate('/', { replace: true });
      }
    }
  }, [hasCompletedOnboarding, loading, navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
        <p className="text-muted-foreground">Loading...</p>
      </div>
    </div>
  );
};

export default Index;
