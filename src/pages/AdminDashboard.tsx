import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useSubscription } from '@/hooks/useSubscription';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  ShieldCheck, 
  Users, 
  CreditCard, 
  DollarSign, 
  Utensils, 
  ArrowLeft, 
  Sparkles, 
  CheckCircle2, 
  Clock, 
  Loader2,
  Lock,
  Plus
} from 'lucide-react';
import { toast } from 'sonner';

interface SubscriptionRecord {
  id: string;
  user_id: string;
  razorpay_payment_id: string | null;
  amount_paise: number;
  status: string;
  paid_at: string | null;
  expires_at: string | null;
  created_at: string;
}

interface RecentMeal {
  id: string;
  user_id: string;
  meal_name: string;
  calories_kcal: number;
  protein_g: number;
  source: string;
  logged_at: string;
}

export const AdminDashboard: React.FC = () => {
  const { user } = useAuth();
  const { isAdmin, loading: authLoading } = useSubscription();
  const navigate = useNavigate();

  const [subscriptions, setSubscriptions] = useState<SubscriptionRecord[]>([]);
  const [recentMeals, setRecentMeals] = useState<RecentMeal[]>([]);
  const [totalDietProfiles, setTotalDietProfiles] = useState(0);
  const [loadingData, setLoadingData] = useState(true);

  // Manual grant user ID form
  const [manualUserId, setManualUserId] = useState('');
  const [granting, setGranting] = useState(false);

  useEffect(() => {
    if (!authLoading && !isAdmin) {
      // not admin
      setLoadingData(false);
      return;
    }

    if (isAdmin) {
      loadAdminData();
    }
  }, [isAdmin, authLoading]);

  const loadAdminData = async () => {
    setLoadingData(true);
    try {
      // 1. Fetch subscriptions
      const { data: subsData, error: subsErr } = await supabase
        .from('user_subscriptions')
        .select('*')
        .order('created_at', { ascending: false });

      if (!subsErr && subsData) {
        setSubscriptions(subsData as SubscriptionRecord[]);
      }

      // 2. Fetch total diet profiles count
      const { count: profileCount } = await supabase
        .from('diet_profiles')
        .select('*', { count: 'exact', head: true });

      setTotalDietProfiles(profileCount || 0);

      // 3. Fetch recent meal logs
      const { data: mealsData } = await supabase
        .from('meal_logs')
        .select('id, user_id, meal_name, calories_kcal, protein_g, source, logged_at')
        .order('logged_at', { ascending: false })
        .limit(10);

      if (mealsData) {
        setRecentMeals(mealsData as RecentMeal[]);
      }
    } catch (err) {
      console.error('Error fetching admin data:', err);
    } finally {
      setLoadingData(false);
    }
  };

  const handleManualGrant = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualUserId.trim()) return;

    setGranting(true);
    try {
      const expiry = new Date();
      expiry.setDate(expiry.getDate() + 30);

      const { error } = await supabase
        .from('user_subscriptions')
        .upsert(
          {
            user_id: manualUserId.trim(),
            status: 'active',
            amount_paise: 14900,
            razorpay_payment_id: `admin_granted_${Date.now()}`,
            paid_at: new Date().toISOString(),
            expires_at: expiry.toISOString(),
            updated_at: new Date().toISOString(),
          },
          { onConflict: 'user_id' }
        );

      if (error) throw error;

      toast.success('Successfully granted 30-day Pro access to user!');
      setManualUserId('');
      await loadAdminData();
    } catch (err: any) {
      console.error('Error granting access:', err);
      toast.error(`Failed to grant access: ${err.message || 'Unknown error'}`);
    } finally {
      setGranting(false);
    }
  };

  if (authLoading || (isAdmin && loadingData)) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
        <Loader2 className="w-8 h-8 text-purple-400 animate-spin mb-3" />
        <p className="text-sm text-muted-foreground">Authenticating Admin Protocol...</p>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4 text-center">
        <div className="p-4 rounded-full bg-red-500/10 border border-red-500/20 text-red-400 mb-4">
          <Lock className="w-8 h-8" />
        </div>
        <h1 className="text-xl font-bold text-foreground mb-2">Access Denied</h1>
        <p className="text-sm text-muted-foreground max-w-sm mb-6">
          This portal is strictly reserved for Yodha Mode platform administrators ({import.meta.env.VITE_ADMIN_EMAIL}).
        </p>
        <Button onClick={() => navigate('/dashboard')} variant="outline">
          <ArrowLeft className="w-4 h-4 mr-2" /> Return to Dashboard
        </Button>
      </div>
    );
  }

  const activeSubCount = subscriptions.filter((s) => s.status === 'active').length;
  const totalRevenuePaise = subscriptions
    .filter((s) => s.status === 'active')
    .reduce((sum, s) => sum + (s.amount_paise || 0), 0);
  const totalRevenueInr = Math.round(totalRevenuePaise / 100);

  return (
    <div className="min-h-screen bg-background text-foreground py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-6 border-b border-border/80">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-2xl bg-gradient-to-br from-purple-600 to-indigo-600 text-white shadow-lg shadow-purple-500/20">
              <ShieldCheck className="w-7 h-7" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-black tracking-tight text-foreground">Yodha Admin Command</h1>
                <span className="text-xs font-mono font-bold px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/40">
                  Root Admin
                </span>
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">
                Logged in as: <span className="text-purple-400 font-mono">{user?.email}</span>
              </p>
            </div>
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate('/dashboard')}
            className="border-border hover:border-purple-500/40 hover:bg-purple-500/10"
          >
            <ArrowLeft className="w-4 h-4 mr-2" /> Back to App
          </Button>
        </div>

        {/* Metrics Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-5 rounded-2xl bg-card/60 border border-border/80 relative overflow-hidden">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Active Pro Users</span>
              <div className="p-2 rounded-xl bg-purple-500/10 text-purple-400">
                <Users className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl font-black font-mono text-foreground mt-2">
              {activeSubCount}
            </div>
            <p className="text-[11px] text-muted-foreground mt-1">₹149/mo active subscribers</p>
          </div>

          <div className="p-5 rounded-2xl bg-card/60 border border-border/80 relative overflow-hidden">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Total Revenue</span>
              <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400">
                <DollarSign className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl font-black font-mono text-emerald-400 mt-2">
              ₹{totalRevenueInr.toLocaleString()}
            </div>
            <p className="text-[11px] text-muted-foreground mt-1">From Razorpay transactions</p>
          </div>

          <div className="p-5 rounded-2xl bg-card/60 border border-border/80 relative overflow-hidden">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Diet Profiles</span>
              <div className="p-2 rounded-xl bg-orange-500/10 text-orange-400">
                <Utensils className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl font-black font-mono text-foreground mt-2">
              {totalDietProfiles}
            </div>
            <p className="text-[11px] text-muted-foreground mt-1">Users calculated daily goals</p>
          </div>

          <div className="p-5 rounded-2xl bg-card/60 border border-border/80 relative overflow-hidden">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Total Transactions</span>
              <div className="p-2 rounded-xl bg-blue-500/10 text-blue-400">
                <CreditCard className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl font-black font-mono text-foreground mt-2">
              {subscriptions.length}
            </div>
            <p className="text-[11px] text-muted-foreground mt-1">Payment logs in Supabase</p>
          </div>
        </div>

        {/* Manual Pro Activation Tool */}
        <div className="p-5 rounded-2xl bg-card/60 border border-purple-500/30 space-y-3">
          <div>
            <h3 className="text-base font-bold text-foreground flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-yellow-400" /> Manually Grant 30-Day Pro Subscription
            </h3>
            <p className="text-xs text-muted-foreground">
              Grant immediate Pro access to any user by their Supabase User ID (bypasses Razorpay for VIPs/testers).
            </p>
          </div>

          <form onSubmit={handleManualGrant} className="flex flex-col sm:flex-row gap-2 max-w-xl">
            <Input
              type="text"
              placeholder="Paste Supabase User UUID (e.g. 748b991b-...)"
              value={manualUserId}
              onChange={(e) => setManualUserId(e.target.value)}
              className="bg-background/60 border-border text-xs font-mono"
            />
            <Button
              type="submit"
              disabled={granting || !manualUserId.trim()}
              className="bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold shrink-0"
            >
              {granting ? <Loader2 className="w-3.5 h-3.5 animate-spin mr-1" /> : <Plus className="w-3.5 h-3.5 mr-1" />}
              Grant Pro
            </Button>
          </form>
        </div>

        {/* Subscriptions Table */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-foreground flex items-center gap-2">
              <CreditCard className="w-4 h-4 text-purple-400" />
              User Subscriptions & Razorpay Transactions
            </h3>
            <span className="text-xs font-mono text-muted-foreground">{subscriptions.length} records</span>
          </div>

          <div className="overflow-x-auto rounded-2xl border border-border/80 bg-card/50">
            <table className="w-full text-left text-xs">
              <thead className="bg-muted/40 text-muted-foreground border-b border-border/80 uppercase font-mono text-[10px]">
                <tr>
                  <th className="p-3.5">User ID</th>
                  <th className="p-3.5">Razorpay Payment ID</th>
                  <th className="p-3.5">Amount</th>
                  <th className="p-3.5">Status</th>
                  <th className="p-3.5">Paid At</th>
                  <th className="p-3.5">Expires At</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {subscriptions.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="p-8 text-center text-muted-foreground">
                      No subscriptions logged yet. As users upgrade via Razorpay, they will appear here.
                    </td>
                  </tr>
                ) : (
                  subscriptions.map((sub) => (
                    <tr key={sub.id} className="hover:bg-muted/30 font-mono">
                      <td className="p-3.5 max-w-[140px] truncate text-foreground" title={sub.user_id}>
                        {sub.user_id}
                      </td>
                      <td className="p-3.5 text-purple-400">
                        {sub.razorpay_payment_id || 'N/A'}
                      </td>
                      <td className="p-3.5 font-bold text-foreground">
                        ₹{(sub.amount_paise / 100).toFixed(0)}
                      </td>
                      <td className="p-3.5">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            sub.status === 'active'
                              ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                              : 'bg-muted text-muted-foreground'
                          }`}
                        >
                          {sub.status}
                        </span>
                      </td>
                      <td className="p-3.5 text-muted-foreground">
                        {sub.paid_at ? new Date(sub.paid_at).toLocaleDateString() : '—'}
                      </td>
                      <td className="p-3.5 text-muted-foreground">
                        {sub.expires_at ? new Date(sub.expires_at).toLocaleDateString() : '—'}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Recent Meals Feed */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-foreground flex items-center gap-2">
              <Utensils className="w-4 h-4 text-orange-400" />
              Latest Meals Logged Across Platform
            </h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {recentMeals.map((meal) => (
              <div key={meal.id} className="p-3.5 rounded-xl bg-card/60 border border-border/70 text-xs space-y-1">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-foreground truncate">{meal.meal_name}</span>
                  <span className={`text-[10px] px-1.5 py-0.2 rounded font-semibold ${
                    meal.source === 'ai_scan' ? 'bg-purple-500/20 text-purple-300' : 'bg-muted text-muted-foreground'
                  }`}>
                    {meal.source === 'ai_scan' ? 'AI' : 'Manual'}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-muted-foreground text-[11px] font-mono">
                  <span>{meal.calories_kcal} kcal</span> · <span>{meal.protein_g}g P</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
