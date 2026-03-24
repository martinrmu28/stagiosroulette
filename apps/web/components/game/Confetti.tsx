'use client';
import { useEffect, useState } from 'react';

const COLORS = ['#F59E0B', '#D97706', '#3B82F6', '#60A5FA', '#10B981', '#EC4899', '#8B5CF6'];

export function Confetti({ active }: { active: boolean }) {
  const [pieces, setPieces] = useState<Array<{ id: number; x: number; color: string; size: number; dur: number; delay: number; rotate: number }>>([]);

  useEffect(() => {
    if (!active) { setPieces([]); return; }
    setPieces(Array.from({ length: 70 }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      color: COLORS[Math.floor(Math.random() * COLORS.length)],
      size: 5 + Math.random() * 7,
      dur: 2.5 + Math.random() * 3,
      delay: Math.random() * 2.5,
      rotate: Math.random() * 360,
    })));
  }, [active]);

  if (!active || !pieces.length) return null;

  return (
    <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden">
      {pieces.map(p => (
        <div
          key={p.id}
          className="confetti-piece"
          style={{
            left: `${p.x}%`,
            top: '-10px',
            width: p.size,
            height: p.size,
            backgroundColor: p.color,
            borderRadius: Math.random() > 0.5 ? '50%' : '2px',
            transform: `rotate(${p.rotate}deg)`,
            animationDuration: `${p.dur}s`,
            animationDelay: `${p.delay}s`,
            boxShadow: `0 0 4px ${p.color}88`,
          }}
        />
      ))}
    </div>
  );
}
