import React, { useState } from 'react';
import { 
  Dumbbell, Heart, Zap, Target, Footprints, Flame, Moon, Check, Pencil, 
  Trash2, Plus, X, Scale, ChevronDown, ChevronUp
} from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useUserWorkouts, Exercise, DaySchedule, ExerciseSet, getExerciseSets, parseReps, formatExerciseSetsReps } from '@/hooks/useUserWorkouts';
import { toast } from 'sonner';

const dayIcons: Record<string, React.ReactNode> = {
  monday: <Dumbbell className="w-5 h-5" />,
  tuesday: <Target className="w-5 h-5" />,
  wednesday: <Heart className="w-5 h-5" />,
  thursday: <Footprints className="w-5 h-5" />,
  friday: <Zap className="w-5 h-5" />,
  saturday: <Flame className="w-5 h-5" />,
  sunday: <Moon className="w-5 h-5" />,
};

const dayColors: Record<string, string> = {
  monday: 'text-primary',
  tuesday: 'text-primary',
  wednesday: 'text-primary',
  thursday: 'text-primary',
  friday: 'text-primary',
  saturday: 'text-primary',
  sunday: 'text-muted-foreground',
};

interface ExerciseFormState {
  name: string;
  sets: ExerciseSet[];
}

export const WeeklySchedule: React.FC = () => {
  const { schedule, loading: scheduleLoading, updateDayWorkout } = useUserWorkouts();
  const [editingDay, setEditingDay] = useState<string | null>(null);
  const [editDayForm, setEditDayForm] = useState({ title: '', subtitle: '' });

  // Multi-set Exercise Editor State
  const [editingExerciseId, setEditingExerciseId] = useState<string | null>(null);
  const [addingToDay, setAddingToDay] = useState<string | null>(null);
  const [exerciseForm, setExerciseForm] = useState<ExerciseFormState>({
    name: '',
    sets: [
      { setNumber: 1, weight: null, reps: '10' },
      { setNumber: 2, weight: null, reps: '10' },
      { setNumber: 3, weight: null, reps: '10' },
    ],
  });
  
  const today = new Date().toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();

  // Day header edit
  const startEditDay = (day: DaySchedule) => {
    setEditDayForm({ title: day.title, subtitle: day.subtitle });
    setEditingDay(day.day);
  };

  const saveEditDay = async (dayName: string) => {
    const day = schedule.find(d => d.day === dayName);
    if (day) {
      await updateDayWorkout(dayName, { ...day, title: editDayForm.title, subtitle: editDayForm.subtitle });
    }
    setEditingDay(null);
  };

  // Start adding a new exercise
  const startAddExercise = (dayName: string) => {
    setAddingToDay(dayName);
    setEditingExerciseId(null);
    setExerciseForm({
      name: '',
      sets: [
        { setNumber: 1, weight: null, reps: '10' },
        { setNumber: 2, weight: null, reps: '10' },
        { setNumber: 3, weight: null, reps: '10' },
      ],
    });
  };

  // Start editing an existing exercise
  const startEditExercise = (exercise: Exercise) => {
    setEditingExerciseId(exercise.id);
    setAddingToDay(null);
    const existingSets = getExerciseSets(exercise);
    setExerciseForm({
      name: exercise.name,
      sets: existingSets.map((s, idx) => ({
        setNumber: idx + 1,
        weight: s.weight,
        reps: String(s.reps || '10').replace(/^[0-9]+\s*[*xX×]\s*/, ''),
      })),
    });
  };

  // Helper to add a set to the form
  const handleAddSetToForm = () => {
    const current = [...exerciseForm.sets];
    const last = current[current.length - 1];
    current.push({
      setNumber: current.length + 1,
      weight: last ? last.weight : null,
      reps: last ? last.reps : '10',
    });
    setExerciseForm({ ...exerciseForm, sets: current });
  };

  // Helper to remove a set from the form
  const handleRemoveSetFromForm = (index: number) => {
    if (exerciseForm.sets.length <= 1) return;
    const current = exerciseForm.sets.filter((_, idx) => idx !== index);
    const renumbered = current.map((s, idx) => ({ ...s, setNumber: idx + 1 }));
    setExerciseForm({ ...exerciseForm, sets: renumbered });
  };

  // Helper to update set weight in form
  const handleUpdateSetWeightInForm = (index: number, weight: number | null) => {
    const current = [...exerciseForm.sets];
    if (current[index]) {
      current[index] = { ...current[index], weight };
      setExerciseForm({ ...exerciseForm, sets: current });
    }
  };

  // Helper to update set reps in form
  const handleUpdateSetRepsInForm = (index: number, reps: string) => {
    const current = [...exerciseForm.sets];
    if (current[index]) {
      current[index] = { ...current[index], reps };
      setExerciseForm({ ...exerciseForm, sets: current });
    }
  };

  // Save the exercise (either create new or update existing)
  const handleSaveExercise = async (dayName: string) => {
    const name = exerciseForm.name.trim();
    if (!name) {
      toast.error('Please enter an exercise name');
      return;
    }
    if (exerciseForm.sets.length === 0) {
      toast.error('Please add at least 1 set');
      return;
    }

    const day = schedule.find(d => d.day === dayName);
    if (!day) return;

    // Calculate base weight and setsReps string
    const weights = exerciseForm.sets.map(s => s.weight).filter((w): w is number => w !== null && w > 0);
    const topWeight = weights.length > 0 ? Math.max(...weights) : null;
    const setsRepsFormatted = formatExerciseSetsReps(exerciseForm.sets);

    if (editingExerciseId) {
      // Update existing
      const updatedExercises = day.exercises.map(e => {
        if (e.id === editingExerciseId) {
          return {
            ...e,
            name,
            setsReps: setsRepsFormatted,
            weight: topWeight,
            sets: exerciseForm.sets,
          };
        }
        return e;
      });
      await updateDayWorkout(dayName, { ...day, exercises: updatedExercises });
      toast.success('Exercise updated');
    } else {
      // Add new
      const newEx: Exercise = {
        id: `${dayName}-${Date.now()}`,
        name,
        setsReps: setsRepsFormatted,
        weight: topWeight,
        sets: exerciseForm.sets,
      };
      const updatedExercises = [...day.exercises, newEx];
      await updateDayWorkout(dayName, { ...day, exercises: updatedExercises });
      toast.success('Exercise added');
    }

    setEditingExerciseId(null);
    setAddingToDay(null);
  };

  // Delete exercise
  const deleteExercise = async (dayName: string, exerciseId: string) => {
    const day = schedule.find(d => d.day === dayName);
    if (day) {
      const updatedExercises = day.exercises.filter(e => e.id !== exerciseId);
      await updateDayWorkout(dayName, { ...day, exercises: updatedExercises });
      toast.success('Exercise removed');
    }
  };

  if (scheduleLoading) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground animate-pulse">Loading schedule...</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-lg font-bold text-foreground">Weekly Workout Split</h2>
          <p className="text-xs text-muted-foreground">Your structured training program with custom sets and weights</p>
        </div>
      </div>

      <Tabs defaultValue={today} className="w-full">
        <TabsList className="w-full grid grid-cols-7 gap-1.5 bg-card/60 p-1.5 rounded-2xl border border-border/50 h-auto">

          {schedule.map((day) => (
            <TabsTrigger
              key={day.day}
              value={day.day}
              className="text-xs md:text-sm font-semibold py-2.5 rounded-xl data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-lg transition-all"
            >
              {day.shortDay}
            </TabsTrigger>
          ))}
        </TabsList>

        {schedule.map((day) => (
          <TabsContent key={day.day} value={day.day} className="mt-6 space-y-4">
            {/* Day Header */}
            {editingDay === day.day ? (
              <div className="flex items-center gap-3 p-4 bg-card/60 rounded-2xl border border-border/50">
                <div className={`w-12 h-12 rounded-xl bg-card flex items-center justify-center ${dayColors[day.day]}`}>
                  {dayIcons[day.day]}
                </div>
                <div className="flex-1 space-y-2">
                  <Input
                    value={editDayForm.title}
                    onChange={(e) => setEditDayForm({ ...editDayForm, title: e.target.value })}
                    className="h-9 font-bold bg-background/70 rounded-xl"
                    placeholder="Day title"
                  />
                  <Input
                    value={editDayForm.subtitle}
                    onChange={(e) => setEditDayForm({ ...editDayForm, subtitle: e.target.value })}
                    className="h-8 text-xs bg-background/70 rounded-xl"
                    placeholder="Subtitle"
                  />
                </div>
                <Button size="icon" variant="ghost" onClick={() => saveEditDay(day.day)} className="h-9 w-9 rounded-xl">
                  <Check className="w-4 h-4 text-primary" />
                </Button>
                <Button size="icon" variant="ghost" onClick={() => setEditingDay(null)} className="h-9 w-9 rounded-xl">
                  <X className="w-4 h-4" />
                </Button>
              </div>
            ) : (
              <div className="flex items-center justify-between gap-3 p-4 bg-card/60 rounded-2xl border border-border/50 group">
                <div className="flex items-center gap-3.5">
                  <div className={`w-12 h-12 rounded-2xl bg-background/80 border border-border/50 flex items-center justify-center ${dayColors[day.day]}`}>
                    {dayIcons[day.day]}
                  </div>
                  <div>
                    <h3 className={`text-lg font-bold ${dayColors[day.day]}`}>{day.title}</h3>
                    <p className="text-xs md:text-sm text-muted-foreground">{day.subtitle}</p>
                  </div>
                </div>
                <Button 
                  size="sm" 
                  variant="outline" 
                  onClick={() => startEditDay(day)}
                  className="rounded-xl text-xs"
                >
                  <Pencil className="w-3.5 h-3.5 mr-1.5" />
                  Edit Day
                </Button>
              </div>
            )}

            {/* Exercises Grid */}
            {day.exercises.length > 0 || addingToDay === day.day ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {day.exercises.map((exercise) => {
                  const isEditingThis = editingExerciseId === exercise.id;
                  
                  if (isEditingThis) {
                    return (
                      <WeeklyExerciseEditorCard
                        key={exercise.id}
                        form={exerciseForm}
                        onNameChange={(name) => setExerciseForm({ ...exerciseForm, name })}
                        onAddSet={handleAddSetToForm}
                        onRemoveSet={handleRemoveSetFromForm}
                        onUpdateWeight={handleUpdateSetWeightInForm}
                        onUpdateReps={handleUpdateSetRepsInForm}
                        onSave={() => handleSaveExercise(day.day)}
                        onCancel={() => setEditingExerciseId(null)}
                      />
                    );
                  }

                  const sets = getExerciseSets(exercise);
                  const weights = sets.map(s => s.weight).filter((w): w is number => w !== null && w > 0);
                  const topWeight = weights.length > 0 ? Math.max(...weights) : (exercise.weight ?? null);

                  return (
                    <WeeklyExerciseViewCard
                      key={exercise.id}
                      exercise={exercise}
                      sets={sets}
                      topWeight={topWeight}
                      dayColor={dayColors[day.day]}
                      onEdit={() => startEditExercise(exercise)}
                      onDelete={() => deleteExercise(day.day, exercise.id)}
                    />
                  );
                })}

                {/* Add Exercise Multi-Set Editor */}
                {addingToDay === day.day && (
                  <WeeklyExerciseEditorCard
                    form={exerciseForm}
                    isNew
                    onNameChange={(name) => setExerciseForm({ ...exerciseForm, name })}
                    onAddSet={handleAddSetToForm}
                    onRemoveSet={handleRemoveSetFromForm}
                    onUpdateWeight={handleUpdateSetWeightInForm}
                    onUpdateReps={handleUpdateSetRepsInForm}
                    onSave={() => handleSaveExercise(day.day)}
                    onCancel={() => setAddingToDay(null)}
                  />
                )}
              </div>
            ) : day.day === 'sunday' ? (
              <Card className="bg-card/30 border-dashed rounded-2xl p-8 text-center">
                <CardContent className="space-y-2">
                  <Moon className="w-10 h-10 mx-auto text-muted-foreground/60" />
                  <p className="text-base font-semibold text-muted-foreground">Take time to rest and recover</p>
                  <p className="text-xs text-muted-foreground/60 mt-1">Your muscles grow and rebuild during rest!</p>
                </CardContent>
              </Card>
            ) : null}

            {/* Add Exercise Button */}
            {addingToDay !== day.day && !editingExerciseId && (
              <Button
                variant="outline"
                size="lg"
                onClick={() => startAddExercise(day.day)}
                className="w-full border-dashed rounded-2xl py-5 border-border hover:border-primary/50 text-sm font-semibold"
              >
                <Plus className="w-4 h-4 mr-2 text-primary" />
                Add Exercise to {day.title}
              </Button>
            )}
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
};

// ── Exercise View Card in Weekly Schedule ───────────────────────────────────────
interface WeeklyExerciseViewCardProps {
  exercise: Exercise;
  sets: ExerciseSet[];
  topWeight: number | null;
  dayColor: string;
  onEdit: () => void;
  onDelete: () => void;
}

const WeeklyExerciseViewCard: React.FC<WeeklyExerciseViewCardProps> = ({
  exercise,
  sets,
  topWeight,
  dayColor,
  onEdit,
  onDelete,
}) => {
  const [isExpanded, setIsExpanded] = useState(true);

  return (
    <Card className="transition-all duration-200 bg-card/75 hover:bg-card border-border/60 hover:border-primary/30 rounded-2xl overflow-hidden shadow-sm">
      <CardContent className="p-4 space-y-3">
        {/* Header */}
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-xl bg-background/80 border border-border/50 flex items-center justify-center shrink-0 ${dayColor}`}>
            <Dumbbell className="w-5 h-5" />
          </div>

          <div className="flex-1 min-w-0">
            <h4 className="font-bold text-base text-foreground truncate">{exercise.name}</h4>
            <div className="flex items-center gap-2 mt-1">
              <Badge variant="outline" className="text-xs bg-background/60 font-mono">
                {sets.length} sets
              </Badge>
              {topWeight !== null ? (
                <Badge variant="secondary" className="text-[10px] font-mono px-2 py-0 bg-primary/15 text-primary border border-primary/30">
                  Top: {topWeight} kg
                </Badge>
              ) : (
                <Badge variant="outline" className="text-[10px] font-medium px-2 py-0 text-muted-foreground">
                  Bodyweight (BW)
                </Badge>
              )}
            </div>
          </div>

          <div className="flex items-center gap-1 shrink-0">
            <Button size="icon" variant="ghost" onClick={onEdit} className="h-8 w-8 rounded-lg hover:bg-muted" title="Edit exercise">
              <Pencil className="w-3.5 h-3.5 text-muted-foreground hover:text-foreground" />
            </Button>
            <Button size="icon" variant="ghost" onClick={onDelete} className="h-8 w-8 rounded-lg text-destructive hover:bg-destructive/10" title="Delete exercise">
              <Trash2 className="w-3.5 h-3.5" />
            </Button>
            <Button size="icon" variant="ghost" onClick={() => setIsExpanded(!isExpanded)} className="h-8 w-8 rounded-lg text-muted-foreground">
              {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </Button>
          </div>
        </div>

        {/* Set Breakdown List */}
        {isExpanded && (
          <div className="pt-2 border-t border-border/40 space-y-1.5">
            <div className="flex items-center justify-between text-[11px] font-bold uppercase tracking-wider text-muted-foreground px-1">
              <span>Set & Weight</span>
              <span>Reps</span>
            </div>

            {sets.map((s, idx) => (
              <div
                key={idx}
                className="flex items-center justify-between gap-2 p-2 rounded-xl bg-background/40 border border-border/40 text-xs"
              >
                <div className="flex items-center gap-2">
                  <span className="font-bold font-mono px-2 py-0.5 rounded-md bg-muted/60 text-muted-foreground text-[11px]">
                    S{s.setNumber || idx + 1}
                  </span>
                  <span className="flex items-center gap-1 font-mono font-medium text-foreground">
                    <Scale className="w-3 h-3 text-primary shrink-0" />
                    {s.weight !== null ? `${s.weight} kg` : 'Bodyweight'}
                  </span>
                </div>

                <span className="font-mono font-semibold text-muted-foreground px-1.5">
                  {String(s.reps || '10').replace(/^[0-9]+\s*[*xX×]\s*/, '')} reps
                </span>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

// ── Exercise Multi-Set Editor Card (For Add & Edit) ─────────────────────────────
interface WeeklyExerciseEditorCardProps {
  form: ExerciseFormState;
  isNew?: boolean;
  onNameChange: (name: string) => void;
  onAddSet: () => void;
  onRemoveSet: (index: number) => void;
  onUpdateWeight: (index: number, weight: number | null) => void;
  onUpdateReps: (index: number, reps: string) => void;
  onSave: () => void;
  onCancel: () => void;
}

const WeeklyExerciseEditorCard: React.FC<WeeklyExerciseEditorCardProps> = ({
  form,
  isNew = false,
  onNameChange,
  onAddSet,
  onRemoveSet,
  onUpdateWeight,
  onUpdateReps,
  onSave,
  onCancel,
}) => {
  return (
    <Card className="bg-card/90 border-primary/50 rounded-2xl shadow-xl overflow-hidden animate-scale-in">
      <CardContent className="p-4 space-y-3.5">
        {/* Title Input */}
        <div>
          <label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground block mb-1">
            Exercise Name
          </label>
          <Input
            value={form.name}
            onChange={(e) => onNameChange(e.target.value)}
            placeholder="e.g. Incline Dumbbell Press"
            className="h-10 bg-background font-semibold rounded-xl"
            autoFocus={isNew}
          />
        </div>

        {/* Sets Config List */}
        <div className="space-y-2 pt-2 border-t border-border/50">
          <div className="flex items-center justify-between text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-muted-foreground px-1">
            <div className="flex items-center gap-2">
              <span className="w-7 text-center">Set</span>
              <span className="pl-0.5">Weight (kg)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-[84px] text-center">Target Reps</span>
              {form.sets.length > 1 && <span className="w-7"></span>}
            </div>
          </div>

          <div className="space-y-2 max-h-72 overflow-y-auto pr-0.5">
            {form.sets.map((set, idx) => {
              const isBW = set.weight === null;

              return (
                <div key={idx} className="flex items-center gap-1.5 p-1.5 sm:p-2 rounded-xl bg-background/80 border border-border/60 hover:border-border/80 transition-colors">
                  {/* Set Badge */}
                  <span className="w-7 h-8 flex items-center justify-center text-xs font-black font-mono rounded-lg bg-primary/15 text-primary shrink-0 border border-primary/20">
                    S{idx + 1}
                  </span>

                  {/* Weight Control: BW Button + Dedicated kg Input */}
                  <div className={`flex items-center flex-1 min-w-0 h-8 rounded-xl border p-0.5 transition-all shadow-inner ${
                    !isBW
                      ? 'bg-background border-primary/50 shadow-sm ring-1 ring-primary/20'
                      : 'bg-card border-border/80'
                  }`}>
                    {/* Compact BW Toggle Pill */}
                    <button
                      type="button"
                      onClick={() => {
                        if (isBW) {
                          onUpdateWeight(idx, 20);
                        } else {
                          onUpdateWeight(idx, null);
                        }
                      }}
                      className={`h-7 px-2 rounded-lg text-[11px] font-extrabold uppercase transition-all shrink-0 flex items-center gap-1 ${
                        isBW
                          ? 'bg-primary text-primary-foreground shadow-sm'
                          : 'text-muted-foreground hover:text-foreground bg-muted/40 hover:bg-muted/70'
                      }`}
                      title={isBW ? "Currently Bodyweight. Click to set weight in kg" : "Click to switch to Bodyweight"}
                    >
                      <Scale className="w-3 h-3" />
                      <span>BW</span>
                    </button>

                    {/* Numeric Weight Input */}
                    <div className="flex items-center flex-1 min-w-0 px-1.5">
                      <input
                        type="number"
                        inputMode="decimal"
                        step="0.5"
                        min="0"
                        placeholder={isBW ? "—" : "0"}
                        value={set.weight !== null ? set.weight : ''}
                        onChange={(e) => {
                          const val = e.target.value;
                          if (val === '') {
                            onUpdateWeight(idx, null);
                          } else {
                            onUpdateWeight(idx, Math.max(0, parseFloat(val) || 0));
                          }
                        }}
                        className="w-full min-w-0 bg-transparent text-xs font-mono font-bold text-foreground text-center outline-none pr-0.5 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                      />
                      <span className={`text-[11px] font-bold select-none shrink-0 ${!isBW ? 'text-primary' : 'text-muted-foreground/40'}`}>
                        kg
                      </span>
                    </div>
                  </div>

                  {/* Target Reps Input */}
                  <div className="flex items-center h-8 rounded-xl bg-card border border-border/80 p-0.5 shadow-inner w-[84px] shrink-0">
                    <input
                      type="text"
                      inputMode="numeric"
                      placeholder="10"
                      value={String(set.reps || '').replace(/^[0-9]+\s*[*xX×]\s*/, '')}
                      onChange={(e) => onUpdateReps(idx, e.target.value)}
                      className="w-full min-w-0 bg-transparent text-xs font-mono font-bold text-foreground text-center outline-none px-1"
                    />
                    <span className="text-[11px] font-semibold text-muted-foreground pr-1.5 select-none shrink-0">
                      reps
                    </span>
                  </div>

                  {/* Delete Set */}
                  {form.sets.length > 1 && (
                    <Button
                      type="button"
                      size="icon"
                      variant="ghost"
                      onClick={() => onRemoveSet(idx)}
                      className="h-8 w-7 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-lg shrink-0 transition-colors p-0"
                      title="Remove this set"
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
            onClick={onAddSet}
            className="w-full h-8 text-xs border-dashed border-primary/40 text-primary hover:bg-primary/10 rounded-xl"
          >
            <Plus className="w-3.5 h-3.5 mr-1.5" />
            Add Set
          </Button>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-2 pt-2 border-t border-border/50">
          <Button
            type="button"
            size="sm"
            variant="ghost"
            onClick={onCancel}
            className="rounded-xl text-xs h-9 px-4 text-muted-foreground hover:text-foreground"
          >
            Cancel
          </Button>
          <Button
            type="button"
            size="sm"
            onClick={onSave}
            className="rounded-xl text-xs h-9 px-5 bg-primary text-primary-foreground font-semibold shadow-md shadow-primary/20"
          >
            <Check className="w-3.5 h-3.5 mr-1.5" />
            {isNew ? 'Add Exercise' : 'Save Changes'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default WeeklySchedule;
