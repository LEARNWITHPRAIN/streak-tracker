import React, { useMemo } from 'react';

interface ProgressCircleProps {
  percentage: number;
  size?: number;
  strokeWidth?: number;
  children?: React.ReactNode;
}

const SPARKLE_COUNT = 10;

export const ProgressCircle: React.FC<ProgressCircleProps> = ({
  percentage,
  size = 120,
  strokeWidth = 8,
  children,
}) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (percentage / 100) * circumference;
  const isComplete = percentage >= 100;

  const sparkles = useMemo(() => {
    return Array.from({ length: SPARKLE_COUNT }, (_, i) => {
      const angle = (360 / SPARKLE_COUNT) * i;
      const delay = (i * 0.15).toFixed(2);
      const sparkleRadius = size / 2 + 4;
      return { angle, delay, sparkleRadius, id: i };
    });
  }, [size]);

  return (
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
          stroke={isComplete ? 'hsl(45 100% 55%)' : 'hsl(var(--primary))'}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className="transition-all duration-500 ease-out"
          style={{
            filter: isComplete
              ? 'drop-shadow(0 0 12px hsl(45 100% 55% / 0.7))'
              : percentage > 0
                ? 'drop-shadow(0 0 8px hsl(var(--primary) / 0.5))'
                : 'none',
          }}
        />
      </svg>

      {/* Sparkle particles on 100% */}
      {isComplete && sparkles.map(({ angle, delay, sparkleRadius, id }) => (
        <span
          key={id}
          className="absolute rounded-full animate-sparkle"
          style={{
            width: 4,
            height: 4,
            background: id % 2 === 0 ? 'hsl(45 100% 60%)' : 'hsl(var(--primary))',
            top: '50%',
            left: '50%',
            transform: `rotate(${angle}deg) translateY(-${sparkleRadius}px)`,
            transformOrigin: '0 0',
            animationDelay: `${delay}s`,
          }}
        />
      ))}

      <div className="absolute inset-0 flex flex-col items-center justify-center">
        {children}
      </div>
    </div>
  );
};
