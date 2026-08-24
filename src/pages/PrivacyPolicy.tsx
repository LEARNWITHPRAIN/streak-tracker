import { useNavigate } from 'react-router-dom';
import { Footer } from '@/components/Footer';
import { ArrowLeft, ShieldCheck, Lock, HardDrive, Eye, Mail, FileText } from 'lucide-react';
import yodhaLogo from '@/assets/yodha-logo.jpg';

const PrivacyPolicy = () => {
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
            <ShieldCheck className="w-3.5 h-3.5" /> Legal Document
          </div>
          <h1 className="text-4xl font-extrabold text-foreground tracking-tight">Privacy Policy</h1>
          <p className="text-sm text-muted-foreground">
            Effective Date: August 21, 2026 • Last Updated: August 2026
          </p>
        </div>

        {/* Highlight Banner */}
        <div className="glass rounded-2xl p-6 border-primary/30 mb-8 flex items-start gap-4">
          <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center text-primary shrink-0 mt-1">
            <HardDrive className="w-5 h-5" />
          </div>
          <div className="space-y-1 text-sm">
            <h3 className="font-bold text-foreground text-base">Your Local Audio Files Stay Local</h3>
            <p className="text-muted-foreground leading-relaxed">
              Yodha Mode processes your uploaded local music files entirely within your device's browser memory/storage. Your MP3 and audio files are <span className="text-foreground font-semibold">never uploaded to our servers</span> or shared with any third party.
            </p>
          </div>
        </div>

        {/* Policy Content */}
        <div className="glass rounded-3xl p-8 sm:p-10 space-y-8 text-foreground/90 text-sm leading-relaxed border-border/60 mb-12">
          {/* Section 1 */}
          <section className="space-y-3">
            <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
              <span className="text-primary">1.</span> Introduction & Overview
            </h2>
            <p>
              Welcome to <strong>Yodha Mode</strong> ("we," "our," or "us"), founded by Prakhar Jain. We are committed to respecting your privacy and protecting your personal data. This Privacy Policy explains how we collect, use, store, and safeguard your information when you use the Yodha Mode SaaS web application (located at <code>yodhamode.cloud</code>).
            </p>
            <p>
              By accessing or using Yodha Mode, you agree to the collection and use of information in accordance with this policy.
            </p>
          </section>

          {/* Section 2 */}
          <section className="space-y-3 pt-4 border-t border-border/40">
            <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
              <span className="text-primary">2.</span> Information We Collect
            </h2>
            <p>We collect minimal information necessary to provide you with a personalized workout workspace:</p>
            <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
              <li>
                <strong className="text-foreground">Account & Authentication Data:</strong> When you register an account, we collect your email address and encrypted password credentials (managed via Supabase Authentication).
              </li>
              <li>
                <strong className="text-foreground">Workout & Fitness Log Data:</strong> Custom exercises, routine names, completed sets, reps, percentage completion rates, rest timer settings, and exercise history.
              </li>
              <li>
                <strong className="text-foreground">Saved Media Embed Links:</strong> YouTube video URLs and Instagram Reel links that you explicitly paste into your Fuel library or exercise cards for in-app playback.
              </li>
              <li>
                <strong className="text-foreground">Local Audio Metadata:</strong> Local file names and track titles for your custom music playlist, stored locally in IndexedDB / Browser Storage.
              </li>
            </ul>
          </section>

          {/* Section 3 */}
          <section className="space-y-3 pt-4 border-t border-border/40">
            <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
              <span className="text-primary">3.</span> How We Use Your Information
            </h2>
            <p>We use your data solely for the following purposes:</p>
            <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
              <li>To create and maintain your account and sync your workout routines across devices.</li>
              <li>To calculate percentage completion rates and generate your monthly progress heatmaps.</li>
              <li>To play embedded media content (YouTube / Instagram) within your logged sets.</li>
              <li>To send essential transactional notifications (such as password reset requests and email verifications).</li>
            </ul>
            <p className="text-foreground font-medium pt-1">
              We do NOT sell, rent, or monetize your personal data or workout logs to third-party advertisers.
            </p>
          </section>

          {/* Section 4 */}
          <section className="space-y-3 pt-4 border-t border-border/40">
            <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
              <span className="text-primary">4.</span> Third-Party Media Embeds & Services
            </h2>
            <p>
              Yodha Mode integrates third-party embeds to enhance your motivation and form guidance:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
              <li>
                <strong className="text-foreground">YouTube & Instagram Embeds:</strong> When you play YouTube or Instagram clips in Yodha Mode, video player components interact directly with YouTube/Meta APIs. These services may collect standard embedded player telemetry according to their respective privacy policies.
              </li>
              <li>
                <strong className="text-foreground">Supabase:</strong> Our secure database provider used for encrypted user authentication and cloud sync of your workout routines.
              </li>
            </ul>
          </section>

          {/* Section 5 */}
          <section className="space-y-3 pt-4 border-t border-border/40">
            <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
              <span className="text-primary">5.</span> Data Security & Retention
            </h2>
            <p>
              We implement industry-standard security protocols, including SSL/TLS encryption for all data in transit and encrypted database storage for account credentials. Your workout data is retained for as long as your account remains active.
            </p>
          </section>

          {/* Section 6 */}
          <section className="space-y-3 pt-4 border-t border-border/40">
            <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
              <span className="text-primary">6.</span> Your Data Rights & Deletion
            </h2>
            <p>
              You have full ownership of your fitness data. At any time, you may request to view, export, or permanently delete your account and all associated workout logs by contacting our support email below.
            </p>
          </section>

          {/* Section 7 */}
          <section className="space-y-3 pt-4 border-t border-border/40">
            <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
              <span className="text-primary">7.</span> Privacy Inquiries & Contact
            </h2>
            <p>
              If you have any questions or concerns regarding this Privacy Policy or your data, please contact Prakhar Jain directly at:
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

export default PrivacyPolicy;
