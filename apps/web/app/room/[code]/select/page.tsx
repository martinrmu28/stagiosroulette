'use client';
import { useState, useRef, useCallback, useEffect } from 'react';
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
const MAX        = 30;
const MIN        = 1;
const BATCH_MAX  = 100;
const SUBSET_MIN = 15;
const SUBSET_MAX = 20;
const YOLO_COUNT = 20;

/* ===== Utils (outside component) ===== */

function checkVideoDuration(file: File): Promise<boolean> {
  return new Promise((resolve) => {
    const url   = URL.createObjectURL(file);
    const video = document.createElement('video');
    video.preload = 'metadata';
    video.onloadedmetadata = () => { URL.revokeObjectURL(url); resolve(video.duration <= 10); };
    video.onerror          = () => { URL.revokeObjectURL(url); resolve(false); };
    video.src = url;
  });
}

function pickSubset(pool: File[], count: number): PreviewItem[] {
  const shuffled = [...pool].sort(() => Math.random() - 0.5);
  const picked   = shuffled.slice(0, Math.min(count, pool.length));
  return picked.map(f => ({
    id: Math.random().toString(36).slice(2),
    file: f,
    previewUrl: URL.createObjectURL(f),
  }));
}

async function compressAndUpload(file: File): Promise<{ id: string; url: string; type: 'photo' | 'video' }> {
  const socket = getSocket();
  const type: 'photo' | 'video' = file.type.startsWith('image/') ? 'photo' : 'video';

  let processedFile = file;
  if (type === 'photo') {
    processedFile = await imageCompression(file, {
      maxSizeMB: 1.5,
      maxWidthOrHeight: 1920,
      useWebWorker: true,
      initialQuality: 0.8,
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

/* ===== Component ===== */

export default function SelectPage({ params }: { params: { code: string } }) {
  const router = useRouter();
  const store  = useGameStore();
  const { code } = params;

  const [mode, setMode]               = useState<Mode>('manuel');
  const [items, setItems]             = useState<PreviewItem[]>([]);
  const [batchFiles, setBatchFiles]   = useState<File[]>([]);
  const [importProgress, setImportProgress] = useState<{ current: number; total: number } | null>(null);
  const [uploading, setUploading]     = useState(false);
  const [done, setDone]               = useState(false);
  const [error, setError]             = useState('');
  const fileRef    = useRef<HTMLInputElement>(null);
  const yoloRef    = useRef<HTMLInputElement>(null);
  const uploadModeRef = useRef<Mode>('manuel');

  const mediaMode = store.roomSettings?.mediaMode ?? 'photo';
  const accept    = mediaMode === 'photo' ? 'image/*' : mediaMode === 'video' ? 'video/*' : 'image/*,video/*';

  // Revoke object URLs on unmount
  useEffect(() => {
    return () => { items.forEach(i => URL.revokeObjectURL(i.previewUrl)); };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  /* ===== Mode switch ===== */
  const switchMode = (newMode: Mode) => {
    items.forEach(i => URL.revokeObjectURL(i.previewUrl));
    setItems([]);
    setBatchFiles([]);
    setImportProgress(null);
    setError('');
    setMode(newMode);
  };

  /* ===== Import batch (aléatoire + yolo) ===== */
  const importBatch = useCallback(async (files: FileList): Promise<File[]> => {
    const all   = Array.from(files).slice(0, BATCH_MAX);
    const total = all.length;
    setImportProgress({ current: 0, total });

    const valid: File[] = [];
    for (let i = 0; i < all.length; i++) {
      const f  = all[i];
      let ok   = true;
      if (f.type.startsWith('video/')) {
        ok = await checkVideoDuration(f);
      } else if (!f.type.startsWith('image/')) {
        ok = false;
      }
      if (ok) valid.push(f);
      setImportProgress({ current: i + 1, total });
    }

    setImportProgress(null);
    return valid;
  }, []);

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
    const valid = await importBatch(files);
    if (valid.length === 0) { setError('Aucun fichier valide (vidéos > 10s exclues).'); return; }
    setBatchFiles(valid);
    const count  = SUBSET_MIN + Math.floor(Math.random() * (SUBSET_MAX - SUBSET_MIN + 1));
    setItems(pickSubset(valid, count));
  }, [importBatch]);

  const reshuffleRandom = () => {
    items.forEach(i => URL.revokeObjectURL(i.previewUrl));
    const count = SUBSET_MIN + Math.floor(Math.random() * (SUBSET_MAX - SUBSET_MIN + 1));
    setItems(pickSubset(batchFiles, count));
  };

  const removeAndReplace = (id: string) => {
    setItems(prev => {
      const item = prev.find(i => i.id === id);
      if (!item) return prev;
      URL.revokeObjectURL(item.previewUrl);
      const currentFiles  = prev.filter(i => i.id !== id).map(i => i.file);
      const availablePool = batchFiles.filter(f => !currentFiles.includes(f) && f !== item.file);
      if (availablePool.length === 0) return prev.filter(i => i.id !== id);
      const replacement = availablePool[Math.floor(Math.random() * availablePool.length)];
      const newItem: PreviewItem = {
        id: Math.random().toString(36).slice(2),
        file: replacement,
        previewUrl: URL.createObjectURL(replacement),
      };
      return prev.map(i => i.id === id ? newItem : i);
    });
  };

  /* ===== YOLO ===== */
  const handleYoloFiles = useCallback(async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    const valid = await importBatch(files);
    if (valid.length === 0) { setError('Aucun fichier valide (vidéos > 10s exclues).'); return; }
    const subset = pickSubset(valid, YOLO_COUNT);
    uploadModeRef.current = 'yolo';
    await doUpload(subset);
  }, [importBatch]); // eslint-disable-line react-hooks/exhaustive-deps

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

  const handleValidate = () => {
    uploadModeRef.current = mode;
    doUpload(items);
  };

  /* ===== Progress bar helper ===== */
  const ProgressBar = ({ progress }: { progress: { current: number; total: number } }) => (
    <div className="flex flex-col gap-2">
      <p className="text-sm text-[var(--text-secondary)] text-center">
        Validation {progress.current}/{progress.total} fichiers...
      </p>
      <div className="w-full h-2 rounded-full bg-[var(--glass-border)] overflow-hidden">
        <div
          className="h-full rounded-full bg-gradient-to-r from-amber-500 to-amber-400 transition-all duration-150"
          style={{ width: `${(progress.current / progress.total) * 100}%` }}
        />
      </div>
    </div>
  );

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
            {importProgress
              ? `Validation ${importProgress.current}/${importProgress.total} fichiers...`
              : items.length > 0
                ? `${items.length} fichier${items.length > 1 ? 's' : ''} sélectionné${items.length > 1 ? 's' : ''}`
                : batchFiles.length > 0
                  ? `${batchFiles.length} fichiers importés`
                  : 'Choisis comment sélectionner'
            }
          </p>
        </div>

        {/* Mode tabs */}
        <div className="glass rounded-2xl p-1 flex gap-1">
          {tabs.map(t => (
            <button
              key={t.key}
              onClick={() => switchMode(t.key)}
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

        {/* Mode panels */}
        <AnimatePresence mode="wait">
          {/* ── MANUEL ── */}
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

          {/* ── ALÉATOIRE ── */}
          {mode === 'aleatoire' && (
            <motion.div key="aleatoire" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} className="flex flex-col gap-4">
              <p className="text-xs text-[var(--text-secondary)]">
                Importe un gros lot, l'app tire 15–20 fichiers au sort. Tu peux relancer ou retirer individuellement.
              </p>

              <input
                ref={fileRef}
                type="file"
                accept={accept}
                multiple
                className="hidden"
                onChange={e => handleRandomFiles(e.target.files)}
              />

              {/* Phase 1 : aucun batch */}
              {!importProgress && batchFiles.length === 0 && (
                <button
                  onClick={() => fileRef.current?.click()}
                  className="w-full py-8 rounded-2xl border-2 border-dashed border-[var(--glass-border)] hover:border-[var(--amber-border)] hover:bg-[var(--amber-surface)] transition-all flex flex-col items-center gap-2 text-[var(--text-secondary)] hover:text-[var(--amber-500)]"
                >
                  <span className="text-3xl">🎲</span>
                  <span className="text-sm font-body">Importer ma galerie</span>
                  <span className="text-xs opacity-60">Max 100 fichiers · vidéos ≤ 10s</span>
                </button>
              )}

              {/* Phase 2 : import en cours */}
              {importProgress && <ProgressBar progress={importProgress} />}

              {/* Phase 3 : subset prêt */}
              {!importProgress && items.length > 0 && (
                <>
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-body font-medium text-[#F1F5F9]">{items.length} tirés au sort</p>
                    <p className="text-xs text-[var(--text-secondary)]">{batchFiles.length} dans ta galerie</p>
                  </div>
                  <PhotoGrid items={items} onRemove={removeAndReplace} canAdd={false} removeLabel="↩" />
                </>
              )}
            </motion.div>
          )}

          {/* ── YOLO ── */}
          {mode === 'yolo' && (
            <motion.div key="yolo" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} className="flex flex-col gap-4">
              <GlassCard variant="amber" className="p-4">
                <p className="text-[var(--amber-500)] font-display font-bold text-sm mb-1">⚠️ Mode YOLO activé</p>
                <p className="text-xs text-[var(--text-secondary)]">
                  L'app pioche 20 fichiers de ta galerie <strong className="text-[#F1F5F9]">sans te les montrer</strong> avant d'envoyer. Pas de filet de sécurité — pour les courageux !
                </p>
              </GlassCard>

              <input ref={yoloRef} type="file" accept={accept} multiple className="hidden" onChange={e => handleYoloFiles(e.target.files)} />

              {/* Progress bar */}
              {importProgress && <ProgressBar progress={importProgress} />}

              {/* Message upload en cours */}
              {uploading && !importProgress && (
                <p className="text-center text-sm text-[var(--amber-500)] font-display font-semibold">
                  C'est parti, pas de retour en arrière ! 🚀
                </p>
              )}

              {/* Bouton — caché pendant import / upload */}
              {!importProgress && !uploading && (
                <Button variant="primary" size="lg" onClick={() => yoloRef.current?.click()}>
                  🤪 Lancer le YOLO !
                </Button>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {error && (
          <p className="text-xs text-[#EF4444] text-center">{error}</p>
        )}
      </div>

      {/* Sticky bottom bar (manuel + aléatoire) */}
      {(mode === 'manuel' || mode === 'aleatoire') && items.length > 0 && !done && !importProgress && (
        <div className="fixed bottom-0 left-0 right-0 z-20 px-5 pb-8 pt-4" style={{ background: 'linear-gradient(to top, #0B1120 60%, transparent)' }}>
          <div className="max-w-sm mx-auto flex gap-3">
            {mode === 'aleatoire' && (
              <Button variant="secondary" size="lg" onClick={reshuffleRandom} className="flex-1">
                🔄 Retirer
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
            <div className="text-center px-6">
              <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', stiffness: 200 }}>
                <span className="text-7xl">{uploadModeRef.current === 'yolo' ? '🤪' : '✅'}</span>
              </motion.div>
              <p className="font-display font-bold text-xl text-[#F1F5F9] mt-4">
                {uploadModeRef.current === 'yolo' ? "C'est parti, pas de retour en arrière !" : 'Photos uploadées !'}
              </p>
              <p className="text-sm text-[var(--text-secondary)] mt-1">Retour au lobby...</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </main>
  );
}

function PhotoGrid({
  items,
  onRemove,
  canAdd = true,
  removeLabel = '✕',
}: {
  items: PreviewItem[];
  onRemove: (id: string) => void;
  canAdd?: boolean;
  removeLabel?: string;
}) {
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
              {removeLabel}
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
