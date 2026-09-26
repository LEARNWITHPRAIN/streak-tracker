import React from 'react';
import yodhaLogo from '@/assets/yodha-logo.jpg';

interface AnimatedYodhaLogoProps {
  size?: 'sm' | 'md' | 'lg' | 'splash';
  showText?: boolean;
  className?: string;
  onClick?: () => void;
}

export const AnimatedYodhaLogo: React.FC<AnimatedYodhaLogoProps> = ({
  size = 'md',
  showText = false,
  className = '',
  onClick,
}) => {
  // Perfect 1:1 square shapes with equal radius all around
  const dimensions = {
    sm: {
      box: 'w-12 h-12',
      rounded: 'rounded-xl',
      border: 'border',
      text: 'text-xs',
    },
    md: {
      box: 'w-24 h-24',
      rounded: 'rounded-2xl',
      border: 'border-2',
      text: 'text-sm',
    },
    lg: {
      box: 'w-36 h-36',
      rounded: 'rounded-3xl',
      border: 'border-2',
      text: 'text-base',
    },
    splash: {
      box: 'w-44 h-44 sm:w-52 sm:h-52',
      rounded: 'rounded-3xl sm:rounded-[32px]',
      border: 'border-2',
      text: 'text-lg sm:text-xl',
    },
  }[size];

  return (
    <div
      onClick={onClick}
      className={`relative flex flex-col items-center justify-center select-none ${className}`}
    >
      {/* ── SQUARE LOGO CONTAINER (POPS OUT + GLOW) ── */}
      <div
        className={`relative ${dimensions.box} ${dimensions.rounded} overflow-hidden animate-yodha-pop animate-yodha-glow ${dimensions.border} border-primary/60 bg-black aspect-square shadow-2xl transition-transform`}
        style={{
          boxShadow: '0 0 35px rgba(249, 115, 22, 0.5), 0 0 70px rgba(234, 88, 12, 0.25)',
        }}
      >
        {/* Warrior Image */}
        <img
          src={yodhaLogo}
          alt="Yodha Logo"
          className="w-full h-full object-cover object-center pointer-events-none"
          draggable={false}
        />

        {/* ── SHINING EFFECT (Brilliant light sweep across the square) ── */}
        <div
          className="absolute inset-0 pointer-events-none overflow-hidden"
          style={{ mixBlendMode: 'screen' }}
        >
          <div
            className="w-[200%] h-[200%] animate-yodha-shine"
            style={{
              background:
                'linear-gradient(135deg, transparent 30%, rgba(255,255,255,0.7) 48%, rgba(255,230,140,0.95) 50%, rgba(255,255,255,0.7) 52%, transparent 70%)',
            }}
          />
        </div>

        {/* Subtle rim highlight with same uniform radius */}
        <div
          className={`absolute inset-0 ${dimensions.rounded} border border-white/25 pointer-events-none`}
        />
      </div>

      {/* ── TEXT BELOW: "Entering YODHA MODE" ── */}
      {showText && (
        <div className="mt-6 text-center animate-fade-in">
          <p className={`${dimensions.text} font-bold tracking-wider text-white flex items-center justify-center gap-1.5`}>
            <span>Entering</span>
            <span className="text-primary font-black uppercase text-glow tracking-widest">
              YODHA MODE
            </span>
          </p>
        </div>
      )}
    </div>
  );
};

export default AnimatedYodhaLogo;
