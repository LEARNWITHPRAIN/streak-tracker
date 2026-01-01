import React, { useRef, useCallback, useEffect, useState } from 'react';
import { Flame, Upload, Trash2 } from 'lucide-react';
import { useFuelContext } from '@/contexts/FuelContext';
import { cn } from '@/lib/utils';

export const FuelPlayer: React.FC = () => {
  const {
    videos,
    currentVideoIndex,
    isPlaying,
    addVideos,
    removeVideo,
    setCurrentVideoIndex,
    setIsPlaying,
  } = useFuelContext();

  const fileInputRef = useRef<HTMLInputElement>(null);
  const dropZoneRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const videoRefs = useRef<(HTMLVideoElement | null)[]>([]);
  const [isDragging, setIsDragging] = useState(false);

  const handleFileSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files && e.target.files.length > 0) {
        addVideos(e.target.files);
        e.target.value = '';
      }
    },
    [addVideos]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragging(false);

      if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
        addVideos(e.dataTransfer.files);
      }
    },
    [addVideos]
  );

  const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const handleVideoTap = useCallback(
    (index: number) => {
      const video = videoRefs.current[index];
      if (video) {
        if (video.paused) {
          video.play();
          setIsPlaying(true);
        } else {
          video.pause();
          setIsPlaying(false);
        }
      }
    },
    [setIsPlaying]
  );

  const handleDeleteVideo = useCallback(
    (e: React.MouseEvent, videoId: string) => {
      e.stopPropagation();
      removeVideo(videoId);
    },
    [removeVideo]
  );

  // Handle scroll snap to detect current video
  useEffect(() => {
    const container = containerRef.current;
    if (!container || videos.length === 0) return;

    const handleScroll = () => {
      const scrollTop = container.scrollTop;
      const containerHeight = container.clientHeight;
      const newIndex = Math.round(scrollTop / containerHeight);
      
      if (newIndex !== currentVideoIndex && newIndex >= 0 && newIndex < videos.length) {
        // Pause previous video
        const prevVideo = videoRefs.current[currentVideoIndex];
        if (prevVideo) prevVideo.pause();
        
        setCurrentVideoIndex(newIndex);
        setIsPlaying(false);
      }
    };

    container.addEventListener('scroll', handleScroll);
    return () => container.removeEventListener('scroll', handleScroll);
  }, [currentVideoIndex, videos.length, setCurrentVideoIndex, setIsPlaying]);

  // Empty state
  if (videos.length === 0) {
    return (
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center">
            <Flame className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-primary text-glow">Fuel</h2>
            <p className="text-xs text-muted-foreground">Your motivation videos</p>
          </div>
        </div>

        {/* Upload Section */}
        <div
          ref={dropZoneRef}
          onClick={() => fileInputRef.current?.click()}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          className={cn(
            "border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all duration-200",
            isDragging
              ? "border-primary bg-primary/10"
              : "border-border hover:border-primary hover:bg-primary/5"
          )}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept="video/*,.mp4,.webm"
            multiple
            onChange={handleFileSelect}
            className="hidden"
          />
          <div className="flex flex-col items-center gap-3">
            <div className="w-14 h-14 rounded-full bg-primary/20 flex items-center justify-center">
              <Flame className="w-7 h-7 text-primary" />
            </div>
            <div>
              <p className="font-semibold text-foreground">Upload Your Vision</p>
              <p className="text-sm text-muted-foreground">(MP4/WebM). Stored Locally.</p>
            </div>
          </div>
        </div>

        {/* Placeholder */}
        <div className="glass rounded-xl p-8 text-center">
          <Flame className="w-12 h-12 text-muted-foreground/50 mx-auto mb-3" />
          <p className="text-muted-foreground">No motivation videos yet</p>
          <p className="text-sm text-muted-foreground/70">Add videos to fuel your workouts</p>
        </div>
      </div>
    );
  }

  // Video feed
  return (
    <div className="relative">
      {/* Header - fixed above feed */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center">
            <Flame className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-primary text-glow">Fuel</h2>
            <p className="text-xs text-muted-foreground">
              {videos.length} {videos.length === 1 ? 'video' : 'videos'}
            </p>
          </div>
        </div>
        
        <button
          onClick={() => fileInputRef.current?.click()}
          className="px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors"
          style={{ boxShadow: '0 0 15px hsl(var(--primary) / 0.4)' }}
        >
          + Add Video
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept="video/*,.mp4,.webm"
          multiple
          onChange={handleFileSelect}
          className="hidden"
        />
      </div>

      {/* Video Feed - TikTok style */}
      <div
        ref={containerRef}
        className="h-[70vh] overflow-y-scroll snap-y snap-mandatory rounded-2xl bg-black"
        style={{ scrollSnapType: 'y mandatory' }}
      >
        {videos.map((video, index) => (
          <div
            key={video.id}
            className="h-full w-full snap-start snap-always relative flex items-center justify-center"
            onClick={() => handleVideoTap(index)}
          >
            <video
              ref={(el) => (videoRefs.current[index] = el)}
              src={video.objectUrl}
              className="h-full w-full object-contain"
              loop
              playsInline
              muted={false}
            />

            {/* Overlay Controls */}
            {/* Delete button - top right */}
            <button
              onClick={(e) => handleDeleteVideo(e, video.id)}
              className="absolute top-4 right-4 w-10 h-10 rounded-full bg-destructive/80 hover:bg-destructive text-destructive-foreground flex items-center justify-center transition-all z-10"
            >
              <Trash2 className="w-5 h-5" />
            </button>

            {/* Video label - bottom left */}
            <div className="absolute bottom-4 left-4 z-10">
              <p className="text-white font-semibold text-lg drop-shadow-lg">
                Motivation #{index + 1}
              </p>
              <p className="text-white/70 text-sm drop-shadow-lg truncate max-w-[200px]">
                {video.name}
              </p>
            </div>

            {/* Play indicator - center (briefly visible) */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              {index === currentVideoIndex && !isPlaying && (
                <div className="w-16 h-16 rounded-full bg-black/40 flex items-center justify-center">
                  <div className="w-0 h-0 border-l-[20px] border-l-white border-y-[12px] border-y-transparent ml-1" />
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Scroll indicator */}
      {videos.length > 1 && (
        <div className="absolute right-2 top-1/2 -translate-y-1/2 flex flex-col gap-1.5 z-10">
          {videos.map((_, index) => (
            <div
              key={index}
              className={cn(
                "w-1.5 h-6 rounded-full transition-all duration-200",
                index === currentVideoIndex ? "bg-primary" : "bg-white/30"
              )}
            />
          ))}
        </div>
      )}
    </div>
  );
};
