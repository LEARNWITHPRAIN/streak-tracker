import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Footer } from '@/components/Footer';
import yodhaLogo from '@/assets/yodha-logo.jpg';
import { Dumbbell, Timer, Music2, Flame, Calendar, Zap, ArrowRight } from 'lucide-react';

const features = [
  {
    icon: <Dumbbell className="w-5 h-5" />,
    title: 'Custom Routines',
    desc: 'Build and track your own workout routines with sets, reps, and progress.',
  },
  {
    icon: <Timer className="w-5 h-5" />,
    title: 'Auto Rest Timer',
    desc: 'Timer starts automatically when you complete a set — no interruptions.',
  },
  {
    icon: <Music2 className="w-5 h-5" />,
    title: 'Workout Music',
    desc: 'Play your local audio files while training, right inside the app.',
  },
  {
    icon: <Flame className="w-5 h-5" />,
    title: 'Daily Progress',
    desc: 'Visual completion % circle and streak counter to keep you motivated.',
  },
  {
    icon: <Calendar className="w-5 h-5" />,
    title: 'Calendar History',
    desc: 'Track your consistency with a full monthly workout calendar.',
  },
  {
    icon: <Zap className="w-5 h-5" />,
    title: 'Fuel / Motivation',
    desc: 'Save YouTube & Instagram Reels to replay your favourite motivation clips.',
  },
];

