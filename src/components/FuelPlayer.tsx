import React, { useRef, useCallback, useEffect, useState } from 'react';
import { Flame, Trash2, Plus, Video, Link, HardDrive, X, RotateCcw } from 'lucide-react';
import { useFuelContext } from '@/contexts/FuelContext';
import { cn } from '@/lib/utils';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';

export const FuelPlayer: React.FC = () => {
  const {
    items,
    currentItemIndex,
    isPlaying,
    storageUsed,
    addLocalVideo,
    addInstagramEmbed,
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
  const [instagramUrl, setInstagramUrl] = useState('');
  const [addingInstagram, setAddingInstagram] = useState(false);
  const [reelKeys, setReelKeys] = useState<{ [key: string]: number }>({});

  const handleReplayReel = useCallback((itemId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setReelKeys((prev) => ({
      ...prev,
      [itemId]: (prev[itemId] || 0) + 1,
    }));
  }, []);

  const handleFileSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files && e.target.files.length > 0) {
        addLocalVideo(e.target.files);
        e.target.value = '';
        setAddModalOpen(false);
      }
    },
    [addLocalVideo]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragging(false);

      if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
        addLocalVideo(e.dataTransfer.files);
      }
    },
    [addLocalVideo]
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
    },
    [removeItem]
  );

  const handleAddInstagram = async () => {
    if (!instagramUrl.trim()) return;

    setAddingInstagram(true);
    const success = await addInstagramEmbed(instagramUrl);
    setAddingInstagram(false);

    if (success) {
      toast({
        title: 'Added!',
        description: 'Instagram reel added to your Fuel.',
      });
      setInstagramUrl('');
      setAddModalOpen(false);
    } else {
      toast({
        title: 'Invalid URL',
        description: 'Please enter a valid Instagram post or reel URL.',
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
        // Pause previous video
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
          onClick={() => setAddModalOpen(true)}
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
              <p className="font-semibold text-foreground">Add Your Fuel</p>
              <p className="text-sm text-muted-foreground">Local videos or Instagram reels</p>
            </div>
          </div>
        </div>

        {/* Privacy Notice */}
        <div className="glass rounded-xl p-4 text-center">
          <div className="flex items-center justify-center gap-2 mb-2">
            <HardDrive className="w-4 h-4 text-primary" />
            <span className="text-sm font-medium text-primary">100% Private</span>
          </div>
          <p className="text-xs text-muted-foreground">
            Stored on your device only. No cloud, no tracking.
          </p>
        </div>

        {/* Add Modal */}
        <AddFuelModal
          open={addModalOpen}
          onOpenChange={setAddModalOpen}
          fileInputRef={fileInputRef}
          instagramUrl={instagramUrl}
          setInstagramUrl={setInstagramUrl}
          addingInstagram={addingInstagram}
          onAddInstagram={handleAddInstagram}
        />
      </div>
    );
  }

  // Feed with items
  return (
    <div className="relative">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center">
            <Flame className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-primary text-glow">Fuel</h2>
            <p className="text-xs text-muted-foreground">
              {items.length} {items.length === 1 ? 'item' : 'items'}
            </p>
          </div>
        </div>
        
        <button
          onClick={() => setAddModalOpen(true)}
          className="px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors"
          style={{ boxShadow: '0 0 15px hsl(var(--primary) / 0.4)' }}
        >
          + Add
        </button>
      </div>

      {/* Storage Indicator */}
      <div className="flex items-center gap-2 mb-4 px-3 py-2 rounded-lg bg-muted/50">
        <HardDrive className="w-4 h-4 text-muted-foreground" />
        <span className="text-xs text-muted-foreground">
          {storageUsed} stored on device
        </span>
      </div>

      {/* Feed - TikTok style */}
      <div
        ref={containerRef}
        className="h-[70vh] overflow-y-scroll snap-y snap-mandatory rounded-2xl bg-black"
        style={{ scrollSnapType: 'y mandatory' }}
      >
        {items.map((item, index) => (
          <div
            key={item.id}
            className="h-full w-full snap-start snap-always relative flex items-center justify-center"
            onClick={() => handleVideoTap(index)}
          >
            {item.type === 'local_video' ? (
              <video
                ref={(el) => (videoRefs.current[index] = el)}
                src={item.objectUrl}
                className="h-full w-full object-contain"
                loop
                playsInline
                muted={false}
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center overflow-hidden" style={{ background: 'linear-gradient(135deg, #0f0f0f 0%, #1a0a2e 50%, #0d0d0d 100%)' }}>
                <div className="relative w-full max-w-[360px] mx-4 flex flex-col items-center gap-6">
                  {/* Instagram-styled preview card */}
                  <div
                    key={`reel-${item.id}-${reelKeys[item.id] || 0}`}
                    className="w-full rounded-3xl overflow-hidden"
                    style={{
                      background: 'linear-gradient(135deg, rgba(131,58,180,0.25) 0%, rgba(253,29,29,0.15) 50%, rgba(252,176,69,0.2) 100%)',
                      border: '1px solid rgba(253,29,29,0.3)',
                      boxShadow: '0 0 60px rgba(131,58,180,0.3), 0 0 30px rgba(253,29,29,0.15)',
                    }}
                  >
                    {/* Header */}
                    <div className="flex items-center gap-3 p-4 border-b" style={{ borderColor: 'rgba(255,255,255,0.08)' }}>
                      <div
                        className="w-10 h-10 rounded-full flex items-center justify-center shrink-0"
                        style={{ background: 'linear-gradient(135deg, #833ab4, #fd1d1d, #fcb045)' }}
                      >
                        <svg viewBox="0 0 24 24" className="w-5 h-5 fill-white">
                          <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                        </svg>
                      </div>
                      <div>
                        <p className="text-white font-semibold text-sm">Instagram Reel</p>
                        <p className="text-white/50 text-xs">Saved to Fuel</p>
                      </div>
                      <div className="ml-auto flex items-center gap-1">
                        <div className="w-1.5 h-1.5 rounded-full bg-pink-400 animate-pulse" />
                        <span className="text-white/40 text-xs">Reel</span>
                      </div>
                    </div>

                    {/* Visual reel preview area */}
                    <div
                      className="relative flex flex-col items-center justify-center py-12 px-6 gap-4"
                      style={{ minHeight: 220 }}
                    >
                      {/* Animated gradient rings */}
                      <div className="relative flex items-center justify-center">
                        <div
                          className="absolute w-28 h-28 rounded-full opacity-20 animate-ping"
                          style={{ background: 'linear-gradient(135deg, #833ab4, #fd1d1d)' }}
                        />
                        <div
                          className="w-20 h-20 rounded-full flex items-center justify-center"
                          style={{ background: 'linear-gradient(135deg, #833ab4, #fd1d1d, #fcb045)' }}
                        >
                          {/* Play icon */}
                          <div className="w-0 h-0 ml-1" style={{ borderLeft: '20px solid white', borderTop: '13px solid transparent', borderBottom: '13px solid transparent' }} />
                        </div>
                      </div>

                      <p className="text-white/60 text-sm text-center">
                        Tap below to watch this Reel on Instagram
                      </p>

                      <p
                        className="text-white/30 text-xs font-mono text-center break-all px-2"
                        style={{ maxWidth: 280 }}
                      >
                        {extractInstagramId(item.instagramUrl || '') || 'reel'}
                      </p>
                    </div>

                    {/* Watch button */}
                    <div className="p-4 pt-0">
                      <a
                        href={item.instagramUrl || '#'}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className="flex items-center justify-center gap-2 w-full py-3 rounded-2xl font-semibold text-white text-sm transition-all hover:opacity-90 active:scale-95"
                        style={{
                          background: 'linear-gradient(90deg, #833ab4, #fd1d1d, #fcb045)',
                          boxShadow: '0 0 20px rgba(253,29,29,0.4)',
                          textDecoration: 'none',
                        }}
                      >
                        <svg viewBox="0 0 24 24" className="w-4 h-4 fill-white">
                          <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                        </svg>
                        Watch on Instagram
                      </a>
                    </div>
                  </div>

                  {/* Replay / refresh button */}
                  <button
                    onClick={(e) => handleReplayReel(item.id, e)}
                    className="flex items-center gap-2 px-4 py-2 rounded-xl text-white/50 hover:text-white text-xs font-medium transition-colors"
                    style={{ border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.05)' }}
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    Refresh
                  </button>
                </div>
              </div>
            )}

            {/* Delete button */}
            <button
              onClick={(e) => handleDeleteItem(e, item.id)}
              className="absolute top-4 right-4 w-10 h-10 rounded-full bg-destructive/80 hover:bg-destructive text-destructive-foreground flex items-center justify-center transition-all z-10"
            >
              <Trash2 className="w-5 h-5" />
            </button>

            {/* Item label */}
            <div className="absolute bottom-4 left-4 z-10">
              <div className="flex items-center gap-2 mb-1">
                {item.type === 'local_video' ? (
                  <Video className="w-4 h-4 text-white/70" />
                ) : (
                  <Link className="w-4 h-4 text-white/70" />
                )}
                <span className="text-white/70 text-xs uppercase tracking-wider">
                  {item.type === 'local_video' ? 'Local' : 'Instagram'}
                </span>
              </div>
              <p className="text-white font-semibold text-lg drop-shadow-lg truncate max-w-[200px]">
                {item.name}
              </p>
            </div>

            {/* Play indicator for local videos */}
            {item.type === 'local_video' && index === currentItemIndex && !isPlaying && (
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="w-16 h-16 rounded-full bg-black/40 flex items-center justify-center">
                  <div className="w-0 h-0 border-l-[20px] border-l-white border-y-[12px] border-y-transparent ml-1" />
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Scroll indicator */}
      {items.length > 1 && (
        <div className="absolute right-2 top-1/2 -translate-y-1/2 flex flex-col gap-1.5 z-10">
          {items.map((_, index) => (
            <div
              key={index}
              className={cn(
                "w-1.5 h-6 rounded-full transition-all duration-200",
                index === currentItemIndex ? "bg-primary" : "bg-white/30"
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
        instagramUrl={instagramUrl}
        setInstagramUrl={setInstagramUrl}
        addingInstagram={addingInstagram}
        onAddInstagram={handleAddInstagram}
      />
    </div>
  );
};

// Helper function for Instagram ID extraction
const extractInstagramId = (url: string): string => {
  const patterns = [
    /instagram\.com\/(?:p|reel|reels)\/([A-Za-z0-9_-]+)/,
    /instagr\.am\/(?:p|reel|reels)\/([A-Za-z0-9_-]+)/,
  ];
  
  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) return match[1];
  }
  return '';
};

// Add Fuel Modal Component
interface AddFuelModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  fileInputRef: React.RefObject<HTMLInputElement>;
  instagramUrl: string;
  setInstagramUrl: (url: string) => void;
  addingInstagram: boolean;
  onAddInstagram: () => void;
}

const AddFuelModal: React.FC<AddFuelModalProps> = ({
  open,
  onOpenChange,
  fileInputRef,
  instagramUrl,
  setInstagramUrl,
  addingInstagram,
  onAddInstagram,
}) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Flame className="w-5 h-5 text-primary" />
            Add Fuel
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Local Video Option */}
          <button
            onClick={() => fileInputRef.current?.click()}
            className="w-full p-4 rounded-xl border-2 border-dashed border-border hover:border-primary hover:bg-primary/5 transition-all text-left flex items-center gap-4"
          >
            <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center shrink-0">
              <Video className="w-6 h-6 text-primary" />
            </div>
            <div>
              <p className="font-semibold text-foreground">Upload Video</p>
              <p className="text-sm text-muted-foreground">MP4, WebM from your device</p>
            </div>
          </button>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-border" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground">or</span>
            </div>
          </div>

          {/* Instagram Link Option */}
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center shrink-0">
                <Link className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="font-semibold text-foreground">Instagram Reel</p>
                <p className="text-sm text-muted-foreground">Paste a reel or post URL</p>
              </div>
            </div>
            
            <div className="flex gap-2">
              <input
                type="url"
                placeholder="https://instagram.com/reel/..."
                value={instagramUrl}
                onChange={(e) => setInstagramUrl(e.target.value)}
                className="flex-1 px-3 py-2 rounded-lg bg-muted border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              />
              <Button
                onClick={onAddInstagram}
                disabled={!instagramUrl.trim() || addingInstagram}
                className="shrink-0"
              >
                {addingInstagram ? '...' : 'Add'}
              </Button>
            </div>
          </div>

          {/* Privacy Note */}
          <div className="flex items-center gap-2 p-3 rounded-lg bg-muted/50 text-xs text-muted-foreground">
            <HardDrive className="w-4 h-4 shrink-0" />
            <span>Stored locally on your device. Private & offline-ready.</span>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
