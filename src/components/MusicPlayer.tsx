import React, { useRef, useCallback } from 'react';
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

  const handleProgressClick = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const percentage = clickX / rect.width;
    const newTime = percentage * duration;
    seekTo(newTime);
  }, [duration, seekTo]);

  const progressPercentage = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <div className="space-y-6 pb-32">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center">
          <Headphones className="w-5 h-5 text-primary" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-primary text-glow">Workout Music & Offline Beats</h2>
          <p className="text-xs text-muted-foreground">High-energy tracks to power your workout sessions</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Upload & Info Section */}
        <div className="lg:col-span-5 space-y-4">
          <div
            ref={dropZoneRef}
            onClick={() => fileInputRef.current?.click()}
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            className="border-2 border-dashed border-border/80 bg-card/40 rounded-2xl p-8 text-center cursor-pointer transition-all duration-200 hover:border-primary hover:bg-primary/5"
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
              <div className="w-16 h-16 rounded-2xl bg-primary/20 flex items-center justify-center shadow-lg shadow-primary/10">
                <Upload className="w-8 h-8 text-primary" />
              </div>
              <div>
                <p className="font-bold text-foreground text-base">Add Local Music Files</p>
                <p className="text-xs text-muted-foreground mt-1">Drag & drop MP3 / WAV files or click to browse</p>
              </div>
            </div>
          </div>

          <div className="glass rounded-2xl p-4 border border-border/50 space-y-2">
            <p className="text-xs font-bold text-primary uppercase tracking-wider">Storage & Playback</p>
            <p className="text-xs text-muted-foreground">
              Audio is cached locally in your browser for fast, offline workout sessions with zero lag.
            </p>
          </div>
        </div>

        {/* Playlist Section */}
        <div className="lg:col-span-7 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
              Playlist ({tracks.length} {tracks.length === 1 ? 'track' : 'tracks'})
            </h3>
          </div>
          
          {tracks.length === 0 ? (
            <div className="glass rounded-2xl p-12 text-center border border-border/50">
              <Music className="w-12 h-12 text-muted-foreground/40 mx-auto mb-3" />
              <p className="text-sm font-semibold text-muted-foreground">No tracks added yet</p>
              <p className="text-xs text-muted-foreground/70 mt-1">Upload audio files on the left to build your workout soundtrack</p>
            </div>
          ) : (
            <div className="space-y-2.5 max-h-[500px] overflow-y-auto pr-1">
              {tracks.map((track, index) => (
                <div
                  key={track.id}
                  className={cn(
                    "glass rounded-2xl p-4 flex items-center gap-4 transition-all duration-200 border border-border/50",
                    index === currentTrackIndex && "border-primary/50 bg-primary/10 shadow-md shadow-primary/5"
                  )}
                >
                  <button
                    onClick={() => playTrack(index)}
                    className={cn(
                      "w-11 h-11 rounded-xl flex items-center justify-center transition-all shrink-0",
                      index === currentTrackIndex && isPlaying
                        ? "bg-primary text-primary-foreground shadow-md shadow-primary/30"
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
                      "font-bold text-sm truncate",
                      index === currentTrackIndex ? "text-primary" : "text-foreground"
                    )}>
                      {track.name}
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">Track {index + 1}</p>
                  </div>
                  
                  <button
                    onClick={() => removeTrack(track.id)}
                    className="w-9 h-9 rounded-xl bg-destructive/10 text-destructive hover:bg-destructive hover:text-destructive-foreground flex items-center justify-center transition-all shrink-0"
                    title="Remove Track"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Now Playing Bar - Fixed at bottom */}
      {tracks.length > 0 && (
        <div className="fixed bottom-0 left-0 right-0 z-40 bg-card/95 backdrop-blur-xl border-t border-border/70 shadow-2xl">
          <div className="w-full max-w-7xl mx-auto">
            {/* Progress Bar */}
            <div 
              onClick={handleProgressClick}
              className="h-1.5 bg-muted cursor-pointer group"
            >
              <div 
                className="h-full bg-primary transition-all duration-100"
                style={{ 
                  width: `${progressPercentage}%`,
                  boxShadow: '0 0 12px hsl(var(--primary) / 0.7)'
                }}
              />
            </div>

            <div className="px-4 sm:px-6 lg:px-8 py-3.5">
              <div className="flex items-center justify-between gap-4">
                {/* Track Info */}
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-sm text-foreground truncate">
                    {currentTrack?.name || 'No track selected'}
                  </p>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5">
                    <span>{formatTime(currentTime)}</span>
                    <span>/</span>
                    <span>{formatTime(duration)}</span>
                  </div>
                </div>

                {/* Controls */}
                <div className="flex items-center gap-3">
                  <button
                    onClick={playPrevious}
                    disabled={tracks.length === 0}
                    className="w-10 h-10 rounded-xl bg-muted/60 hover:bg-muted flex items-center justify-center transition-all disabled:opacity-50"
                  >
                    <SkipBack className="w-4 h-4 text-foreground" />
                  </button>
                  
                  <button
                    onClick={togglePlayPause}
                    disabled={tracks.length === 0}
                    className="w-12 h-12 rounded-xl bg-primary hover:bg-primary/90 flex items-center justify-center transition-all disabled:opacity-50 shadow-lg shadow-primary/30"
                  >
                    {isPlaying ? (
                      <Pause className="w-6 h-6 text-primary-foreground" />
                    ) : (
                      <Play className="w-6 h-6 text-primary-foreground ml-0.5" />
                    )}
                  </button>
                  
                  <button
                    onClick={playNext}
                    disabled={tracks.length === 0}
                    className="w-10 h-10 rounded-xl bg-muted/60 hover:bg-muted flex items-center justify-center transition-all disabled:opacity-50"
                  >
                    <SkipForward className="w-4 h-4 text-foreground" />
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
