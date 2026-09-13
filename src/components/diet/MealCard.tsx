import React, { useState } from 'react';
import { MealLog } from '@/hooks/useMealLogs';
import { Trash2, Sparkles, Utensils, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface MealCardProps {
  meal: MealLog;
  onDelete: (id: string) => Promise<boolean>;
}

export const MealCard: React.FC<MealCardProps> = ({ meal, onDelete }) => {
  const [deleting, setDeleting] = useState(false);

  const timeFormatted = new Date(meal.logged_at).toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
  });

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await onDelete(meal.id);
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="group relative p-4 rounded-xl bg-card/40 hover:bg-card/70 border border-border/70 hover:border-purple-500/30 transition-all duration-200">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <div className="p-2 rounded-lg bg-muted/60 border border-border/60 text-muted-foreground group-hover:text-purple-400 group-hover:border-purple-500/30 transition-colors">
            <Utensils className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h4 className="font-semibold text-sm text-foreground">{meal.meal_name}</h4>
              {meal.source === 'ai_scan' ? (
                <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-500/15 text-purple-300 border border-purple-500/30">
                  <Sparkles className="w-3 h-3 text-yellow-400" /> AI Scan
                </span>
              ) : (
                <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-muted text-muted-foreground">
                  Manual
                </span>
              )}
            </div>
            <div className="flex items-center gap-1 text-[11px] text-muted-foreground mt-0.5">
              <Clock className="w-3 h-3" />
              <span>{timeFormatted}</span>
              {meal.notes && <span className="italic truncate max-w-xs">· {meal.notes}</span>}
            </div>
          </div>
        </div>

        <Button
          variant="ghost"
          size="sm"
          onClick={handleDelete}
          disabled={deleting}
          className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-red-400 hover:bg-red-500/10 h-8 w-8 p-0 transition-opacity"
        >
          <Trash2 className="w-4 h-4" />
        </Button>
      </div>

      {/* Macro Pills */}
      <div className="grid grid-cols-4 gap-2 mt-3 pt-3 border-t border-border/40 text-center">
        <div className="p-1.5 rounded-lg bg-orange-500/10 border border-orange-500/15">
          <div className="text-[10px] text-orange-400 font-medium">Calories</div>
          <div className="text-xs font-bold text-foreground font-mono">{Math.round(meal.calories_kcal)}</div>
        </div>
        <div className="p-1.5 rounded-lg bg-purple-500/10 border border-purple-500/15">
          <div className="text-[10px] text-purple-400 font-medium">Protein</div>
          <div className="text-xs font-bold text-foreground font-mono">{Math.round(meal.protein_g)}g</div>
        </div>
        <div className="p-1.5 rounded-lg bg-blue-500/10 border border-blue-500/15">
          <div className="text-[10px] text-blue-400 font-medium">Carbs</div>
          <div className="text-xs font-bold text-foreground font-mono">{Math.round(meal.carbs_g)}g</div>
        </div>
        <div className="p-1.5 rounded-lg bg-pink-500/10 border border-pink-500/15">
          <div className="text-[10px] text-pink-400 font-medium">Fat</div>
          <div className="text-xs font-bold text-foreground font-mono">{Math.round(meal.fat_g)}g</div>
        </div>
      </div>
    </div>
  );
};
