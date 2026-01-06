import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { InputOTP, InputOTPGroup, InputOTPSlot } from '@/components/ui/input-otp';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft, Mail, Lock, Loader2, Eye, EyeOff, KeyRound } from 'lucide-react';
import { z } from 'zod';

const emailSchema = z.string().trim().email('Please enter a valid email address').max(255);
const passwordSchema = z.string().min(6, 'Password must be at least 6 characters');

type AuthMode = 'signin' | 'signup' | 'verify' | 'forgot' | 'reset';

const Auth = () => {
  const [searchParams] = useSearchParams();
  const [mode, setMode] = useState<AuthMode>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [otp, setOtp] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const navigate = useNavigate();
  const { signIn, signUp, verifyOtp, resetPassword, updatePassword, user, loading } = useAuth();
  const { toast } = useToast();

  // Check URL for reset mode
  useEffect(() => {
    if (searchParams.get('mode') === 'reset') {
      setMode('reset');
    }
  }, [searchParams]);

  useEffect(() => {
    if (!loading && user && mode !== 'reset') {
      navigate('/dashboard');
    }
  }, [user, loading, navigate, mode]);

  const handleSignIn = async () => {
    const { error: signInError } = await signIn(email, password);
    if (signInError) {
      if (signInError.message.includes('Invalid login credentials')) {
        setError('Invalid email or password. Please try again.');
      } else if (signInError.message.includes('Email not confirmed')) {
        setError('Please verify your email first.');
      } else {
        setError(signInError.message);
      }
    } else {
      toast({
        title: 'Welcome back!',
        description: 'You have been signed in successfully.',
      });
      navigate('/dashboard');
    }
  };

  const handleSignUp = async () => {
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    const { error: signUpError } = await signUp(email, password);
    if (signUpError) {
      if (signUpError.message.includes('already registered')) {
        setError('This email is already registered. Please sign in instead.');
      } else {
        setError(signUpError.message);
      }
    } else {
      toast({
        title: 'Verification code sent!',
        description: 'Please check your email for the 6-digit code.',
      });
      setMode('verify');
    }
  };

  const handleVerifyOtp = async () => {
    if (otp.length !== 6) {
      setError('Please enter the complete 6-digit code');
      return;
    }

    const { error: verifyError } = await verifyOtp(email, otp);
    if (verifyError) {
      setError('Invalid or expired code. Please try again.');
    } else {
      toast({
        title: 'Welcome to Yodha Mode!',
        description: 'Your account has been verified successfully.',
      });
      navigate('/dashboard');
    }
  };

  const handleForgotPassword = async () => {
    const emailResult = emailSchema.safeParse(email);
    if (!emailResult.success) {
      setError(emailResult.error.errors[0].message);
      return;
    }

    const { error: resetError } = await resetPassword(email);
    if (resetError) {
      setError(resetError.message);
    } else {
      toast({
        title: 'Reset email sent!',
        description: 'Check your email for the password reset link.',
      });
      setMode('signin');
    }
  };

  const handleResetPassword = async () => {
    const passwordResult = passwordSchema.safeParse(password);
    if (!passwordResult.success) {
      setError(passwordResult.error.errors[0].message);
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    const { error: updateError } = await updatePassword(password);
    if (updateError) {
      setError(updateError.message);
    } else {
      toast({
        title: 'Password updated!',
        description: 'Your password has been reset successfully.',
      });
      navigate('/dashboard');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    
    // Validate email for modes that need it
    if (['signin', 'signup', 'forgot'].includes(mode)) {
      const emailResult = emailSchema.safeParse(email);
      if (!emailResult.success) {
        setError(emailResult.error.errors[0].message);
        return;
      }
    }
    
    // Validate password for modes that need it
    if (['signin', 'signup', 'reset'].includes(mode)) {
      const passwordResult = passwordSchema.safeParse(password);
      if (!passwordResult.success) {
        setError(passwordResult.error.errors[0].message);
        return;
      }
    }
    
    setIsLoading(true);
    
    try {
      switch (mode) {
        case 'signin':
          await handleSignIn();
          break;
        case 'signup':
          await handleSignUp();
          break;
        case 'verify':
          await handleVerifyOtp();
          break;
        case 'forgot':
          await handleForgotPassword();
          break;
        case 'reset':
          await handleResetPassword();
          break;
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleBack = () => {
    if (mode === 'verify') {
      setMode('signup');
      setOtp('');
    } else if (mode === 'forgot') {
      setMode('signin');
    } else {
      navigate('/');
    }
  };

  const toggleMode = () => {
    setMode(mode === 'signin' ? 'signup' : 'signin');
    setError(null);
    setPassword('');
    setConfirmPassword('');
    setOtp('');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  const getHeaderContent = () => {
    switch (mode) {
      case 'signin':
        return { title: 'Welcome Back', subtitle: 'Sign in to continue your journey', icon: Mail };
      case 'signup':
        return { title: 'Create Account', subtitle: 'Join Yodha Mode and start your journey', icon: Mail };
      case 'verify':
        return { title: 'Verify Email', subtitle: `Enter the 6-digit code sent to ${email}`, icon: KeyRound };
      case 'forgot':
        return { title: 'Forgot Password', subtitle: 'Enter your email to receive a reset link', icon: Lock };
      case 'reset':
        return { title: 'Reset Password', subtitle: 'Enter your new password', icon: Lock };
      default:
        return { title: '', subtitle: '', icon: Mail };
    }
  };

  const getButtonText = () => {
    if (isLoading) {
      switch (mode) {
        case 'signin': return 'Signing in...';
        case 'signup': return 'Creating account...';
        case 'verify': return 'Verifying...';
        case 'forgot': return 'Sending...';
        case 'reset': return 'Updating...';
      }
    }
    switch (mode) {
      case 'signin': return 'Sign In';
      case 'signup': return 'Create Account';
      case 'verify': return 'Verify Code';
      case 'forgot': return 'Send Reset Link';
      case 'reset': return 'Update Password';
    }
  };

  const isButtonDisabled = () => {
    if (isLoading) return true;
    switch (mode) {
      case 'signin': return !email || !password;
      case 'signup': return !email || !password || !confirmPassword;
      case 'verify': return otp.length !== 6;
      case 'forgot': return !email;
      case 'reset': return !password || !confirmPassword;
    }
  };

  const { title, subtitle, icon: Icon } = getHeaderContent();

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
        {/* Icon */}
        <div className="flex justify-center mb-6">
          <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center">
            <Icon className="w-10 h-10 text-primary" />
          </div>
        </div>

        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">{title}</h1>
          <p className="text-muted-foreground">{subtitle}</p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Email (signin, signup, forgot) */}
          {['signin', 'signup', 'forgot'].includes(mode) && (
            <div className="space-y-2">
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  placeholder="Email address"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    if (error) setError(null);
                  }}
                  className="h-14 pl-12 text-lg bg-muted/50 border-muted-foreground/20 rounded-xl text-foreground placeholder:text-muted-foreground/50"
                  disabled={isLoading}
                  autoFocus
                />
              </div>
            </div>
          )}

          {/* OTP Input (verify mode) */}
          {mode === 'verify' && (
            <div className="flex justify-center">
              <InputOTP
                maxLength={6}
                value={otp}
                onChange={(value) => {
                  setOtp(value);
                  if (error) setError(null);
                }}
                disabled={isLoading}
              >
                <InputOTPGroup className="gap-2">
                  {[0, 1, 2, 3, 4, 5].map((index) => (
                    <InputOTPSlot
                      key={index}
                      index={index}
                      className="w-12 h-14 text-xl bg-muted/50 border-muted-foreground/20 rounded-xl text-foreground"
                    />
                  ))}
                </InputOTPGroup>
              </InputOTP>
            </div>
          )}

          {/* Password (signin, signup, reset) */}
          {['signin', 'signup', 'reset'].includes(mode) && (
            <div className="space-y-2">
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder={mode === 'reset' ? 'New password' : 'Password'}
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    if (error) setError(null);
                  }}
                  className="h-14 pl-12 pr-12 text-lg bg-muted/50 border-muted-foreground/20 rounded-xl text-foreground placeholder:text-muted-foreground/50"
                  disabled={isLoading}
                  autoFocus={mode === 'reset'}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>
          )}

          {/* Confirm Password (signup, reset) */}
          {['signup', 'reset'].includes(mode) && (
            <div className="space-y-2">
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input
                  id="confirmPassword"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Confirm password"
                  value={confirmPassword}
                  onChange={(e) => {
                    setConfirmPassword(e.target.value);
                    if (error) setError(null);
                  }}
                  className="h-14 pl-12 text-lg bg-muted/50 border-muted-foreground/20 rounded-xl text-foreground placeholder:text-muted-foreground/50"
                  disabled={isLoading}
                />
              </div>
            </div>
          )}

          {/* Error */}
          {error && (
            <p className="text-sm text-destructive font-medium text-center">{error}</p>
          )}

          {/* Forgot Password Link (signin only) */}
          {mode === 'signin' && (
            <div className="text-right">
              <button
                type="button"
                onClick={() => {
                  setMode('forgot');
                  setError(null);
                }}
                className="text-sm text-primary hover:underline"
              >
                Forgot password?
              </button>
            </div>
          )}

          {/* Submit Button */}
          <Button
            type="submit"
            className="w-full h-14 text-lg font-bold bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl mt-6"
            disabled={isButtonDisabled()}
          >
            {isLoading && <Loader2 className="w-5 h-5 mr-2 animate-spin" />}
            {getButtonText()}
          </Button>

          {/* Resend code (verify mode) */}
          {mode === 'verify' && (
            <div className="text-center">
              <button
                type="button"
                onClick={async () => {
                  setIsLoading(true);
                  const { error } = await signUp(email, password);
                  setIsLoading(false);
                  if (!error) {
                    toast({
                      title: 'Code resent!',
                      description: 'Check your email for the new verification code.',
                    });
                  }
                }}
                className="text-sm text-primary hover:underline"
                disabled={isLoading}
              >
                Didn't receive the code? Resend
              </button>
            </div>
          )}
        </form>

        {/* Toggle mode (signin/signup only) */}
        {['signin', 'signup'].includes(mode) && (
          <div className="text-center mt-6">
            <p className="text-muted-foreground">
              {mode === 'signin' ? "Don't have an account? " : 'Already have an account? '}
              <button
                type="button"
                onClick={toggleMode}
                className="text-primary font-medium hover:underline"
                disabled={isLoading}
              >
                {mode === 'signin' ? 'Sign up' : 'Sign in'}
              </button>
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Auth;