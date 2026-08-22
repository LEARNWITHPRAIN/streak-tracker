import React, { useRef, useCallback, useEffect, useState } from 'react';
import { Flame, Trash2, Video, Link, HardDrive, RotateCcw, ExternalLink, Play, Sparkles } from 'lucide-react';
import { useFuelContext } from '@/contexts/FuelContext';
import { cn } from '@/lib/utils';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { extractInstagramId, extractYouTubeId, isValidInstagramUrl, isValidYouTubeUrl } from '@/lib/videoStorage';

export const FuelPlayer: React.FC = () => {
  const {
    items,
    currentItemIndex,
    isPlaying,
    storageUsed,
    addLocalVideo,
    addInstagramEmbed,
    addYouTubeShort,
    removeItem,
    setCurrentItemIndex,
    setIsPlaying,
  } = useFuelContext();

  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dropZoneRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const videoRefs = useRef<(HTMLVideoElement | null)[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [videoUrl, setVideoUrl] = useState('');
  const [addingVideo, setAddingVideo] = useState(false);
  const [iframeReloadKeys, setIframeReloadKeys] = useState<{ [key: string]: number }>({});

  const handleReloadEmbed = useCallback((itemId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setIframeReloadKeys((prev) => ({
      ...prev,
      [itemId]: (prev[itemId] || 0) + 1,
    }));
    toast({
      title: 'Reloading player',
      description: 'Refreshing the video embed stream...',
    });
  }, [toast]);

  const handleFileSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files && e.target.files.length > 0) {
        addLocalVideo(e.target.files);
        e.target.value = '';
        setAddModalOpen(false);
        toast({
          title: 'Video saved locally',
          description: 'Stored securely in your device storage for offline playback.',
        });
      }
    },
    [addLocalVideo, toast]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragging(false);

      if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
        addLocalVideo(e.dataTransfer.files);
        toast({
          title: 'Video saved locally',
          description: 'Stored securely in your device storage for offline playback.',
        });
      }
    },
    [addLocalVideo, toast]
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
      const item = items[index];
      if (item.type !== 'local_video') return;

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
    [items, setIsPlaying]
  );

  const handleDeleteItem = useCallback(
    (e: React.MouseEvent, itemId: string) => {
      e.stopPropagation();
      removeItem(itemId);
      toast({
        title: 'Removed from Fuel',
      });
    },
    [removeItem, toast]
  );

  const handleAddUrl = async (overrideUrl?: string) => {
    const targetUrl = (overrideUrl || videoUrl).trim();
    if (!targetUrl) return;

    setAddingVideo(true);

    if (isValidInstagramUrl(targetUrl)) {
      const success = await addInstagramEmbed(targetUrl);
      setAddingVideo(false);
      if (success) {
        toast({
          title: 'Instagram Reel Added!',
          description: 'You can now watch it directly on Yodha Mode.',
        });
        setVideoUrl('');
        setAddModalOpen(false);
      } else {
        toast({
          title: 'Error adding Reel',
          description: 'Could not parse the Instagram reel URL.',
          variant: 'destructive',
        });
      }
    } else if (isValidYouTubeUrl(targetUrl)) {
      const success = await addYouTubeShort(targetUrl);
      setAddingVideo(false);
      if (success) {
        toast({
          title: 'YouTube Short Added!',
          description: 'Playing directly on Yodha Mode without redirects.',
        });
        setVideoUrl('');
        setAddModalOpen(false);
      } else {
        toast({
          title: 'Error adding YouTube video',
          description: 'Could not parse the YouTube URL.',
          variant: 'destructive',
        });
      }
    } else {
      setAddingVideo(false);
      toast({
        title: 'Unrecognized URL',
        description: 'Please paste a valid Instagram Reel or YouTube Shorts URL.',
        variant: 'destructive',
      });
    }
  };

  // Handle scroll snap to detect current item
  useEffect(() => {
    const container = containerRef.current;
    if (!container || items.length === 0) return;

    const handleScroll = () => {
      const scrollTop = container.scrollTop;
      const containerHeight = container.clientHeight;
      const newIndex = Math.round(scrollTop / containerHeight);

      if (newIndex !== currentItemIndex && newIndex >= 0 && newIndex < items.length) {
        // Pause previous video if local
        const prevVideo = videoRefs.current[currentItemIndex];
        if (prevVideo) prevVideo.pause();

        setCurrentItemIndex(newIndex);
        setIsPlaying(false);
      }
    };

    container.addEventListener('scroll', handleScroll);
    return () => container.removeEventListener('scroll', handleScroll);
  }, [currentItemIndex, items.length, setCurrentItemIndex, setIsPlaying]);

  // Empty state
  if (items.length === 0) {
    return (
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center shadow-lg shadow-primary/20">
            <Flame className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-primary text-glow">Fuel</h2>
            <p className="text-xs text-muted-foreground">Your workout motivation clips & reels</p>
          </div>
        </div>

        {/* Upload Section */}
        <div
          ref={dropZoneRef}
          onClick={() => setAddModalOpen(true)}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          className={cn(
            "border-2 border-dashed rounded-2xl p-10 text-center cursor-pointer transition-all duration-200 glass hover:border-primary",
            isDragging
              ? "border-primary bg-primary/10 scale-[0.99]"
              : "border-border/60 hover:bg-primary/5"
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
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary/30 to-orange-500/20 flex items-center justify-center shadow-lg shadow-primary/10 border border-primary/30">
              <Flame className="w-8 h-8 text-primary animate-pulse" />
            </div>
            <div>
              <p className="font-bold text-foreground text-lg">Add Motivation Fuel</p>
              <p className="text-sm text-muted-foreground mt-1 max-w-sm mx-auto">
                Paste Instagram Reels, YouTube Shorts, or upload downloaded workout videos from your device
              </p>
            </div>
            <div className="flex items-center gap-2 mt-2 px-3 py-1.5 rounded-xl bg-primary/10 border border-primary/20 text-xs font-semibold text-primary">
              <Sparkles className="w-3.5 h-3.5" /> Plays directly on website without redirects
            </div>
          </div>
        </div>

        {/* Action Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <button
            onClick={() => setAddModalOpen(true)}
            className="p-4 rounded-2xl glass border border-red-500/30 hover:border-red-500/60 bg-red-500/5 hover:bg-red-500/10 text-left transition-all group flex flex-col justify-between"
          >
            <div className="flex items-center justify-between mb-3">
              <div className="w-9 h-9 rounded-xl bg-red-600 flex items-center justify-center text-white shadow-md shadow-red-600/30">
                <Play className="w-4 h-4 fill-white" />
              </div>
              <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-red-500/20 text-red-400 border border-red-500/30">
                In-App
              </span>
            </div>
            <div>
              <p className="text-sm font-bold text-foreground group-hover:text-red-400 transition-colors">
                Play YouTube Shorts
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">
                Embed &amp; play directly on website without redirect
              </p>
            </div>
          </button>

          <button
            onClick={() => setAddModalOpen(true)}
            className="p-4 rounded-2xl glass border border-pink-500/30 hover:border-pink-500/60 bg-pink-500/5 hover:bg-pink-500/10 text-left transition-all group flex flex-col justify-between"
          >
            <div className="flex items-center justify-between mb-3">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-purple-500 via-pink-500 to-orange-400 flex items-center justify-center text-white shadow-md">
                <Link className="w-4 h-4" />
              </div>
              <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-pink-500/20 text-pink-400 border border-pink-500/30">
                Reels
              </span>
            </div>
            <div>
              <p className="text-sm font-bold text-foreground group-hover:text-pink-400 transition-colors">
                Instagram Reels
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">
                Paste Instagram reel links or download offline
              </p>
            </div>
          </button>

          <button
            onClick={() => fileInputRef.current?.click()}
            className="p-4 rounded-2xl glass border border-primary/30 hover:border-primary/60 bg-primary/5 hover:bg-primary/10 text-left transition-all group flex flex-col justify-between"
          >
            <div className="flex items-center justify-between mb-3">
              <div className="w-9 h-9 rounded-xl bg-primary/20 flex items-center justify-center text-primary">
                <Video className="w-4 h-4" />
              </div>
              <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-primary/20 text-primary border border-primary/30">
                Device
              </span>
            </div>
            <div>
              <p className="text-sm font-bold text-foreground group-hover:text-primary transition-colors">
                Upload MP4 Video
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">
                Stored 100% locally in browser for offline playback
              </p>
            </div>
          </button>
        </div>

        {/* Privacy Notice */}
        <div className="glass rounded-xl p-4 text-center border border-border/40">
          <div className="flex items-center justify-center gap-2 mb-1">
            <HardDrive className="w-4 h-4 text-primary" />
            <span className="text-sm font-semibold text-primary">100% Private &amp; Instant</span>
          </div>
          <p className="text-xs text-muted-foreground">
            Local videos are stored directly on your device storage (IndexedDB) with zero cloud tracking.
          </p>
        </div>

        {/* Add Modal */}
        <AddFuelModal
          open={addModalOpen}
          onOpenChange={setAddModalOpen}
          fileInputRef={fileInputRef}
          videoUrl={videoUrl}
          setVideoUrl={setVideoUrl}
          addingVideo={addingVideo}
          onAddUrl={handleAddUrl}
        />
      </div>
    );
  }

  // Feed with items
  return (
    <div className="relative space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center shadow-lg shadow-primary/20">
            <Flame className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-primary text-glow">Fuel</h2>
            <p className="text-xs text-muted-foreground">
              {items.length} {items.length === 1 ? 'motivation clip' : 'motivation clips'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setAddModalOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs sm:text-sm font-bold transition-all shadow-lg shadow-red-600/25 hover:scale-105"
          >
            <Play className="w-3.5 h-3.5 fill-white" />
            <span>Play YouTube Shorts</span>
          </button>
          <button
            onClick={() => setAddModalOpen(true)}
            className="px-3.5 py-2 rounded-xl bg-primary text-primary-foreground text-xs sm:text-sm font-bold hover:bg-primary/90 transition-all shadow-lg shadow-primary/25 hover:scale-105"
          >
            + Add Fuel
          </button>
        </div>
      </div>

      {/* Storage Indicator */}
      <div className="flex items-center justify-between px-4 py-2 rounded-xl bg-muted/40 border border-border/40 text-xs text-muted-foreground">
        <div className="flex items-center gap-2">
          <HardDrive className="w-3.5 h-3.5 text-primary" />
          <span>{storageUsed} stored on device</span>
        </div>
        <span className="text-primary font-medium">Scroll down for next clip ↓</span>
      </div>

      {/* Feed - TikTok/Reels full container */}
      <div
        ref={containerRef}
        className="h-[75vh] max-h-[820px] overflow-y-scroll snap-y snap-mandatory rounded-3xl bg-black border border-border/50 shadow-2xl relative"
        style={{ scrollSnapType: 'y mandatory' }}
      >
        {items.map((item, index) => {
          const instaId = item.type === 'instagram_embed' ? extractInstagramId(item.instagramUrl || '') : null;
          const ytId = item.type === 'youtube_short' ? extractYouTubeId(item.youtubeUrl || '') : null;
          const reloadKey = iframeReloadKeys[item.id] || 0;

          return (
            <div
              key={item.id}
              className="h-full w-full snap-start snap-always relative flex items-center justify-center bg-black overflow-hidden select-none"
              onClick={() => handleVideoTap(index)}
            >
              {/* Local Video */}
              {item.type === 'local_video' && (
                <div className="w-full h-full flex items-center justify-center relative">
                  <video
                    ref={(el) => (videoRefs.current[index] = el)}
                    src={item.objectUrl}
                    className="h-full w-full object-contain"
                    loop
                    playsInline
                    muted={false}
                  />

                  {/* Play/Pause indicator for local videos */}
                  {index === currentItemIndex && !isPlaying && (
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                      <div className="w-16 h-16 rounded-full bg-black/60 border border-white/20 backdrop-blur-md flex items-center justify-center shadow-xl">
                        <Play className="w-7 h-7 text-white fill-white ml-1" />
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Instagram Reel Embed — Sandboxed so clicks never redirect parent window */}
              {item.type === 'instagram_embed' && (
                <div className="w-full h-full flex items-center justify-center bg-[#0d0d11] relative p-2 sm:p-4">
                  <div
                    className="w-full max-w-[420px] h-[98%] max-h-[760px] rounded-2xl overflow-hidden shadow-2xl relative bg-black flex flex-col border border-pink-500/20"
                    style={{
                      boxShadow: '0 0 40px rgba(253, 29, 29, 0.15), 0 0 80px rgba(131, 58, 180, 0.1)',
                    }}
                  >
                    {/* Top branded bar */}
                    <div className="flex items-center justify-between px-3.5 py-2 bg-black/80 backdrop-blur-md border-b border-white/10 shrink-0 z-10">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-purple-500 via-pink-500 to-orange-400 flex items-center justify-center shrink-0">
                          <svg viewBox="0 0 24 24" className="w-3.5 h-3.5 fill-white">
                            <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                          </svg>
                        </div>
                        <span className="text-white text-xs font-semibold tracking-wide">Instagram Reel</span>
                      </div>

                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={(e) => handleReloadEmbed(item.id, e)}
                          title="Reload Reel Stream"
                          className="p-1 rounded-lg text-white/60 hover:text-white hover:bg-white/10 transition-colors"
                        >
                          <RotateCcw className="w-3.5 h-3.5" />
                        </button>
                        <a
                          href={item.instagramUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          title="Open in Instagram app"
                          onClick={(e) => e.stopPropagation()}
                          className="p-1 rounded-lg text-white/60 hover:text-pink-400 hover:bg-white/10 transition-colors"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                        </a>
                      </div>
                    </div>

                    {/* Instagram Iframe Player with sandbox to block top navigation redirects */}
                    <div className="flex-1 w-full relative bg-black">
                      <iframe
                        key={`ig-frame-${item.id}-${reloadKey}`}
                        src={`https://www.instagram.com/reel/${instaId || ''}/embed/`}
                        className="w-full h-full border-0 bg-black"
                        sandbox="allow-scripts allow-same-origin allow-forms"
                        allow="autoplay; clipboard-write; encrypted-media; picture-in-picture; web-share; fullscreen"
                        allowFullScreen
                        scrolling="no"
                        title={item.name}
                      />
                    </div>

                    {/* YouTube Shorts Play Button Below Instagram Reel */}
                    <div className="px-3.5 py-2.5 bg-black/90 backdrop-blur-md border-t border-white/10 flex items-center justify-between gap-2 shrink-0 z-10">
                      <div className="flex items-center gap-2 min-w-0">
                        <div className="w-5 h-5 rounded-md bg-red-600 flex items-center justify-center shrink-0">
                          <svg viewBox="0 0 24 24" className="w-3 h-3 fill-white">
                            <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
                          </svg>
                        </div>
                        <span className="text-xs text-white/90 font-medium truncate">Reel restricted? Play Shorts</span>
                      </div>

                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setAddModalOpen(true);
                        }}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-600 hover:bg-red-500 text-white text-xs font-bold shadow-md shadow-red-600/30 transition-all hover:scale-105 active:scale-95 shrink-0"
                      >
                        <Play className="w-3 h-3 fill-white" />
                        <span>Play YouTube Shorts</span>
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* YouTube Short Embed */}
              {item.type === 'youtube_short' && (
                <div className="w-full h-full flex items-center justify-center bg-[#0d0d11] relative p-2 sm:p-4">
                  <div
                    className="w-full max-w-[420px] h-[98%] max-h-[760px] rounded-2xl overflow-hidden shadow-2xl relative bg-black flex flex-col border border-red-500/20"
                    style={{
                      boxShadow: '0 0 40px rgba(239, 68, 68, 0.2)',
                    }}
                  >
                    {/* Top branded bar */}
                    <div className="flex items-center justify-between px-3.5 py-2 bg-black/80 backdrop-blur-md border-b border-white/10 shrink-0 z-10">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-lg bg-red-600 flex items-center justify-center shrink-0">
                          <svg viewBox="0 0 24 24" className="w-3.5 h-3.5 fill-white">
                            <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
                          </svg>
                        </div>
                        <span className="text-white text-xs font-semibold tracking-wide">YouTube Short</span>
                      </div>

                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={(e) => handleReloadEmbed(item.id, e)}
                          title="Reload Short"
                          className="p-1 rounded-lg text-white/60 hover:text-white hover:bg-white/10 transition-colors"
                        >
                          <RotateCcw className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    {/* YouTube Iframe Player */}
                    <div className="flex-1 w-full relative bg-black">
                      <iframe
                        key={`yt-frame-${item.id}-${reloadKey}`}
                        src={`https://www.youtube-nocookie.com/embed/${ytId}?autoplay=1&loop=1&playlist=${ytId}&modestbranding=1&rel=0&playsinline=1&enablejsapi=1`}
                        className="w-full h-full border-0 bg-black"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share; fullscreen"
                        allowFullScreen
                        title={item.name}
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Floating Delete Button */}
              <button
                onClick={(e) => handleDeleteItem(e, item.id)}
                className="absolute top-4 right-4 w-9 h-9 rounded-full bg-black/60 hover:bg-destructive text-white/80 hover:text-destructive-foreground backdrop-blur-md border border-white/10 flex items-center justify-center transition-all shadow-lg z-20 hover:scale-105"
                title="Delete this fuel clip"
              >
                <Trash2 className="w-4 h-4" />
              </button>

              {/* Item bottom label (for local video) */}
              {item.type === 'local_video' && (
                <div className="absolute bottom-4 left-4 z-10 bg-black/50 backdrop-blur-md px-3.5 py-2 rounded-xl border border-white/10 max-w-[240px]">
                  <div className="flex items-center gap-1.5 mb-0.5">
                    <Video className="w-3.5 h-3.5 text-primary" />
                    <span className="text-primary text-[10px] uppercase font-bold tracking-wider">Local Video</span>
                  </div>
                  <p className="text-white font-semibold text-sm truncate">
                    {item.name}
                  </p>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Scroll indicator pills */}
      {items.length > 1 && (
        <div className="absolute right-3 top-1/2 -translate-y-1/2 flex flex-col gap-1.5 z-20 pointer-events-none">
          {items.map((_, index) => (
            <div
              key={index}
              className={cn(
                "w-1.5 rounded-full transition-all duration-200",
                index === currentItemIndex ? "h-6 bg-primary shadow-sm shadow-primary" : "h-1.5 bg-white/30"
              )}
            />
          ))}
        </div>
      )}

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="video/*,.mp4,.webm"
        multiple
        onChange={handleFileSelect}
        className="hidden"
      />

      {/* Add Modal */}
      <AddFuelModal
        open={addModalOpen}
        onOpenChange={setAddModalOpen}
        fileInputRef={fileInputRef}
        videoUrl={videoUrl}
        setVideoUrl={setVideoUrl}
        addingVideo={addingVideo}
        onAddUrl={handleAddUrl}
      />
    </div>
  );
};

// Add Fuel Modal Component
interface AddFuelModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  fileInputRef: React.RefObject<HTMLInputElement>;
  videoUrl: string;
  setVideoUrl: (url: string) => void;
  addingVideo: boolean;
  onAddUrl: (overrideUrl?: string) => void;
}

const MOTIVATION_SHORTS = [
  {
    name: 'David Goggins',
    tag: 'Discipline',
    url: 'https://www.youtube.com/shorts/q7q0m7iFjG4',
  },
  {
    name: 'Arnold Motivation',
    tag: 'Champion Mindset',
    url: 'https://www.youtube.com/shorts/7QyQpB8tJ6E',
  },
  {
    name: 'CBum Focus',
    tag: 'Workout Drive',
    url: 'https://www.youtube.com/shorts/P1bWn4_JjFE',
  },
  {
    name: 'Ronnie Coleman',
    tag: 'Heavy Duty',
    url: 'https://www.youtube.com/shorts/Vf7Hw0mJp0o',
  },
];

const AddFuelModal: React.FC<AddFuelModalProps> = ({
  open,
  onOpenChange,
  fileInputRef,
  videoUrl,
  setVideoUrl,
  addingVideo,
  onAddUrl,
}) => {
  const [ytUrl, setYtUrl] = useState('');
  const isInsta = isValidInstagramUrl(videoUrl);

  const handleOpenDownloader = () => {
    if (!videoUrl.trim()) return;
    window.open(`https://saveinsta.app/en?url=${encodeURIComponent(videoUrl.trim())}`, '_blank');
  };

  const handleAddYouTube = (targetUrl?: string) => {
    const urlToAdd = targetUrl || ytUrl;
    if (!urlToAdd.trim()) return;
    onAddUrl(urlToAdd.trim());
    setYtUrl('');
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg bg-card border-border/80 text-foreground max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl font-bold text-foreground">
            <Flame className="w-5 h-5 text-primary" />
            Add Motivation Fuel
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 pt-1">
          {/* 1. Instagram Reels Option */}
          <div className="space-y-3 p-4 rounded-2xl bg-muted/40 border border-pink-500/20">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 via-pink-500 to-orange-400 flex items-center justify-center shrink-0 shadow-md">
                <svg viewBox="0 0 24 24" className="w-5 h-5 fill-white">
                  <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                </svg>
              </div>
              <div>
                <p className="font-bold text-foreground text-sm">Instagram Reel</p>
                <p className="text-xs text-muted-foreground">Paste any Instagram reel share link</p>
              </div>
            </div>

            <div className="flex gap-2 pt-1">
              <input
                type="url"
                placeholder="https://instagram.com/reel/..."
                value={videoUrl}
                onChange={(e) => setVideoUrl(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    onAddUrl();
                  }
                }}
                className="flex-1 px-3.5 py-2.5 rounded-xl bg-background border border-border text-foreground text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-pink-500/50"
              />
              <Button
                onClick={() => onAddUrl()}
                disabled={!videoUrl.trim() || addingVideo}
                className="shrink-0 bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-500 hover:to-purple-500 text-white font-semibold px-4 rounded-xl shadow-md"
              >
                {addingVideo ? 'Adding...' : 'Add Reel'}
              </Button>
            </div>

            {isInsta && (
              <div className="pt-2 border-t border-border/40 flex items-center justify-between">
                <span className="text-xs text-muted-foreground">Want 100% offline playback?</span>
                <button
                  type="button"
                  onClick={handleOpenDownloader}
                  className="text-xs font-bold text-pink-400 hover:text-pink-300 flex items-center gap-1 bg-pink-500/10 px-2.5 py-1 rounded-lg border border-pink-500/30"
                >
                  ⚡ Download MP4
                </button>
              </div>
            )}
          </div>

          {/* 2. YouTube Shorts (Plays Directly on Website) */}
          <div className="space-y-3 p-4 rounded-2xl bg-muted/40 border border-red-500/30 shadow-sm">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-red-600 flex items-center justify-center shrink-0 shadow-md shadow-red-600/30">
                  <svg viewBox="0 0 24 24" className="w-5 h-5 fill-white">
                    <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
                  </svg>
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <p className="font-bold text-foreground text-sm">YouTube Shorts</p>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-500/20 text-red-400 border border-red-500/30">
                      In-App Player
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground">Plays directly on website with zero redirects</p>
                </div>
              </div>
            </div>

            <div className="flex gap-2 pt-1">
              <input
                type="url"
                placeholder="https://youtube.com/shorts/... or watch?v=..."
                value={ytUrl}
                onChange={(e) => setYtUrl(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddYouTube();
                  }
                }}
                className="flex-1 px-3.5 py-2.5 rounded-xl bg-background border border-border text-foreground text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-red-500/50"
              />
              <Button
                onClick={() => handleAddYouTube()}
                disabled={!ytUrl.trim() || addingVideo}
                className="shrink-0 bg-red-600 hover:bg-red-500 text-white font-semibold px-4 rounded-xl shadow-md shadow-red-600/30 flex items-center gap-1.5"
              >
                <Play className="w-3.5 h-3.5 fill-white" />
                <span>Play on Website</span>
              </Button>
            </div>

            {/* Quick Presets */}
            <div className="pt-2 border-t border-border/40 space-y-1.5">
              <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                ⚡ 1-Click Gym Motivation Shorts:
              </p>
              <div className="grid grid-cols-2 gap-2">
                {MOTIVATION_SHORTS.map((short) => (
                  <button
                    key={short.name}
                    type="button"
                    onClick={() => handleAddYouTube(short.url)}
                    disabled={addingVideo}
                    className="flex items-center justify-between p-2 rounded-xl bg-background hover:bg-red-500/10 border border-border hover:border-red-500/40 text-left transition-all group"
                  >
                    <div className="min-w-0 pr-1">
                      <p className="text-xs font-semibold text-foreground truncate group-hover:text-red-400 transition-colors">
                        {short.name}
                      </p>
                      <p className="text-[10px] text-muted-foreground truncate">{short.tag}</p>
                    </div>
                    <div className="w-6 h-6 rounded-lg bg-red-600/20 group-hover:bg-red-600 text-red-400 group-hover:text-white flex items-center justify-center shrink-0 transition-colors">
                      <Play className="w-3 h-3 fill-current ml-0.5" />
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-border/60" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-card px-2 text-muted-foreground font-semibold">or store offline on device</span>
            </div>
          </div>

          {/* 3. Local Video Option */}
          <button
            onClick={() => fileInputRef.current?.click()}
            className="w-full p-4 rounded-2xl border-2 border-dashed border-border/70 hover:border-primary hover:bg-primary/5 transition-all text-left flex items-center gap-4 group"
          >
            <div className="w-11 h-11 rounded-xl bg-primary/20 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
              <Video className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="font-bold text-foreground text-sm">Upload Video (MP4 / WebM)</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                Saved 100% locally to your browser storage — plays natively with audio and zero redirects
              </p>
            </div>
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
