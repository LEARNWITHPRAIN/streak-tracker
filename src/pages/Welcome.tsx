import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import yodhaLogo from '@/assets/yodha-logo.jpg';
import welcomeBgVideo from '@/assets/welcome-bg.mp4';
import { Loader2 } from 'lucide-react';

const Welcome = () => {
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  const { toast } = useToast();
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!loading && user) {
      navigate('/dashboard');
    }
  }, [user, loading, navigate]);

  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleSignupSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const trimmedEmail = email.trim();
    
    if (!trimmedEmail) {
      toast({
        title: "Error",
        description: "Please enter your email address",
        variant: "destructive",
      });
      return;
    }

    if (!validateEmail(trimmedEmail)) {
      toast({
        title: "Error",
        description: "Please enter a valid email address",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      await fetch('https://n8n.techyyyodha.online/webhook/form-signup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        mode: 'no-cors',
        body: JSON.stringify({ email: trimmedEmail }),
      });

      toast({
        title: "Thanks for signing up!",
        description: "We'll keep you updated with the latest news.",
      });
      setEmail('');
    } catch (error) {
      console.error('Error submitting email:', error);
      toast({
        title: "Error",
        description: "Failed to submit. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen relative flex flex-col items-center justify-center px-6 overflow-hidden">
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
      
      {/* Dark Overlay */}
      <div className="absolute inset-0 bg-black/60 z-10" />
      
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

        {/* Email Signup Form */}
        <form onSubmit={handleSignupSubmit} className="space-y-3 pt-2">
          <div className="flex gap-2">
            <Input
              type="email"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="flex-1 h-12 bg-white/10 border-white/30 text-white placeholder:text-white/50 focus:border-primary"
              disabled={isSubmitting}
            />
            <Button
              type="submit"
              className="h-12 px-6"
              disabled={isSubmitting}
            >
              {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Join'}
            </Button>
          </div>
          <p className="text-xs text-white/50">Get early access & updates</p>
        </form>

        {/* Buttons */}
        <div className="space-y-3 pt-2">
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
