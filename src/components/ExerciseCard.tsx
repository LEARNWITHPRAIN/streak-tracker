import React, { useState } from 'react';
import { Exercise, ExerciseStatus } from '@/types/exercise';
import { Clock, CheckCircle, SkipForward, Pencil, Trash2, X, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface ExerciseCardProps {
  exercise: Exercise;
  isNext: boolean;
  onStatusChange: (id: string, status: ExerciseStatus) => void;
  onEdit: (id: string, name: string) => void;
  onDelete: (id: string) => void;
  onTimerStart: () => void;
}

export const ExerciseCard: React.FC<ExerciseCardProps> = ({
  exercise,
  isNext,
  onStatusChange,
  onEdit,
  onDelete,
  onTimerStart,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState(exercise.name);

  const handleSave = () => {
    if (editName.trim()) {
      onEdit(exercise.id, editName.trim());
      setIsEditing(false);
    }
  };

  const handleCancel = () => {
    setEditName(exercise.name);
    setIsEditing(false);
  };

  const handleMarkDone = () => {
    onStatusChange(exercise.id, 'done');
    onTimerStart();
  };

  const getStatusIcon = () => {
    switch (exercise.status) {
      case 'done':
        return <CheckCircle className="w-4 h-4 text-primary" />;
      case 'skipped':
        return <SkipForward className="w-4 h-4 text-muted-foreground" />;
      default:
        return <Clock className="w-4 h-4 text-secondary" />;
    }
  };

  const getStatusClass = () => {
    switch (exercise.status) {
      case 'done':
        return 'text-primary';
      case 'skipped':
        return 'text-muted-foreground line-through';
      default:
        return 'text-secondary';
    }
  };

  if (isEditing) {
    return (
      <div className="exercise-card p-4 animate-scale-in">
        <div className="flex items-center gap-3">
          <span className="w-8 h-8 flex items-center justify-center rounded-lg bg-secondary/20 text-secondary font-semibold text-sm">
            {exercise.order}
          </span>
          <Input
            value={editName}
            onChange={(e) => setEditName(e.target.value)}
            className="flex-1 bg-background"
            autoFocus
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleSave();
              if (e.key === 'Escape') handleCancel();
            }}
          />
          <Button size="icon" variant="ghost" onClick={handleSave} className="text-primary">
            <Check className="w-4 h-4" />
          </Button>
          <Button size="icon" variant="ghost" onClick={handleCancel} className="text-muted-foreground">
            <X className="w-4 h-4" />
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div 
      className={`exercise-card p-4 animate-slide-up ${isNext ? 'exercise-card-active' : ''}`}
      style={{ animationDelay: `${exercise.order * 50}ms` }}
    >
      <div className="flex items-center gap-3">
        <span className="w-8 h-8 flex items-center justify-center rounded-lg bg-secondary/20 text-secondary font-semibold text-sm">
          {exercise.order}
        </span>
        
        <div className="flex-1 min-w-0">
          <p className={`font-medium truncate ${exercise.status === 'skipped' ? 'line-through text-muted-foreground' : ''}`}>
            {exercise.name}
          </p>
          <p className={`text-xs capitalize ${getStatusClass()}`}>
            {exercise.status}
          </p>
        </div>

        {isNext && (
          <span className="px-2 py-0.5 rounded text-xs font-semibold bg-primary text-primary-foreground">
            NEXT UP
          </span>
        )}

        <div className="flex items-center gap-1">
          {exercise.status === 'pending' && (
            <>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => onStatusChange(exercise.id, 'skipped')}
                className="text-muted-foreground hover:text-foreground"
              >
                <SkipForward className="w-4 h-4" />
              </Button>
              <Button
                size="sm"
                className={`${isNext ? 'btn-primary-glow' : 'bg-primary/80 text-primary-foreground hover:bg-primary'}`}
                onClick={handleMarkDone}
              >
                {getStatusIcon()}
                <span className="ml-1 capitalize">{exercise.status}</span>
              </Button>
            </>
          )}

          {exercise.status !== 'pending' && (
            <Button
              size="sm"
              variant="outline"
              onClick={() => onStatusChange(exercise.id, 'pending')}
              className="border-border"
            >
              Undo
            </Button>
          )}

          <Button
            size="icon"
            variant="ghost"
            onClick={() => setIsEditing(true)}
            className="text-muted-foreground hover:text-foreground"
          >
            <Pencil className="w-4 h-4" />
          </Button>

          <Button
            size="icon"
            variant="ghost"
            onClick={() => onDelete(exercise.id)}
            className="text-destructive hover:text-destructive"
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
};
