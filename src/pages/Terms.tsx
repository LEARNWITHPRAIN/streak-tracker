import { useNavigate } from 'react-router-dom';
import { Footer } from '@/components/Footer';
import { ArrowLeft, FileText, AlertTriangle, Shield, CheckCircle2, Mail } from 'lucide-react';
import yodhaLogo from '@/assets/yodha-logo.jpg';

const Terms = () => {
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

        {/* Title */}
        <div className="space-y-3 mb-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/30 text-primary text-xs font-semibold uppercase tracking-wider">
            <FileText className="w-3.5 h-3.5" /> Agreement & Rules
          </div>
          <h1 className="text-4xl font-extrabold text-foreground tracking-tight">Terms and Conditions</h1>
          <p className="text-sm text-muted-foreground">
            Effective Date: August 21, 2026 • Last Updated: August 2026
          </p>
        </div>

        {/* Highlight Banner */}
        <div className="glass rounded-2xl p-6 border-primary/30 mb-8 flex items-start gap-4">
          <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center text-primary shrink-0 mt-1">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div className="space-y-1 text-sm">
            <h3 className="font-bold text-foreground text-base">Fitness Disclaimer</h3>
            <p className="text-muted-foreground leading-relaxed">
              Yodha Mode is a workout tracking and routine management tool. It does not provide medical or professional healthcare advice. Always consult a qualified physician or certified trainer before initiating any heavy lifting or physical workout regimen.
            </p>
          </div>
        </div>

        {/* Terms Content */}
        <div className="glass rounded-3xl p-8 sm:p-10 space-y-8 text-foreground/90 text-sm leading-relaxed border-border/60 mb-12">
          {/* Section 1 */}
          <section className="space-y-3">
            <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
              <span className="text-primary">1.</span> Acceptance of Terms
            </h2>
            <p>
              Welcome to <strong>Yodha Mode</strong> (accessible via <code>yodhamode.cloud</code>), created by Prakhar Jain. By creating an account, browsing, or using any feature of Yodha Mode, you agree to be bound by these Terms and Conditions ("Terms"). If you do not agree with any part of these terms, please do not access or use the service.
            </p>
          </section>

          {/* Section 2 */}
          <section className="space-y-3 pt-4 border-t border-border/40">
            <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
              <span className="text-primary">2.</span> Description of Service
            </h2>
            <p>
              Yodha Mode provides users with an all-in-one workout tracking platform featuring:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
              <li>Gamified calendar logging with percentage-based completion analytics.</li>
              <li>Local audio playback integration for custom offline music files.</li>
              <li>In-app media link parsing and playback for YouTube videos and Instagram Reels.</li>
              <li>Automated set rest timers with customizable interval alerts.</li>
            </ul>
          </section>

          {/* Section 3 */}
          <section className="space-y-3 pt-4 border-t border-border/40">
            <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
              <span className="text-primary">3.</span> User Accounts & Responsibility
            </h2>
            <p>
              To access certain features, you must register for an account. You are responsible for maintaining the confidentiality of your login credentials and for all activities that occur under your account. You agree to notify us immediately of any unauthorized use of your account at <code>yodhamode89@gmail.com</code>.
            </p>
          </section>

          {/* Section 4 */}
          <section className="space-y-3 pt-4 border-t border-border/40">
            <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
              <span className="text-primary">4.</span> Acceptable Use Policy
            </h2>
            <p>You agree not to engage in any of the following prohibited activities:</p>
            <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
              <li>Using the platform for any illegal purpose or to violate local, state, or international laws.</li>
              <li>Attempting to reverse engineer, scrape, or interfere with the infrastructure or security of Yodha Mode.</li>
              <li>Using automated bots, scripts, or crawlers to access user accounts or server endpoints.</li>
              <li>Uploading malicious files or code into the local audio player or custom routines.</li>
            </ul>
          </section>

          {/* Section 5 */}
          <section className="space-y-3 pt-4 border-t border-border/40">
            <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
              <span className="text-primary">5.</span> Intellectual Property & Third-Party Content
            </h2>
            <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
              <li>
                <strong className="text-foreground">Yodha Mode Platform:</strong> All visual interfaces, graphics, logos, branding, code, and gamification concepts belong exclusively to Prakhar Jain / Yodha Mode.
              </li>
              <li>
                <strong className="text-foreground">Third-Party Media Embeds:</strong> Videos embedded via YouTube or Instagram links remain the intellectual property of their respective creators and copyright holders. Yodha Mode does not claim ownership over external media.
              </li>
              <li>
                <strong className="text-foreground">Local Audio Files:</strong> Users retain full responsibility and ownership rights for audio files uploaded locally for personal gym playback.
              </li>
            </ul>
          </section>

          {/* Section 6 */}
          <section className="space-y-3 pt-4 border-t border-border/40">
            <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
              <span className="text-primary">6.</span> Limitation of Liability
            </h2>
            <p>
              To the maximum extent permitted by applicable law, Yodha Mode and its founder, Prakhar Jain, shall not be liable for any indirect, incidental, special, consequential, or punitive damages, including loss of exercise logs, physical injury, or hardware malfunction arising out of your use of the service.
            </p>
          </section>

          {/* Section 7 */}
          <section className="space-y-3 pt-4 border-t border-border/40">
            <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
              <span className="text-primary">7.</span> Modifications to Service & Terms
            </h2>
            <p>
              We reserve the right to update or modify these Terms at any time. Continued use of Yodha Mode following any updates constitutes acceptance of the new Terms.
            </p>
          </section>

          {/* Section 8 */}
          <section className="space-y-3 pt-4 border-t border-border/40">
            <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
              <span className="text-primary">8.</span> Contact Us
            </h2>
            <p>
              For any legal questions, support requests, or terms clarifications, please email:
            </p>
            <div className="p-4 rounded-xl bg-muted/40 border border-border/50 flex items-center gap-3 w-fit mt-2">
              <Mail className="w-5 h-5 text-primary" />
              <a href="mailto:yodhamode89@gmail.com" className="font-semibold text-primary hover:underline">
                yodhamode89@gmail.com
              </a>
            </div>
          </section>
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default Terms;
