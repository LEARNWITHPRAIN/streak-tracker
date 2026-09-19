import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSubscription } from '@/hooks/useSubscription';
import { useAuth } from '@/contexts/AuthContext';
import {
  Dumbbell, Music2, Calendar, Play, Check, Flame, Zap,
  TrendingUp, Shield, Star, ArrowRight, Loader2, LogOut, Clock
} from 'lucide-react';
import yodhaLogo from '@/assets/yodha-logo.jpg';

const benefits = [
  {
    icon: <TrendingUp className="w-6 h-6" />,
    title: 'Track Progressive Overload',
    desc: 'Log every set, rep, and weight. Watch your strength climb week over week with detailed history and progress charts.',
    color: 'from-orange-500/20 to-orange-600/5 border-orange-500/30',
    iconColor: 'text-orange-400',
  },
  {
    icon: <Music2 className="w-6 h-6" />,
    title: 'Workout Music Player',
    desc: 'Upload your own MP3 tracks and train to your favourite beats — no Spotify needed. Your music, your vibe.',
    color: 'from-purple-500/20 to-purple-600/5 border-purple-500/30',
    iconColor: 'text-purple-400',
  },
  {
    icon: <Calendar className="w-6 h-6" />,
    title: 'Workout Calendar & Streaks',
    desc: 'Build unbreakable habits with a monthly workout calendar, daily streak counter, and consistency heatmap.',
    color: 'from-blue-500/20 to-blue-600/5 border-blue-500/30',
    iconColor: 'text-blue-400',
  },
  {
    icon: <Play className="w-6 h-6" />,
    title: 'Motivational Videos',
    desc: 'Save your favourite YouTube Shorts and Instagram Reels directly in the app. Watch them when you need that extra push.',
    color: 'from-red-500/20 to-red-600/5 border-red-500/30',
    iconColor: 'text-red-400',
  },
];

const included = [
  'Unlimited workout routines & custom splits',
  'Set-by-set logging with progressive overload tracking',
  'Auto rest timer between sets',
  'Local music player (upload your own tracks)',
  'YouTube & Instagram motivation feed',
  'Monthly calendar & streak counter',
  'AI workout insights',
  'Cancel anytime',
];

interface SubscriptionPageProps {
  isExpired?: boolean;
}

