import { PostStatus, PostType } from '@/types';
import { useApp } from '@/context/AppContext';
import { cn } from '@/lib/utils';

interface StatusBadgeProps {
  status: PostStatus;
  size?: 'sm' | 'md';
}

export function StatusBadge({ status, size = 'sm' }: StatusBadgeProps) {
  const { getStatusLabel, getStatusColor } = useApp();
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full font-medium font-display tracking-wide uppercase',
        size === 'sm' ? 'px-2 py-0.5 text-[10px]' : 'px-3 py-1 text-xs',
      )}
      style={{ backgroundColor: `hsl(${getStatusColor(status)})`, color: 'hsl(240 10% 6%)' }}
    >
      {getStatusLabel(status)}
    </span>
  );
}

interface TypeBadgeProps {
  type: PostType;
}

export function TypeBadge({ type }: TypeBadgeProps) {
  const { getTypeLabel, getTypeColor } = useApp();
  return (
    <span
      className="inline-flex items-center rounded-md px-2 py-0.5 text-[10px] font-medium font-display tracking-wide"
      style={{ backgroundColor: `hsl(${getTypeColor(type)} / 0.15)`, color: `hsl(${getTypeColor(type)})` }}
    >
      {getTypeLabel(type)}
    </span>
  );
}
