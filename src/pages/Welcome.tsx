import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useEffect } from 'react';
import { Button } from '@/components/ui/button';

const Welcome = () => {
  const navigate = useNavigate();
  const { user, loading } = useAuth();

  useEffect(() => {
    if (!loading && user) {
      navigate('/dashboard');
    }
  }, [user, loading, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center px-6">
      <div className="text-center space-y-8 max-w-md">
        {/* Logo/Icon */}
        <div className="w-20 h-20 mx-auto rounded-2xl bg-primary/10 flex items-center justify-center">
          <span className="text-4xl">💪</span>
        </div>

        {/* Headline */}
        <div className="space-y-3">
          <h1 className="text-4xl font-bold text-foreground tracking-tight">
            Yodha Mode
          </h1>
          <p className="text-xl text-muted-foreground font-medium">
            Master Your Routine.
          </p>
        </div>

        {/* Buttons */}
        <div className="space-y-3 pt-4">
          <Button
            onClick={() => navigate('/auth?mode=login')}
            className="w-full h-12 text-base font-semibold"
            size="lg"
          >
            Log In
          </Button>
          <Button
            onClick={() => navigate('/auth?mode=signup')}
            variant="outline"
            className="w-full h-12 text-base font-semibold"
            size="lg"
          >
            Create Account
          </Button>
        </div>

        {/* Footer text */}
        <p className="text-sm text-muted-foreground pt-4">
          Sync your progress across all devices
        </p>
      </div>
    </div>
  );
};

export default Welcome;
