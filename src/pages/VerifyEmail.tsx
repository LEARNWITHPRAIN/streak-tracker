import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Mail, Loader2, CheckCircle, RefreshCw, ArrowLeft } from 'lucide-react';
import yodhaLogo from '@/assets/yodha-logo.jpg';

const VerifyEmail = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user, loading, signOut } = useAuth();
  const { toast } = useToast();
  const [isResending, setIsResending] = useState(false);
  const [isVerified, setIsVerified] = useState(false);
  const [countdown, setCountdown] = useState(0);

  const targetEmail = searchParams.get('email') || user?.email || '';

  // Check if email is already verified
  useEffect(() => {
    if (!loading && !user && !targetEmail) {
      navigate('/auth');
      return;
    }

    if (user?.email_confirmed_at) {
      setIsVerified(true);
      setTimeout(() => {
        navigate('/dashboard');
      }, 2000);
    }
  }, [user, loading, targetEmail, navigate]);

  // Listen for auth state changes (when user verifies email)
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if ((event === 'USER_UPDATED' || event === 'SIGNED_IN') && session?.user?.email_confirmed_at) {
          setIsVerified(true);
          toast({
            title: 'Identity Confirmed!',
            description: `Welcome to the Army, ${session.user.email?.split('@')[0] || 'Warrior'}!`,
          });
          setTimeout(() => {
            navigate('/dashboard');
          }, 1500);
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

  const getAuthRedirectUrl = () => {
    if (typeof window !== 'undefined' && window.location.origin && !window.location.origin.includes('localhost')) {
      return `${window.location.origin}/dashboard`;
    }
    return 'https://yodhamode.cloud/dashboard';
  };

  const handleResendEmail = async () => {
    if (!targetEmail || countdown > 0) return;

    setIsResending(true);
    try {
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: targetEmail,
        options: {
          emailRedirectTo: getAuthRedirectUrl(),
        },
      });

      if (error) throw error;

      toast({
        title: 'Email Sent!',
        description: 'Check your inbox (or spam) for the verification link.',
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
    if (user) {
      await signOut();
    }
    navigate('/auth?mode=signup');
  };

  const isGmail = targetEmail.toLowerCase().includes('@gmail.com');

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
            Welcome to the Army, {targetEmail ? targetEmail.split('@')[0] : 'Warrior'}!
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
        <span>Back to Sign In</span>
      </button>

      <div className="flex-1 flex flex-col items-center justify-center max-w-md mx-auto w-full">
        {/* Brand Logo & Icon */}
        <div className="flex flex-col items-center justify-center mb-6">
          <div className="w-16 h-16 rounded-2xl overflow-hidden shadow-lg shadow-primary/20 ring-2 ring-primary/40 mb-3">
            <img src={yodhaLogo} alt="Yodha Mode Logo" className="w-full h-full object-cover" />
          </div>
          <span className="text-sm font-semibold tracking-wider uppercase text-primary">Yodha Mode</span>
        </div>

        {/* Envelope Icon */}
        <div className="w-20 h-20 rounded-2xl bg-primary/20 border border-primary/30 flex items-center justify-center mb-6 animate-bounce shadow-lg shadow-primary/10">
          <Mail className="w-10 h-10 text-primary" />
        </div>

        {/* Header */}
        <div className="text-center mb-6 space-y-2.5">
          <h1 className="text-3xl font-bold text-foreground tracking-tight">
            Check Your Inbox
          </h1>
          <p className="text-muted-foreground text-sm">
            We've sent an activation link to:
          </p>
          <p className="text-base font-bold text-primary break-all px-3 py-1.5 rounded-xl bg-primary/10 border border-primary/20 inline-block">
            {targetEmail || 'your email address'}
          </p>
          <p className="text-xs text-muted-foreground pt-1 leading-relaxed">
            Click the link in the email to activate your account and start tracking your workouts.
          </p>
        </div>

        {/* Spam / Junk Notice Box */}
        <div className="w-full mb-6 p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs space-y-1">
          <p className="font-semibold flex items-center gap-1.5 text-amber-400">
            ⚠️ Can't find the email?
          </p>
          <p className="text-muted-foreground text-[11px] leading-relaxed">
            Please check your <strong>Spam</strong> or <strong>Junk / Promotions</strong> folder. Make sure to mark it as <em>"Not Spam"</em> so you never miss workout updates.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="w-full space-y-3">
          {isGmail && (
            <Button
              onClick={() => window.open('https://mail.google.com', '_blank')}
              className="w-full h-12 text-sm font-bold bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl shadow-md"
            >
              Open Gmail
            </Button>
          )}

          <Button
            onClick={handleResendEmail}
            disabled={isResending || countdown > 0}
            variant={isGmail ? 'outline' : 'default'}
            className={`w-full h-12 text-sm font-semibold rounded-xl ${
              !isGmail ? 'bg-primary hover:bg-primary/90 text-primary-foreground' : 'border-border/60 hover:bg-muted'
            }`}
          >
            {isResending ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Sending...
              </>
            ) : countdown > 0 ? (
              <>
                <RefreshCw className="w-4 h-4 mr-2" />
                Resend available in {countdown}s
              </>
            ) : (
              <>
                <RefreshCw className="w-4 h-4 mr-2" />
                Resend Verification Email
              </>
            )}
          </Button>

          <Button
            onClick={handleChangeEmail}
            variant="ghost"
            className="w-full h-11 text-xs font-medium rounded-xl text-muted-foreground hover:text-foreground"
          >
            Change Email Address / Sign In
          </Button>
        </div>
      </div>
    </div>
  );
};

export default VerifyEmail;
