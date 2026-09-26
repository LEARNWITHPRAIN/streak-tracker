import React, { useState, useEffect, useCallback } from 'react';
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
  ArrowLeft,
  Sparkles,
  Loader2,
  Lock,
  Plus,
  Mail,
  RefreshCw,
  Search,
  CheckCircle2,
  Clock,
  XCircle,
  AlertCircle,
  Chrome,
  UserCheck,
  Calendar,
  Activity,
  TrendingUp,
  Timer,
} from 'lucide-react';
import { toast } from 'sonner';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string;

// ── Types ─────────────────────────────────────────────────────────────────────

interface AdminUser {
  id: string;
  email: string | null;
  created_at: string;
  last_sign_in_at: string | null;
  confirmed_at: string | null;
  provider: string;
  sub_status: string | null;
  sub_created_at: string | null;
  trial_start: string | null;
  trial_end: string | null;
  current_period_start: string | null;
  current_period_end: string | null;
  cancel_at_period_end: boolean;
  expires_at: string | null;
  amount: number | null;
  provider_subscription_id: string | null;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function fmt(dateStr: string | null, opts?: Intl.DateTimeFormatOptions) {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    ...opts,
  });
}

function timeAgo(dateStr: string | null): string {
  if (!dateStr) return 'Never';
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  const months = Math.floor(days / 30);
  return `${months}mo ago`;
}

