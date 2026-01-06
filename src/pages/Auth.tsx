import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft, Mail, Shield, Loader2 } from 'lucide-react';
import { z } from 'zod';
import { InputOTP, InputOTPGroup, InputOTPSlot } from '@/components/ui/input-otp';

const emailSchema = z.string().trim().email('Please enter a valid email address').max(255);

const Auth = () => {
  const [step, setStep] = useState<'email' | 'otp'>('email');
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [countdown, setCountdown] = useState(0);
  
  const navigate = useNavigate();
  const { sendOtp, verifyOtp, user, loading } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    if (!loading && user) {
      navigate('/dashboard');
    }
  }, [user, loading, navigate]);

  // Countdown timer for resend
  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    
    const result = emailSchema.safeParse(email);
    if (!result.success) {
      setError(result.error.errors[0].message);
      return;
    }
    
    setIsLoading(true);
    
    try {
      const { error: otpError } = await sendOtp(email);
      if (otpError) {
        setError(otpError.message);
        toast({
          title: 'Failed to send code',
          description: otpError.message,
          variant: 'destructive',
        });
      } else {
        setStep('otp');
        setCountdown(60);
        toast({
          title: 'Code sent!',
          description: 'Check your email for the 6-digit verification code.',
        });
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    
    if (otp.length !== 6) {
      setError('Please enter a valid 6-digit code');
      return;
    }
    
    setIsLoading(true);
    
    try {
      const { error: verifyError } = await verifyOtp(email, otp);
      if (verifyError) {
        setError('Invalid or expired code. Please try again.');
        toast({
          title: 'Verification failed',
          description: 'Invalid or expired code. Please try again.',
          variant: 'destructive',
        });
      } else {
        toast({
          title: 'Welcome to Yodha Mode!',
          description: 'You have been successfully verified.',
        });
        navigate('/dashboard');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendCode = async () => {
    if (countdown > 0) return;
    
    setError(null);
    setIsLoading(true);
    
    try {
      const { error: otpError } = await sendOtp(email);
      if (otpError) {
        setError(otpError.message);
      } else {
        setCountdown(60);
        setOtp('');
        toast({
          title: 'Code resent!',
          description: 'Check your email for the new 6-digit code.',
        });
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleBack = () => {
    if (step === 'otp') {
      setStep('email');
      setOtp('');
      setError(null);
    } else {
      navigate('/');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col px-6 py-8">
      {/* Back button */}
      <button
        onClick={handleBack}
        className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-8"
      >
        <ArrowLeft className="w-5 h-5" />
        <span>Back</span>
      </button>

      <div className="flex-1 flex flex-col justify-center max-w-md mx-auto w-full">
        {/* Step 1: Email Entry */}
        {step === 'email' && (
          <>
            {/* Icon */}
            <div className="flex justify-center mb-6">
              <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center">
                <Mail className="w-10 h-10 text-primary" />
              </div>
            </div>

            {/* Header */}
            <div className="text-center mb-8">
              <h1 className="text-3xl font-bold text-foreground mb-2">
                Enter Your Email
              </h1>
              <p className="text-muted-foreground">
                We'll send you a 6-digit verification code
              </p>
            </div>

            {/* Form */}
            <form onSubmit={handleSendOtp} className="space-y-6">
              <div className="space-y-2">
                <Input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    if (error) setError(null);
                  }}
                  className="h-14 text-lg bg-muted/50 border-muted-foreground/20 rounded-xl text-foreground placeholder:text-muted-foreground/50"
                  disabled={isLoading}
                  autoFocus
                />
                {error && (
                  <p className="text-sm text-destructive font-medium">{error}</p>
                )}
              </div>

              <Button
                type="submit"
                className="w-full h-14 text-lg font-bold bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl"
                disabled={isLoading || !email}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    Sending Code...
                  </>
                ) : (
                  'Send Code'
                )}
              </Button>
            </form>
          </>
        )}

        {/* Step 2: OTP Verification */}
        {step === 'otp' && (
          <>
            {/* Icon */}
            <div className="flex justify-center mb-6">
              <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center">
                <Shield className="w-10 h-10 text-primary" />
              </div>
            </div>

            {/* Header */}
            <div className="text-center mb-8">
              <h1 className="text-3xl font-bold text-foreground mb-2">
                Enter Verification Code
              </h1>
              <p className="text-muted-foreground">
                We sent a 6-digit code to
              </p>
              <p className="text-primary font-medium mt-1">{email}</p>
            </div>

            {/* Form */}
            <form onSubmit={handleVerifyOtp} className="space-y-6">
              <div className="flex flex-col items-center space-y-4">
                <InputOTP
                  value={otp}
                  onChange={(value) => {
                    setOtp(value);
                    if (error) setError(null);
                  }}
                  maxLength={6}
                  disabled={isLoading}
                >
                  <InputOTPGroup className="gap-2">
                    {[0, 1, 2, 3, 4, 5].map((index) => (
                      <InputOTPSlot
                        key={index}
                        index={index}
                        className="w-12 h-14 text-xl font-bold bg-muted/50 border-muted-foreground/20 rounded-lg text-foreground"
                      />
                    ))}
                  </InputOTPGroup>
                </InputOTP>
                
                {error && (
                  <p className="text-sm text-destructive font-medium">{error}</p>
                )}
              </div>

              <Button
                type="submit"
                className="w-full h-14 text-lg font-bold bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl"
                disabled={isLoading || otp.length !== 6}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    Verifying...
                  </>
                ) : (
                  'Verify & Continue'
                )}
              </Button>

              {/* Resend */}
              <div className="text-center">
                <p className="text-muted-foreground text-sm">
                  Didn't receive the code?{' '}
                  {countdown > 0 ? (
                    <span className="text-muted-foreground/70">
                      Resend in {countdown}s
                    </span>
                  ) : (
                    <button
                      type="button"
                      onClick={handleResendCode}
                      className="text-primary font-medium hover:underline"
                      disabled={isLoading}
                    >
                      Resend Code
                    </button>
                  )}
                </p>
              </div>
            </form>
          </>
        )}
      </div>
    </div>
  );
};

export default Auth;
