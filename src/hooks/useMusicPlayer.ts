import { useState, useRef, useEffect, useCallback } from 'react';

export interface Track {
  id: string;
  name: string;
  file: File;
  objectUrl: string;
  duration: number;
}

export const useMusicPlayer = () => {
  const [tracks, setTracks] = useState<Track[]>([]);
  const [currentTrackIndex, setCurrentTrackIndex] = useState<number>(-1);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Initialize audio element
  useEffect(() => {
    audioRef.current = new Audio();
    audioRef.current.addEventListener('ended', handleTrackEnd);
    audioRef.current.addEventListener('timeupdate', handleTimeUpdate);
    audioRef.current.addEventListener('loadedmetadata', handleLoadedMetadata);

    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.removeEventListener('ended', handleTrackEnd);
        audioRef.current.removeEventListener('timeupdate', handleTimeUpdate);
        audioRef.current.removeEventListener('loadedmetadata', handleLoadedMetadata);
      }
      // Cleanup object URLs
      tracks.forEach(track => URL.revokeObjectURL(track.objectUrl));
    };
  }, []);

  const handleTrackEnd = useCallback(() => {
    // Auto-play next track
    setCurrentTrackIndex(prev => {
      const nextIndex = prev + 1;
      if (nextIndex < tracks.length) {
        return nextIndex;
      }
      setIsPlaying(false);
      return -1;
    });
  }, [tracks.length]);

  const handleTimeUpdate = () => {
    if (audioRef.current) {
      setCurrentTime(audioRef.current.currentTime);
    }
  };

  const handleLoadedMetadata = () => {
    if (audioRef.current) {
      setDuration(audioRef.current.duration);
    }
  };

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

  const addTracks = useCallback((files: FileList | File[]) => {
    const fileArray = Array.from(files);
    const audioFiles = fileArray.filter(file => 
      file.type.startsWith('audio/') || 
      file.name.endsWith('.mp3') || 
      file.name.endsWith('.wav')
    );

    const newTracks: Track[] = audioFiles.map(file => ({
      id: `${file.name}-${Date.now()}-${Math.random()}`,
      name: file.name.replace(/\.[^/.]+$/, ''), // Remove extension
      file,
      objectUrl: URL.createObjectURL(file),
      duration: 0,
    }));

    setTracks(prev => [...prev, ...newTracks]);
  }, []);

  const removeTrack = useCallback((trackId: string) => {
    setTracks(prev => {
      const trackToRemove = prev.find(t => t.id === trackId);
      if (trackToRemove) {
        URL.revokeObjectURL(trackToRemove.objectUrl);
      }
      const newTracks = prev.filter(t => t.id !== trackId);
      
      // Adjust current track index if needed
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
        // Toggle play/pause for same track
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

  return {
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
  };
};
