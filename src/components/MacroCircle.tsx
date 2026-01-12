import React from 'react';

interface MacroCircleProps {
  label: string;
  current: number;
  goal: number;
  unit?: string;
  size?: number;
  strokeWidth?: number;
  color?: string;
}

export const MacroCircle: React.FC<MacroCircleProps> = ({
  label,
  current,
  goal,
  unit = 'g',
  size = 80,
  strokeWidth = 6,
  color = 'hsl(var(--primary))',
}) => {
  const percentage = goal > 0 ? Math.min((current / goal) * 100, 100) : 0;
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (percentage / 100) * circumference;

  return (
    <div className="flex flex-col items-center gap-1">
      <div className="relative inline-flex items-center justify-center">
        <svg
          width={size}
          height={size}
          className="transform -rotate-90"
        >
          {/* Background circle */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="hsl(var(--muted))"
            strokeWidth={strokeWidth}
          />
          {/* Progress circle */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke={color}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            className="transition-all duration-500 ease-out"
            style={{
              filter: percentage > 0 ? `drop-shadow(0 0 4px ${color})` : 'none',
            }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-sm font-bold">{current}</span>
          <span className="text-[8px] text-muted-foreground">/{goal}{unit}</span>
        </div>
      </div>
      <span className="text-xs text-muted-foreground font-medium">{label}</span>
    </div>
  );
};
