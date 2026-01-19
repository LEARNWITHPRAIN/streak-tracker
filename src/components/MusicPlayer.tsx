import React, { useRef, useCallback, useState } from 'react';
import { Headphones, Upload, Play, Pause, SkipBack, SkipForward, Trash2, Music } from 'lucide-react';
import { useMusicContext } from '@/contexts/MusicContext';
import { cn } from '@/lib/utils';

const formatTime = (seconds: number): string => {
  if (isNaN(seconds) || !isFinite(seconds)) return '0:00';
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
};

export const MusicPlayer: React.FC = () => {
  const {
    tracks,
    currentTrack,
    currentTrackIndex,
    isPlaying,
    currentTime,
    duration,
    addTracks,
    removeTrack,
    playTrack,
    togglePlayPause,
    playNext,
    playPrevious,
    seekTo,
  } = useMusicContext();

  const fileInputRef = useRef<HTMLInputElement>(null);
  const dropZoneRef = useRef<HTMLDivElement>(null);
  const progressRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      addTracks(e.target.files);
      e.target.value = '';
    }
  }, [addTracks]);

  const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    dropZoneRef.current?.classList.remove('border-primary', 'bg-primary/10');
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      addTracks(e.dataTransfer.files);
    }
  }, [addTracks]);

  const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    dropZoneRef.current?.classList.add('border-primary', 'bg-primary/10');
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    dropZoneRef.current?.classList.remove('border-primary', 'bg-primary/10');
  }, []);

  const handleSeek = useCallback((clientX: number) => {
    if (!progressRef.current || duration <= 0) return;
    const rect = progressRef.current.getBoundingClientRect();
    const x = Math.max(0, Math.min(clientX - rect.left, rect.width));
    const percentage = x / rect.width;
    seekTo(percentage * duration);
  }, [duration, seekTo]);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    setIsDragging(true);
    handleSeek(e.clientX);

    const handleMouseMove = (moveEvent: MouseEvent) => {
      handleSeek(moveEvent.clientX);
    };

    const handleMouseUp = () => {
      setIsDragging(false);
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  }, [handleSeek]);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    setIsDragging(true);
    handleSeek(e.touches[0].clientX);

    const handleTouchMove = (moveEvent: TouchEvent) => {
      handleSeek(moveEvent.touches[0].clientX);
    };

    const handleTouchEnd = () => {
      setIsDragging(false);
      document.removeEventListener('touchmove', handleTouchMove);
      document.removeEventListener('touchend', handleTouchEnd);
    };

    document.addEventListener('touchmove', handleTouchMove);
    document.addEventListener('touchend', handleTouchEnd);
  }, [handleSeek]);

  const progressPercentage = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <div className="space-y-6 pb-32">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center">
          <Headphones className="w-5 h-5 text-primary" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-primary text-glow">Workout Mix</h2>
          <p className="text-xs text-muted-foreground">Your offline music player</p>
        </div>
      </div>

      {/* Upload Section */}
      <div
        ref={dropZoneRef}
        onClick={() => fileInputRef.current?.click()}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        className="border-2 border-dashed border-border rounded-xl p-8 text-center cursor-pointer transition-all duration-200 hover:border-primary hover:bg-primary/5"
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="audio/*,.mp3,.wav"
          multiple
          onChange={handleFileSelect}
          className="hidden"
        />
        <div className="flex flex-col items-center gap-3">
          <div className="w-14 h-14 rounded-full bg-primary/20 flex items-center justify-center">
            <Upload className="w-7 h-7 text-primary" />
          </div>
          <div>
            <p className="font-semibold text-foreground">Add Local Files</p>
            <p className="text-sm text-muted-foreground">Drop MP3/WAV files or click to browse</p>
          </div>
        </div>
      </div>

      {/* Playlist Section */}
      <div className="space-y-3">
        <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
          Playlist ({tracks.length} {tracks.length === 1 ? 'track' : 'tracks'})
        </h3>
        
        {tracks.length === 0 ? (
          <div className="glass rounded-xl p-8 text-center">
            <Music className="w-12 h-12 text-muted-foreground/50 mx-auto mb-3" />
            <p className="text-muted-foreground">No tracks added yet</p>
            <p className="text-sm text-muted-foreground/70">Add some music to get started</p>
          </div>
        ) : (
          <div className="space-y-2 max-h-[400px] overflow-y-auto pr-1">
            {tracks.map((track, index) => (
              <div
                key={track.id}
                className={cn(
                  "glass rounded-xl p-4 flex items-center gap-4 transition-all duration-200",
                  index === currentTrackIndex && "border border-primary/50 bg-primary/10"
                )}
              >
                <button
                  onClick={() => playTrack(index)}
                  className={cn(
                    "w-10 h-10 rounded-full flex items-center justify-center transition-all",
                    index === currentTrackIndex && isPlaying
                      ? "bg-primary text-primary-foreground"
                      : "bg-primary/20 text-primary hover:bg-primary hover:text-primary-foreground"
                  )}
                >
                  {index === currentTrackIndex && isPlaying ? (
                    <Pause className="w-5 h-5" />
                  ) : (
                    <Play className="w-5 h-5 ml-0.5" />
                  )}
                </button>
                
                <div className="flex-1 min-w-0">
                  <p className={cn(
                    "font-medium truncate",
                    index === currentTrackIndex ? "text-primary" : "text-foreground"
                  )}>
                    {track.name}
                  </p>
                </div>
                
                <button
                  onClick={() => removeTrack(track.id)}
                  className="w-9 h-9 rounded-lg bg-destructive/10 text-destructive hover:bg-destructive hover:text-destructive-foreground flex items-center justify-center transition-all"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Now Playing Bar - Fixed at bottom */}
      {tracks.length > 0 && (
        <div className="fixed bottom-0 left-0 right-0 z-40 bg-card/95 backdrop-blur-lg border-t border-border">
          <div className="container max-w-2xl mx-auto">
            {/* Progress Bar - Draggable */}
            <div 
              ref={progressRef}
              onMouseDown={handleMouseDown}
              onTouchStart={handleTouchStart}
              className="h-2 bg-muted cursor-pointer group relative"
            >
              <div 
                className="h-full bg-primary"
                style={{ 
                  width: `${progressPercentage}%`,
                  boxShadow: '0 0 10px hsl(var(--primary) / 0.7)',
                  transition: isDragging ? 'none' : 'width 0.1s'
                }}
              />
              {/* Draggable thumb */}
              <div
                className="absolute top-1/2 -translate-y-1/2 w-4 h-4 bg-primary rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-opacity"
                style={{ 
                  left: `calc(${progressPercentage}% - 8px)`,
                  boxShadow: '0 0 10px hsl(var(--primary) / 0.8)',
                  opacity: isDragging ? 1 : undefined
                }}
              />
            </div>

            <div className="px-4 py-3">
              <div className="flex items-center gap-4">
                {/* Track Info */}
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-foreground truncate">
                    {currentTrack?.name || 'No track selected'}
                  </p>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <span>{formatTime(currentTime)}</span>
                    <span>/</span>
                    <span>{formatTime(duration)}</span>
                  </div>
                </div>

                {/* Controls */}
                <div className="flex items-center gap-2">
                  <button
                    onClick={playPrevious}
                    disabled={tracks.length === 0}
                    className="w-10 h-10 rounded-full bg-muted hover:bg-muted/80 flex items-center justify-center transition-all disabled:opacity-50"
                  >
                    <SkipBack className="w-5 h-5 text-foreground" />
                  </button>
                  
                  <button
                    onClick={togglePlayPause}
                    disabled={tracks.length === 0}
                    className="w-14 h-14 rounded-full bg-primary hover:bg-primary/90 flex items-center justify-center transition-all disabled:opacity-50 shadow-lg"
                    style={{ boxShadow: '0 0 20px hsl(var(--primary) / 0.5)' }}
                  >
                    {isPlaying ? (
                      <Pause className="w-7 h-7 text-primary-foreground" />
                    ) : (
                      <Play className="w-7 h-7 text-primary-foreground ml-1" />
                    )}
                  </button>
                  
                  <button
                    onClick={playNext}
                    disabled={tracks.length === 0}
                    className="w-10 h-10 rounded-full bg-muted hover:bg-muted/80 flex items-center justify-center transition-all disabled:opacity-50"
                  >
                    <SkipForward className="w-5 h-5 text-foreground" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
