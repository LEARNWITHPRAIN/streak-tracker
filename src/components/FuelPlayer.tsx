import React, { useRef, useCallback, useEffect, useState } from 'react';
import { Flame, Trash2, Plus, Video, Link, HardDrive, X } from 'lucide-react';
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
              <div className="w-full h-full flex items-center justify-center bg-black overflow-hidden">
                <div className="relative w-full max-w-[400px] h-[90%] rounded-xl overflow-hidden bg-black">
                  <iframe
                    src={`https://www.instagram.com/reel/${extractInstagramId(item.instagramUrl || '')}/embed/?hidecaption=1&autoplay=1`}
                    className="absolute inset-0 w-full h-[calc(100%+140px)] border-0"
                    style={{ 
                      marginBottom: '-140px',
                      background: '#000',
                      colorScheme: 'dark'
                    }}
                    allowFullScreen
                    allow="autoplay; clipboard-write; encrypted-media; picture-in-picture; web-share"
                    sandbox="allow-scripts allow-same-origin allow-presentation"
                  />
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
