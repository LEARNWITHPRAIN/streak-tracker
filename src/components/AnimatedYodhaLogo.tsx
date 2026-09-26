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
  // Dimension profiles matching the capsule/stadium shape from the mobile splash
  const dimensions = {
    sm: {
      width: 'w-10',
      height: 'h-20',
      rounded: 'rounded-[20px]',
      fontSize: 'text-xs',
      glowSize: 'w-20 h-28',
    },
    md: {
      width: 'w-24',
      height: 'h-48',
      rounded: 'rounded-[36px]',
      fontSize: 'text-sm',
      glowSize: 'w-44 h-64',
    },
    lg: {
      width: 'w-36',
      height: 'h-72',
      rounded: 'rounded-[50px]',
      fontSize: 'text-base',
      glowSize: 'w-60 h-96',
    },
    splash: {
      width: 'w-[160px] sm:w-[190px]',
      height: 'h-[320px] sm:h-[380px]',
      rounded: 'rounded-[54px] sm:rounded-[64px]',
      fontSize: 'text-lg',
      glowSize: 'w-[280px] sm:w-[340px] h-[420px] sm:h-[500px]',
    },
  }[size];

  return (
    <div
      onClick={onClick}
      className={`relative flex flex-col items-center justify-center select-none ${className}`}
    >
      {/* ── AMBIENT WARRIOR AURA (Sunburst / Radial Fire) ── */}
      <div
        className={`pointer-events-none absolute -translate-x-1/2 -translate-y-1/2 top-1/2 left-1/2 ${dimensions.glowSize} rounded-full bg-gradient-to-r from-orange-600/30 via-amber-500/40 to-orange-500/25 blur-3xl animate-yodha-aura`}
      />

      {/* ── EXPANDING ENERGY SHOCKWAVE RING ── */}
      <div
        className={`pointer-events-none absolute ${dimensions.width} ${dimensions.height} ${dimensions.rounded} border border-primary/50 animate-yodha-ripple`}
      />

      {/* ── SECOND RIPPLE RING (Staggered) ── */}
      <div
        className={`pointer-events-none absolute ${dimensions.width} ${dimensions.height} ${dimensions.rounded} border border-amber-400/30 animate-yodha-ripple`}
        style={{ animationDelay: '1.7s' }}
      />

      {/* ── CAPSULE CONTAINER (Breathing) ── */}
      <div
        className={`relative ${dimensions.width} ${dimensions.height} ${dimensions.rounded} overflow-hidden animate-yodha-breathe border border-primary/40 shadow-2xl shadow-primary/30 transition-transform duration-300 group`}
        style={{
          boxShadow:
            '0 0 30px rgba(249, 115, 22, 0.4), 0 0 60px rgba(234, 88, 12, 0.25), inset 0 0 20px rgba(0, 0, 0, 0.8)',
        }}
      >
        {/* Silhouette Image */}
        <img
          src={yodhaLogo}
          alt="Yodha Warrior"
          className="w-full h-full object-cover object-center pointer-events-none transform transition-transform duration-700 ease-out group-hover:scale-105"
          draggable={false}
        />

        {/* Sunset Ambient Vignette Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/25 pointer-events-none" />

        {/* Diagonal Golden Sword Glint / Shimmer Beam */}
        <div
          className="absolute inset-0 pointer-events-none overflow-hidden"
          style={{ mixBlendMode: 'screen' }}
        >
          <div
            className="w-[200%] h-full animate-yodha-glint"
            style={{
              background:
                'linear-gradient(115deg, transparent 25%, rgba(255,255,255,0.4) 47%, rgba(255,215,0,0.75) 50%, rgba(255,255,255,0.4) 53%, transparent 75%)',
            }}
          />
        </div>

        {/* Inner Border Rim */}
        <div
          className={`absolute inset-0 ${dimensions.rounded} border border-white/20 pointer-events-none`}
        />
      </div>

      {/* ── OPTIONAL TYPOGRAPHY ── */}
      {showText && (
        <div className="mt-6 text-center space-y-1.5 animate-fade-in">
          <h2
            className="text-lg sm:text-xl font-extrabold tracking-[0.35em] uppercase text-transparent bg-clip-text bg-gradient-to-r from-orange-400 via-amber-300 to-orange-500 font-mono"
            style={{
              textShadow: '0 0 25px rgba(249, 115, 22, 0.5)',
            }}
          >
            YODHA MODE
          </h2>
          <p className="text-[11px] font-medium tracking-[0.25em] text-muted-foreground uppercase">
            Build with dedication
          </p>
        </div>
      )}
    </div>
  );
};

export default AnimatedYodhaLogo;
