import React from 'react';
import { Play, Pause, SkipBack, SkipForward } from 'lucide-react';
import { useMusicContext } from '@/contexts/MusicContext';

interface MiniPlayerProps {
  hidden?: boolean;
}

export const MiniPlayer: React.FC<MiniPlayerProps> = ({ hidden = false }) => {
  const { currentTrack, isPlaying, togglePlayPause, playNext, playPrevious, currentTime, duration } = useMusicContext();

  // Don't show if no track is playing or loaded, or if hidden
  if (!currentTrack || hidden) {
    return null;
  }

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 bg-card/95 backdrop-blur-xl border-t border-border/60 shadow-2xl">
      {/* Progress bar at top */}
      <div className="h-1 bg-muted/60">
        <div
          className="h-full bg-primary transition-all duration-200"
          style={{ 
            width: `${progress}%`,
            boxShadow: '0 0 10px hsl(var(--primary) / 0.7)'
          }}
        />
      </div>
      
      <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
        <div className="flex items-center justify-between gap-4">
          {/* Track name */}
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold text-foreground truncate">
              {currentTrack.name}
            </p>
            <p className="text-xs text-muted-foreground">Now Playing • Workout Beat</p>
          </div>
          
          {/* Controls */}
          <div className="flex items-center gap-2">
            <button
              onClick={playPrevious}
              className="w-9 h-9 rounded-xl bg-muted/50 hover:bg-muted flex items-center justify-center transition-colors"
            >
              <SkipBack className="w-4 h-4 text-foreground" />
            </button>
            
            <button
              onClick={togglePlayPause}
              className="w-11 h-11 rounded-xl bg-primary flex items-center justify-center hover:bg-primary/90 transition-colors shadow-lg shadow-primary/30"
            >
              {isPlaying ? (
                <Pause className="w-5 h-5 text-primary-foreground" />
              ) : (
                <Play className="w-5 h-5 text-primary-foreground ml-0.5" />
              )}
            </button>
            
            <button
              onClick={playNext}
              className="w-9 h-9 rounded-xl bg-muted/50 hover:bg-muted flex items-center justify-center transition-colors"
            >
              <SkipForward className="w-4 h-4 text-foreground" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
