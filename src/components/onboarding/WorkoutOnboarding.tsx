import React, { useState } from 'react';
import {
  X, ChevronRight, ChevronLeft, Check, Dumbbell, Target, Zap,
  Heart, Flame, Clock, Calendar, AlertTriangle, Sparkles, RotateCcw,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  OnboardingPreferences,
  TemplateName,
  getTemplateRecommendations,
  TemplateRecommendation,
} from '@/lib/workoutPlanGenerator';

// ── Types ─────────────────────────────────────────────────────────────────────
interface WorkoutOnboardingProps {
  isOpen: boolean;
  existingData?: boolean; // if user already has workout data
  isMandatory?: boolean;  // if true, user cannot close/skip — must complete
  onComplete: (prefs: OnboardingPreferences, template: TemplateName) => Promise<void>;
  onClose: () => void;
}

type WizardStep = 'goal' | 'experience' | 'equipment' | 'frequency' | 'duration' | 'limitations' | 'template' | 'confirm';

const STEPS: WizardStep[] = ['goal', 'experience', 'equipment', 'frequency', 'duration', 'limitations', 'template', 'confirm'];

// ── Shared option card ────────────────────────────────────────────────────────
interface OptionCardProps {
  selected: boolean;
  onClick: () => void;
  icon?: React.ReactNode;
  label: string;
  description?: string;
  badge?: string;
}