function StatusBadge({ status }: { status: string | null }) {
  if (!status) {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-muted/60 text-muted-foreground border border-border/60">
        <XCircle className="w-2.5 h-2.5" /> No plan
      </span>
    );
  }

  const map: Record<string, { label: string; cls: string; icon: React.ReactNode }> = {
    active: {
      label: 'Active',
      cls: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
      icon: <CheckCircle2 className="w-2.5 h-2.5" />,
    },
    trialing: {
      label: 'Trial',
      cls: 'bg-amber-500/15 text-amber-400 border-amber-500/30',
      icon: <Timer className="w-2.5 h-2.5" />,
    },
    pending: {
      label: 'Pending',
      cls: 'bg-blue-500/15 text-blue-400 border-blue-500/30',
      icon: <Clock className="w-2.5 h-2.5" />,
    },
    cancelled: {
      label: 'Cancelled',
      cls: 'bg-rose-500/15 text-rose-400 border-rose-500/30',
      icon: <XCircle className="w-2.5 h-2.5" />,
    },
    expired: {
      label: 'Expired',
      cls: 'bg-muted/80 text-muted-foreground border-border/60',
      icon: <AlertCircle className="w-2.5 h-2.5" />,
    },
    halted: {
      label: 'Halted',
      cls: 'bg-orange-500/15 text-orange-400 border-orange-500/30',
      icon: <AlertCircle className="w-2.5 h-2.5" />,
    },
    past_due: {
      label: 'Past Due',
      cls: 'bg-rose-500/15 text-rose-400 border-rose-500/30',
      icon: <AlertCircle className="w-2.5 h-2.5" />,
    },
    authenticated: {
      label: 'Auth\'d',
      cls: 'bg-purple-500/15 text-purple-400 border-purple-500/30',
      icon: <CheckCircle2 className="w-2.5 h-2.5" />,
    },
  };

  const cfg = map[status] ?? {
    label: status,
    cls: 'bg-muted text-muted-foreground border-border/60',
    icon: <AlertCircle className="w-2.5 h-2.5" />,
  };

  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border ${cfg.cls}`}>
      {cfg.icon} {cfg.label}
    </span>
  );
}

// ── Component ─────────────────────────────────────────────────────────────────

export const AdminDashboard: React.FC = () => {
  const { user, session } = useAuth();
  const { isAdmin, loading: authLoading } = useSubscription();
  const navigate = useNavigate();

  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<'all' | 'trial' | 'active' | 'none'>('all');
  const [lastRefreshed, setLastRefreshed] = useState<Date | null>(null);

  // Grant access form
  const [manualEmail, setManualEmail] = useState('');
  const [granting, setGranting] = useState(false);

  // ── Fetch users from edge function ──────────────────────────────────────
  const fetchUsers = useCallback(async () => {
    if (!session) return;
    setLoadingUsers(true);
    try {
      const res = await fetch(`${SUPABASE_URL}/functions/v1/admin-users`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'apikey': SUPABASE_ANON_KEY,
          'Content-Type': 'application/json',
        },
      });

      if (!res.ok) {
        const err = await res.json();
        toast.error(`Failed to load users: ${err.error ?? res.status}`);
        return;
      }

      const data = await res.json();
      setUsers(data.users ?? []);
      setLastRefreshed(new Date());
    } catch (e: any) {
      toast.error(`Network error: ${e.message}`);
    } finally {
      setLoadingUsers(false);
    }
  }, [session]);

  useEffect(() => {
    if (!authLoading && isAdmin) fetchUsers();
    if (!authLoading && !isAdmin) setLoadingUsers(false);
  }, [isAdmin, authLoading, fetchUsers]);

  // ── Grant Pro access ─────────────────────────────────────────────────────
  const handleGrant = async (e: React.FormEvent) => {
    e.preventDefault();
    const targetEmail = manualEmail.trim().toLowerCase();
    if (!targetEmail.includes('@')) {
      toast.error('Please enter a valid email address');
      return;
    }
    setGranting(true);
    try {
      const expiry = new Date();
      expiry.setDate(expiry.getDate() + 30);

      const { data: existingSub } = await supabase
        .from('user_subscriptions')
        .select('id, user_id')
        .eq('user_email', targetEmail)
        .maybeSingle();

      const payload: any = {
        user_email: targetEmail,
        status: 'active',
        amount: 14900,
        paid_at: new Date().toISOString(),
        expires_at: expiry.toISOString(),
        updated_at: new Date().toISOString(),
      };

      if (existingSub?.id) {
        payload.id = existingSub.id;
        if (existingSub.user_id) payload.user_id = existingSub.user_id;
      }

      const { error } = await supabase.from('user_subscriptions').upsert(payload);
      if (error) throw error;

      toast.success(`🎉 Granted 30-Day Pro to ${targetEmail}!`);
      setManualEmail('');
      await fetchUsers();
    } catch (err: any) {
      toast.error(`Failed: ${err.message}`);
    } finally {
      setGranting(false);
    }
  };

  // ── Derived stats ─────────────────────────────────────────────────────────
  const totalUsers = users.length;
  const activeCount = users.filter((u) => u.sub_status === 'active').length;
  const trialCount = users.filter((u) => u.sub_status === 'trialing').length;
  const noSubCount = users.filter((u) => !u.sub_status).length;
  const revenueINR = users
    .filter((u) => u.sub_status === 'active')
    .reduce((s, u) => s + (u.amount ? u.amount / 100 : 0), 0);

  // Filter + search
  const visible = users.filter((u) => {
    const matchSearch =
      !search ||
      u.email?.toLowerCase().includes(search.toLowerCase()) ||
      u.id.includes(search);

    const matchFilter =
      filter === 'all' ||
      (filter === 'active' && u.sub_status === 'active') ||
      (filter === 'trial' && u.sub_status === 'trialing') ||
      (filter === 'none' && !u.sub_status);

    return matchSearch && matchFilter;
  });

  // ── Auth guard ────────────────────────────────────────────────────────────
  if (authLoading || (isAdmin && loadingUsers && users.length === 0)) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
        <Loader2 className="w-8 h-8 text-primary animate-spin mb-3" />
        <p className="text-sm text-muted-foreground font-mono">Loading admin data…</p>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4 text-center">
        <div className="p-4 rounded-full bg-destructive/15 border border-destructive/30 text-destructive mb-4">
          <Lock className="w-8 h-8" />
        </div>
        <h1 className="text-xl font-bold text-foreground mb-2">Access Denied</h1>
        <p className="text-sm text-muted-foreground max-w-sm mb-6">
          This portal is reserved for Yodha Mode administrators.
        </p>
        <Button onClick={() => navigate('/dashboard')} variant="outline" className="rounded-xl border-border">
          <ArrowLeft className="w-4 h-4 mr-2" /> Return to Dashboard
        </Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground py-8 px-4 sm:px-6">
      <div className="max-w-7xl mx-auto space-y-7">

        {/* ── Header ── */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-6 border-b border-border/60">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-2xl bg-gradient-to-br from-orange-500 to-amber-600 text-white shadow-lg shadow-orange-500/25">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-2xl font-black tracking-tight">Yodha Admin</h1>
                <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-primary/15 text-primary border border-primary/30">
                  ROOT ACCESS
                </span>
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">
                Signed in as <span className="text-primary font-mono font-semibold">{user?.email}</span>
                {lastRefreshed && (
                  <span className="ml-2 opacity-60">· refreshed {timeAgo(lastRefreshed.toISOString())}</span>
                )}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={fetchUsers}
              disabled={loadingUsers}
              className="rounded-xl border-border/80 hover:border-primary/50 gap-1.5"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loadingUsers ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate('/dashboard')}
              className="rounded-xl border-border/80 hover:border-primary/50"
            >
              <ArrowLeft className="w-4 h-4 mr-1" /> Back
            </Button>
          </div>
        </div>

        {/* ── Metric cards ── */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            {
              label: 'Total Users',
              value: totalUsers,
              sub: 'All signups',
              icon: <Users className="w-4 h-4" />,
              color: 'text-blue-400',
              bg: 'bg-blue-500/15',
            },
            {
              label: 'Active Subscribers',
              value: activeCount,
              sub: '₹149/mo plan',
              icon: <CheckCircle2 className="w-4 h-4" />,
              color: 'text-emerald-400',
              bg: 'bg-emerald-500/15',
            },
            {
              label: 'On Free Trial',
              value: trialCount,
              sub: '7-day trial',
              icon: <Timer className="w-4 h-4" />,
              color: 'text-amber-400',
              bg: 'bg-amber-500/15',
            },
            {
              label: 'Revenue (Active)',
              value: `₹${Math.round(revenueINR).toLocaleString('en-IN')}`,
              sub: 'From active subs',
              icon: <TrendingUp className="w-4 h-4" />,
              color: 'text-primary',
              bg: 'bg-primary/15',
            },
          ].map((m) => (
            <div
              key={m.label}
              className="p-4 rounded-2xl bg-card/60 border border-border/70 flex flex-col gap-2"
            >
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">{m.label}</span>
                <div className={`p-1.5 rounded-lg ${m.bg} ${m.color}`}>{m.icon}</div>
              </div>
              <div className={`text-2xl font-black font-mono ${m.color}`}>{m.value}</div>
              <p className="text-[10px] text-muted-foreground">{m.sub}</p>
            </div>
          ))}
        </div>

        {/* ── Grant Pro access ── */}
        <div className="p-5 rounded-2xl bg-card/60 border border-primary/25 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-40 h-40 bg-primary/8 rounded-full blur-3xl pointer-events-none" />
          <h3 className="text-sm font-bold text-foreground flex items-center gap-2 mb-1">
            <Sparkles className="w-4 h-4 text-primary" /> Grant 30-Day Pro Access
          </h3>
          <p className="text-[11px] text-muted-foreground mb-3">
            Instantly grant Pro without Razorpay checkout.
          </p>
          <form onSubmit={handleGrant} className="flex flex-col sm:flex-row gap-2 max-w-xl">
            <div className="relative flex-1">
              <Mail className="w-4 h-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
              <Input
                type="email"
                placeholder="user@example.com"
                value={manualEmail}
                onChange={(e) => setManualEmail(e.target.value)}
                required
                className="pl-9 bg-background/70 border-border text-xs font-mono h-9 rounded-xl"
              />
            </div>
            <Button
              type="submit"
              disabled={granting || !manualEmail.trim()}
              className="bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-bold h-9 px-5 rounded-xl shadow-md shadow-primary/20 shrink-0"
            >
              {granting ? <Loader2 className="w-3.5 h-3.5 animate-spin mr-1" /> : <Plus className="w-3.5 h-3.5 mr-1" />}
              Grant Access
            </Button>
          </form>
        </div>

        {/* ── Users Table ── */}
        <div className="space-y-3">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <h3 className="text-base font-bold flex items-center gap-2">
              <Users className="w-4 h-4 text-primary" />
              All Users
              <span className="text-xs font-mono text-muted-foreground">({visible.length} shown)</span>
            </h3>

            <div className="flex items-center gap-2 flex-wrap">
              {/* Search */}
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
                <Input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search email…"
                  className="pl-8 h-8 text-xs rounded-xl bg-background/70 border-border w-48"
                />
              </div>

              {/* Filter pills */}
              {(['all', 'active', 'trial', 'none'] as const).map((f) => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className={`px-3 h-8 rounded-xl text-xs font-semibold border transition-all ${
                    filter === f
                      ? 'bg-primary/20 border-primary/50 text-primary'
                      : 'bg-muted/40 border-border/60 text-muted-foreground hover:border-primary/30'
                  }`}
                >
                  {f === 'all' ? 'All' : f === 'active' ? 'Active' : f === 'trial' ? 'Trial' : 'No Plan'}
                </button>
              ))}
            </div>
          </div>

          <div className="overflow-x-auto rounded-2xl border border-border/70 bg-card/40">
            <table className="w-full text-left text-xs min-w-[900px]">
              <thead className="bg-muted/30 text-muted-foreground border-b border-border/70 uppercase font-mono text-[10px]">
                <tr>
                  <th className="p-3.5 pl-4">User</th>
                  <th className="p-3.5">Signed Up</th>
                  <th className="p-3.5">Last Login</th>
                  <th className="p-3.5">Provider</th>
                  <th className="p-3.5">Plan Status</th>
                  <th className="p-3.5">Trial Window</th>
                  <th className="p-3.5">Billing Period</th>
                  <th className="p-3.5 pr-4">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/40">
                {loadingUsers ? (
                  <tr>
                    <td colSpan={8} className="p-10 text-center text-muted-foreground">
                      <Loader2 className="w-5 h-5 animate-spin mx-auto mb-2" />
                      Fetching users…
                    </td>
                  </tr>
                ) : visible.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="p-10 text-center text-muted-foreground">
                      No users match your filter.
                    </td>
                  </tr>
                ) : (
                  visible.map((u) => {
                    const isActive = u.sub_status === 'active';
                    const isTrial = u.sub_status === 'trialing';
                    const trialExpired = u.trial_end ? new Date(u.trial_end) < new Date() : false;

                    return (
                      <tr
                        key={u.id}
                        className={`hover:bg-muted/20 transition-colors ${
                          isActive ? 'bg-emerald-500/[0.03]' : isTrial ? 'bg-amber-500/[0.03]' : ''
                        }`}
                      >
                        {/* User email */}
                        <td className="p-3.5 pl-4">
                          <div className="flex items-center gap-2">
                            <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[9px] font-black shrink-0 ${
                              isActive ? 'bg-emerald-500/20 text-emerald-400' :
                              isTrial ? 'bg-amber-500/20 text-amber-400' :
                              'bg-muted text-muted-foreground'
                            }`}>
                              {(u.email?.[0] ?? '?').toUpperCase()}
                            </div>
                            <div>
                              <div className="font-semibold text-foreground truncate max-w-[180px]" title={u.email ?? ''}>
                                {u.email ?? <span className="text-muted-foreground italic">no email</span>}
                              </div>
                              <div className="text-[9px] text-muted-foreground font-mono truncate max-w-[180px]">{u.id}</div>
                            </div>
                          </div>
                        </td>

                        {/* Signed up */}
                        <td className="p-3.5">
                          <div className="text-foreground/80">{fmt(u.created_at, { day: '2-digit', month: 'short', year: 'numeric', hour: undefined, minute: undefined })}</div>
                          <div className="text-[10px] text-muted-foreground">{timeAgo(u.created_at)}</div>
                        </td>

                        {/* Last login */}
                        <td className="p-3.5">
                          {u.last_sign_in_at ? (
                            <>
                              <div className="text-foreground/80">{fmt(u.last_sign_in_at, { day: '2-digit', month: 'short', year: 'numeric', hour: undefined, minute: undefined })}</div>
                              <div className="text-[10px] text-muted-foreground">{timeAgo(u.last_sign_in_at)}</div>
                            </>
                          ) : (
                            <span className="text-muted-foreground">Never</span>
                          )}
                        </td>

                        {/* Auth provider */}
                        <td className="p-3.5">
                          <span className="inline-flex items-center gap-1 text-muted-foreground">
                            {u.provider === 'google' ? (
                              <Chrome className="w-3 h-3 text-blue-400" />
                            ) : (
                              <Mail className="w-3 h-3 text-orange-400" />
                            )}
                            {u.provider}
                          </span>
                        </td>

                        {/* Plan status */}
                        <td className="p-3.5">
                          <StatusBadge status={u.sub_status} />
                          {u.cancel_at_period_end && (
                            <div className="text-[9px] text-rose-400 mt-1">cancels at period end</div>
                          )}
                        </td>

                        {/* Trial window */}
                        <td className="p-3.5">
                          {u.trial_start ? (
                            <div>
                              <div className="text-foreground/70 text-[11px]">
                                {fmt(u.trial_start, { day: '2-digit', month: 'short', hour: undefined, minute: undefined })}
                                {' → '}
                                {fmt(u.trial_end, { day: '2-digit', month: 'short', hour: undefined, minute: undefined })}
                              </div>
                              {u.trial_end && (
                                <div className={`text-[9px] mt-0.5 ${trialExpired ? 'text-rose-400' : 'text-amber-400'}`}>
                                  {trialExpired ? 'ended' : `ends ${timeAgo(u.trial_end)}`}
                                </div>
                              )}
                            </div>
                          ) : (
                            <span className="text-muted-foreground">—</span>
                          )}
                        </td>

                        {/* Billing period */}
                        <td className="p-3.5">
                          {u.current_period_start ? (
                            <div className="text-foreground/70 text-[11px]">
                              {fmt(u.current_period_start, { day: '2-digit', month: 'short', hour: undefined, minute: undefined })}
                              {' → '}
                              {fmt(u.current_period_end, { day: '2-digit', month: 'short', hour: undefined, minute: undefined })}
                            </div>
                          ) : (
                            <span className="text-muted-foreground">—</span>
                          )}
                        </td>

                        {/* Amount */}
                        <td className="p-3.5 pr-4">
                          {u.amount ? (
                            <span className="font-bold text-foreground">
                              ₹{(u.amount / 100).toFixed(0)}
                            </span>
                          ) : (
                            <span className="text-muted-foreground">—</span>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Table footer summary */}
          <div className="flex items-center justify-between text-[11px] text-muted-foreground px-1">
            <span>{totalUsers} total users · {activeCount} active · {trialCount} on trial · {noSubCount} no plan</span>
            <span className="font-mono">MRR ≈ ₹{Math.round(activeCount * 149).toLocaleString('en-IN')}</span>
          </div>
        </div>

      </div>
    </div>
  );
};

export default AdminDashboard;
