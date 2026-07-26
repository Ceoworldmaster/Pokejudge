interface PokeballProps {
  type?: 'pokeball' | 'greatball' | 'ultraball' | 'masterball';
  size?: number;
  className?: string;
}

export function Pokeball({ type = 'pokeball', size = 20, className = '' }: PokeballProps) {
  const colors = {
    pokeball: { top: '#EF4444', bottom: '#F1F5F9', band: '#0F172A' },
    greatball: { top: '#3B82F6', bottom: '#F1F5F9', band: '#0F172A' },
    ultraball: { top: '#1E293B', bottom: '#F1F5F9', band: '#FACC15' },
    masterball: { top: '#A855F7', bottom: '#F1F5F9', band: '#FACC15' },
  }[type];

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      className={className}
      aria-hidden="true"
    >
      <defs>
        <clipPath id={`top-${type}-${size}`}>
          <path d="M50 5 A45 45 0 0 1 95 50 L5 50 A45 45 0 0 1 50 5 Z" />
        </clipPath>
      </defs>
      <circle cx="50" cy="50" r="45" fill={colors.bottom} stroke={colors.band} strokeWidth="3" />
      <path d="M50 5 A45 45 0 0 1 95 50 L5 50 A45 45 0 0 1 50 5 Z" fill={colors.top} />
      <rect x="5" y="47" width="90" height="6" fill={colors.band} />
      <circle cx="50" cy="50" r="14" fill="#F1F5F9" stroke={colors.band} strokeWidth="4" />
      <circle cx="50" cy="50" r="6" fill={colors.band} />
    </svg>
  );
}
