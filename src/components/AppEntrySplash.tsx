import React, { useState, useEffect } from 'react';
import { AnimatedYodhaLogo } from './AnimatedYodhaLogo';

export const AppEntrySplash: React.FC = () => {
  const [visible, setVisible] = useState(true);
  const [fading, setFading] = useState(false);

  useEffect(() => {
    // Show cinematic entrance on page load/app open
    const timer = setTimeout(() => {
      setFading(true);
      const closeTimer = setTimeout(() => {
        setVisible(false);
      }, 700); // 700ms fade transition
      return () => clearTimeout(closeTimer);
    }, 1800); // Display for 1.8 seconds of glorious animation

    return () => clearTimeout(timer);
  }, []);

  if (!visible) return null;

  return (
    <div
      onClick={() => {
        setFading(true);
        setTimeout(() => setVisible(false), 500);
      }}
      className={`fixed inset-0 z-[99999] flex flex-col items-center justify-center bg-[#050505] transition-all duration-700 cursor-pointer ${
        fading
          ? 'opacity-0 scale-105 pointer-events-none'
          : 'opacity-100 scale-100'
      }`}
      style={{
        transitionTimingFunction: 'cubic-bezier(0.16, 1, 0.3, 1)',
      }}
    >
      {/* Subtle background solar radial flare */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-primary/10 rounded-full blur-[140px] pointer-events-none" />

      {/* The Animated Yodha Capsule Logo */}
      <AnimatedYodhaLogo size="splash" showText={true} />

      {/* Tap hint on mobile */}
      <p className="absolute bottom-10 text-[10px] uppercase tracking-[0.2em] text-white/30 font-mono animate-pulse">
        Tap anywhere to enter
      </p>
    </div>
  );
};

export default AppEntrySplash;
