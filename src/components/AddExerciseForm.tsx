import React, { useState } from 'react';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface AddExerciseFormProps {
  /**
   * Adds a new exercise with optional weight (kg). Weight null indicates body weight.
   */
  onAdd: (exercise: { name: string; weight: number | null }) => void;
}

export const AddExerciseForm: React.FC<AddExerciseFormProps> = ({ onAdd }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [name, setName] = useState('');

  const [weightOption, setWeightOption] = useState<'body' | 'custom'>('body');
  const [weightKg, setWeightKg] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim()) {
      const weight = weightOption === 'custom' ? Number(weightKg) : null;
      onAdd({ name: name.trim(), weight });
      setName('');
      setWeightOption('body');
      setWeightKg('');
      setIsOpen(false);
    }
  };

  if (!isOpen) {
    return (
      <Button
        variant="outline"
        className="w-full border-dashed border-border hover:border-primary hover:bg-primary/5 transition-all"
        onClick={() => setIsOpen(true)}
      >
        <Plus className="w-4 h-4 mr-2" />
        Add Exercise
      </Button>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-2 animate-scale-in">
      <Input
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Exercise name (e.g., 10 push ups)"
        className="flex-1 bg-card"
        autoFocus
      />
      {/* Weight selection */}
      <div className="flex items-center gap-2">
        <select
          value={weightOption}
          onChange={(e) => setWeightOption(e.target.value as any)}
          className="border rounded p-1"
        >
          <option value="body">Body weight</option>
          <option value="custom">Weight (kg)</option>
        </select>
        {weightOption === 'custom' && (
          <input
            type="number"
            min="0"
            value={weightKg}
            onChange={(e) => setWeightKg(e.target.value)}
            placeholder="kg"
            className="w-20 border rounded p-1"
          />
        )}
      </div>
      <div className="flex gap-2 mt-2">
        <Button type="submit" className="btn-primary-glow">
          Add
        </Button>
        <Button
          type="button"
          variant="ghost"
          onClick={() => {
            setIsOpen(false);
            setName('');
            setWeightOption('body');
            setWeightKg('');
          }}
        >
          Cancel
        </Button>
      </div>
    </form>
  );
};
