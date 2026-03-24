'use client';
import { useState, useCallback } from 'react';
import imageCompression from 'browser-image-compression';
import { getExistingSocket } from '@/lib/socket';
import { useGameStore } from '@/stores/gameStore';

export function useMediaUpload() {
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const addMyMedia = useGameStore(s => s.addMyMedia);
  const removeMyMedia = useGameStore(s => s.removeMyMedia);

  const uploadFile = useCallback(async (file: File) => {
    const socket = getExistingSocket();
    if (!socket) return;

    setUploading(true);
    setProgress(0);

    try {
      let processedFile: File = file;
      let type: 'photo' | 'video' = 'photo';

      if (file.type.startsWith('image/')) {
        type = 'photo';
        processedFile = await imageCompression(file, {
          maxSizeMB: 1.5,
          maxWidthOrHeight: 1920,
          useWebWorker: true,
          onProgress: (p) => setProgress(p * 0.8),
        });
      } else if (file.type.startsWith('video/')) {
        type = 'video';
        // Videos are sent as-is (compressed on server)
      } else {
        return;
      }

      const buffer = await processedFile.arrayBuffer();
      const base64 = btoa(String.fromCharCode(...new Uint8Array(buffer)));

      setProgress(90);

      socket.emit('media:upload', { data: base64, type, mimeType: file.type });

      // Listen for confirmation
      socket.once('media:uploaded', ({ media }) => {
        addMyMedia(media);
        setProgress(100);
        setTimeout(() => { setUploading(false); setProgress(0); }, 500);
      });

      socket.once('error', () => {
        setUploading(false);
        setProgress(0);
      });
    } catch (err) {
      console.error('Upload error:', err);
      setUploading(false);
      setProgress(0);
    }
  }, [addMyMedia]);

  const removeFile = useCallback((mediaId: string) => {
    const socket = getExistingSocket();
    if (!socket) return;
    socket.emit('media:remove', { mediaId });
    removeMyMedia(mediaId);
  }, [removeMyMedia]);

  return { uploadFile, removeFile, uploading, progress };
}
