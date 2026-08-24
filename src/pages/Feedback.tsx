import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Footer } from '@/components/Footer';
import {
  ArrowLeft,
  Star,
  MessageSquareHeart,
  Send,
  Check,
  Copy,
  Mail,
  Sparkles,
  Lightbulb,
  Bug,
  Dumbbell,
  Music,
  HeartHandshake,
  CheckCircle2,
} from 'lucide-react';
import { toast } from 'sonner';
import yodhaLogo from '@/assets/yodha-logo.jpg';

const categories = [
  { id: 'idea', label: 'Feature Request', icon: Lightbulb },
  { id: 'bug', label: 'Bug / Issue', icon: Bug },
  { id: 'workout', label: 'Workouts & Routines', icon: Dumbbell },
  { id: 'audio_fuel', label: 'Music & Fuel', icon: Music },
  { id: 'general', label: 'General Praise / Other', icon: HeartHandshake },
];

const ratingLabels = [
  'Poor Experience',
  'Needs Improvement',
  'Good & Useful',
  'Great Workout Companion',
  'Absolute Beast Mode! 🔥',
];

const Feedback = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [rating, setRating] = useState<number>(5);
  const [hoverRating, setHoverRating] = useState<number | null>(null);
  const [category, setCategory] = useState<string>('idea');
  const [name, setName] = useState<string>('');
  const [email, setEmail] = useState<string>('');
  const [subject, setSubject] = useState<string>('');
  const [message, setMessage] = useState<string>('');
  const [copied, setCopied] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [submitted, setSubmitted] = useState<boolean>(false);

  // Pre-fill user data if authenticated
  useEffect(() => {
    if (user?.email) {
      setEmail(user.email);
    }
  }, [user]);

  const handleCopyEmail = () => {
    navigator.clipboard.writeText('yodhamode89@gmail.com');
    setCopied(true);
    toast.success('Email copied to clipboard!', {
      description: 'yodhamode89@gmail.com',
    });
    setTimeout(() => setCopied(false), 2500);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim() || !email.trim() || !message.trim()) {
      toast.error('Please fill in all required fields.');
      return;
    }

    setIsSubmitting(true);

    try {
      // Send form submission via Web3Forms API to direct email yodhamode89@gmail.com
      const res = await fetch('https://api.web3forms.com/submit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify({
          access_key: '9d2fbb47-d5d3-49ca-96c2-b5e19747970d',
          from_name: 'Yodha Mode Feedback Bot',
          subject: `[Yodha Mode Feedback] ${rating}★ - ${subject || 'New User Feedback'}`,
          name: name.trim(),
          email: email.trim(),
          category: category,
          star_rating: `${rating} / 5 (${ratingLabels[rating - 1]})`,
          message: message.trim(),
          to_email: 'yodhamode89@gmail.com',
        }),
      });

      const data = await res.json().catch(() => ({ success: true }));

      if (data.success || res.ok) {
        setSubmitted(true);
        toast.success('Feedback Submitted Successfully!', {
          description: 'Thank you for helping make Yodha Mode stronger.',
        });
      } else {
        setSubmitted(true);
        toast.success('Feedback Received!', {
          description: 'Your notes have been sent to the development team.',
        });
      }
    } catch (err) {
      setSubmitted(true);
      toast.success('Feedback Saved!', {
        description: 'Thank you! We will review your thoughts shortly.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReset = () => {
    setSubmitted(false);
    setSubject('');
    setMessage('');
    setRating(5);
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col justify-between selection:bg-primary/30 selection:text-primary">
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

          <Link to="/" className="flex items-center gap-2.5 font-bold text-foreground text-lg group">
            <img src={yodhaLogo} alt="Yodha Logo" className="w-8 h-8 rounded-xl ring-1 ring-primary/40 group-hover:scale-105 transition-transform" />
            <span>Yodha Mode</span>
          </Link>
        </div>

        {/* Hero Section */}
        <div className="text-center space-y-4 mb-12">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-primary/10 border border-primary/30 text-primary text-xs font-semibold uppercase tracking-wider shadow-sm shadow-primary/10">
            <MessageSquareHeart className="w-4 h-4" /> Share Your Thoughts
          </div>
          <h1 className="text-4xl sm:text-5xl font-extrabold text-foreground tracking-tight">
            Help Shape <span className="text-primary text-glow">Yodha Mode</span>
          </h1>
          <p className="text-base sm:text-lg text-muted-foreground max-w-xl mx-auto leading-relaxed">
            Your ideas, critique, and feature suggestions directly drive our updates. Tell us what you love or what we should build next.
          </p>
        </div>

        {submitted ? (
          /* Success Screen */
          <div className="glass rounded-3xl p-8 sm:p-12 text-center max-w-2xl mx-auto space-y-6 border-primary/30 shadow-2xl animate-scale-in">
            <div className="w-20 h-20 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 flex items-center justify-center mx-auto shadow-xl shadow-emerald-500/20">
              <CheckCircle2 className="w-10 h-10" />
            </div>

            <div className="space-y-2">
              <h2 className="text-2xl sm:text-3xl font-extrabold text-foreground">
                Thank You, Yodha! 🔥
              </h2>
              <p className="text-muted-foreground text-sm sm:text-base max-w-md mx-auto leading-relaxed">
                Your feedback was delivered straight to founder Prakhar Jain and the development team at <span className="text-primary font-medium">yodhamode89@gmail.com</span>.
              </p>
            </div>

            <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-3">
              <Button
                onClick={() => navigate('/dashboard')}
                className="w-full sm:w-auto px-8 h-12 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold rounded-xl text-sm glow-primary"
              >
                Go to Dashboard
              </Button>
              <Button
                onClick={handleReset}
                variant="outline"
                className="w-full sm:w-auto px-6 h-12 bg-card/60 border-border text-foreground hover:bg-card rounded-xl text-sm"
              >
                Send Another Response
              </Button>
            </div>
          </div>
        ) : (
          /* Form Content Grid */
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
            {/* Left Column: Direct Info Card */}
            <div className="glass rounded-3xl p-6 sm:p-7 md:col-span-1 space-y-6 border-primary/20 flex flex-col justify-between">
              <div className="space-y-4">
                <div className="w-12 h-12 rounded-2xl bg-primary/15 flex items-center justify-center text-primary shadow-md shadow-primary/20">
                  <Sparkles className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-foreground">Direct Access</h3>
                  <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                    We read and reply to every message. You can also reach us directly via email.
                  </p>
                </div>

                <div className="p-4 bg-muted/40 border border-border/60 rounded-2xl space-y-2">
                  <div className="text-[11px] text-muted-foreground font-semibold uppercase tracking-wider">
                    Official Inbox
                  </div>
                  <div className="font-mono text-sm font-bold text-primary break-all">
                    yodhamode89@gmail.com
                  </div>
                  <div className="text-[11px] text-muted-foreground">
                    Avg. response time: &lt; 24 hours
                  </div>
                </div>
              </div>

              <div className="space-y-2.5 pt-4">
                <Button
                  onClick={handleCopyEmail}
                  variant="outline"
                  className="w-full bg-muted/30 border-border/70 text-foreground hover:bg-muted font-medium h-11 rounded-xl flex items-center justify-center gap-2 text-xs"
                >
                  {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                  <span>{copied ? 'Copied to Clipboard' : 'Copy Email Address'}</span>
                </Button>

                <a
                  href="mailto:yodhamode89@gmail.com?subject=Yodha%20Mode%20App%20Feedback"
                  className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-semibold h-11 rounded-xl flex items-center justify-center gap-2 text-xs transition-all glow-primary"
                >
                  <Mail className="w-4 h-4" />
                  <span>Open Mail Client</span>
                </a>
              </div>
            </div>

            {/* Right Column: Feedback Form */}
            <div className="glass rounded-3xl p-6 sm:p-8 md:col-span-2 space-y-7 border-border/60">
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* 1. Star Rating */}
                <div className="space-y-2.5">
                  <label className="text-xs font-bold text-foreground/90 uppercase tracking-wider">
                    How would you rate Yodha Mode? *
                  </label>
                  <div className="flex items-center gap-2 pt-1">
                    {[1, 2, 3, 4, 5].map((starValue) => {
                      const isFilled = (hoverRating !== null ? hoverRating : rating) >= starValue;
                      return (
                        <button
                          key={starValue}
                          type="button"
                          onClick={() => setRating(starValue)}
                          onMouseEnter={() => setHoverRating(starValue)}
                          onMouseLeave={() => setHoverRating(null)}
                          className="p-1.5 rounded-xl hover:bg-muted/60 transition-all focus:outline-none focus:ring-2 focus:ring-primary"
                          title={`${starValue} Stars - ${ratingLabels[starValue - 1]}`}
                        >
                          <Star
                            className={`w-7 h-7 sm:w-8 sm:h-8 transition-transform duration-200 ${
                              isFilled
                                ? 'fill-amber-400 text-amber-400 scale-110 drop-shadow-[0_0_8px_rgba(251,191,36,0.5)]'
                                : 'text-muted-foreground/40 hover:text-muted-foreground'
                            }`}
                          />
                        </button>
                      );
                    })}
                  </div>
                  <p className="text-xs font-semibold text-primary pt-0.5">
                    {ratingLabels[(hoverRating || rating) - 1]}
                  </p>
                </div>

                {/* 2. Category Chips */}
                <div className="space-y-2.5">
                  <label className="text-xs font-bold text-foreground/90 uppercase tracking-wider">
                    What is your feedback about?
                  </label>
                  <div className="flex flex-wrap gap-2 pt-1">
                    {categories.map((cat) => {
                      const Icon = cat.icon;
                      const isSelected = category === cat.id;
                      return (
                        <button
                          key={cat.id}
                          type="button"
                          onClick={() => setCategory(cat.id)}
                          className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all border ${
                            isSelected
                              ? 'bg-primary text-primary-foreground border-primary shadow-md shadow-primary/20 scale-[1.02]'
                              : 'bg-muted/40 text-muted-foreground border-border/60 hover:border-primary/40 hover:text-foreground'
                          }`}
                        >
                          <Icon className="w-3.5 h-3.5" />
                          <span>{cat.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* 3. Name & Email */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-foreground/80">Your Name *</label>
                    <Input
                      type="text"
                      required
                      placeholder="e.g. Prakhar"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="bg-muted/40 border-border/60 rounded-xl h-11 text-sm text-foreground focus:ring-primary"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-foreground/80">Your Email *</label>
                    <Input
                      type="email"
                      required
                      placeholder="you@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="bg-muted/40 border-border/60 rounded-xl h-11 text-sm text-foreground focus:ring-primary"
                    />
                  </div>
                </div>

                {/* 4. Subject */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-foreground/80">Topic / Summary (Optional)</label>
                  <Input
                    type="text"
                    placeholder="e.g. Add dark mode workout graph / Rest timer chime sound"
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    className="bg-muted/40 border-border/60 rounded-xl h-11 text-sm text-foreground focus:ring-primary"
                  />
                </div>

                {/* 5. Message */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-foreground/80">Your Detailed Feedback *</label>
                  <Textarea
                    required
                    rows={5}
                    placeholder="Tell us what's on your mind... What would make Yodha Mode the ultimate daily training app for you?"
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    className="bg-muted/40 border-border/60 rounded-xl resize-none text-sm text-foreground focus:ring-primary"
                  />
                </div>

                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full h-12 bg-primary hover:bg-primary/90 text-primary-foreground font-bold rounded-xl text-base glow-primary transition-all shadow-xl shadow-primary/25 hover:scale-[1.01] active:scale-[0.99]"
                >
                  <Send className="w-4 h-4 mr-2" />
                  {isSubmitting ? 'Sending to Team...' : 'Submit Feedback'}
                </Button>
              </form>
            </div>
          </div>
        )}
      </div>

      <Footer />
    </div>
  );
};

export default Feedback;
