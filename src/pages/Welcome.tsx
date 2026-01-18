import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import yodhaLogo from '@/assets/yodha-logo.jpg';
import welcomeBgVideo from '@/assets/welcome-bg.mp4';

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
    <div className="min-h-screen relative flex flex-col items-center justify-center px-6 overflow-hidden bg-black">
      {/* Video Background */}
      <video
        autoPlay
        loop
        muted
        playsInline
        className="absolute inset-0 w-full h-full object-cover z-0"
      >
        <source src={welcomeBgVideo} type="video/mp4" />
      </video>
      
      {/* Dark Overlay with edge blending */}
      <div className="absolute inset-0 bg-black/60 z-10" />
      <div className="absolute inset-y-0 left-0 w-32 bg-gradient-to-r from-black to-transparent z-10" />
      <div className="absolute inset-y-0 right-0 w-32 bg-gradient-to-l from-black to-transparent z-10" />
      
      {/* Content */}
      <div className="relative z-20 text-center space-y-8 max-w-md w-full">
        {/* Logo/Icon */}
        <div className="w-28 h-28 mx-auto rounded-2xl overflow-hidden shadow-lg shadow-primary/30 ring-2 ring-primary/50">
          <img src={yodhaLogo} alt="Yodha Logo" className="w-full h-full object-cover" />
        </div>

        {/* Headline */}
        <div className="space-y-3">
          <h1 className="text-4xl font-bold text-white tracking-tight">
            Yodha Mode
          </h1>
          <p className="text-xl text-white/80 font-medium">
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
            className="w-full h-12 text-base font-semibold bg-white/10 border-white/30 text-white hover:bg-white/20"
            size="lg"
          >
            Create Account
          </Button>
        </div>

        {/* Footer text */}
        <p className="text-sm text-white/60 pt-4">
          Sync your progress across all devices
        </p>
      </div>
    </div>
  );
};

export default Welcome;
