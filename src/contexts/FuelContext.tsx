import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import {
  StoredFuelItem,
  FuelItemType,
  saveFuelItemToDB,
  removeFuelItemFromDB,
  getAllFuelItemsFromDB,
  getStorageUsage,
  fileToArrayBuffer,
  arrayBufferToObjectUrl,
  formatBytes,
  isValidInstagramUrl,
  extractInstagramId,
} from '@/lib/videoStorage';

export interface FuelItem {
  id: string;
  type: FuelItemType;
  name: string;
  objectUrl?: string; // For local videos
  instagramUrl?: string; // For Instagram embeds
  mimeType?: string;
  createdAt: number;
}

interface FuelContextType {
  items: FuelItem[];
  currentItemIndex: number;
  isPlaying: boolean;
  storageUsed: string;
  addLocalVideo: (files: FileList | File[]) => Promise<void>;
  addInstagramEmbed: (url: string) => Promise<boolean>;
  removeItem: (itemId: string) => Promise<void>;
  setCurrentItemIndex: (index: number) => void;
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
  const [items, setItems] = useState<FuelItem[]>([]);
  const [currentItemIndex, setCurrentItemIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [storageUsed, setStorageUsed] = useState('0 Bytes');

  const updateStorageUsage = useCallback(async () => {
    try {
      const bytes = await getStorageUsage();
      setStorageUsed(formatBytes(bytes));
    } catch (error) {
      console.error('Failed to get storage usage:', error);
    }
  }, []);

  // Load items from IndexedDB on mount
  useEffect(() => {
    const loadItems = async () => {
      try {
        const storedItems = await getAllFuelItemsFromDB();
        const loadedItems: FuelItem[] = storedItems.map((stored) => {
          if (stored.type === 'local_video' && stored.content instanceof ArrayBuffer) {
            return {
              id: stored.id,
              type: stored.type,
              name: stored.name,
              objectUrl: arrayBufferToObjectUrl(stored.content, stored.mimeType || 'video/mp4'),
              mimeType: stored.mimeType,
              createdAt: stored.createdAt,
            };
          } else {
            return {
              id: stored.id,
              type: stored.type,
              name: stored.name,
              instagramUrl: stored.content as string,
              createdAt: stored.createdAt,
            };
          }
        });
        setItems(loadedItems);
        await updateStorageUsage();
      } catch (error) {
        console.error('Failed to load fuel items from IndexedDB:', error);
      }
    };

    loadItems();

    // Cleanup object URLs on unmount
    return () => {
      items.forEach((item) => {
        if (item.objectUrl) URL.revokeObjectURL(item.objectUrl);
      });
    };
  }, []);

  const addLocalVideo = useCallback(async (files: FileList | File[]) => {
    const fileArray = Array.from(files);
    const videoFiles = fileArray.filter(
      (file) => file.type.startsWith('video/') || file.name.endsWith('.mp4') || file.name.endsWith('.webm')
    );

    for (const file of videoFiles) {
      try {
        const id = `fuel-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        const fileData = await fileToArrayBuffer(file);
        const mimeType = file.type || 'video/mp4';
        const createdAt = Date.now();

        // Save to IndexedDB
        await saveFuelItemToDB({
          id,
          type: 'local_video',
          name: file.name.replace(/\.[^/.]+$/, ''),
          content: fileData,
          mimeType,
          createdAt,
        });

        // Create object URL and add to state
        const objectUrl = arrayBufferToObjectUrl(fileData, mimeType);
        setItems((prev) => [
          {
            id,
            type: 'local_video',
            name: file.name.replace(/\.[^/.]+$/, ''),
            objectUrl,
            mimeType,
            createdAt,
          },
          ...prev,
        ]);
      } catch (error) {
        console.error('Failed to add video:', error);
      }
    }
    await updateStorageUsage();
  }, [updateStorageUsage]);

  const addInstagramEmbed = useCallback(async (url: string): Promise<boolean> => {
    if (!isValidInstagramUrl(url)) {
      return false;
    }

    try {
      const id = `fuel-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      const instagramId = extractInstagramId(url);
      const createdAt = Date.now();

      // Save to IndexedDB
      await saveFuelItemToDB({
        id,
        type: 'instagram_embed',
        name: `Reel ${instagramId}`,
        content: url,
        createdAt,
      });

      // Add to state
      setItems((prev) => [
        {
          id,
          type: 'instagram_embed',
          name: `Reel ${instagramId}`,
          instagramUrl: url,
          createdAt,
        },
        ...prev,
      ]);

      await updateStorageUsage();
      return true;
    } catch (error) {
      console.error('Failed to add Instagram embed:', error);
      return false;
    }
  }, [updateStorageUsage]);

  const removeItem = useCallback(async (itemId: string) => {
    try {
      await removeFuelItemFromDB(itemId);
      
      setItems((prev) => {
        const itemToRemove = prev.find((i) => i.id === itemId);
        if (itemToRemove?.objectUrl) {
          URL.revokeObjectURL(itemToRemove.objectUrl);
        }
        return prev.filter((i) => i.id !== itemId);
      });

      // Adjust current index if needed
      setCurrentItemIndex((prevIndex) => {
        const newItems = items.filter((i) => i.id !== itemId);
        if (prevIndex >= newItems.length && newItems.length > 0) {
          return newItems.length - 1;
        }
        return prevIndex;
      });

      await updateStorageUsage();
    } catch (error) {
      console.error('Failed to remove item:', error);
    }
  }, [items, updateStorageUsage]);

  const togglePlayPause = useCallback(() => {
    setIsPlaying((prev) => !prev);
  }, []);

  return (
    <FuelContext.Provider
      value={{
        items,
        currentItemIndex,
        isPlaying,
        storageUsed,
        addLocalVideo,
        addInstagramEmbed,
        removeItem,
        setCurrentItemIndex,
        togglePlayPause,
        setIsPlaying,
      }}
    >
      {children}
    </FuelContext.Provider>
  );
};
