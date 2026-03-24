'use client';
import { useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useMediaUpload } from '@/hooks/useMediaUpload';
import { useGameStore } from '@/stores/gameStore';

import { getServerUrl } from '@/lib/serverUrl';
const SERVER_URL = getServerUrl();

interface MediaUploaderProps {
  mediaMode: 'photo' | 'video' | 'both';
}

export function MediaUploader({ mediaMode }: MediaUploaderProps) {
  const { uploadFile, removeFile, uploading, progress } = useMediaUpload();
  const myMedia = useGameStore(s => s.myMedia);
  const fileRef = useRef<HTMLInputElement>(null);

  const accept = mediaMode === 'photo' ? 'image/*' : mediaMode === 'video' ? 'video/*' : 'image/*,video/*';

  const handleFiles = async (files: FileList | null) => {
    if (!files) return;
    for (const file of Array.from(files)) {
      await uploadFile(file);
    }
  };

  return (
    <div className="flex flex-col gap-4">
      <input
        ref={fileRef}
        type="file"
        accept={accept}
        multiple
        className="hidden"
        onChange={e => handleFiles(e.target.files)}
      />

      {/* Upload button */}
      <motion.button
        whileTap={{ scale: 0.97 }}
        onClick={() => fileRef.current?.click()}
        disabled={uploading || myMedia.length >= 30}
        className={`
          relative w-full py-4 rounded-2xl border-2 border-dashed
          flex flex-col items-center gap-2 transition-all duration-200
          ${uploading
            ? 'border-violet-glow/50 bg-violet-electric/10'
            : 'border-white/20 hover:border-violet-electric/60 hover:bg-violet-electric/5'
          }
          disabled:opacity-50 disabled:cursor-not-allowed
        `}
      >
        {uploading ? (
          <>
            <div className="w-8 h-8 border-2 border-violet-glow/30 border-t-violet-glow rounded-full animate-spin" />
            <p className="text-sm text-violet-glow font-body">Upload en cours... {Math.round(progress)}%</p>
            <div className="w-full max-w-xs h-1 bg-white/10 rounded-full overflow-hidden">
              <motion.div
                className="h-full bg-gradient-to-r from-violet-electric to-violet-glow rounded-full"
                animate={{ width: `${progress}%` }}
                transition={{ duration: 0.2 }}
              />
            </div>
          </>
        ) : (
          <>
            <span className="text-3xl">📸</span>
            <p className="text-sm font-display font-semibold text-[#F1F5F9]">
              Ajouter des photos
            </p>
            <p className="text-xs text-[#475569] font-body">
              {myMedia.length}/30 • Tap pour choisir dans ta galerie
            </p>
          </>
        )}
      </motion.button>

      {/* Media grid */}
      {myMedia.length > 0 && (
        <div className="grid grid-cols-3 gap-2">
          <AnimatePresence>
            {myMedia.map(media => (
              <motion.div
                key={media.id}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                className="relative aspect-square rounded-xl overflow-hidden group"
              >
                {media.type === 'photo' ? (
                  <img
                    src={`${SERVER_URL}${media.url}`}
                    alt="Media"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <video
                    src={`${SERVER_URL}${media.url}`}
                    className="w-full h-full object-cover"
                    muted
                  />
                )}
                <motion.button
                  whileTap={{ scale: 0.9 }}
                  onClick={() => removeFile(media.id)}
                  className="absolute top-1 right-1 w-6 h-6 rounded-full bg-black/70 flex items-center justify-center
                    text-white text-xs opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  ✕
                </motion.button>
                {media.type === 'video' && (
                  <div className="absolute bottom-1 left-1 px-1.5 py-0.5 rounded bg-black/70 text-xs text-white">
                    🎬
                  </div>
                )}
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}