const SubscriptionPage: React.FC<SubscriptionPageProps> = ({ isExpired = false }) => {
  const { startTrial, initiatePayment, loading } = useSubscription();
  const { signOut, user } = useAuth();
  const navigate = useNavigate();
  const [actionLoading, setActionLoading] = useState(false);

  const handleStartTrial = async () => {
    setActionLoading(true);
    await startTrial();
    setActionLoading(false);
    navigate('/dashboard');
  };

  const handleSubscribe = async () => {
    setActionLoading(true);
    await initiatePayment();
    setActionLoading(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#09090b] flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-orange-500" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#09090b] text-white overflow-x-hidden">
      {/* Ambient glow backgrounds */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[-20%] left-[-10%] w-[60vw] h-[60vw] bg-orange-500/10 rounded-full blur-[120px]" />
        <div className="absolute bottom-[-20%] right-[-10%] w-[50vw] h-[50vw] bg-purple-500/8 rounded-full blur-[100px]" />
      </div>

      {/* Top bar */}
      <div className="relative z-10 flex items-center justify-between px-6 py-4 border-b border-white/5">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full overflow-hidden ring-2 ring-orange-500/50 shadow-lg shadow-orange-500/20">
            <img src={yodhaLogo} alt="Yodha Mode" className="w-full h-full object-cover" />
          </div>
          <span className="font-bold tracking-wider text-sm text-orange-400 uppercase">Yodha Mode</span>
        </div>
        <button
          onClick={signOut}
          className="flex items-center gap-1.5 text-xs text-white/40 hover:text-white/70 transition-colors"
        >
          <LogOut className="w-3.5 h-3.5" />
          Sign out
        </button>
      </div>

      <div className="relative z-10 max-w-6xl mx-auto px-5 py-10 sm:py-16">

        {/* Hero */}
        <div className="text-center space-y-4 mb-14">
          {isExpired ? (
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-semibold bg-red-500/15 border border-red-500/30 text-red-400 mb-2">
              <Clock className="w-3.5 h-3.5" />
              Your trial has ended — subscribe to continue
            </div>
          ) : (
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-semibold bg-orange-500/15 border border-orange-500/30 text-orange-400 mb-2">
              <Flame className="w-3.5 h-3.5 animate-pulse" />
              Welcome, {user?.email?.split('@')[0]}! Your private gym awaits.
            </div>
          )}

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight leading-[1.1]">
            Your Personal Gym.<br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-400 via-orange-500 to-red-500">
              In Your Pocket.
            </span>
          </h1>

          <p className="text-white/60 text-lg sm:text-xl max-w-xl mx-auto leading-relaxed">
            Everything a serious gym-goer needs — workout tracking, music, motivation, and progress — all in one powerful app.
          </p>

          <div className="flex items-center justify-center gap-3 text-sm text-white/40 pt-2">
            <div className="flex -space-x-2">
              {['💪', '🔥', '⚡', '🏆', '🎯'].map((emoji, i) => (
                <div key={i} className="w-8 h-8 rounded-full bg-white/10 border border-white/20 flex items-center justify-center text-sm">
                  {emoji}
                </div>
              ))}
            </div>
            <span>Join <strong className="text-white/70">1,000+ warriors</strong> already crushing their goals</span>
          </div>
        </div>

        {/* Main layout: Benefits + Pricing Card */}
        <div className="grid lg:grid-cols-2 gap-8 lg:gap-12 items-start">

          {/* Left: Benefits */}
          <div className="space-y-4">
            <p className="text-xs font-bold uppercase tracking-wider text-white/30 mb-5">What you get</p>
            {benefits.map((b) => (
              <div
                key={b.title}
                className={`flex items-start gap-4 p-5 rounded-2xl bg-gradient-to-br border ${b.color} backdrop-blur-sm transition-all duration-300 hover:scale-[1.01]`}
              >
                <div className={`mt-0.5 shrink-0 ${b.iconColor}`}>
                  {b.icon}
                </div>
                <div>
                  <h3 className="font-bold text-base text-white mb-1">{b.title}</h3>
                  <p className="text-sm text-white/55 leading-relaxed">{b.desc}</p>
                </div>
              </div>
            ))}

            {/* Social proof */}
            <div className="flex items-center gap-2 pt-4 px-2">
              <div className="flex">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                ))}
              </div>
              <span className="text-sm text-white/50">"The only workout app I've stuck with for over 3 months."</span>
            </div>
          </div>

          {/* Right: Pricing Card */}
          <div className="lg:sticky lg:top-8">
            <div className="relative rounded-3xl border border-orange-500/30 bg-gradient-to-b from-orange-500/10 via-[#111]/80 to-[#111]/90 p-7 sm:p-8 shadow-2xl shadow-orange-500/10 backdrop-blur-xl overflow-hidden">
              {/* Glow */}
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-3/4 h-px bg-gradient-to-r from-transparent via-orange-500/60 to-transparent" />
              
              {!isExpired ? (
                <>
                  {/* Trial badge */}
                  <div className="flex items-center justify-between mb-6">
                    <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-green-500/15 border border-green-500/30 text-green-400 text-xs font-bold">
                      <Zap className="w-3.5 h-3.5" />
                      7-Day Free Trial
                    </div>
                    <div className="flex items-center gap-1 text-white/30">
                      <Shield className="w-4 h-4" />
                      <span className="text-xs">No card required</span>
                    </div>
                  </div>

                  {/* Pricing */}
                  <div className="mb-6">
                    <div className="flex items-end gap-2 mb-1">
                      <span className="text-5xl font-black text-white">₹0</span>
                      <span className="text-white/40 mb-2 text-sm">for 7 days</span>
                    </div>
                    <p className="text-white/50 text-sm">
                      Then <strong className="text-white/80">₹149/month</strong> — less than a single protein shake.
                    </p>
                  </div>

                  {/* CTA */}
                  <button
                    onClick={handleStartTrial}
                    disabled={actionLoading}
                    className="w-full h-14 rounded-2xl bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-400 hover:to-orange-500 text-white font-bold text-base shadow-lg shadow-orange-500/30 hover:shadow-orange-500/50 hover:-translate-y-0.5 active:translate-y-0 transition-all duration-200 flex items-center justify-center gap-2 mb-4 disabled:opacity-70 disabled:cursor-not-allowed"
                  >
                    {actionLoading ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                      <>
                        <Flame className="w-5 h-5" />
                        Start My Free Trial
                        <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </button>

                  <p className="text-center text-xs text-white/30 mb-6">
                    No payment needed today. Cancel anytime.
                  </p>
                </>
              ) : (
                <>
                  {/* Expired state */}
                  <div className="flex items-center justify-between mb-6">
                    <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-orange-500/15 border border-orange-500/30 text-orange-400 text-xs font-bold">
                      <Flame className="w-3.5 h-3.5" />
                      Premium Access
                    </div>
                    <div className="flex items-center gap-1 text-white/30">
                      <Shield className="w-4 h-4" />
                      <span className="text-xs">Secure payment</span>
                    </div>
                  </div>

                  <div className="mb-6">
                    <div className="flex items-end gap-2 mb-1">
                      <span className="text-5xl font-black text-white">₹149</span>
                      <span className="text-white/40 mb-2 text-sm">/month</span>
                    </div>
                    <p className="text-white/50 text-sm">
                      Unlock everything. That's <strong className="text-white/80">₹5/day</strong> for your entire gym toolkit.
                    </p>
                  </div>

                  <button
                    onClick={handleSubscribe}
                    disabled={actionLoading}
                    className="w-full h-14 rounded-2xl bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-400 hover:to-orange-500 text-white font-bold text-base shadow-lg shadow-orange-500/30 hover:shadow-orange-500/50 hover:-translate-y-0.5 active:translate-y-0 transition-all duration-200 flex items-center justify-center gap-2 mb-4 disabled:opacity-70 disabled:cursor-not-allowed"
                  >
                    {actionLoading ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                      <>
                        <Zap className="w-5 h-5" />
                        Subscribe for ₹149/month
                        <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </button>

                  <p className="text-center text-xs text-white/30 mb-6">
                    Powered by Razorpay. Secure & encrypted.
                  </p>
                </>
              )}

              {/* What's included */}
              <div className="border-t border-white/10 pt-5">
                <p className="text-xs font-bold uppercase tracking-wider text-white/30 mb-4">Everything included</p>
                <ul className="space-y-2.5">
                  {included.map((item) => (
                    <li key={item} className="flex items-center gap-2.5 text-sm text-white/70">
                      <Check className="w-4 h-4 text-green-400 shrink-0" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>

              {/* Powered by Razorpay badge */}
              <div className="mt-6 flex items-center justify-center gap-2 text-xs text-white/20">
                <Shield className="w-3.5 h-3.5" />
                Secured by Razorpay · UPI · Cards · NetBanking
              </div>
            </div>

            {/* Extra trust signals */}
            <div className="grid grid-cols-3 gap-3 mt-4">
              {[
                { icon: '🔒', label: 'Safe Payment' },
                { icon: '⚡', label: 'Instant Access' },
                { icon: '❌', label: 'No Auto-charge' },
              ].map((t) => (
                <div key={t.label} className="flex flex-col items-center gap-1 p-3 rounded-xl bg-white/5 border border-white/10 text-center">
                  <span className="text-lg">{t.icon}</span>
                  <span className="text-[10px] text-white/40 font-medium">{t.label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Bottom comparison */}
        <div className="mt-16 text-center space-y-3">
          <p className="text-white/30 text-sm">
            For less than a <span className="text-white/50">cup of coffee</span>, get your complete workout partner.
          </p>
          <div className="flex justify-center gap-6 text-xs text-white/20">
            <span>Gym membership: ₹1,500/month</span>
            <span>•</span>
            <span>Personal trainer: ₹3,000/month</span>
            <span>•</span>
            <span className="text-orange-400/60 font-semibold">Yodha Mode: ₹149/month</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SubscriptionPage;
