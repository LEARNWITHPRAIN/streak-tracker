import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Mail, Loader2, CheckCircle, RefreshCw, ArrowLeft } from 'lucide-react';

const VerifyEmail = () => {
  const navigate = useNavigate();
  const { user, loading, signOut } = useAuth();
  const { toast } = useToast();
  const [isResending, setIsResending] = useState(false);
  const [isVerified, setIsVerified] = useState(false);
  const [countdown, setCountdown] = useState(0);

  // Check if email is already verified
  useEffect(() => {
    if (!loading && !user) {
      navigate('/auth');
      return;
    }

    if (user?.email_confirmed_at) {
      setIsVerified(true);
      setTimeout(() => {
        navigate('/dashboard');
      }, 2000);
    }
  }, [user, loading, navigate]);

  // Listen for auth state changes (when user verifies email)
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event === 'USER_UPDATED' && session?.user?.email_confirmed_at) {
          setIsVerified(true);
          toast({
            title: 'Identity Confirmed!',
            description: `Welcome to the Army, ${session.user.email?.split('@')[0] || 'Warrior'}!`,
          });
          setTimeout(() => {
            navigate('/dashboard');
          }, 2000);
        }
      }
    );

    return () => subscription.unsubscribe();
  }, [navigate, toast]);

  // Countdown timer for resend button
  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  const handleResendEmail = async () => {
    if (!user?.email || countdown > 0) return;

    setIsResending(true);
    try {
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: user.email,
        options: {
          emailRedirectTo: `${window.location.origin}/dashboard`,
        },
      });

      if (error) throw error;

      toast({
        title: 'Email Sent!',
        description: 'Check your inbox for the verification link.',
      });
      setCountdown(60); // 60 second cooldown
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to resend email',
        variant: 'destructive',
      });
    } finally {
      setIsResending(false);
    }
  };

  const handleChangeEmail = async () => {
    await signOut();
    navigate('/auth?mode=signup');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  // Success state
  if (isVerified) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center px-6">
        <div className="text-center space-y-6 max-w-md">
          <div className="w-24 h-24 mx-auto rounded-full bg-green-500/20 flex items-center justify-center animate-pulse">
            <CheckCircle className="w-14 h-14 text-green-500" />
          </div>
          <h1 className="text-3xl font-bold text-foreground">
            Identity Confirmed!
          </h1>
          <p className="text-xl text-primary font-semibold">
            Welcome to the Army, {user?.email?.split('@')[0] || 'Warrior'}!
          </p>
          <p className="text-muted-foreground">
            Redirecting to dashboard...
          </p>
          <Loader2 className="w-6 h-6 animate-spin text-primary mx-auto" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col px-6 py-8">
      {/* Back button */}
      <button
        onClick={handleChangeEmail}
        className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-8"
      >
        <ArrowLeft className="w-5 h-5" />
        <span>Back</span>
      </button>

      <div className="flex-1 flex flex-col items-center justify-center max-w-md mx-auto w-full">
        {/* Envelope Icon */}
        <div className="w-28 h-28 rounded-full bg-primary/20 flex items-center justify-center mb-8 animate-bounce">
          <Mail className="w-14 h-14 text-primary" />
        </div>

        {/* Header */}
        <div className="text-center mb-8 space-y-3">
          <h1 className="text-3xl font-bold text-foreground">
            Verify Your Identity
          </h1>
          <p className="text-muted-foreground">
            We've sent a verification email to:
          </p>
          <p className="text-lg font-semibold text-primary">
            {user?.email}
          </p>
          <p className="text-sm text-muted-foreground mt-4">
            Click the link in the email to verify your account and join the army.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="w-full space-y-4">
          <Button
            onClick={handleResendEmail}
            disabled={isResending || countdown > 0}
            className="w-full h-14 text-lg font-bold bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl"
          >
            {isResending ? (
              <>
                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                Sending...
              </>
            ) : countdown > 0 ? (
              <>
                <RefreshCw className="w-5 h-5 mr-2" />
                Resend in {countdown}s
              </>
            ) : (
              <>
                <RefreshCw className="w-5 h-5 mr-2" />
                Resend Verification Email
              </>
            )}
          </Button>

          <Button
            onClick={handleChangeEmail}
            variant="outline"
            className="w-full h-14 text-lg font-medium rounded-xl border-muted-foreground/20"
          >
            Change Email Address
          </Button>
        </div>

        {/* Help text */}
        <p className="text-center text-sm text-muted-foreground mt-8">
          Didn't receive the email? Check your spam folder or try resending.
        </p>
      </div>
    </div>
  );
};

export default VerifyEmail;