const Welcome = () => {
  const navigate = useNavigate();
  const { user, loading } = useAuth();

  useEffect(() => {
    if (!loading && user) {
      navigate('/dashboard');
    }
  }, [user, loading, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">

      {/* ── HERO ── */}
      <section
        className="relative w-full min-h-screen flex items-center justify-center overflow-hidden"
        style={{ minHeight: '100svh' }}
      >
        {/* Full-bleed background image */}
        <img
          src={yodhaLogo}
          alt="Yodha warrior at sunset"
          className="absolute inset-0 w-full h-full object-cover object-center"
          draggable={false}
        />

        {/* Gradient overlay — darker on right so text is readable */}
        <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/60 to-black/30 md:from-black/85 md:via-black/55 md:to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-black/20" />

        {/* Content */}
        <div className="relative z-10 w-full max-w-7xl mx-auto px-6 sm:px-10 lg:px-16 flex flex-col md:flex-row items-center md:items-end justify-start gap-10 py-20">

          {/* Left column — main CTA */}
          <div className="w-full md:max-w-xl space-y-7 text-left">
            {/* Badge */}
            <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-semibold bg-primary/20 border border-primary/40 text-primary backdrop-blur-sm">
              <Flame className="w-3.5 h-3.5 animate-pulse" />
              Your Personal Workout Tracker
            </span>

            {/* Headline */}
            <div className="space-y-3">
              <h1 className="text-5xl md:text-6xl lg:text-7xl font-extrabold text-white tracking-tight leading-[1.05]">
                Yodha<br />
                <span className="text-primary" style={{ textShadow: '0 0 40px hsl(var(--primary)/0.6)' }}>
                  Mode
                </span>
              </h1>
              <p className="text-xl md:text-2xl text-white/80 font-medium leading-snug">
                Master Your Routine. Build Your Strongest Self.
              </p>
              <p className="text-sm md:text-base text-white/60 max-w-md leading-relaxed">
                Custom routines · Automatic rest timers · Workout music · Daily progress tracking — all in one place.
              </p>
            </div>

            {/* Buttons */}
            <div className="flex flex-col sm:flex-row gap-3.5 pt-2">
              <Button
                onClick={() => navigate('/auth?mode=signup')}
                size="lg"
                className="group relative h-13 px-8 text-base font-semibold text-primary-foreground bg-primary hover:bg-primary/90 shadow-xl shadow-primary/25 hover:shadow-primary/40 hover:-translate-y-0.5 active:translate-y-0 transition-all duration-200 rounded-xl overflow-hidden"
              >
                <span className="flex items-center gap-2">
                  <span>Get Started Free</span>
                  <ArrowRight className="w-4 h-4 transition-transform duration-200 group-hover:translate-x-1" />
                </span>
              </Button>
              <Button
                onClick={() => navigate('/auth?mode=login')}
                variant="outline"
                size="lg"
                className="h-13 px-8 text-base font-medium bg-white/5 hover:bg-white/10 text-white border-white/20 hover:border-white/35 backdrop-blur-md hover:-translate-y-0.5 active:translate-y-0 transition-all duration-200 rounded-xl"
              >
                Log In
              </Button>
            </div>

            <p className="text-xs text-white/50 flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block" />
              Free forever · No credit card required
            </p>
          </div>
        </div>

        {/* Scroll hint */}
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-10 flex flex-col items-center gap-1 opacity-50 animate-bounce">
          <div className="w-0.5 h-8 bg-white/60 rounded-full" />
        </div>
      </section>

      {/* ── FEATURES ── */}
      <section className="w-full bg-background py-20 px-6 sm:px-10 lg:px-16">
        <div className="max-w-7xl mx-auto space-y-12">
          <div className="text-center space-y-3">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground">
              Everything you need to train smarter
            </h2>
            <p className="text-muted-foreground max-w-xl mx-auto text-base">
              Yodha Mode combines all your workout essentials into one powerful, distraction-free app.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {features.map((f) => (
              <div
                key={f.title}
                className="group p-6 rounded-2xl border border-border/60 bg-card/60 hover:bg-card hover:border-primary/40 hover:shadow-lg hover:shadow-primary/10 transition-all duration-300 backdrop-blur-sm"
              >
                <div className="w-10 h-10 rounded-xl bg-primary/15 text-primary flex items-center justify-center mb-4 group-hover:bg-primary/25 transition-colors">
                  {f.icon}
                </div>
                <h3 className="font-bold text-base text-foreground mb-1.5">{f.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── SEO TEXT SECTION ── */}
      <section className="w-full bg-muted/20 py-16 px-6 sm:px-10 lg:px-16 border-t border-border/40">
        <div className="max-w-4xl mx-auto grid sm:grid-cols-2 gap-8 text-sm leading-relaxed text-muted-foreground">
          <div>
            <h2 className="text-base font-semibold text-foreground mb-2">Create Custom Workout Routines</h2>
            <p>Build routines that fit your goals. Add exercises, organize your training, and design a personalized plan — bodyweight, calisthenics, strength, or anything you like.</p>
          </div>
          <div>
            <h2 className="text-base font-semibold text-foreground mb-2">Automatic Workout Timer</h2>
            <p>Focus on your workout, not the clock. Yodha Mode auto-starts your rest timer after each set and alerts you when it's time for the next one.</p>
          </div>
          <div>
            <h2 className="text-base font-semibold text-foreground mb-2">Track Your Daily Progress</h2>
            <p>Use the workout calendar to monitor your exercise consistency and see how much of your planned workout you complete each day.</p>
          </div>
          <div>
            <h2 className="text-base font-semibold text-foreground mb-2">Listen to Your Own Music</h2>
            <p>Upload your audio files and listen to your favourite songs while training — create the perfect workout atmosphere without switching apps.</p>
          </div>
          <div>
            <h2 className="text-base font-semibold text-foreground mb-2">Fuel Your Motivation</h2>
            <p>Save your favourite motivational Instagram Reels and YouTube Shorts. When you need a boost, revisit the content that inspires you most.</p>
          </div>
          <div>
            <h2 className="text-base font-semibold text-foreground mb-2">Complete Workout Journey</h2>
            <p>Exercises, custom routines, workout completion, daily consistency, and overall progress — all organized in one place with Yodha Mode.</p>
          </div>
        </div>
      </section>

      {/* ── FINAL CTA ── */}
      <section className="w-full py-16 px-6 text-center bg-background border-t border-border/40">
        <div className="max-w-lg mx-auto space-y-5">
          <h2 className="text-2xl md:text-3xl font-bold text-foreground">Ready to become a Yodha?</h2>
          <p className="text-muted-foreground text-sm">Join and start tracking your workouts today. Free, no credit card needed.</p>
          <Button
            onClick={() => navigate('/auth?mode=signup')}
            size="lg"
            className="group px-9 h-12 text-base font-semibold text-primary-foreground bg-primary hover:bg-primary/90 shadow-xl shadow-primary/25 hover:shadow-primary/40 hover:-translate-y-0.5 active:translate-y-0 transition-all duration-200 rounded-xl"
          >
            <span className="flex items-center gap-2">
              <span>Start Training Now</span>
              <ArrowRight className="w-4 h-4 transition-transform duration-200 group-hover:translate-x-1" />
            </span>
          </Button>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Welcome;
