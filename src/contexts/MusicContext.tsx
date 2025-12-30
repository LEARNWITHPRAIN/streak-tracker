import React, { createContext, useContext, useState, useRef, useEffect, useCallback, ReactNode } from 'react';
import { 
  saveTrackToDB, 
  removeTrackFromDB, 
  getAllTracksFromDB, 
  fileToArrayBuffer, 
  arrayBufferToObjectUrl,
  StoredTrack 
} from '@/lib/musicStorage';

export interface Track {
  id: string;
  name: string;
  objectUrl: string;
  duration: number;
  mimeType: string;
}

interface MusicContextType {
  tracks: Track[];
  currentTrack: Track | null;
  currentTrackIndex: number;
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  isLoading: boolean;
  addTracks: (files: FileList | File[]) => void;
  removeTrack: (trackId: string) => void;
  playTrack: (index: number) => void;
  togglePlayPause: () => void;
  playNext: () => void;
  playPrevious: () => void;
  seekTo: (time: number) => void;
}

const MusicContext = createContext<MusicContextType | undefined>(undefined);

export const useMusicContext = () => {
  const context = useContext(MusicContext);
  if (!context) {
    throw new Error('useMusicContext must be used within a MusicProvider');
  }
  return context;
};

interface MusicProviderProps {
  children: ReactNode;
}

