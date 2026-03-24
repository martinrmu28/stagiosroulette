'use client';
import { useState, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { useGameStore } from '@/stores/gameStore';
import { getSocket } from '@/lib/socket';
import { Button } from '@/components/ui/Button';
import { GlassCard } from '@/components/ui/GlassCard';
import imageCompression from 'browser-image-compression';

type Mode = 'manuel' | 'aleatoire' | 'yolo';

interface PreviewItem { id: string; file: File; previewUrl: string; uploading?: boolean; }

import { getServerUrl } from '@/lib/serverUrl';
const SERVER_URL = getServerUrl();
const MAX = 30;
const MIN = 1;

async function compressAndUpload(file: File): Promise<{ id: string; url: string; type: 'photo' | 'video' }> {
  const socket = getSocket();
  const type: 'photo' | 'video' = file.type.startsWith('image/') ? 'photo' : 'video';

  let processedFile = file;
  if (type === 'photo') {
    processedFile = await imageCompression(file, {
      maxSizeMB: 1.5,
      maxWidthOrHeight: 1920,
      useWebWorker: true,
    });
  }

  const buffer = await processedFile.arrayBuffer();
  const base64 = btoa(String.fromCharCode(...new Uint8Array(buffer)));

  return new Promise((resolve, reject) => {
    socket.emit('media:upload', { data: base64, type, mimeType: file.type });
    socket.once('media:uploaded', ({ media }) => resolve(media));
    socket.once('error', ({ message }: { message: string }) => reject(new Error(message)));
  });
}

export default function SelectPage({ params }: { params: { code: string } }) {
  const router = useRouter();
  const store  = useGameStore();
  const { code } = params;

  const [mode, setMode]         = useState<Mode>('manuel');
  const [items, setItems]       = useState<PreviewItem[]>([]);
  const [uploading, setUploading] = useState(false);
  const [done, setDone]         = useState(false);
  const [error, setError]       = useState('');
  const fileRef  = useRef<HTMLInputElement>(null);
  const yoloRef  = useRef<HTMLInputElement>(null);

  const mediaMode = store.roomSettings?.mediaMode ?? 'photo';
  const accept    = mediaMode === 'photo' ? 'image/*' : mediaMode === 'video' ? 'video/*' : 'image/*,video/*';

  /* ===== MANUEL ===== */
  const handleManualFiles = useCallback(async (files: FileList | null) => {
    if (!files) return;
    const arr = Array.from(files).slice(0, MAX - items.length);
    const newItems: PreviewItem[] = arr.map(f => ({
      id: Math.random().toString(36).slice(2),
      file: f,
      previewUrl: URL.createObjectURL(f),
    }));
    setItems(prev => [...prev, ...newItems]);
  }, [items.length]);

  const removeItem = (id: string) => {
    setItems(prev => {
      const item = prev.find(i => i.id === id);
      if (item) URL.revokeObjectURL(item.previewUrl);
      return prev.filter(i => i.id !== id);
    });
  };

  /* ===== ALÉATOIRE ===== */
  const handleRandomFiles = useCallback(async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    const arr  = Array.from(files);
    const count = Math.min(Math.max(10, Math.floor(arr.length * 0.3)), 20, arr.length);
    const shuffled = arr.sort(() => Math.random() - 0.5).slice(0, count);
    const newItems: PreviewItem[] = shuffled.map(f => ({
      id: Math.random().toString(36).slice(2),
      file: f,
      previewUrl: URL.createObjectURL(f),
    }));
    setItems(newItems);
  }, []);

  const reshuffleRandom = () => {
    // Reset and re-trigger file input
    items.forEach(i => URL.revokeObjectURL(i.previewUrl));
    setItems([]);
    if (fileRef.current) {
      fileRef.current.value = '';
      fileRef.current.click();
    }
  };

  /* ===== YOLO ===== */
  const handleYoloFiles = useCallback(async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    const arr = Array.from(files).sort(() => Math.random() - 0.5).slice(0, 20);
    const newItems: PreviewItem[] = arr.map(f => ({
      id: Math.random().toString(36).slice(2),
      file: f,
      previewUrl: URL.createObjectURL(f),
    }));
    // Directly upload
    setItems(newItems);
    await doUpload(newItems);
  }, []);

  /* ===== UPLOAD ===== */
  const doUpload = async (toUpload: PreviewItem[]) => {
    setUploading(true);
    setError('');
    try {
      for (const item of toUpload) {
        const media = await compressAndUpload(item.file);
        store.addMyMedia(media);
        setItems(prev => prev.map(i => i.id === item.id ? { ...i, uploading: false } : i));
      }
      // Mark player ready
      getSocket().emit('player:ready');
      store.updatePlayer(store.playerId!, { isReady: true, mediaCount: toUpload.length });
      setDone(true);
      setTimeout(() => router.push(`/room/${code}`), 1200);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erreur upload');
    } finally {
      setUploading(false);
    }
  };

  const handleValidate = () => doUpload(items);

  const tabs: { key: Mode; label: string; icon: string }[] = [
    { key: 'manuel',    label: 'Manuel',    icon: '✋' },
    { key: 'aleatoire', label: 'Aléatoire', icon: '🎲' },
    { key: 'yolo',      label: 'YOLO',      icon: '🤪' },
  ];

  return (
    <main className="min-h-screen flex flex-col bg-gradient-app relative overflow-hidden">
      <div className="orb-amber w-72 h-72 -top-16 -right-16 opacity-50" />

      <div className="relative z-10 w-full max-w-sm mx-auto px-5 pt-6 pb-28 flex flex-col gap-5">
        {/* Header */}
        <div>
          <button onClick={() => router.back()} className="flex items-center gap-1.5 text-sm text-[var(--text-secondary)] hover:text-[#F1F5F9] transition-colors mb-5">
            ← Retour
          </button>
          <h1 className="font-display font-bold text-2xl text-[#F1F5F9]">Tes photos</h1>
          <p className="text-sm text-[var(--text-secondary)] mt-1">
            {items.length > 0 ? `${items.length} photo${items.length > 1 ? 's' : ''} sélectionnée${items.length > 1 ? 's' : ''}` : 'Choisis comment sélectionner'}
          </p>
        </div>

        {/* Mode tabs */}
        <div className="glass rounded-2xl p-1 flex gap-1">
          {tabs.map(t => (
            <button
              key={t.key}
              onClick={() => { setMode(t.key); setItems([]); }}
              className={`
                flex-1 py-2.5 rounded-xl text-sm font-display font-semibold transition-all duration-200
                ${mode === t.key
                  ? 'bg-[var(--amber-surface)] text-[var(--amber-500)] border border-[var(--amber-border)]'
                  : 'text-[var(--text-secondary)] hover:text-[#F1F5F9]'
                }
              `}
            >
              {t.icon} {t.label}
            </button>
          ))}
        </div>

        {/* Mode descriptions */}
        <AnimatePresence mode="wait">
          {mode === 'manuel' && (
            <motion.div key="manuel" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} className="flex flex-col gap-4">
              <p className="text-xs text-[var(--text-secondary)]">
                Choisis exactement les photos que tu veux montrer. Tu peux en retirer avant de valider.
              </p>
              <input ref={fileRef} type="file" accept={accept} multiple className="hidden" onChange={e => handleManualFiles(e.target.files)} />
              <button
                onClick={() => fileRef.current?.click()}
                disabled={items.length >= MAX}
                className="w-full py-8 rounded-2xl border-2 border-dashed border-[var(--glass-border)] hover:border-[var(--amber-border)] hover:bg-[var(--amber-surface)] transition-all flex flex-col items-center gap-2 text-[var(--text-secondary)] hover:text-[var(--amber-500)]"
              >
                <span className="text-3xl">📁</span>
                <span className="text-sm font-body">Ouvrir la galerie</span>
                <span className="text-xs opacity-60">{items.length}/{MAX}</span>
              </button>
              {items.length > 0 && <PhotoGrid items={items} onRemove={removeItem} />}
            </motion.div>
          )}

          {mode === 'aleatoire' && (
            <motion.div key="aleatoire" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} className="flex flex-col gap-4">
              <p className="text-xs text-[var(--text-secondary)]">
                L'app tire aléatoirement 10-20 photos depuis ta galerie. Tu peux valider ou relancer un nouveau tirage.
              </p>
              <input
                ref={fileRef}
                type="file"
                accept={accept}
                multiple
                className="hidden"
                onChange={e => handleRandomFiles(e.target.files)}
              />
              {items.length === 0 ? (
                <button
                  onClick={() => fileRef.current?.click()}
                  className="w-full py-8 rounded-2xl border-2 border-dashed border-[var(--glass-border)] hover:border-[var(--amber-border)] hover:bg-[var(--amber-surface)] transition-all flex flex-col items-center gap-2 text-[var(--text-secondary)] hover:text-[var(--amber-500)]"
                >
                  <span className="text-3xl">🎲</span>
                  <span className="text-sm font-body">Accorder l'accès à la galerie</span>
                  <span className="text-xs opacity-60">10-20 photos seront tirées au sort</span>
                </button>
              ) : (
                <>
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-body font-medium text-[#F1F5F9]">{items.length} photos tirées au sort</p>
                    <button onClick={reshuffleRandom} className="text-xs text-[var(--amber-500)] hover:text-[var(--amber-600)] transition-colors flex items-center gap-1">
                      🔄 Relancer
                    </button>
                  </div>
                  <PhotoGrid items={items} onRemove={removeItem} canAdd={false} />
                </>
              )}
            </motion.div>
          )}

          {mode === 'yolo' && (
            <motion.div key="yolo" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} className="flex flex-col gap-4">
              <GlassCard variant="amber" className="p-4">
                <p className="text-[var(--amber-500)] font-display font-bold text-sm mb-1">⚠️ Mode YOLO activé</p>
                <p className="text-xs text-[var(--text-secondary)]">
                  L'app pioche 20 photos de ta galerie <strong className="text-[#F1F5F9]">sans te les montrer</strong> avant d'envoyer. Pas de filet de sécurité — pour les courageux !
                </p>
              </GlassCard>
              <input ref={yoloRef} type="file" accept={accept} multiple className="hidden" onChange={e => handleYoloFiles(e.target.files)} />
              <Button variant="primary" size="lg" onClick={() => yoloRef.current?.click()} loading={uploading}>
                🤪 Lancer le YOLO !
              </Button>
            </motion.div>
          )}
        </AnimatePresence>

        {error && (
          <p className="text-xs text-[#EF4444] text-center">{error}</p>
        )}
      </div>

      {/* Sticky bottom bar */}
      {(mode === 'manuel' || mode === 'aleatoire') && items.length > 0 && !done && (
        <div className="fixed bottom-0 left-0 right-0 z-20 px-5 pb-8 pt-4" style={{ background: 'linear-gradient(to top, #0B1120 60%, transparent)' }}>
          <div className="max-w-sm mx-auto flex gap-3">
            {mode === 'aleatoire' && (
              <Button variant="secondary" size="lg" onClick={reshuffleRandom} className="flex-1">
                🔄 Relancer
              </Button>
            )}
            <Button
              variant="primary"
              size="lg"
              onClick={handleValidate}
              loading={uploading}
              disabled={items.length < MIN}
              className="flex-1"
            >
              ✅ C'est bon !
            </Button>
          </div>
        </div>
      )}

      {/* Done overlay */}
      <AnimatePresence>
        {done && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="fixed inset-0 z-50 flex items-center justify-center"
            style={{ background: 'rgba(11,17,32,0.9)', backdropFilter: 'blur(20px)' }}
          >
            <div className="text-center">
              <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', stiffness: 200 }}>
                <span className="text-7xl">✅</span>
              </motion.div>
              <p className="font-display font-bold text-xl text-[#F1F5F9] mt-4">Photos uploadées !</p>
              <p className="text-sm text-[var(--text-secondary)] mt-1">Retour au lobby...</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </main>
  );
}

function PhotoGrid({ items, onRemove, canAdd = true }: { items: PreviewItem[]; onRemove: (id: string) => void; canAdd?: boolean }) {
  return (
    <div className="grid grid-cols-3 gap-2">
      <AnimatePresence>
        {items.map(item => (
          <motion.div
            key={item.id}
            layout
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.7 }}
            transition={{ duration: 0.2 }}
            className="relative aspect-square rounded-xl overflow-hidden group"
          >
            {item.file.type.startsWith('image/') ? (
              <img src={item.previewUrl} alt="" className="w-full h-full object-cover" />
            ) : (
              <video src={item.previewUrl} className="w-full h-full object-cover" muted />
            )}
            <button
              onClick={() => onRemove(item.id)}
              className="absolute top-1 right-1 w-5 h-5 rounded-full bg-black/70 border border-white/20 flex items-center justify-center text-white text-[10px] opacity-0 group-hover:opacity-100 active:opacity-100 transition-opacity"
            >
              ✕
            </button>
            {item.file.type.startsWith('video/') && (
              <span className="absolute bottom-1 left-1 text-xs bg-black/60 rounded px-1">🎬</span>
            )}
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
