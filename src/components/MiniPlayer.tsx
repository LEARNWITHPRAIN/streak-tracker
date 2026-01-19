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
    <div className="fixed bottom-0 left-0 right-0 z-40 bg-card/95 backdrop-blur-lg border-t border-border/50">
      {/* Progress bar at top */}
      <div className="h-1 bg-muted">
        <div
          className="h-full bg-primary transition-all duration-200"
          style={{ 
            width: `${progress}%`,
            boxShadow: '0 0 8px hsl(var(--primary) / 0.6)'
          }}
        />
      </div>
      
      <div className="container max-w-2xl mx-auto px-4 py-3">
        <div className="flex items-center gap-3">
          {/* Track name */}
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-foreground truncate">
              {currentTrack.name}
            </p>
            <p className="text-xs text-muted-foreground">Now Playing</p>
          </div>
          
          {/* Controls */}
          <div className="flex items-center gap-1">
            <button
              onClick={playPrevious}
              className="w-8 h-8 rounded-full bg-muted/50 hover:bg-muted flex items-center justify-center transition-colors"
            >
              <SkipBack className="w-4 h-4 text-foreground" />
            </button>
            
            <button
              onClick={togglePlayPause}
              className="w-10 h-10 rounded-full bg-primary flex items-center justify-center hover:bg-primary/90 transition-colors shadow-lg"
              style={{ boxShadow: '0 0 15px hsl(var(--primary) / 0.4)' }}
            >
              {isPlaying ? (
                <Pause className="w-5 h-5 text-primary-foreground" />
              ) : (
                <Play className="w-5 h-5 text-primary-foreground ml-0.5" />
              )}
            </button>
            
            <button
              onClick={playNext}
              className="w-8 h-8 rounded-full bg-muted/50 hover:bg-muted flex items-center justify-center transition-colors"
            >
              <SkipForward className="w-4 h-4 text-foreground" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
