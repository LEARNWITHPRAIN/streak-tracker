import React, { useState } from 'react';
import { Plus, Sparkles, Check, ChevronDown, ChevronUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { NewMealInput } from '@/hooks/useMealLogs';

interface ManualMealEntryProps {
  onAddMeal: (meal: NewMealInput) => Promise<boolean>;
}

// Helpful Indian & general fitness food presets for instant 1-tap logging
const QUICK_PRESETS = [
  { name: 'Whey Protein Scoop (1 scoop)', calories: 120, protein: 24, carbs: 3, fat: 1.5 },
  { name: 'Boiled Eggs (3 whole)', calories: 210, protein: 18, carbs: 1.5, fat: 15 },
  { name: 'Egg Whites (4 whites)', calories: 68, protein: 14, carbs: 1, fat: 0.2 },
  { name: 'Chicken Breast (150g cooked)', calories: 247, protein: 46, carbs: 0, fat: 5 },
  { name: 'Paneer / Cottage Cheese (100g)', calories: 265, protein: 18, carbs: 4, fat: 20 },
  { name: 'Oatmeal with Milk & Honey (1 bowl)', calories: 310, protein: 12, carbs: 54, fat: 6 },
  { name: 'Greek Yogurt / Curd (150g)', calories: 100, protein: 15, carbs: 6, fat: 1 },
  { name: 'Chapati / Roti (2 pcs with ghee)', calories: 220, protein: 6, carbs: 36, fat: 6 },
  { name: 'Cooked White/Brown Rice (1 cup)', calories: 205, protein: 4, carbs: 45, fat: 0.5 },
  { name: 'Dal Tadka (1 katori / bowl)', calories: 150, protein: 9, carbs: 20, fat: 4 },
];

export const ManualMealEntry: React.FC<ManualMealEntryProps> = ({ onAddMeal }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showPresets, setShowPresets] = useState(false);

  const [form, setForm] = useState({
    meal_name: '',
    calories_kcal: '',
    protein_g: '',
    carbs_g: '',
    fat_g: '',
    notes: '',
  });

  const handlePresetSelect = (preset: typeof QUICK_PRESETS[0]) => {
    setForm({
      meal_name: preset.name,
      calories_kcal: String(preset.calories),
      protein_g: String(preset.protein),
      carbs_g: String(preset.carbs),
      fat_g: String(preset.fat),
      notes: '',
    });
    setIsOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.meal_name.trim()) return;

    setSaving(true);
    try {
      const ok = await onAddMeal({
        meal_name: form.meal_name,
        calories_kcal: Number(form.calories_kcal) || 0,
        protein_g: Number(form.protein_g) || 0,
        carbs_g: Number(form.carbs_g) || 0,
        fat_g: Number(form.fat_g) || 0,
        notes: form.notes || undefined,
        source: 'manual',
      });

      if (ok) {
        setForm({
          meal_name: '',
          calories_kcal: '',
          protein_g: '',
          carbs_g: '',
          fat_g: '',
          notes: '',
        });
        setIsOpen(false);
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="rounded-2xl border border-border/80 bg-card/50 backdrop-blur-sm p-4 space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
            <span>Log Meal Manually</span>
            <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
              Free
            </span>
          </h3>
          <p className="text-xs text-muted-foreground">Type macros manually or pick a common fitness food preset</p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setShowPresets(!showPresets)}
            className="text-xs border-border/70 text-muted-foreground hover:text-foreground"
          >
            Quick Presets {showPresets ? <ChevronUp className="w-3 h-3 ml-1" /> : <ChevronDown className="w-3 h-3 ml-1" />}
          </Button>

          <Button
            type="button"
            size="sm"
            onClick={() => setIsOpen(!isOpen)}
            className="bg-primary hover:bg-primary/90 text-primary-foreground text-xs rounded-xl font-bold"
          >
            <Plus className="w-3.5 h-3.5 mr-1" />
            {isOpen ? 'Close' : 'Add Food'}
          </Button>
        </div>
      </div>

      {/* Quick Presets Carousel/Grid */}
      {showPresets && (
        <div className="p-3 rounded-xl bg-background/50 border border-border/60 space-y-2">
          <div className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
            Popular High-Protein & Fitness Foods (Click to populate):
          </div>
          <div className="flex flex-wrap gap-1.5 max-h-48 overflow-y-auto pr-1">
            {QUICK_PRESETS.map((preset, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => handlePresetSelect(preset)}
                className="text-xs px-2.5 py-1.5 rounded-lg border border-border/60 bg-card/60 hover:bg-primary/15 hover:border-primary/40 text-foreground transition-colors text-left flex items-center gap-1.5"
              >
                <span>{preset.name}</span>
                <span className="text-[10px] font-mono text-primary font-semibold">({preset.protein}g P)</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Manual Entry Form */}
      {isOpen && (
        <form onSubmit={handleSubmit} className="pt-3 border-t border-border/60 space-y-3">
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Food or Meal Name</Label>
            <Input
              type="text"
              placeholder="e.g. Grilled Chicken Salad with Olive Oil"
              value={form.meal_name}
              onChange={(e) => setForm({ ...form, meal_name: e.target.value })}
              required
              className="bg-background/50 border-border text-foreground text-sm"
            />
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            <div className="space-y-1">
              <Label className="text-xs text-orange-400">Calories (kcal)</Label>
              <Input
                type="number"
                placeholder="450"
                min={0}
                value={form.calories_kcal}
                onChange={(e) => setForm({ ...form, calories_kcal: e.target.value })}
                className="bg-background/50 border-border text-foreground font-mono text-sm"
              />
            </div>

            <div className="space-y-1">
              <Label className="text-xs text-primary">Protein (g)</Label>
              <Input
                type="number"
                placeholder="35"
                min={0}
                value={form.protein_g}
                onChange={(e) => setForm({ ...form, protein_g: e.target.value })}
                className="bg-background/50 border-border text-foreground font-mono text-sm"
              />
            </div>

            <div className="space-y-1">
              <Label className="text-xs text-blue-400">Carbs (g)</Label>
              <Input
                type="number"
                placeholder="40"
                min={0}
                value={form.carbs_g}
                onChange={(e) => setForm({ ...form, carbs_g: e.target.value })}
                className="bg-background/50 border-border text-foreground font-mono text-sm"
              />
            </div>

            <div className="space-y-1">
              <Label className="text-xs text-pink-400">Fat (g)</Label>
              <Input
                type="number"
                placeholder="12"
                min={0}
                value={form.fat_g}
                onChange={(e) => setForm({ ...form, fat_g: e.target.value })}
                className="bg-background/50 border-border text-foreground font-mono text-sm"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setIsOpen(false)}
              className="text-xs"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              size="sm"
              disabled={saving || !form.meal_name.trim()}
              className="bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-bold rounded-xl shadow-md shadow-primary/20"
            >
              <Check className="w-3.5 h-3.5 mr-1" />
              {saving ? 'Adding...' : 'Save Meal'}
            </Button>
          </div>
        </form>
      )}
    </div>
  );
};
