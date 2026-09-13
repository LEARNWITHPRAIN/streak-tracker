import React, { useState } from 'react';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription,
  DialogFooter 
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { DietProfile, CalculatedMacros } from '@/hooks/useDiet';
import { SlidersHorizontal, RotateCcw } from 'lucide-react';

interface MacroGoalEditorProps {
  isOpen: boolean;
  onClose: () => void;
  dietProfile: DietProfile;
  onSave: (goals: Partial<CalculatedMacros>) => Promise<boolean>;
  onResetToCalculated?: () => void;
}

export const MacroGoalEditor: React.FC<MacroGoalEditorProps> = ({
  isOpen,
  onClose,
  dietProfile,
  onSave,
  onResetToCalculated,
}) => {
  const [goals, setGoals] = useState({
    daily_calories: dietProfile.daily_calories,
    daily_protein_g: dietProfile.daily_protein_g,
    daily_carbs_g: dietProfile.daily_carbs_g,
    daily_fat_g: dietProfile.daily_fat_g,
    daily_fiber_g: dietProfile.daily_fiber_g || 30,
  });
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const ok = await onSave(goals);
      if (ok) onClose();
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md bg-card/95 backdrop-blur-xl border border-border/80">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-foreground">
            <SlidersHorizontal className="w-5 h-5 text-purple-400" />
            Adjust Daily Nutrition Targets
          </DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground">
            Customize your daily macro benchmarks. All progress tracking will immediately sync with these numbers.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 py-2">
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground flex justify-between">
              <span>Daily Calorie Target</span>
              <span className="font-mono text-orange-400 font-semibold">{goals.daily_calories} kcal</span>
            </Label>
            <Input
              type="number"
              min={800}
              max={6000}
              value={goals.daily_calories}
              onChange={(e) => setGoals({ ...goals, daily_calories: Number(e.target.value) || 0 })}
              className="bg-background/50 border-border text-foreground font-mono"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground flex justify-between">
                <span>Protein (g)</span>
                <span className="font-mono text-purple-400 font-semibold">{goals.daily_protein_g}g</span>
              </Label>
              <Input
                type="number"
                min={20}
                max={400}
                value={goals.daily_protein_g}
                onChange={(e) => setGoals({ ...goals, daily_protein_g: Number(e.target.value) || 0 })}
                className="bg-background/50 border-border text-foreground font-mono"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground flex justify-between">
                <span>Carbs (g)</span>
                <span className="font-mono text-blue-400 font-semibold">{goals.daily_carbs_g}g</span>
              </Label>
              <Input
                type="number"
                min={0}
                max={600}
                value={goals.daily_carbs_g}
                onChange={(e) => setGoals({ ...goals, daily_carbs_g: Number(e.target.value) || 0 })}
                className="bg-background/50 border-border text-foreground font-mono"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground flex justify-between">
                <span>Fats (g)</span>
                <span className="font-mono text-pink-400 font-semibold">{goals.daily_fat_g}g</span>
              </Label>
              <Input
                type="number"
                min={10}
                max={200}
                value={goals.daily_fat_g}
                onChange={(e) => setGoals({ ...goals, daily_fat_g: Number(e.target.value) || 0 })}
                className="bg-background/50 border-border text-foreground font-mono"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground flex justify-between">
                <span>Fiber (g)</span>
                <span className="font-mono text-emerald-400 font-semibold">{goals.daily_fiber_g}g</span>
              </Label>
              <Input
                type="number"
                min={0}
                max={100}
                value={goals.daily_fiber_g}
                onChange={(e) => setGoals({ ...goals, daily_fiber_g: Number(e.target.value) || 0 })}
                className="bg-background/50 border-border text-foreground font-mono"
              />
            </div>
          </div>

          <DialogFooter className="flex items-center justify-between sm:justify-between pt-4">
            {onResetToCalculated && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => {
                  onResetToCalculated();
                  onClose();
                }}
                className="text-xs text-muted-foreground hover:text-foreground"
              >
                <RotateCcw className="w-3.5 h-3.5 mr-1.5" /> Recompute Profile
              </Button>
            )}
            <div className="flex gap-2">
              <Button type="button" variant="outline" size="sm" onClick={onClose}>
                Cancel
              </Button>
              <Button
                type="submit"
                size="sm"
                disabled={saving}
                className="bg-purple-600 hover:bg-purple-500 text-white"
              >
                {saving ? 'Saving...' : 'Save Targets'}
              </Button>
            </div>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
