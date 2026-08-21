import { Link } from 'react-router-dom';
import { Mail, Heart, ShieldCheck, FileText, Info, Dumbbell } from 'lucide-react';
import yodhaLogo from '@/assets/yodha-logo.jpg';

export const Footer = () => {
  return (
    <footer className="w-full border-t border-border/50 bg-card/60 backdrop-blur-lg pt-12 pb-8 px-6 mt-16">
      <div className="max-w-5xl mx-auto flex flex-col md:flex-row justify-between items-start md:items-center gap-8 mb-8">
        {/* Brand Column */}
        <div className="space-y-3 max-w-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl overflow-hidden shadow-md shadow-primary/20 ring-1 ring-primary/40">
              <img src={yodhaLogo} alt="Yodha Mode Logo" className="w-full h-full object-cover" />
            </div>
            <span className="text-xl font-bold text-foreground tracking-tight">Yodha Mode</span>
          </div>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Your all-in-one workout space. Streamline your routines, local music, motivation, and rest timers in a single gamified platform.
          </p>
        </div>

        {/* Navigation Links */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-6 text-sm">
          <div className="space-y-2">
            <h4 className="font-semibold text-foreground text-xs uppercase tracking-wider text-primary">Platform</h4>
            <ul className="space-y-1.5 text-muted-foreground">
              <li>
                <Link to="/dashboard" className="hover:text-foreground transition-colors flex items-center gap-1.5">
                  <Dumbbell className="w-3.5 h-3.5" /> Dashboard
                </Link>
              </li>
              <li>
                <Link to="/about" className="hover:text-foreground transition-colors flex items-center gap-1.5">
                  <Info className="w-3.5 h-3.5" /> About Us
                </Link>
              </li>
              <li>
                <Link to="/contact" className="hover:text-foreground transition-colors flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5" /> Contact Us
                </Link>
              </li>
            </ul>
          </div>

          <div className="space-y-2">
            <h4 className="font-semibold text-foreground text-xs uppercase tracking-wider text-primary">Legal</h4>
            <ul className="space-y-1.5 text-muted-foreground">
              <li>
                <Link to="/privacy" className="hover:text-foreground transition-colors flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5" /> Privacy Policy
                </Link>
              </li>
              <li>
                <Link to="/terms" className="hover:text-foreground transition-colors flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5" /> Terms & Conditions
                </Link>
              </li>
            </ul>
          </div>

          <div className="col-span-2 sm:col-span-1 space-y-2">
            <h4 className="font-semibold text-foreground text-xs uppercase tracking-wider text-primary">Support</h4>
            <a
              href="mailto:admin@yodhamode.cloud"
              className="inline-flex items-center gap-2 text-xs bg-muted/60 hover:bg-muted text-foreground px-3 py-2 rounded-lg border border-border/60 transition-all hover:border-primary/40 group"
            >
              <Mail className="w-3.5 h-3.5 text-primary group-hover:scale-110 transition-transform" />
              <span>admin@yodhamode.cloud</span>
            </a>
          </div>
        </div>
      </div>

      {/* Bottom Copyright & Creator Info */}
      <div className="max-w-5xl mx-auto pt-6 border-t border-border/40 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-muted-foreground">
        <p>© {new Date().getFullYear()} Yodha Mode. All rights reserved.</p>
        <p className="flex items-center gap-1">
          Built with <Heart className="w-3.5 h-3.5 text-primary fill-primary animate-pulse" /> by Prakhar Jain
        </p>
      </div>
    </footer>
  );
};

export default Footer;
