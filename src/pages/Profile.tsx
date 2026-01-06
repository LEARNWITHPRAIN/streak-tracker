import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft, User, Lock, Loader2, Eye, EyeOff, Save } from 'lucide-react';
import { z } from 'zod';

const passwordSchema = z.string().min(6, 'Password must be at least 6 characters');

const Profile = () => {
  const navigate = useNavigate();
  const { user, loading, updatePassword } = useAuth();
  const { toast } = useToast();

  const [displayName, setDisplayName] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSavingName, setIsSavingName] = useState(false);
  const [isSavingPassword, setIsSavingPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [profileLoading, setProfileLoading] = useState(true);

  useEffect(() => {
    if (!loading && !user) {
      navigate('/');
    }
  }, [user, loading, navigate]);

  useEffect(() => {
    const fetchProfile = async () => {
      if (!user) return;

      const { data, error } = await supabase
        .from('profiles')
        .select('display_name')
        .eq('user_id', user.id)
        .single();

      if (data) {
        setDisplayName(data.display_name || '');
      }
      
      // If no profile exists, create one
      if (error && error.code === 'PGRST116') {
        await supabase.from('profiles').insert({ user_id: user.id });
      }
      
      setProfileLoading(false);
    };

    fetchProfile();
  }, [user]);

  const handleSaveDisplayName = async () => {
    if (!user) return;
    
    setIsSavingName(true);
    setError(null);

    const { error: updateError } = await supabase
      .from('profiles')
      .update({ display_name: displayName.trim() || null })
      .eq('user_id', user.id);

    setIsSavingName(false);

    if (updateError) {
      setError('Failed to update display name');
    } else {
      toast({
        title: 'Profile updated!',
        description: 'Your display name has been saved.',
      });
    }
  };

  const handleChangePassword = async () => {
    setError(null);

    const passwordResult = passwordSchema.safeParse(newPassword);
    if (!passwordResult.success) {
      setError(passwordResult.error.errors[0].message);
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setIsSavingPassword(true);

    const { error: updateError } = await updatePassword(newPassword);

    setIsSavingPassword(false);

    if (updateError) {
      setError(updateError.message);
    } else {
      toast({
        title: 'Password updated!',
        description: 'Your password has been changed successfully.',
      });
      setNewPassword('');
      setConfirmPassword('');
    }
  };

  if (loading || profileLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background flex flex-col px-6 py-8">
      {/* Back button */}
      <button
        onClick={() => navigate('/dashboard')}
        className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-8"
      >
        <ArrowLeft className="w-5 h-5" />
        <span>Back to Dashboard</span>
      </button>

      <div className="flex-1 flex flex-col max-w-md mx-auto w-full">
        {/* Icon */}
        <div className="flex justify-center mb-6">
          <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center">
            <User className="w-10 h-10 text-primary" />
          </div>
        </div>

        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">Profile Settings</h1>
          <p className="text-muted-foreground">{user.email}</p>
        </div>

        {/* Display Name Section */}
        <div className="glass rounded-2xl p-6 mb-6">
          <h2 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
            <User className="w-5 h-5 text-primary" />
            Display Name
          </h2>
          
          <div className="space-y-4">
            <Input
              type="text"
              placeholder="Enter your display name"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              className="h-14 text-lg bg-muted/50 border-muted-foreground/20 rounded-xl text-foreground placeholder:text-muted-foreground/50"
              disabled={isSavingName}
            />
            
            <Button
              onClick={handleSaveDisplayName}
              className="w-full h-12 bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl font-semibold"
              disabled={isSavingName}
            >
              {isSavingName ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="w-5 h-5 mr-2" />
                  Save Name
                </>
              )}
            </Button>
          </div>
        </div>

        {/* Change Password Section */}
        <div className="glass rounded-2xl p-6">
          <h2 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
            <Lock className="w-5 h-5 text-primary" />
            Change Password
          </h2>
          
          <div className="space-y-4">
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <Input
                type={showPassword ? 'text' : 'password'}
                placeholder="New password"
                value={newPassword}
                onChange={(e) => {
                  setNewPassword(e.target.value);
                  if (error) setError(null);
                }}
                className="h-14 pl-12 pr-12 text-lg bg-muted/50 border-muted-foreground/20 rounded-xl text-foreground placeholder:text-muted-foreground/50"
                disabled={isSavingPassword}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>

            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <Input
                type={showPassword ? 'text' : 'password'}
                placeholder="Confirm new password"
                value={confirmPassword}
                onChange={(e) => {
                  setConfirmPassword(e.target.value);
                  if (error) setError(null);
                }}
                className="h-14 pl-12 text-lg bg-muted/50 border-muted-foreground/20 rounded-xl text-foreground placeholder:text-muted-foreground/50"
                disabled={isSavingPassword}
              />
            </div>

            {error && (
              <p className="text-sm text-destructive font-medium text-center">{error}</p>
            )}

            <Button
              onClick={handleChangePassword}
              className="w-full h-12 bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl font-semibold"
              disabled={isSavingPassword || !newPassword || !confirmPassword}
            >
              {isSavingPassword ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  Updating...
                </>
              ) : (
                'Update Password'
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;
