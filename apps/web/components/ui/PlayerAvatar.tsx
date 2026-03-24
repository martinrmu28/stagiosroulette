'use client';

const PLAYER_COLORS = [
  '#3B82F6', '#EC4899', '#10B981', '#8B5CF6',
  '#06B6D4', '#F43F5E', '#84CC16', '#F97316',
];

interface PlayerAvatarProps {
  emoji: string;
  colorIndex: number;
  size?: 'sm' | 'md' | 'lg';
  isHost?: boolean;
  className?: string;
}

const sizes = { sm: 32, md: 40, lg: 52 };
const textSizes = { sm: 'text-base', md: 'text-xl', lg: 'text-2xl' };

export function PlayerAvatar({ emoji, colorIndex, size = 'md', isHost, className = '' }: PlayerAvatarProps) {
  const color = PLAYER_COLORS[colorIndex % PLAYER_COLORS.length];
  const px = sizes[size];

  return (
    <div className={`relative shrink-0 ${className}`} style={{ width: px, height: px }}>
      <div
        className={`w-full h-full rounded-full flex items-center justify-center ${textSizes[size]}`}
        style={{
          background: `${color}22`,
          border: `1.5px solid ${color}55`,
        }}
      >
        {emoji}
      </div>
      {isHost && (
        <span className="absolute -top-1 -right-1 text-xs leading-none">👑</span>
      )}
    </div>
  );
}

export { PLAYER_COLORS };