const OptionCard: React.FC<OptionCardProps> = ({ selected, onClick, icon, label, description, badge }) => (
  <button
    type="button"
    onClick={onClick}
    className={`w-full text-left p-4 rounded-2xl border-2 transition-all duration-200 flex items-start gap-4 group ${
      selected
        ? 'border-primary bg-primary/10 shadow-lg shadow-primary/10'
        : 'border-border/50 bg-card/50 hover:border-primary/40 hover:bg-card/80'
    }`}
  >
    {icon && (
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 transition-all ${
        selected ? 'bg-primary text-primary-foreground' : 'bg-muted/50 text-muted-foreground group-hover:bg-primary/15 group-hover:text-primary'
      }`}>
        {icon}
      </div>
    )}
    <div className="flex-1 min-w-0">
      <div className="flex items-center gap-2">
        <span className={`font-bold text-sm ${selected ? 'text-foreground' : 'text-foreground/90'}`}>{label}</span>
        {badge && (
          <Badge className="text-[10px] px-2 py-0 bg-primary/20 text-primary border-primary/30 border">
            {badge}
          </Badge>
        )}
      </div>
      {description && (
        <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{description}</p>
      )}
    </div>
    <div className={`w-5 h-5 rounded-full border-2 shrink-0 mt-0.5 flex items-center justify-center transition-all ${
      selected ? 'bg-primary border-primary' : 'border-border/60'
    }`}>
      {selected && <Check className="w-3 h-3 text-primary-foreground stroke-[3]" />}
    </div>
  </button>
);

// ── Progress indicator ────────────────────────────────────────────────────────
const StepProgress: React.FC<{ current: number; total: number }> = ({ current, total }) => (
  <div className="flex items-center gap-1.5">
    {Array.from({ length: total }).map((_, i) => (
      <div
        key={i}
        className={`h-1.5 rounded-full transition-all duration-300 ${
          i < current ? 'bg-primary w-6' : i === current ? 'bg-primary/60 w-4' : 'bg-muted/60 w-2'
        }`}
      />
    ))}
    <span className="text-xs text-muted-foreground ml-1 font-medium">{current + 1}/{total}</span>
  </div>
);

// ── Template preview mini-schedule ────────────────────────────────────────────
const TemplateSchedulePreview: React.FC<{ schedule: TemplateRecommendation['schedule'] }> = ({ schedule }) => (
  <div className="flex gap-1 flex-wrap mt-3">
    {schedule.map((s, i) => (
      <div key={i} className={`flex flex-col items-center gap-0.5 px-2 py-1.5 rounded-lg text-[10px] font-semibold border ${
        s.type === 'workout'
          ? 'bg-primary/10 text-primary border-primary/25'
          : 'bg-muted/30 text-muted-foreground border-border/30'
      }`}>
        <span className="font-bold">{s.day}</span>
        <span className="font-medium opacity-80">{s.label}</span>
      </div>
    ))}
  </div>
);

// ── Main component ─────────────────────────────────────────────────────────────
export const WorkoutOnboarding: React.FC<WorkoutOnboardingProps> = ({
  isOpen,
  existingData = false,
  isMandatory = false,
  onComplete,
  onClose,
}) => {
  const [stepIndex, setStepIndex] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<TemplateName | null>(null);
  const [prefs, setPrefs] = useState<OnboardingPreferences>({
    goal: 'build_muscle',
    experience: 'beginner',
    equipment: 'full_gym',
    training_days: 4,
    session_duration: '60',
    limitations: '',
    selected_template: null,
  });

  const currentStep = STEPS[stepIndex];
  const totalSteps = STEPS.length;
  const recommendations = getTemplateRecommendations(prefs);

  const next = () => setStepIndex(i => Math.min(i + 1, totalSteps - 1));
  const prev = () => setStepIndex(i => Math.max(i - 1, 0));

  const handleTemplateSelect = (t: TemplateName) => {
    setSelectedTemplate(t);
    setPrefs(p => ({ ...p, selected_template: t }));
  };

  const handleComplete = async () => {
    if (!selectedTemplate) return;
    setIsSubmitting(true);
    try {
      await onComplete({ ...prefs, selected_template: selectedTemplate }, selectedTemplate);
    } finally {
      setIsSubmitting(false);
    }
  };

  const canProceed = (): boolean => {
    if (currentStep === 'template') return !!selectedTemplate;
    return true;
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-background/80 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-lg bg-background border border-border/60 rounded-3xl shadow-2xl flex flex-col overflow-hidden max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-border/40 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-primary/20 flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-primary" />
            </div>
            <div>
              <h2 className="font-bold text-base text-foreground">Build My Plan</h2>
              <p className="text-xs text-muted-foreground">Personalized for you</p>
            </div>
          </div>
        <div className="flex items-center gap-3">
            <StepProgress current={stepIndex} total={totalSteps} />
            {!isMandatory && (
              <button
                type="button"
                onClick={onClose}
                className="w-8 h-8 rounded-xl flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Step Content */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-3">

          {/* ── STEP: Goal ── */}
          {currentStep === 'goal' && (
            <>
              <StepHeader
                title="What's your main goal?"
                subtitle="This shapes your training intensity, rep ranges, and exercise selection."
              />
              <div className="space-y-3 pt-1">
                {([
                  { value: 'build_muscle', label: 'Build Muscle', icon: <Dumbbell className="w-5 h-5" />, description: 'Maximize muscle growth with hypertrophy-focused training' },
                  { value: 'lose_fat', label: 'Lose Fat', icon: <Flame className="w-5 h-5" />, description: 'Higher reps, shorter rest, calorie-burning focused workouts' },
                  { value: 'strength', label: 'Get Stronger', icon: <Zap className="w-5 h-5" />, description: 'Heavy compound lifts, progressive overload focus' },
                  { value: 'endurance', label: 'Build Endurance', icon: <Heart className="w-5 h-5" />, description: 'High rep, circuit-style training for stamina' },
                  { value: 'general_fitness', label: 'General Fitness', icon: <Target className="w-5 h-5" />, description: 'Well-rounded training for overall health and fitness' },
                ] as { value: OnboardingPreferences['goal']; label: string; icon: React.ReactNode; description: string }[]).map(opt => (
                  <OptionCard
                    key={opt.value}
                    selected={prefs.goal === opt.value}
                    onClick={() => setPrefs(p => ({ ...p, goal: opt.value }))}
                    icon={opt.icon}
                    label={opt.label}
                    description={opt.description}
                  />
                ))}
              </div>
            </>
          )}

          {/* ── STEP: Experience ── */}
          {currentStep === 'experience' && (
            <>
              <StepHeader
                title="What's your training experience?"
                subtitle="This determines exercise complexity, volume, and rest periods."
              />
              <div className="space-y-3 pt-1">
                {([
                  { value: 'beginner', label: 'Beginner', description: 'Less than 1 year of consistent training. Learning fundamental movements.', badge: 'Recommended for most' },
                  { value: 'intermediate', label: 'Intermediate', description: '1–3 years of consistent training. Comfortable with compound lifts.' },
                  { value: 'advanced', label: 'Advanced', description: '3+ years of serious training. Familiar with periodization and progression schemes.' },
                ] as { value: OnboardingPreferences['experience']; label: string; description: string; badge?: string }[]).map(opt => (
                  <OptionCard
                    key={opt.value}
                    selected={prefs.experience === opt.value}
                    onClick={() => setPrefs(p => ({ ...p, experience: opt.value }))}
                    label={opt.label}
                    description={opt.description}
                    badge={opt.badge}
                  />
                ))}
              </div>
            </>
          )}

          {/* ── STEP: Equipment ── */}
          {currentStep === 'equipment' && (
            <>
              <StepHeader
                title="What equipment do you have?"
                subtitle="Your plan will only include exercises you can actually do."
              />
              <div className="space-y-3 pt-1">
                {([
                  { value: 'full_gym', label: 'Full Gym', description: 'Access to barbells, dumbbells, machines, cables, and more.' },
                  { value: 'barbell_rack', label: 'Barbell & Rack', description: 'Home gym or powerlifting setup with barbell, plates, and squat rack.' },
                  { value: 'dumbbells_only', label: 'Dumbbells Only', description: 'Limited to dumbbells — still a great setup for most goals.' },
                  { value: 'bodyweight', label: 'Bodyweight Only', description: 'No equipment — training with just your bodyweight. Ideal for home workouts.' },
                ] as { value: OnboardingPreferences['equipment']; label: string; description: string }[]).map(opt => (
                  <OptionCard
                    key={opt.value}
                    selected={prefs.equipment === opt.value}
                    onClick={() => setPrefs(p => ({ ...p, equipment: opt.value }))}
                    label={opt.label}
                    description={opt.description}
                  />
                ))}
              </div>
            </>
          )}

          {/* ── STEP: Training Frequency ── */}
          {currentStep === 'frequency' && (
            <>
              <StepHeader
                title="How many days per week can you train?"
                subtitle="Be honest — consistency beats ambition. Pick what you can sustain."
              />
              <div className="grid grid-cols-3 gap-3 pt-1">
                {[2, 3, 4, 5, 6, 7].map(days => (
                  <button
                    key={days}
                    type="button"
                    onClick={() => setPrefs(p => ({ ...p, training_days: days }))}
                    className={`flex flex-col items-center py-5 rounded-2xl border-2 font-bold transition-all ${
                      prefs.training_days === days
                        ? 'border-primary bg-primary/10 text-primary shadow-lg shadow-primary/10'
                        : 'border-border/50 bg-card/50 text-muted-foreground hover:border-primary/40 hover:text-foreground'
                    }`}
                  >
                    <span className="text-3xl font-black">{days}</span>
                    <span className="text-xs mt-1 font-semibold opacity-80">days/wk</span>
                    {days === 4 && <span className="text-[10px] mt-1 text-primary font-bold">Popular</span>}
                  </button>
                ))}
              </div>
              <p className="text-xs text-muted-foreground text-center pt-2">
                {prefs.training_days <= 3 && '✦ Full Body split recommended'}
                {prefs.training_days === 4 && '✦ Upper/Lower split works great'}
                {prefs.training_days >= 5 && '✦ Push/Pull/Legs or Bro Split recommended'}
              </p>
            </>
          )}

          {/* ── STEP: Session Duration ── */}
          {currentStep === 'duration' && (
            <>
              <StepHeader
                title="How long is each session?"
                subtitle="This helps calibrate exercise volume so sessions don't run over."
              />
              <div className="grid grid-cols-2 gap-3 pt-1">
                {([
                  { value: '30', label: '30 min', description: 'Quick & focused — 3–4 exercises' },
                  { value: '45', label: '45 min', description: 'Efficient — 4–5 exercises' },
                  { value: '60', label: '60 min', description: 'Standard — 5–6 exercises', badge: 'Most popular' },
                  { value: '90', label: '90 min', description: 'Extended — 6–7 exercises' },
                ] as { value: string; label: string; description: string; badge?: string }[]).map(opt => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setPrefs(p => ({ ...p, session_duration: opt.value }))}
                    className={`flex flex-col items-start gap-1.5 p-4 rounded-2xl border-2 font-bold text-left transition-all ${
                      prefs.session_duration === opt.value
                        ? 'border-primary bg-primary/10 shadow-lg shadow-primary/10'
                        : 'border-border/50 bg-card/50 hover:border-primary/40'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <Clock className={`w-4 h-4 ${prefs.session_duration === opt.value ? 'text-primary' : 'text-muted-foreground'}`} />
                      <span className={`text-base font-black ${prefs.session_duration === opt.value ? 'text-primary' : 'text-foreground'}`}>{opt.label}</span>
                      {opt.badge && <Badge className="text-[10px] px-2 py-0 bg-primary/20 text-primary border-primary/30 border">{opt.badge}</Badge>}
                    </div>
                    <p className="text-xs text-muted-foreground font-normal">{opt.description}</p>
                  </button>
                ))}
              </div>
            </>
          )}

          {/* ── STEP: Limitations ── */}
          {currentStep === 'limitations' && (
            <>
              <StepHeader
                title="Any injuries or limitations?"
                subtitle="This is optional. Mention any joints or movements to avoid."
              />
              <div className="pt-1 space-y-3">
                <div className="flex items-start gap-3 p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/20">
                  <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                  <p className="text-xs text-amber-300/90 leading-relaxed">
                    Yodha Mode is not a medical service. Always consult a doctor before starting a new workout program if you have serious injuries.
                  </p>
                </div>
                <textarea
                  className="w-full h-28 bg-card/60 border border-border/60 rounded-2xl p-4 text-sm text-foreground placeholder:text-muted-foreground/50 resize-none outline-none focus:border-primary/50 focus:bg-card transition-all"
                  placeholder="e.g. Left knee pain, avoid deep squats · Lower back issues, no heavy deadlifts · Shoulder injury, avoid overhead press..."
                  value={prefs.limitations ?? ''}
                  onChange={e => setPrefs(p => ({ ...p, limitations: e.target.value }))}
                />
                <button
                  type="button"
                  onClick={() => setPrefs(p => ({ ...p, limitations: '' }))}
                  className="text-xs text-muted-foreground hover:text-foreground underline transition-colors"
                >
                  Skip — no limitations
                </button>
              </div>
            </>
          )}

          {/* ── STEP: Template Picker ── */}
          {currentStep === 'template' && (
            <>
              <StepHeader
                title="Choose your training split"
                subtitle="Based on your answers, we've ranked these templates for you."
              />
              <div className="space-y-3 pt-1">
                {recommendations.map(rec => (
                  <button
                    key={rec.template}
                    type="button"
                    onClick={() => handleTemplateSelect(rec.template)}
                    className={`w-full text-left p-4 rounded-2xl border-2 transition-all duration-200 ${
                      selectedTemplate === rec.template
                        ? 'border-primary bg-primary/10 shadow-xl shadow-primary/15'
                        : 'border-border/50 bg-card/50 hover:border-primary/40 hover:bg-card/80'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className={`font-black text-base ${selectedTemplate === rec.template ? 'text-foreground' : 'text-foreground/90'}`}>
                            {rec.label}
                          </span>
                          {rec.isRecommended && (
                            <Badge className="text-[10px] px-2.5 py-0.5 bg-primary text-primary-foreground border-0 font-bold">
                              ⭐ Recommended
                            </Badge>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{rec.description}</p>
                        <p className={`text-[11px] mt-2 leading-relaxed font-medium ${rec.isRecommended ? 'text-primary/90' : 'text-muted-foreground/80'}`}>
                          {rec.reason}
                        </p>
                        <TemplateSchedulePreview schedule={rec.schedule} />
                      </div>
                      <div className={`w-5 h-5 rounded-full border-2 shrink-0 mt-0.5 flex items-center justify-center transition-all ${
                        selectedTemplate === rec.template ? 'bg-primary border-primary' : 'border-border/60'
                      }`}>
                        {selectedTemplate === rec.template && <Check className="w-3 h-3 text-primary-foreground stroke-[3]" />}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </>
          )}

          {/* ── STEP: Confirm ── */}
          {currentStep === 'confirm' && selectedTemplate && (
            <>
              <StepHeader
                title="Your plan is ready 🎉"
                subtitle="Here's a summary of your personalized training program."
              />
              <div className="space-y-3 pt-1">
                {/* Summary card */}
                <div className="p-4 rounded-2xl bg-card/60 border border-border/50 space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    {[
                      { label: 'Goal', value: prefs.goal.replace('_', ' ').replace(/\b\w/g, c => c.toUpperCase()) },
                      { label: 'Experience', value: prefs.experience.charAt(0).toUpperCase() + prefs.experience.slice(1) },
                      { label: 'Equipment', value: prefs.equipment.replace('_', ' ').replace(/\b\w/g, c => c.toUpperCase()) },
                      { label: 'Training Days', value: `${prefs.training_days}×/week` },
                      { label: 'Session', value: `${prefs.session_duration} min` },
                      { label: 'Split', value: recommendations.find(r => r.template === selectedTemplate)?.label || '' },
                    ].map(item => (
                      <div key={item.label} className="flex flex-col gap-0.5">
                        <span className="text-[10px] uppercase tracking-wider font-bold text-muted-foreground">{item.label}</span>
                        <span className="text-sm font-bold text-foreground">{item.value}</span>
                      </div>
                    ))}
                  </div>
                  {prefs.limitations && (
                    <div className="pt-2 border-t border-border/40">
                      <span className="text-[10px] uppercase tracking-wider font-bold text-muted-foreground">Limitations</span>
                      <p className="text-xs text-muted-foreground mt-0.5">{prefs.limitations}</p>
                    </div>
                  )}
                </div>

                {existingData && (
                  <div className="flex items-start gap-3 p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/20">
                    <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                    <p className="text-xs text-amber-300/90 leading-relaxed">
                      <strong>Heads up:</strong> Generating a new plan will replace your current manually-edited workout schedule. Your workout history and logs will be preserved.
                    </p>
                  </div>
                )}

                <div className="p-3.5 rounded-xl bg-primary/10 border border-primary/20">
                  <p className="text-xs text-foreground/80 leading-relaxed">
                    ✦ After generating, you can still edit individual exercises, weights, sets and reps from the Weekly tab at any time.
                  </p>
                </div>
              </div>
            </>
          )}

        </div>

        {/* Footer Navigation */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-border/40 shrink-0 gap-3">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={stepIndex === 0 ? onClose : prev}
            disabled={isMandatory && stepIndex === 0}
            className="rounded-xl text-muted-foreground hover:text-foreground gap-1.5 disabled:opacity-30 disabled:cursor-not-allowed"
          >
            <ChevronLeft className="w-4 h-4" />
            {stepIndex === 0 ? (isMandatory ? 'Required' : 'Cancel') : 'Back'}
          </Button>

          {currentStep === 'confirm' ? (
            <Button
              type="button"
              onClick={handleComplete}
              disabled={isSubmitting}
              className="rounded-xl bg-primary text-primary-foreground font-bold px-6 gap-2 shadow-lg shadow-primary/25"
            >
              {isSubmitting ? (
                <>
                  <RotateCcw className="w-4 h-4 animate-spin" />
                  Building…
                </>
              ) : (
                <>
                  <Dumbbell className="w-4 h-4" />
                  Build My Plan
                </>
              )}
            </Button>
          ) : (
            <Button
              type="button"
              onClick={next}
              disabled={!canProceed()}
              className="rounded-xl bg-primary text-primary-foreground font-bold px-5 gap-1.5 shadow-md shadow-primary/20"
            >
              {currentStep === 'limitations' ? 'Continue' : 'Next'}
              <ChevronRight className="w-4 h-4" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

// ── Shared step header ────────────────────────────────────────────────────────
const StepHeader: React.FC<{ title: string; subtitle: string }> = ({ title, subtitle }) => (
  <div className="space-y-1 pb-1">
    <h3 className="text-lg font-black text-foreground leading-tight">{title}</h3>
    <p className="text-sm text-muted-foreground leading-relaxed">{subtitle}</p>
  </div>
);

export default WorkoutOnboarding;
