import React, { useState } from 'react';
import { Plus, Trash2, ChevronDown, ChevronUp } from 'lucide-react';
import { ChallengeTask } from '@/hooks/useChallenges';
import { Button } from '@/components/ui/button';

interface TaskBuilderProps {
  tasks: Omit<ChallengeTask, 'id'>[];
  onChange: (tasks: Omit<ChallengeTask, 'id'>[]) => void;
  locked?: boolean; // once challenge is active, task list is locked
}

const emptyFixed = (): Omit<ChallengeTask, 'id'> => ({
  task_name: '',
  task_type: 'fixed',
  xp_flat: 10,
  sort_order: 0,
});

const emptyVariable = (): Omit<ChallengeTask, 'id'> => ({
  task_name: '',
  task_type: 'variable',
  unit_label: '',
  xp_rate: 1,
  step_increment: 1,
  daily_unit_cap: null,
  sort_order: 0,
});

export const TaskBuilder: React.FC<TaskBuilderProps> = ({ tasks, onChange, locked }) => {
  const [expandedIdx, setExpandedIdx] = useState<number | null>(null);

  const addTask = (type: 'fixed' | 'variable') => {
    const newTask = type === 'fixed' ? emptyFixed() : emptyVariable();
    newTask.sort_order = tasks.length;
    const updated = [...tasks, newTask];
    onChange(updated);
    setExpandedIdx(updated.length - 1);
  };

  const removeTask = (idx: number) => {
    const updated = tasks.filter((_, i) => i !== idx).map((t, i) => ({ ...t, sort_order: i }));
    onChange(updated);
    if (expandedIdx === idx) setExpandedIdx(null);
  };

  const updateTask = (idx: number, patch: Partial<Omit<ChallengeTask, 'id'>>) => {
    const updated = tasks.map((t, i) => (i === idx ? { ...t, ...patch } : t));
    onChange(updated);
  };

  if (locked) {
    return (
      <div className="space-y-2">
        {tasks.map((task, i) => (
          <div key={i} className="flex items-center gap-3 px-4 py-3 rounded-xl glass border border-border/40">
            <span className="text-xs px-2 py-0.5 rounded-lg bg-muted/60 text-muted-foreground font-medium">
              {task.task_type === 'fixed' ? 'Fixed' : 'Variable'}
            </span>
            <span className="flex-1 text-sm font-medium text-foreground">{task.task_name}</span>
            <span className="text-xs text-muted-foreground">
              {task.task_type === 'fixed'
                ? `${task.xp_flat} XP`
                : `${task.xp_rate} XP/${task.unit_label}`}
            </span>
          </div>
        ))}
        <p className="text-xs text-muted-foreground text-center py-2 italic">
          Task list is locked — challenge is active.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {tasks.map((task, idx) => {
        const isExpanded = expandedIdx === idx;
        return (
          <div key={idx} className="glass rounded-xl border border-border/40 overflow-hidden">
            {/* Header */}
            <div className="flex items-center gap-3 px-4 py-3">
              <span className={`text-xs px-2 py-0.5 rounded-lg font-medium ${
                task.task_type === 'fixed'
                  ? 'bg-blue-500/15 text-blue-400 border border-blue-500/20'
                  : 'bg-purple-500/15 text-purple-400 border border-purple-500/20'
              }`}>
                {task.task_type === 'fixed' ? 'Fixed' : 'Variable'}
              </span>
              <span className="flex-1 text-sm font-medium text-foreground truncate">
                {task.task_name || <span className="text-muted-foreground italic">Untitled task</span>}
              </span>
              <button
                onClick={() => setExpandedIdx(isExpanded ? null : idx)}
                className="w-7 h-7 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-all"
              >
                {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </button>
              <button
                onClick={() => removeTask(idx)}
                className="w-7 h-7 rounded-lg flex items-center justify-center text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-all"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>

            {/* Expanded edit form */}
            {isExpanded && (
              <div className="px-4 pb-4 space-y-3 border-t border-border/30 pt-3">
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">Task Name</label>
                  <input
                    value={task.task_name}
                    onChange={e => updateTask(idx, { task_name: e.target.value })}
                    placeholder="e.g. Cold Shower"
                    className="w-full px-3 py-2 rounded-xl bg-muted/50 border border-border/40 text-sm text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:border-primary/50"
                  />
                </div>

                {task.task_type === 'fixed' ? (
                  <div>
                    <label className="text-xs text-muted-foreground mb-1 block">XP Value</label>
                    <input
                      type="number"
                      min={1}
                      value={task.xp_flat ?? 10}
                      onChange={e => updateTask(idx, { xp_flat: Number(e.target.value) })}
                      className="w-full px-3 py-2 rounded-xl bg-muted/50 border border-border/40 text-sm text-foreground focus:outline-none focus:border-primary/50"
                    />
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs text-muted-foreground mb-1 block">Unit Label</label>
                      <input
                        value={task.unit_label ?? ''}
                        onChange={e => updateTask(idx, { unit_label: e.target.value })}
                        placeholder="e.g. reps, minutes"
                        className="w-full px-3 py-2 rounded-xl bg-muted/50 border border-border/40 text-sm text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:border-primary/50"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-muted-foreground mb-1 block">XP per Unit</label>
                      <input
                        type="number"
                        min={0.1}
                        step={0.1}
                        value={task.xp_rate ?? 1}
                        onChange={e => updateTask(idx, { xp_rate: Number(e.target.value) })}
                        className="w-full px-3 py-2 rounded-xl bg-muted/50 border border-border/40 text-sm text-foreground focus:outline-none focus:border-primary/50"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-muted-foreground mb-1 block">Step (+/-)</label>
                      <input
                        type="number"
                        min={0.1}
                        step={0.1}
                        value={task.step_increment ?? 1}
                        onChange={e => updateTask(idx, { step_increment: Number(e.target.value) })}
                        className="w-full px-3 py-2 rounded-xl bg-muted/50 border border-border/40 text-sm text-foreground focus:outline-none focus:border-primary/50"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-muted-foreground mb-1 block">Daily Cap (optional)</label>
                      <input
                        type="number"
                        min={1}
                        value={task.daily_unit_cap ?? ''}
                        onChange={e => updateTask(idx, { daily_unit_cap: e.target.value ? Number(e.target.value) : null })}
                        placeholder="No cap"
                        className="w-full px-3 py-2 rounded-xl bg-muted/50 border border-border/40 text-sm text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:border-primary/50"
                      />
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        );
      })}

      {/* Add task buttons */}
      <div className="flex gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => addTask('fixed')}
          className="flex-1 rounded-xl border-dashed border-border/60 text-muted-foreground hover:text-primary hover:border-primary/40"
        >
          <Plus className="w-3.5 h-3.5 mr-1.5" />
          Fixed Task
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => addTask('variable')}
          className="flex-1 rounded-xl border-dashed border-border/60 text-muted-foreground hover:text-purple-400 hover:border-purple-500/40"
        >
          <Plus className="w-3.5 h-3.5 mr-1.5" />
          Variable Task
        </Button>
      </div>
    </div>
  );
};
