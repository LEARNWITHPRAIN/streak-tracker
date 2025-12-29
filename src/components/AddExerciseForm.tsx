import React, { useState } from 'react';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface AddExerciseFormProps {
  onAdd: (name: string) => void;
}

export const AddExerciseForm: React.FC<AddExerciseFormProps> = ({ onAdd }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [name, setName] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim()) {
      onAdd(name.trim());
      setName('');
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
    <form onSubmit={handleSubmit} className="flex gap-2 animate-scale-in">
      <Input
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Exercise name (e.g., 10 push ups)"
        className="flex-1 bg-card"
        autoFocus
      />
      <Button type="submit" className="btn-primary-glow">
        Add
      </Button>
      <Button 
        type="button" 
        variant="ghost" 
        onClick={() => {
          setIsOpen(false);
          setName('');
        }}
      >
        Cancel
      </Button>
    </form>
  );
};
