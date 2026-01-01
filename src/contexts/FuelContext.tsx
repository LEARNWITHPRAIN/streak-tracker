import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import {
  StoredVideo,
  saveVideoToDB,
  removeVideoFromDB,
  getAllVideosFromDB,
  fileToArrayBuffer,
  arrayBufferToObjectUrl,
} from '@/lib/videoStorage';

export interface Video {
  id: string;
  name: string;
  objectUrl: string;
  mimeType: string;
}

interface FuelContextType {
  videos: Video[];
  currentVideoIndex: number;
  isPlaying: boolean;
  addVideos: (files: FileList | File[]) => Promise<void>;
  removeVideo: (videoId: string) => Promise<void>;
  setCurrentVideoIndex: (index: number) => void;
  togglePlayPause: () => void;
  setIsPlaying: (playing: boolean) => void;
}

const FuelContext = createContext<FuelContextType | null>(null);

export const useFuelContext = () => {
  const context = useContext(FuelContext);
  if (!context) {
    throw new Error('useFuelContext must be used within a FuelProvider');
  }
  return context;
};

export const FuelProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [videos, setVideos] = useState<Video[]>([]);
  const [currentVideoIndex, setCurrentVideoIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);

  // Load videos from IndexedDB on mount
  useEffect(() => {
    const loadVideos = async () => {
      try {
        const storedVideos = await getAllVideosFromDB();
        const loadedVideos: Video[] = storedVideos.map((stored) => ({
          id: stored.id,
          name: stored.name,
          objectUrl: arrayBufferToObjectUrl(stored.fileData, stored.mimeType),
          mimeType: stored.mimeType,
        }));
        setVideos(loadedVideos);
      } catch (error) {
        console.error('Failed to load videos from IndexedDB:', error);
      }
    };

    loadVideos();

    // Cleanup object URLs on unmount
    return () => {
      videos.forEach((video) => URL.revokeObjectURL(video.objectUrl));
    };
  }, []);

  const addVideos = useCallback(async (files: FileList | File[]) => {
    const fileArray = Array.from(files);
    const videoFiles = fileArray.filter(
      (file) => file.type.startsWith('video/') || file.name.endsWith('.mp4') || file.name.endsWith('.webm')
    );

    for (const file of videoFiles) {
      try {
        const id = `video-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        const fileData = await fileToArrayBuffer(file);
        const mimeType = file.type || 'video/mp4';

        // Save to IndexedDB
        await saveVideoToDB({
          id,
          name: file.name.replace(/\.[^/.]+$/, ''), // Remove extension
          fileData,
          mimeType,
        });

        // Create object URL and add to state
        const objectUrl = arrayBufferToObjectUrl(fileData, mimeType);
        setVideos((prev) => [
          ...prev,
          {
            id,
            name: file.name.replace(/\.[^/.]+$/, ''),
            objectUrl,
            mimeType,
          },
        ]);
      } catch (error) {
        console.error('Failed to add video:', error);
      }
    }
  }, []);

  const removeVideo = useCallback(async (videoId: string) => {
    try {
      await removeVideoFromDB(videoId);
      
      setVideos((prev) => {
        const videoToRemove = prev.find((v) => v.id === videoId);
        if (videoToRemove) {
          URL.revokeObjectURL(videoToRemove.objectUrl);
        }
        return prev.filter((v) => v.id !== videoId);
      });

      // Adjust current index if needed
      setCurrentVideoIndex((prevIndex) => {
        const newVideos = videos.filter((v) => v.id !== videoId);
        if (prevIndex >= newVideos.length && newVideos.length > 0) {
          return newVideos.length - 1;
        }
        return prevIndex;
      });
    } catch (error) {
      console.error('Failed to remove video:', error);
    }
  }, [videos]);

  const togglePlayPause = useCallback(() => {
    setIsPlaying((prev) => !prev);
  }, []);

  return (
    <FuelContext.Provider
      value={{
        videos,
        currentVideoIndex,
        isPlaying,
        addVideos,
        removeVideo,
        setCurrentVideoIndex,
        togglePlayPause,
        setIsPlaying,
      }}
    >
      {children}
    </FuelContext.Provider>
  );
};
