import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft, Mail, Lock, Loader2, Eye, EyeOff, CheckCircle } from 'lucide-react';
import { z } from 'zod';

const emailSchema = z.string().trim().email('Please enter a valid email address').max(255);
const passwordSchema = z.string().min(6, 'Password must be at least 6 characters');

type AuthMode = 'signin' | 'signup' | 'magiclink-sent' | 'forgot' | 'reset';

const Auth = () => {
  const [searchParams] = useSearchParams();
  const [mode, setMode] = useState<AuthMode>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const navigate = useNavigate();
  const { signIn, sendMagicLink, signInWithGoogle, resetPassword, updatePassword, user, loading } = useAuth();
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

    // Send magic link for email verification
    const { error: magicLinkError } = await sendMagicLink(email);
    if (magicLinkError) {
      if (magicLinkError.message.includes('rate limit') || magicLinkError.message.includes('security purposes')) {
        setError('Please wait before requesting another link.');
      } else {
        setError(magicLinkError.message);
      }
    } else {
      setMode('magiclink-sent');
    }
  };

  const handleGoogleSignIn = async () => {
    setIsLoading(true);
    setError(null);
    
    const { error: googleError } = await signInWithGoogle();
    
    if (googleError) {
      setError(googleError.message);
      setIsLoading(false);
    }
    // Don't reset loading - redirect will happen
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
    if (mode === 'magiclink-sent') {
      setMode('signup');
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
  };

  const handleResendLink = async () => {
    setIsLoading(true);
    setError(null);
    
    const { error } = await sendMagicLink(email);
    setIsLoading(false);
    
    if (error) {
      if (error.message.includes('rate limit') || error.message.includes('security purposes')) {
        setError('Please wait before requesting another link.');
      } else {
        setError(error.message);
      }
    } else {
      toast({
        title: 'Link resent!',
        description: 'Check your email for the new sign-in link.',
      });
    }
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
      case 'magiclink-sent':
        return { title: 'Check Your Email', subtitle: `We sent a sign-in link to ${email}`, icon: CheckCircle };
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
        case 'signup': return 'Sending link...';
        case 'forgot': return 'Sending...';
        case 'reset': return 'Updating...';
      }
    }
    switch (mode) {
      case 'signin': return 'Sign In';
      case 'signup': return 'Send Magic Link';
      case 'forgot': return 'Send Reset Link';
      case 'reset': return 'Update Password';
    }
  };

  const isButtonDisabled = () => {
    if (isLoading) return true;
    switch (mode) {
      case 'signin': return !email || !password;
      case 'signup': return !email || !password || !confirmPassword;
      case 'forgot': return !email;
      case 'reset': return !password || !confirmPassword;
      default: return false;
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

        {/* Magic Link Sent View */}
        {mode === 'magiclink-sent' && (
          <div className="space-y-6 text-center">
            <p className="text-muted-foreground">
              Click the link in your email to complete sign up. The link will sign you in automatically.
            </p>
            
            <div className="space-y-4">
              <Button
                type="button"
                variant="outline"
                onClick={handleResendLink}
                disabled={isLoading}
                className="w-full h-14 text-lg font-medium rounded-xl border-muted-foreground/20"
              >
                {isLoading && <Loader2 className="w-5 h-5 mr-2 animate-spin" />}
                Resend Link
              </Button>
              
              <Button
                type="button"
                variant="ghost"
                onClick={() => setMode('signup')}
                className="w-full text-muted-foreground"
              >
                Use a different email
              </Button>
            </div>

            {error && (
              <p className="text-sm text-destructive font-medium">{error}</p>
            )}
          </div>
        )}

        {/* Google Sign-In Button (signin and signup modes only) */}
        {['signin', 'signup'].includes(mode) && (
          <>
            <Button
              type="button"
              variant="outline"
              onClick={handleGoogleSignIn}
              disabled={isLoading}
              className="w-full h-14 text-lg font-medium rounded-xl border-muted-foreground/20 bg-muted/50 hover:bg-muted text-foreground mb-4"
            >
              <svg className="w-5 h-5 mr-3" viewBox="0 0 24 24">
                <path
                  fill="currentColor"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="currentColor"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="currentColor"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                />
                <path
                  fill="currentColor"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                />
              </svg>
              Continue with Google
            </Button>

            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-muted-foreground/20" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-4 bg-background text-muted-foreground">or continue with email</span>
              </div>
            </div>
          </>
        )}

        {/* Form */}
        {mode !== 'magiclink-sent' && (
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
          </form>
        )}

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