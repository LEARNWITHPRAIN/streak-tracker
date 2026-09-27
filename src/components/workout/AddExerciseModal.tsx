import React, { useState, useMemo } from 'react';
import { 
  X, Dumbbell, PersonStanding, Plus, ArrowLeft, Search, Sparkles, 
  Award, Check, ChevronDown, ChevronUp, Scale, Trash2, Info, BookOpen
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  EXERCISE_TEMPLATES, 
  ExerciseTemplate, 
  ExerciseCategory, 
  MuscleGroup 
} from '@/data/exerciseTemplates';
import { Exercise, ExerciseSet, formatExerciseSetsReps } from '@/hooks/useUserWorkouts';
import { toast } from 'sonner';

interface AddExerciseModalProps {
  isOpen: boolean;
  onClose: () => void;
  targetDay: string;
  onExerciseAdded: (day: string, exercise: Exercise) => Promise<void>;
  daysList?: { day: string; shortDay: string; title: string }[];
}

type ModalStep = 'choose-category' | 'choose-method' | 'manual-form' | 'template-browser';

export const AddExerciseModal: React.FC<AddExerciseModalProps> = ({
  isOpen,
  onClose,
  targetDay,
  onExerciseAdded,
  daysList = [
    { day: 'monday', shortDay: 'Mon', title: 'Monday' },
    { day: 'tuesday', shortDay: 'Tue', title: 'Tuesday' },
    { day: 'wednesday', shortDay: 'Wed', title: 'Wednesday' },
    { day: 'thursday', shortDay: 'Thu', title: 'Thursday' },
    { day: 'friday', shortDay: 'Fri', title: 'Friday' },
    { day: 'saturday', shortDay: 'Sat', title: 'Saturday' },
    { day: 'sunday', shortDay: 'Sun', title: 'Sunday' },
  ],
}) => {
  const [step, setStep] = useState<ModalStep>('choose-category');
  const [selectedDay, setSelectedDay] = useState<string>(targetDay);
  const [selectedCategory, setSelectedCategory] = useState<ExerciseCategory>('equipment');
  const [muscleFilter, setMuscleFilter] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [expandedHowToId, setExpandedHowToId] = useState<string | null>(null);

  // Manual Form State
  const [manualName, setManualName] = useState('');
  const [manualSets, setManualSets] = useState<ExerciseSet[]>([
    { setNumber: 1, weight: 20, reps: '10' },
    { setNumber: 2, weight: 20, reps: '10' },
    { setNumber: 3, weight: 20, reps: '10' },
  ]);

  // Sync target day when modal opens
  React.useEffect(() => {
    if (isOpen) {
      setSelectedDay(targetDay);
      setStep('choose-category');
      setSearchQuery('');
      setMuscleFilter('All');
      setExpandedHowToId(null);
    }
  }, [isOpen, targetDay]);

  // When category changes, setup default manual sets
  const handleSelectCategory = (cat: ExerciseCategory) => {
    setSelectedCategory(cat);
    if (cat === 'bodyweight') {
      setManualSets([
        { setNumber: 1, weight: null, reps: '12' },
        { setNumber: 2, weight: null, reps: '12' },
        { setNumber: 3, weight: null, reps: '12' },
      ]);
    } else {
      setManualSets([
        { setNumber: 1, weight: 30, reps: '10' },
        { setNumber: 2, weight: 30, reps: '10' },
        { setNumber: 3, weight: 30, reps: '10' },
      ]);
    }
    setStep('choose-method');
  };

  // Filtered Templates
  const filteredTemplates = useMemo(() => {
    return EXERCISE_TEMPLATES.filter((tpl) => {
      if (tpl.category !== selectedCategory) return false;
      if (muscleFilter !== 'All' && tpl.muscleGroup !== muscleFilter) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesName = tpl.name.toLowerCase().includes(q);
        const matchesPrimary = tpl.primaryMuscle.toLowerCase().includes(q);
        const matchesSecondary = tpl.secondaryMuscles.some((m) => m.toLowerCase().includes(q));
        const matchesRank = tpl.rankLabel.toLowerCase().includes(q);
        if (!matchesName && !matchesPrimary && !matchesSecondary && !matchesRank) return false;
      }
      return true;
    }).sort((a, b) => a.rank - b.rank);
  }, [selectedCategory, muscleFilter, searchQuery]);

  // Handle Add Set in Manual Form
  const handleAddSet = () => {
    const last = manualSets[manualSets.length - 1];
    setManualSets([
      ...manualSets,
      {
        setNumber: manualSets.length + 1,
        weight: last ? last.weight : (selectedCategory === 'bodyweight' ? null : 20),
        reps: last ? last.reps : '10',
      },
    ]);
  };

  const handleRemoveSet = (index: number) => {
    if (manualSets.length <= 1) return;
    const updated = manualSets.filter((_, idx) => idx !== index);
    setManualSets(updated.map((s, idx) => ({ ...s, setNumber: idx + 1 })));
  };

  const handleUpdateWeight = (index: number, weight: number | null) => {
    const updated = [...manualSets];
    if (updated[index]) {
      updated[index] = { ...updated[index], weight };
      setManualSets(updated);
    }
  };

  const handleUpdateReps = (index: number, reps: string) => {
    const updated = [...manualSets];
    if (updated[index]) {
      updated[index] = { ...updated[index], reps };
      setManualSets(updated);
    }
  };

  // Submit Manual Exercise
  const handleSaveManualExercise = async () => {
    const trimmed = manualName.trim();
    if (!trimmed) {
      toast.error('Please enter an exercise name');
      return;
    }

    const weights = manualSets.map(s => s.weight).filter((w): w is number => w !== null && w > 0);
    const topWeight = weights.length > 0 ? Math.max(...weights) : null;
    const setsRepsFormatted = formatExerciseSetsReps(manualSets);

    const newEx: Exercise = {
      id: `${selectedDay}-${Date.now()}`,
      name: trimmed,
      setsReps: setsRepsFormatted,
      weight: topWeight,
      sets: manualSets,
    };

    await onExerciseAdded(selectedDay, newEx);
    toast.success(`Added ${trimmed} to ${selectedDay.toUpperCase()}`);
    onClose();
  };

  // Submit Template Exercise
  const handleAddTemplate = async (template: ExerciseTemplate) => {
    const generatedSets: ExerciseSet[] = [];
    for (let i = 1; i <= template.defaultSets; i++) {
      generatedSets.push({
        setNumber: i,
        weight: template.defaultWeightKg,
        reps: template.defaultReps,
        completed: false,
      });
    }

    const newEx: Exercise = {
      id: `${selectedDay}-${template.id}-${Date.now()}`,
      name: template.name,
      setsReps: `${template.defaultSets}×${template.defaultReps}`,
      weight: template.defaultWeightKg,
      sets: generatedSets,
    };

    await onExerciseAdded(selectedDay, newEx);
    toast.success(`🏆 Added ${template.name} to ${selectedDay.toUpperCase()}`);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-background/80 backdrop-blur-md animate-fade-in overflow-y-auto">
      <div 
        className="relative w-full max-w-2xl bg-card border border-border/80 rounded-3xl shadow-2xl overflow-hidden my-auto max-h-[92vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Bar */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-border/60 bg-muted/20">
          <div className="flex items-center gap-2.5">
            {step !== 'choose-category' && (
              <button
                type="button"
                onClick={() => {
                  if (step === 'manual-form' || step === 'template-browser') {
                    setStep('choose-method');
                  } else {
                    setStep('choose-category');
                  }
                }}
                className="w-8 h-8 rounded-xl bg-background border border-border/60 flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors mr-1"
                title="Go back"
              >
                <ArrowLeft className="w-4 h-4" />
              </button>
            )}

            <div>
              <h3 className="font-extrabold text-base sm:text-lg text-foreground tracking-tight flex items-center gap-2">
                <span>Add Exercise</span>
                {selectedCategory && step !== 'choose-category' && (
                  <Badge variant="outline" className="text-[10px] font-semibold uppercase tracking-wider bg-primary/10 text-primary border-primary/20">
                    {selectedCategory === 'bodyweight' ? 'Bodyweight' : 'Gym Equipment'}
                  </Badge>
                )}
              </h3>
              <p className="text-[11px] text-muted-foreground">
                Target Day:{' '}
                <select
                  value={selectedDay}
                  onChange={(e) => setSelectedDay(e.target.value)}
                  className="bg-transparent font-bold text-primary underline underline-offset-2 cursor-pointer outline-none capitalize"
                >
                  {daysList.map((d) => (
                    <option key={d.day} value={d.day} className="bg-card text-foreground">
                      {d.title}
                    </option>
                  ))}
                </select>
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-xl bg-background border border-border/60 flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5">
          {/* ── STEP 1: CHOOSE CATEGORY ────────────────────────────────────────── */}
          {step === 'choose-category' && (
            <div className="space-y-4 py-2">
              <div className="text-center max-w-md mx-auto space-y-1 mb-6">
                <h4 className="text-xl font-bold text-foreground">Select Exercise Category</h4>
                <p className="text-xs text-muted-foreground">
                  Choose whether you are adding bodyweight calisthenics or gym equipment movements.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Bodyweight Card */}
                <button
                  type="button"
                  onClick={() => handleSelectCategory('bodyweight')}
                  className="group relative flex flex-col items-center text-center p-6 rounded-2xl border-2 border-border/70 hover:border-primary bg-card/60 hover:bg-primary/5 transition-all duration-200 hover:shadow-xl hover:shadow-primary/10 active:scale-[0.98]"
                >
                  <div className="w-16 h-16 rounded-2xl bg-emerald-500/15 text-emerald-400 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                    <PersonStanding className="w-9 h-9" />
                  </div>
                  <h5 className="font-extrabold text-base text-foreground mb-1 group-hover:text-primary transition-colors">
                    Bodyweight
                  </h5>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    Calisthenics, push-ups, pull-ups, dips, squats & core exercises without machines.
                  </p>
                  <div className="mt-4 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 text-[11px] font-bold">
                    Zero Equipment Needed
                  </div>
                </button>

                {/* Gym Equipment Card */}
                <button
                  type="button"
                  onClick={() => handleSelectCategory('equipment')}
                  className="group relative flex flex-col items-center text-center p-6 rounded-2xl border-2 border-border/70 hover:border-primary bg-card/60 hover:bg-primary/5 transition-all duration-200 hover:shadow-xl hover:shadow-primary/10 active:scale-[0.98]"
                >
                  <div className="w-16 h-16 rounded-2xl bg-primary/15 text-primary flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                    <Dumbbell className="w-9 h-9" />
                  </div>
                  <h5 className="font-extrabold text-base text-foreground mb-1 group-hover:text-primary transition-colors">
                    Gym Equipment
                  </h5>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    Barbells, dumbbells, cable stations, plate machines & bench strength movements.
                  </p>
                  <div className="mt-4 px-3 py-1 rounded-full bg-primary/10 text-primary text-[11px] font-bold">
                    Weights & Heavy Overload
                  </div>
                </button>
              </div>
            </div>
          )}

          {/* ── STEP 2: CHOOSE METHOD ──────────────────────────────────────────── */}
          {step === 'choose-method' && (
            <div className="space-y-4 py-2">
              <div className="text-center max-w-md mx-auto space-y-1 mb-6">
                <h4 className="text-xl font-bold text-foreground">How would you like to add it?</h4>
                <p className="text-xs text-muted-foreground">
                  Pick from verified ranked exercise templates or type custom details manually.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Add from Template */}
                <button
                  type="button"
                  onClick={() => setStep('template-browser')}
                  className="group relative flex flex-col items-center text-center p-6 rounded-2xl border-2 border-primary/50 hover:border-primary bg-primary/5 hover:bg-primary/10 transition-all duration-200 hover:shadow-xl hover:shadow-primary/15 active:scale-[0.98]"
                >
                  <div className="w-14 h-14 rounded-2xl bg-primary/20 text-primary flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                    <Sparkles className="w-7 h-7" />
                  </div>
                  <div className="flex items-center gap-1.5 mb-1">
                    <Award className="w-4 h-4 text-amber-400" />
                    <h5 className="font-extrabold text-base text-foreground group-hover:text-primary transition-colors">
                      Add from Template
                    </h5>
                  </div>
                  <p className="text-xs text-muted-foreground leading-relaxed mb-3">
                    Browse top #1 & #2 ranked exercises with images, target muscle breakdowns & execution cues.
                  </p>
                  <span className="text-[11px] font-bold text-primary flex items-center gap-1">
                    <span>Ranked Exercise Library</span> →
                  </span>
                </button>

                {/* Add Manually */}
                <button
                  type="button"
                  onClick={() => setStep('manual-form')}
                  className="group relative flex flex-col items-center text-center p-6 rounded-2xl border-2 border-border/70 hover:border-primary bg-card/60 hover:bg-primary/5 transition-all duration-200 hover:shadow-xl hover:shadow-primary/10 active:scale-[0.98]"
                >
                  <div className="w-14 h-14 rounded-2xl bg-muted text-foreground flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                    <Plus className="w-7 h-7" />
                  </div>
                  <h5 className="font-extrabold text-base text-foreground mb-1 group-hover:text-primary transition-colors">
                    Add Manually
                  </h5>
                  <p className="text-xs text-muted-foreground leading-relaxed mb-3">
                    Directly type your custom exercise name, number of sets, target reps & planned weight.
                  </p>
                  <span className="text-[11px] font-bold text-muted-foreground group-hover:text-foreground flex items-center gap-1">
                    <span>Quick Custom Builder</span> →
                  </span>
                </button>
              </div>
            </div>
          )}

          {/* ── STEP 3A: MANUAL FORM ───────────────────────────────────────────── */}
          {step === 'manual-form' && (
            <div className="space-y-4">
              <div>
                <label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground block mb-1.5">
                  Exercise Name
                </label>
                <Input
                  value={manualName}
                  onChange={(e) => setManualName(e.target.value)}
                  placeholder={
                    selectedCategory === 'bodyweight'
                      ? 'e.g. Pull-ups or Diamond Push-ups'
                      : 'e.g. Incline Dumbbell Press'
                  }
                  className="h-11 bg-background font-semibold rounded-xl"
                  autoFocus
                />
              </div>

              {/* Multi-set Config */}
              <div className="space-y-2.5 pt-2 border-t border-border/60">
                <div className="flex items-center justify-between text-[11px] font-bold uppercase tracking-wider text-muted-foreground px-1">
                  <span>Sets & Target Load</span>
                  <span>Target Reps</span>
                </div>

                <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                  {manualSets.map((s, idx) => {
                    const isBW = s.weight === null;
                    return (
                      <div
                        key={idx}
                        className="flex items-center gap-2 p-2 rounded-xl bg-background/80 border border-border/60 text-xs"
                      >
                        <span className="w-7 h-8 flex items-center justify-center text-xs font-black font-mono rounded-lg bg-primary/15 text-primary shrink-0 border border-primary/20">
                          S{idx + 1}
                        </span>

                        {/* Weight Toggle/Input */}
                        <div className="flex items-center flex-1 min-w-0 h-8 rounded-xl border border-border/80 bg-card p-0.5">
                          <button
                            type="button"
                            onClick={() => {
                              if (isBW) {
                                handleUpdateWeight(idx, 20);
                              } else {
                                handleUpdateWeight(idx, null);
                              }
                            }}
                            className={`h-7 px-2 rounded-lg text-[11px] font-extrabold uppercase transition-all shrink-0 flex items-center gap-1 ${
                              isBW
                                ? 'bg-primary text-primary-foreground shadow-sm'
                                : 'text-muted-foreground hover:text-foreground bg-muted/40'
                            }`}
                          >
                            <Scale className="w-3 h-3" />
                            <span>BW</span>
                          </button>

                          <div className="flex items-center flex-1 min-w-0 px-1.5">
                            <input
                              type="number"
                              inputMode="decimal"
                              step="0.5"
                              min="0"
                              placeholder={isBW ? '—' : '0'}
                              value={s.weight !== null ? s.weight : ''}
                              onChange={(e) => {
                                const val = e.target.value;
                                if (val === '') {
                                  handleUpdateWeight(idx, null);
                                } else {
                                  handleUpdateWeight(idx, Math.max(0, parseFloat(val) || 0));
                                }
                              }}
                              className="w-full min-w-0 bg-transparent text-xs font-mono font-bold text-foreground text-center outline-none pr-0.5"
                            />
                            <span className="text-[11px] font-bold text-muted-foreground/60 select-none shrink-0">
                              kg
                            </span>
                          </div>
                        </div>

                        {/* Target Reps */}
                        <div className="flex items-center h-8 rounded-xl bg-card border border-border/80 p-0.5 w-24 shrink-0">
                          <input
                            type="text"
                            placeholder="10"
                            value={String(s.reps || '10').replace(/^[0-9]+\s*[*xX×]\s*/, '')}
                            onChange={(e) => handleUpdateReps(idx, e.target.value)}
                            className="w-full bg-transparent text-xs font-mono font-bold text-foreground text-center outline-none px-1"
                          />
                          <span className="text-[10px] text-muted-foreground pr-1.5 select-none shrink-0">
                            reps
                          </span>
                        </div>

                        {/* Delete Set */}
                        {manualSets.length > 1 && (
                          <Button
                            type="button"
                            size="icon"
                            variant="ghost"
                            onClick={() => handleRemoveSet(idx)}
                            className="h-8 w-7 text-muted-foreground hover:text-destructive rounded-lg shrink-0 p-0"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                        )}
                      </div>
                    );
                  })}
                </div>

                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={handleAddSet}
                  className="w-full h-8 text-xs border-dashed border-primary/40 text-primary hover:bg-primary/10 rounded-xl"
                >
                  <Plus className="w-3.5 h-3.5 mr-1.5" />
                  Add Set
                </Button>
              </div>

              <div className="pt-3 border-t border-border/60 flex items-center justify-end gap-2">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => setStep('choose-method')}
                  className="rounded-xl text-xs h-9 px-4"
                >
                  Back
                </Button>
                <Button
                  type="button"
                  onClick={handleSaveManualExercise}
                  className="rounded-xl text-xs h-9 px-5 bg-primary text-primary-foreground font-semibold shadow-md shadow-primary/20"
                >
                  <Check className="w-3.5 h-3.5 mr-1.5" />
                  Save Exercise to {selectedDay.toUpperCase()}
                </Button>
              </div>
            </div>
          )}

          {/* ── STEP 3B: TEMPLATE BROWSER ──────────────────────────────────────── */}
          {step === 'template-browser' && (
            <div className="space-y-4">
              {/* Search & Muscle Group Filters */}
              <div className="space-y-2.5">
                <div className="relative">
                  <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search by exercise or muscle (e.g. Chest, Lats, Quads)…"
                    className="h-10 pl-9 bg-background/80 rounded-xl text-xs"
                  />
                  {searchQuery && (
                    <button
                      type="button"
                      onClick={() => setSearchQuery('')}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground text-xs"
                    >
                      Clear
                    </button>
                  )}
                </div>

                {/* Muscle Pills */}
                <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar text-xs">
                  {['All', 'Chest', 'Back', 'Legs', 'Shoulders', 'Arms', 'Core'].map((m) => (
                    <button
                      key={m}
                      type="button"
                      onClick={() => setMuscleFilter(m)}
                      className={`px-3 py-1 rounded-xl text-xs font-semibold shrink-0 transition-all ${
                        muscleFilter === m
                          ? 'bg-primary text-primary-foreground shadow-sm shadow-primary/20'
                          : 'bg-muted/50 hover:bg-muted text-muted-foreground hover:text-foreground border border-border/40'
                      }`}
                    >
                      {m}
                    </button>
                  ))}
                </div>
              </div>

              {/* Template Cards List */}
              <div className="space-y-3.5 max-h-[55vh] overflow-y-auto pr-1">
                {filteredTemplates.length === 0 ? (
                  <div className="text-center py-10 space-y-2 bg-muted/20 rounded-2xl border border-dashed border-border/70 p-6">
                    <BookOpen className="w-8 h-8 mx-auto text-muted-foreground/60" />
                    <p className="text-sm font-semibold text-foreground">No template exercises found</p>
                    <p className="text-xs text-muted-foreground">
                      Try adjusting your muscle filter or search terms, or switch to Add Manually.
                    </p>
                  </div>
                ) : (
                  filteredTemplates.map((template) => {
                    const isHowToExpanded = expandedHowToId === template.id;

                    return (
                      <div
                        key={template.id}
                        className="p-3.5 sm:p-4 rounded-2xl border border-border/80 bg-card/80 hover:bg-card hover:border-primary/40 transition-all shadow-sm space-y-3"
                      >
                        {/* Top: Image + Info */}
                        <div className="flex gap-3.5 items-start">
                          {/* Image preview with fallback */}
                          <div className="relative w-20 h-20 sm:w-24 sm:h-24 rounded-xl overflow-hidden bg-muted shrink-0 border border-border/60">
                            <img
                              src={template.image}
                              alt={template.name}
                              className="w-full h-full object-cover"
                              loading="lazy"
                              onError={(e) => {
                                // fallback to styled placeholder if image url is unreachable
                                (e.target as HTMLElement).style.display = 'none';
                              }}
                            />
                            {/* Rank badge overlay */}
                            <div className="absolute top-1 left-1 px-1.5 py-0.5 rounded-md bg-black/75 backdrop-blur-sm text-[9px] font-black text-amber-300 border border-amber-400/30 flex items-center gap-0.5">
                              <span>#{template.rank}</span>
                            </div>
                          </div>

                          {/* Exercise Title, Rank & Muscles */}
                          <div className="flex-1 min-w-0 space-y-1">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <h5 className="font-extrabold text-sm sm:text-base text-foreground leading-tight">
                                {template.name}
                              </h5>
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/15 text-amber-300 border border-amber-500/30">
                                {template.rankLabel}
                              </span>
                            </div>

                            {/* Muscles Targeted */}
                            <div className="space-y-0.5 text-[11px] pt-0.5">
                              <p className="text-foreground/90 font-medium">
                                <span className="text-primary font-bold">🎯 Primary:</span>{' '}
                                {template.primaryMuscle}
                              </p>
                              {template.secondaryMuscles.length > 0 && (
                                <p className="text-muted-foreground text-[10px]">
                                  <span className="font-semibold text-muted-foreground/80">⚡ Secondary:</span>{' '}
                                  {template.secondaryMuscles.join(', ')}
                                </p>
                              )}
                            </div>

                            {/* Recommended sets/reps */}
                            <div className="flex items-center gap-2 pt-1 text-[10px] text-muted-foreground">
                              <Badge variant="outline" className="px-1.5 py-0 text-[10px] font-mono">
                                {template.defaultSets} sets × {template.defaultReps}
                              </Badge>
                              {template.defaultWeightKg !== null ? (
                                <Badge variant="secondary" className="px-1.5 py-0 text-[10px] font-mono bg-primary/10 text-primary">
                                  Rec: {template.defaultWeightKg} kg
                                </Badge>
                              ) : (
                                <Badge variant="outline" className="px-1.5 py-0 text-[10px] text-emerald-400 border-emerald-500/30">
                                  Bodyweight (BW)
                                </Badge>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Expandable How To Perform */}
                        {template.howToPerform && template.howToPerform.length > 0 && (
                          <div className="pt-2 border-t border-border/40">
                            <button
                              type="button"
                              onClick={() => setExpandedHowToId(isHowToExpanded ? null : template.id)}
                              className="text-[11px] font-bold text-primary hover:underline flex items-center gap-1"
                            >
                              <Info className="w-3 h-3" />
                              <span>{isHowToExpanded ? 'Hide Form & Performance Guide' : 'How to Perform & Form Guide'}</span>
                              {isHowToExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                            </button>

                            {isHowToExpanded && (
                              <div className="mt-2.5 p-3 rounded-xl bg-background/60 border border-border/50 space-y-2 text-xs text-foreground/90 animate-fade-in">
                                <p className="font-bold text-[11px] uppercase tracking-wider text-muted-foreground">
                                  Step-by-Step Execution:
                                </p>
                                <ol className="list-decimal list-inside space-y-1 text-[11px] text-muted-foreground leading-relaxed pl-1">
                                  {template.howToPerform.map((stepText, idx) => (
                                    <li key={idx}>
                                      <span className="text-foreground">{stepText}</span>
                                    </li>
                                  ))}
                                </ol>
                                {template.tips && (
                                  <p className="text-[11px] text-amber-400/90 pt-1 border-t border-border/40 font-medium">
                                    💡 <strong className="text-amber-300">Coach Tip:</strong> {template.tips}
                                  </p>
                                )}
                              </div>
                            )}
                          </div>
                        )}

                        {/* Add Button */}
                        <div className="pt-1 flex justify-end">
                          <Button
                            type="button"
                            size="sm"
                            onClick={() => handleAddTemplate(template)}
                            className="rounded-xl text-xs font-bold h-8 px-4 bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm shadow-primary/20"
                          >
                            <Plus className="w-3.5 h-3.5 mr-1" />
                            Add to {selectedDay.toUpperCase()}
                          </Button>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
