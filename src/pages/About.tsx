import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Footer } from '@/components/Footer';
import { ArrowLeft, Dumbbell, Flame, Music, Video, Timer, Sparkles, User, Target, Layers, ExternalLink } from 'lucide-react';
import yodhaLogo from '@/assets/yodha-logo.jpg';

const About = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col justify-between">
      <div className="max-w-4xl mx-auto w-full px-6 py-10">
        {/* Navigation Header */}
        <div className="flex items-center justify-between mb-10">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors group"
          >
            <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
            <span className="font-medium">Back</span>
          </button>

          <button
            onClick={() => navigate('/')}
            className="flex items-center gap-2 font-bold text-foreground text-lg"
          >
            <img src={yodhaLogo} alt="Yodha Logo" className="w-7 h-7 rounded-lg" />
            <span>Yodha Mode</span>
          </button>
        </div>

        {/* Hero Section */}
        <div className="text-center space-y-4 mb-14">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/30 text-primary text-xs font-semibold uppercase tracking-wider">
            <Sparkles className="w-3.5 h-3.5" /> Story Behind Yodha Mode
          </div>
          <h1 className="text-4xl sm:text-5xl font-extrabold text-foreground tracking-tight">
            Built Out of Frustration. <br />
            <span className="text-primary text-glow">Designed for Ultimate Gym Focus.</span>
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            One platform that replaces app-switching chaos with a single, personalized workspace for your workout routines.
          </p>
        </div>

        {/* Story Card */}
        <div className="glass rounded-3xl p-8 sm:p-10 space-y-8 mb-12 border-primary/20 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl -z-10 pointer-events-none" />

          {/* Founder Badge */}
          <div className="flex items-center gap-4 border-b border-border/50 pb-6">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary to-orange-600 flex items-center justify-center text-primary-foreground font-bold text-2xl shadow-lg shadow-primary/20">
              PJ
            </div>
            <div>
              <h2 className="text-2xl font-bold text-foreground">Prakhar Jain</h2>
              <p className="text-sm text-primary font-medium flex items-center gap-1.5">
                <User className="w-4 h-4" /> Founder & Solo Creator • 20-Year-Old College Student
              </p>
            </div>
          </div>

          {/* Story Narrative */}
          <div className="space-y-6 text-foreground/90 leading-relaxed text-base">
            <p className="text-lg font-medium text-foreground">
              "Hey there! I’m Prakhar Jain — a 20-year-old college student who just wanted to stay consistent with my workouts."
            </p>
            <p>
              Like many lifters, I kept falling off my routine not because I lacked motivation, but because every single workout session felt like managing a chaotic digital dashboard across 4 different apps:
            </p>

            {/* Pain Points Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 py-2">
              <div className="p-4 rounded-xl bg-muted/40 border border-border/40 flex items-start gap-3">
                <Timer className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-semibold text-foreground text-sm">The Clock App</h4>
                  <p className="text-xs text-muted-foreground">Constantly switching screens to manually set rest timers between every set.</p>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-muted/40 border border-border/40 flex items-start gap-3">
                <Flame className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-semibold text-foreground text-sm">Habit Tracker Apps</h4>
                  <p className="text-xs text-muted-foreground">Tallying daily streaks that felt punitive whenever life got in the way.</p>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-muted/40 border border-border/40 flex items-start gap-3">
                <Music className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-semibold text-foreground text-sm">Separate Music Players</h4>
                  <p className="text-xs text-muted-foreground">Fiddling with offline audio files and playlists mid-session.</p>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-muted/40 border border-border/40 flex items-start gap-3">
                <Video className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-semibold text-foreground text-sm">Saved Instagram Clips</h4>
                  <p className="text-xs text-muted-foreground">Searching through saved Instagram reels & YouTube videos for form inspiration.</p>
                </div>
              </div>
            </div>

            <p>
              App switching was killing my workout intensity, taking my mind off the weights, and burning unnecessary mental energy. That's when I had a realization: <span className="text-foreground font-semibold">Why isn't there a single platform built specifically to bring all of this together in one personal workspace?</span>
            </p>

            <p>
              I decided to build <strong className="text-primary">Yodha Mode</strong> — a unified fitness tracking SaaS created from the ground up to solve this exact problem. It gives every lifter, student, and athlete a personalized space where workout completion heatmaps, offline music uploads, YouTube & Instagram video embeds, and auto rest timers seamlessly coexist.
            </p>
          </div>
        </div>

        {/* Core Pillars */}
        <div className="space-y-6 mb-12">
          <h2 className="text-2xl font-bold text-foreground text-center">What Yodha Mode Stands For</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="glass p-6 rounded-2xl space-y-3">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                <Target className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-foreground">Percentage-Based Progress</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Rather than binary streaks that break when you take a rest day, we track monthly percentage completion so you focus on long-term consistency.
              </p>
            </div>

            <div className="glass p-6 rounded-2xl space-y-3">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                <Layers className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-foreground">Zero App Switching</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Audio playback, video motivation guides, and zero-click rest timers are built directly into your set log.
              </p>
            </div>

            <div className="glass p-6 rounded-2xl space-y-3">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                <Dumbbell className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-foreground">Your Personalized Space</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Tailor your exercises, custom music library, and exercise clips to build a workout dashboard that feels 100% yours.
              </p>
            </div>
          </div>
        </div>

        {/* Social Media Section */}
        <div className="space-y-5 mb-12">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-foreground">Follow Yodha Mode</h2>
            <p className="text-sm text-muted-foreground mt-1">Get workout tips, motivation & updates</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* YouTube */}
            <a
              href="https://youtube.com/@yodha_mode?si=RJvEt_LTLetO92Le"
              target="_blank"
              rel="noopener noreferrer"
              className="glass p-5 rounded-2xl flex items-center gap-4 border border-border/40 hover:border-red-500/50 hover:bg-red-500/5 transition-all duration-300 group"
              style={{ textDecoration: 'none' }}
            >
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-red-500 to-red-700 flex items-center justify-center shadow-lg shadow-red-500/30 shrink-0 group-hover:scale-105 transition-transform">
                {/* YouTube icon */}
                <svg viewBox="0 0 24 24" className="w-7 h-7 fill-white">
                  <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
                </svg>
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-bold text-foreground text-base group-hover:text-red-400 transition-colors">@yodha_mode</p>
                <p className="text-xs text-muted-foreground mt-0.5">Workout clips & gym motivation</p>
              </div>
              <ExternalLink className="w-4 h-4 text-muted-foreground group-hover:text-red-400 transition-colors shrink-0" />
            </a>

            {/* Instagram */}
            <a
              href="https://www.instagram.com/yodha.mode"
              target="_blank"
              rel="noopener noreferrer"
              className="glass p-5 rounded-2xl flex items-center gap-4 border border-border/40 hover:border-pink-500/50 hover:bg-pink-500/5 transition-all duration-300 group"
              style={{ textDecoration: 'none' }}
            >
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-purple-500 via-pink-500 to-orange-400 flex items-center justify-center shadow-lg shadow-pink-500/30 shrink-0 group-hover:scale-105 transition-transform">
                {/* Instagram icon */}
                <svg viewBox="0 0 24 24" className="w-7 h-7 fill-white">
                  <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                </svg>
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-bold text-foreground text-base group-hover:text-pink-400 transition-colors">@yodha.mode</p>
                <p className="text-xs text-muted-foreground mt-0.5">Daily gym content & progress shots</p>
              </div>
              <ExternalLink className="w-4 h-4 text-muted-foreground group-hover:text-pink-400 transition-colors shrink-0" />
            </a>
          </div>
        </div>

        {/* CTA Card */}
        <div className="glass rounded-2xl p-8 text-center space-y-5 border-primary/30 glow-primary/20">
          <h3 className="text-2xl font-bold text-foreground">Ready to Enter Yodha Mode?</h3>
          <p className="text-muted-foreground max-w-md mx-auto text-sm">
            Join lifters who have stopped juggling apps and started mastering their daily gym routines.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center pt-2">
            <Button
              onClick={() => navigate('/auth?mode=signup')}
              className="bg-primary hover:bg-primary/90 text-primary-foreground font-semibold px-8 h-12 rounded-xl glow-primary"
            >
              Get Started Free
            </Button>
            <Button
              onClick={() => navigate('/contact')}
              variant="outline"
              className="bg-muted/30 border-border text-foreground hover:bg-muted font-semibold px-6 h-12 rounded-xl"
            >
              Get in Touch with Prakhar
            </Button>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default About;