export const MusicProvider: React.FC<MusicProviderProps> = ({ children }) => {
  const [tracks, setTracks] = useState<Track[]>([]);
  const [currentTrackIndex, setCurrentTrackIndex] = useState<number>(-1);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const handleTimeUpdate = useCallback(() => {
    if (audioRef.current) {
      setCurrentTime(audioRef.current.currentTime);
    }
  }, []);

  const handleLoadedMetadata = useCallback(() => {
    if (audioRef.current) {
      setDuration(audioRef.current.duration);
    }
  }, []);

  // Initialize audio element once
  useEffect(() => {
    audioRef.current = new Audio();
    const audio = audioRef.current;
    
    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('loadedmetadata', handleLoadedMetadata);

    return () => {
      audio.pause();
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
    };
  }, [handleTimeUpdate, handleLoadedMetadata]);

  // Load tracks from IndexedDB on mount
  useEffect(() => {
    const loadStoredTracks = async () => {
      try {
        const storedTracks = await getAllTracksFromDB();
        const loadedTracks: Track[] = storedTracks.map((stored: StoredTrack) => ({
          id: stored.id,
          name: stored.name,
          objectUrl: arrayBufferToObjectUrl(stored.fileData, stored.mimeType),
          duration: 0,
          mimeType: stored.mimeType,
        }));
        setTracks(loadedTracks);
      } catch (error) {
        console.error('Failed to load tracks from storage:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadStoredTracks();
  }, []);

  // Handle track end - auto-play next
  const handleTrackEnd = useCallback(() => {
    setCurrentTrackIndex(prev => {
      const nextIndex = prev + 1;
      if (nextIndex < tracks.length) {
        setTimeout(() => {
          audioRef.current?.play().catch(console.error);
        }, 100);
        return nextIndex;
      }
      // Loop back to first track
      if (tracks.length > 0) {
        setTimeout(() => {
          audioRef.current?.play().catch(console.error);
        }, 100);
        return 0;
      }
      setIsPlaying(false);
      return -1;
    });
  }, [tracks.length]);

  // Add ended listener when tracks change
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    audio.addEventListener('ended', handleTrackEnd);
    return () => {
      audio.removeEventListener('ended', handleTrackEnd);
    };
  }, [handleTrackEnd]);

  // Load and play track when currentTrackIndex changes
  useEffect(() => {
    if (currentTrackIndex >= 0 && currentTrackIndex < tracks.length && audioRef.current) {
      const track = tracks[currentTrackIndex];
      audioRef.current.src = track.objectUrl;
      audioRef.current.load();
      if (isPlaying) {
        audioRef.current.play().catch(console.error);
      }
    }
  }, [currentTrackIndex, tracks]);

  const addTracks = useCallback(async (files: FileList | File[]) => {
    const fileArray = Array.from(files);
    const audioFiles = fileArray.filter(file => 
      file.type.startsWith('audio/') || 
      file.name.endsWith('.mp3') || 
      file.name.endsWith('.wav')
    );

    const newTracks: Track[] = [];

    for (const file of audioFiles) {
      const id = `${file.name}-${Date.now()}-${Math.random()}`;
      const mimeType = file.type || 'audio/mpeg';
      
      try {
        // Convert file to ArrayBuffer for storage
        const fileData = await fileToArrayBuffer(file);
        
        // Save to IndexedDB
        await saveTrackToDB({
          id,
          name: file.name.replace(/\.[^/.]+$/, ''),
          fileData,
          mimeType,
        });

        // Create object URL for playback
        newTracks.push({
          id,
          name: file.name.replace(/\.[^/.]+$/, ''),
          objectUrl: URL.createObjectURL(file),
          duration: 0,
          mimeType,
        });
      } catch (error) {
        console.error('Failed to save track:', error);
      }
    }

    setTracks(prev => [...prev, ...newTracks]);
  }, []);

  const removeTrack = useCallback(async (trackId: string) => {
    // Remove from IndexedDB
    try {
      await removeTrackFromDB(trackId);
    } catch (error) {
      console.error('Failed to remove track from storage:', error);
    }

    setTracks(prev => {
      const trackToRemove = prev.find(t => t.id === trackId);
      if (trackToRemove) {
        URL.revokeObjectURL(trackToRemove.objectUrl);
      }
      const newTracks = prev.filter(t => t.id !== trackId);
      
      const removedIndex = prev.findIndex(t => t.id === trackId);
      if (removedIndex === currentTrackIndex) {
        setIsPlaying(false);
        setCurrentTrackIndex(-1);
        if (audioRef.current) {
          audioRef.current.pause();
          audioRef.current.src = '';
        }
      } else if (removedIndex < currentTrackIndex) {
        setCurrentTrackIndex(curr => curr - 1);
      }
      
      return newTracks;
    });
  }, [currentTrackIndex]);

  const playTrack = useCallback((index: number) => {
    if (index >= 0 && index < tracks.length) {
      if (index === currentTrackIndex) {
        if (isPlaying) {
          audioRef.current?.pause();
          setIsPlaying(false);
        } else {
          audioRef.current?.play().catch(console.error);
          setIsPlaying(true);
        }
      } else {
        setCurrentTrackIndex(index);
        setIsPlaying(true);
        setTimeout(() => {
          audioRef.current?.play().catch(console.error);
        }, 100);
      }
    }
  }, [tracks.length, currentTrackIndex, isPlaying]);

  const togglePlayPause = useCallback(() => {
    if (currentTrackIndex === -1 && tracks.length > 0) {
      playTrack(0);
    } else if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
        setIsPlaying(false);
      } else {
        audioRef.current.play().catch(console.error);
        setIsPlaying(true);
      }
    }
  }, [currentTrackIndex, tracks.length, isPlaying, playTrack]);

  const playNext = useCallback(() => {
    if (tracks.length === 0) return;
    const nextIndex = (currentTrackIndex + 1) % tracks.length;
    setCurrentTrackIndex(nextIndex);
    setIsPlaying(true);
    setTimeout(() => {
      audioRef.current?.play().catch(console.error);
    }, 100);
  }, [currentTrackIndex, tracks.length]);

  const playPrevious = useCallback(() => {
    if (tracks.length === 0) return;
    const prevIndex = currentTrackIndex <= 0 ? tracks.length - 1 : currentTrackIndex - 1;
    setCurrentTrackIndex(prevIndex);
    setIsPlaying(true);
    setTimeout(() => {
      audioRef.current?.play().catch(console.error);
    }, 100);
  }, [currentTrackIndex, tracks.length]);

  const seekTo = useCallback((time: number) => {
    if (audioRef.current) {
      audioRef.current.currentTime = time;
      setCurrentTime(time);
    }
  }, []);

  const currentTrack = currentTrackIndex >= 0 ? tracks[currentTrackIndex] : null;

  return (
    <MusicContext.Provider
      value={{
        tracks,
        currentTrack,
        currentTrackIndex,
        isPlaying,
        currentTime,
        duration,
        isLoading,
        addTracks,
        removeTrack,
        playTrack,
        togglePlayPause,
        playNext,
        playPrevious,
        seekTo,
      }}
    >
      {children}
    </MusicContext.Provider>
  );
};
