import { User } from '@/types';
import { cn } from '@/lib/utils';

interface UserAvatarProps {
  user: User | undefined;
  size?: 'sm' | 'md' | 'lg';
  showName?: boolean;
}

const sizeClasses = {
  sm: 'w-6 h-6 text-[10px]',
  md: 'w-8 h-8 text-xs',
  lg: 'w-10 h-10 text-sm',
};

export function UserAvatar({ user, size = 'sm', showName = false }: UserAvatarProps) {
  if (!user) return null;

  const initials = user.nome.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();

  return (
    <div className="flex items-center gap-2">
      <div className={cn(
        'rounded-full bg-primary/20 text-primary flex items-center justify-center font-display font-semibold shrink-0',
        sizeClasses[size]
      )}>
        {user.avatar ? (
          <img src={user.avatar} alt={user.nome} className="w-full h-full rounded-full object-cover" />
        ) : (
          initials
        )}
      </div>
      {showName && <span className="text-sm text-secondary-foreground truncate">{user.nome}</span>}
    </div>
  );
}
