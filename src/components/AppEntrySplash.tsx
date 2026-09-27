import React, { useState, useEffect } from 'react';
import yodhaLogo from '@/assets/yodha-logo.jpg';

export const AppEntrySplash: React.FC = () => {
  const [phase, setPhase] = useState<'enter' | 'hold' | 'exit' | 'gone'>('enter');

  useEffect(() => {
    // Phase: enter (scale + fade in) → 350ms
    const holdTimer = setTimeout(() => setPhase('hold'), 350);
    // Phase: hold → 400ms
    const exitTimer = setTimeout(() => setPhase('exit'), 750);
    // Phase: exit (fade out) → 300ms, then unmount
    const goneTimer = setTimeout(() => setPhase('gone'), 1050);

    return () => {
      clearTimeout(holdTimer);
      clearTimeout(exitTimer);
      clearTimeout(goneTimer);
    };
  }, []);

  if (phase === 'gone') return null;

  return (
    <div
      className="fixed inset-0 z-[99999] flex flex-col items-center justify-center bg-[#050505]"
      style={{
        opacity: phase === 'exit' ? 0 : 1,
        transition: phase === 'enter'
          ? 'opacity 280ms ease-out'
          : phase === 'exit'
          ? 'opacity 300ms cubic-bezier(0.4, 0, 1, 1)'
          : undefined,
      }}
    >
      {/* Subtle warm glow behind logo */}
      <div
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-32 h-32 rounded-full pointer-events-none"
        style={{
          background: 'radial-gradient(circle, rgba(249,115,22,0.18) 0%, transparent 70%)',
          filter: 'blur(20px)',
        }}
      />

      {/* Logo + wordmark — matches auth page size exactly */}
      <div
        style={{
          transform: phase === 'enter' ? 'scale(0.88)' : 'scale(1)',
          opacity: phase === 'enter' ? 0 : 1,
          transition: 'transform 320ms cubic-bezier(0.34, 1.56, 0.64, 1), opacity 280ms ease-out',
        }}
        className="flex flex-col items-center gap-3"
      >
        {/* Logo — same 64px size as auth page */}
        <div
          className="w-16 h-16 rounded-2xl overflow-hidden shadow-lg"
          style={{
            boxShadow: '0 0 0 2px rgba(249,115,22,0.5), 0 8px 24px rgba(249,115,22,0.25)',
          }}
        >
          <img
            src={yodhaLogo}
            alt="Yodha Mode"
            className="w-full h-full object-cover"
            draggable={false}
          />
        </div>

        {/* Brand name */}
        <span
          className="text-sm font-semibold tracking-wider uppercase"
          style={{ color: 'hsl(25, 95%, 53%)' }}
        >
          Yodha Mode
        </span>
      </div>
    </div>
  );
};

export default AppEntrySplash;
