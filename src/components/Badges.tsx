import { ELEMENTS, DIFFICULTIES } from '@/lib/constants';
import type { Difficulty } from '@/types';
import { Pokeball } from './Pokeball';

export function ElementBadge({ element, size = 'sm', glow = false }: { element: string; size?: 'sm' | 'md'; glow?: boolean }) {
  const meta = ELEMENTS[element] ?? ELEMENTS.Normal;
  const sz = size === 'md' ? 'px-3 py-1 text-sm' : 'px-2.5 py-0.5 text-xs';
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full font-semibold ${meta.bg} ${meta.text} ring-1 ${meta.ring} ${sz} ${glow ? 'element-glow' : ''}`}
      style={glow ? ({ ['--el-glow' as string]: meta.glow, ['--el-color' as string]: meta.color } as React.CSSProperties) : undefined}
    >
      <span className="text-sm leading-none">{meta.emoji}</span>
      <span
        className="h-2 w-2 rounded-full"
        style={{ backgroundColor: meta.color }}
      />
      {meta.name}
    </span>
  );
}

export function DifficultyBadge({ difficulty }: { difficulty: Difficulty }) {
  const meta = DIFFICULTIES[difficulty];
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full font-semibold ${meta.bg} ${meta.text} ring-1 ring-${meta.color}/40 px-2.5 py-0.5 text-xs`}
      style={{ boxShadow: `0 0 0 1px ${meta.color}33` }}
    >
      <Pokeball type={meta.ball as 'pokeball' | 'greatball' | 'ultraball' | 'masterball'} size={14} />
      {meta.label}
    </span>
  );
}
