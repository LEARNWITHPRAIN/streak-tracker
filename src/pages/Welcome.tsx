import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import yodhaLogo from '@/assets/yodha-logo.jpg';
import welcomeBgVideo from '@/assets/welcome-bg.mp4';

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
    <div className="min-h-screen relative flex flex-col items-center justify-center px-6 overflow-hidden">
      {/* Video Background */}
      <video
        autoPlay
        loop
        muted
        playsInline
        className="absolute inset-0 w-full h-full object-cover z-0"
      >
        <source src={welcomeBgVideo} type="video/mp4" />
      </video>
      
      {/* Dark Overlay */}
      <div className="absolute inset-0 bg-black/60 z-10" />
      
      {/* Content */}
      <div className="relative z-20 text-center space-y-8 max-w-md">
        {/* Logo/Icon */}
        <div className="w-28 h-28 mx-auto rounded-2xl overflow-hidden shadow-lg shadow-primary/30 ring-2 ring-primary/50">
          <img src={yodhaLogo} alt="Yodha Logo" className="w-full h-full object-cover" />
        </div>

        {/* Headline */}
        <div className="space-y-3">
          <h1 className="text-4xl font-bold text-white tracking-tight">
            Track Every Workout. Build Your Strongest Self.
          </h1>
          <p className="text-xl text-white/80 font-medium">
            Yodha Mode — Master Your Routine.
          </p>
          <p className="text-sm text-white/70">
            Your personal workout tracker for custom routines, exercise tracking, automatic timers, daily progress, music, and motivation.
          </p>
        </div>

        {/* Buttons */}
        <div className="space-y-3 pt-4">
          <Button
            onClick={() => navigate('/auth?mode=login')}
            className="w-full h-12 text-base font-semibold"
            size="lg"
          >
            Log In
          </Button>
          <Button
            onClick={() => navigate('/auth?mode=signup')}
            variant="outline"
            className="w-full h-12 text-base font-semibold bg-white/10 border-white/30 text-white hover:bg-white/20"
            size="lg"
          >
            Create Account
          </Button>
        </div>

        {/* Footer text */}
        <p className="text-sm text-white/60 pt-4">
          Sync your progress across all devices
        </p>
      </div>

      {/* SEO content (visually subtle, screen-reader & crawler friendly) */}
      <section className="relative z-20 mt-12 max-w-2xl text-white/70 space-y-6 px-2 pb-10 text-sm leading-relaxed">
        <div>
          <h2 className="text-lg font-semibold text-white mb-1">Your Personal Workout Tracker</h2>
          <p>Yodha Mode helps you take control of your fitness journey. Create custom workout routines, track every exercise, use automatic timers, listen to your favorite music, monitor your daily progress, and stay motivated throughout your workout.</p>
        </div>
        <div>
          <h2 className="text-lg font-semibold text-white mb-1">Create Custom Workout Routines</h2>
          <p>Build a workout routine that fits your goals. Add your own exercises, organize your training, and design a personalized plan — whether you train with bodyweight, calisthenics, strength training, or your own custom routine.</p>
        </div>
        <div>
          <h2 className="text-lg font-semibold text-white mb-1">Automatic Workout Timer</h2>
          <p>Focus on your workout instead of watching the clock. Yodha Mode automatically starts your rest timer when you complete an exercise and alerts you when it's time for the next set.</p>
        </div>
        <div>
          <h2 className="text-lg font-semibold text-white mb-1">Track Your Daily Progress</h2>
          <p>Use the workout calendar to monitor your exercise consistency and see how much of your planned workout you complete each day.</p>
        </div>
        <div>
          <h2 className="text-lg font-semibold text-white mb-1">Listen to Your Own Music</h2>
          <p>Add music from your phone and listen to your favorite songs while training. Create the perfect workout atmosphere with the tracks that motivate you.</p>
        </div>
        <div>
          <h2 className="text-lg font-semibold text-white mb-1">Fuel Your Motivation</h2>
          <p>Save your favorite motivational Instagram Reels and YouTube Shorts in Fuel. When you need extra motivation, revisit the content that inspires you to keep training.</p>
        </div>
        <div>
          <h2 className="text-lg font-semibold text-white mb-1">Track Your Complete Workout Journey</h2>
          <p>Keep exercises, custom routines, workout completion, daily consistency, and overall progress organized in one place with Yodha Mode.</p>
        </div>
      </section>
    </div>
  );
};

export default Welcome;
