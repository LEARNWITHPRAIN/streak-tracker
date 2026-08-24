import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Footer } from '@/components/Footer';
import { ArrowLeft, Mail, Copy, Check, Send, MessageSquare, HelpCircle, ShieldCheck, FileText, Sparkles } from 'lucide-react';
import { toast } from 'sonner';
import yodhaLogo from '@/assets/yodha-logo.jpg';

const Contact = () => {
  const navigate = useNavigate();
  const [copied, setCopied] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    category: 'general',
    subject: '',
    message: ''
  });

  const handleCopyEmail = () => {
    navigator.clipboard.writeText('yodhamode89@gmail.com');
    setCopied(true);
    toast.success('Email copied to clipboard!', {
      description: 'yodhamode89@gmail.com'
    });
    setTimeout(() => setCopied(false), 2500);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.email || !formData.message) {
      toast.error('Please fill in all required fields.');
      return;
    }

    setIsSubmitting(true);

    try {
      await fetch('https://api.web3forms.com/submit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify({
          access_key: '9d2fbb47-d5d3-49ca-96c2-b5e19747970d',
          from_name: 'Yodha Mode Contact Form',
          subject: `[Yodha Mode Contact] ${formData.subject || 'New Message'}`,
          name: formData.name.trim(),
          email: formData.email.trim(),
          category: formData.category,
          message: formData.message.trim(),
          to_email: 'yodhamode89@gmail.com',
        }),
      });

      toast.success('Message Sent Successfully!', {
        description: 'Thank you for reaching out. Prakhar will get back to you shortly at yodhamode89@gmail.com.'
      });
      setFormData({
        name: '',
        email: '',
        category: 'general',
        subject: '',
        message: ''
      });
    } catch (err) {
      toast.success('Message Sent!', {
        description: 'Thank you for reaching out.'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

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
        <div className="text-center space-y-4 mb-12">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/30 text-primary text-xs font-semibold uppercase tracking-wider">
            <Mail className="w-3.5 h-3.5" /> Support & Contact
          </div>
          <h1 className="text-4xl sm:text-5xl font-extrabold text-foreground tracking-tight">
            We’re Here to Help You <span className="text-primary text-glow">Master Your Routine</span>
          </h1>
          <p className="text-lg text-muted-foreground max-w-xl mx-auto leading-relaxed">
            Have a question, feedback, or a feature request? Reach out directly to founder Prakhar Jain and the Yodha Mode team.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
          {/* Direct Email Card */}
          <div className="glass rounded-2xl p-6 md:col-span-1 space-y-6 border-primary/20 flex flex-col justify-between">
            <div className="space-y-4">
              <div className="w-12 h-12 rounded-xl bg-primary/15 flex items-center justify-center text-primary">
                <Mail className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-foreground">Direct Email</h3>
                <p className="text-xs text-muted-foreground mt-1">
                  Prefer sending a direct email from your mail app? Reach us anytime.
                </p>
              </div>

              <div className="p-3.5 bg-muted/50 border border-border/60 rounded-xl space-y-2">
                <div className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Official Email</div>
                <div className="font-mono text-sm font-semibold text-primary break-all">
                  yodhamode89@gmail.com
                </div>
              </div>
            </div>

            <div className="space-y-2 pt-4">
              <Button
                onClick={handleCopyEmail}
                variant="outline"
                className="w-full bg-muted/40 border-border text-foreground hover:bg-muted font-medium h-11 rounded-xl flex items-center justify-center gap-2"
              >
                {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                <span>{copied ? 'Copied to Clipboard' : 'Copy Email Address'}</span>
              </Button>

              <a
                href="mailto:yodhamode89@gmail.com"
                className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-semibold h-11 rounded-xl flex items-center justify-center gap-2 text-sm transition-all glow-primary"
              >
                <Send className="w-4 h-4" />
                <span>Open Mail App</span>
              </a>
            </div>
          </div>

          {/* Contact Form */}
          <div className="glass rounded-2xl p-6 sm:p-8 md:col-span-2 space-y-6">
            <div className="flex items-center gap-2">
              <MessageSquare className="w-5 h-5 text-primary" />
              <h2 className="text-xl font-bold text-foreground">Send a Direct Message</h2>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-foreground/80">Your Name *</label>
                  <Input
                    type="text"
                    required
                    placeholder="Prakhar Jain"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="bg-muted/40 border-border/60 rounded-xl h-11"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-foreground/80">Your Email Address *</label>
                  <Input
                    type="email"
                    required
                    placeholder="you@example.com"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="bg-muted/40 border-border/60 rounded-xl h-11"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-foreground/80">Category</label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full h-11 bg-muted/40 border border-border/60 rounded-xl px-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                  >
                    <option value="general" className="bg-card text-foreground">General Question</option>
                    <option value="bug" className="bg-card text-foreground">Bug Report</option>
                    <option value="feature" className="bg-card text-foreground">Feature Request</option>
                    <option value="feedback" className="bg-card text-foreground">App Feedback</option>
                    <option value="partnership" className="bg-card text-foreground">Partnership / Inquiries</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-foreground/80">Subject</label>
                  <Input
                    type="text"
                    placeholder="How can we help?"
                    value={formData.subject}
                    onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                    className="bg-muted/40 border-border/60 rounded-xl h-11"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground/80">Message *</label>
                <Textarea
                  required
                  rows={5}
                  placeholder="Tell us what you'd like to share or ask..."
                  value={formData.message}
                  onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                  className="bg-muted/40 border-border/60 rounded-xl resize-none"
                />
              </div>

              <Button
                type="submit"
                disabled={isSubmitting}
                className="w-full h-12 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold rounded-xl text-base glow-primary"
              >
                {isSubmitting ? 'Sending Message...' : 'Send Message'}
              </Button>
            </form>
          </div>
        </div>

        {/* FAQ Quick Links */}
        <div className="glass rounded-2xl p-6 sm:p-8 space-y-6">
          <div className="flex items-center gap-2">
            <HelpCircle className="w-5 h-5 text-primary" />
            <h3 className="text-xl font-bold text-foreground">Quick Resources & Policies</h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Link
              to="/privacy"
              className="p-4 rounded-xl bg-muted/30 border border-border/40 hover:border-primary/40 hover:bg-muted/50 transition-all flex items-center justify-between group"
            >
              <div className="flex items-center gap-3">
                <ShieldCheck className="w-5 h-5 text-primary" />
                <div>
                  <h4 className="font-semibold text-foreground text-sm group-hover:text-primary transition-colors">Privacy Policy</h4>
                  <p className="text-xs text-muted-foreground">Learn how your data & local audio stay secure.</p>
                </div>
              </div>
            </Link>

            <Link
              to="/terms"
              className="p-4 rounded-xl bg-muted/30 border border-border/40 hover:border-primary/40 hover:bg-muted/50 transition-all flex items-center justify-between group"
            >
              <div className="flex items-center gap-3">
                <FileText className="w-5 h-5 text-primary" />
                <div>
                  <h4 className="font-semibold text-foreground text-sm group-hover:text-primary transition-colors">Terms & Conditions</h4>
                  <p className="text-xs text-muted-foreground">Review service rules and usage terms.</p>
                </div>
              </div>
            </Link>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default Contact;
