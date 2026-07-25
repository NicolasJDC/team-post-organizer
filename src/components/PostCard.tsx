import { Post } from '@/types';
import { useApp } from '@/context/AppContext';
import { StatusBadge, TypeBadge } from '@/components/StatusBadge';
import { UserAvatar } from '@/components/UserAvatar';
import { Calendar, ImageIcon, Images, RotateCcw } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { toDirectImageUrl } from '@/lib/driveUtils';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface PostCardProps {
  post: Post;
  index?: number;
}

export function PostCard({ post, index = 0 }: PostCardProps) {
  const { getClient, getUser, setSelectedPostId } = useApp();
  const client = getClient(post.clienteId);
  const user = getUser(post.responsavelId);
  const hasArtes = post.artes.length > 0;

  return (
    <div
      onClick={() => setSelectedPostId(post.id)}
      className="group bg-card rounded-lg border border-border overflow-hidden cursor-pointer card-hover shadow-card animate-fade-in"
      style={{ animationDelay: `${index * 40}ms` }}
    >
      <div className="aspect-square bg-muted relative overflow-hidden">
        {hasArtes ? (
          <>
            <img src={toDirectImageUrl(post.artes[0])} alt={post.titulo} className="w-full h-full object-cover" />
            {post.artes.length > 1 && (
              <div className="absolute bottom-2 right-2 bg-background/70 backdrop-blur-sm rounded-md px-1.5 py-0.5 flex items-center gap-1 text-[10px] text-foreground">
                <Images className="w-3 h-3" />
                {post.artes.length}
              </div>
            )}
          </>
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <ImageIcon className="w-10 h-10 text-foreground/30" />
          </div>
        )}
        <div className="absolute top-2 left-2 flex gap-1">
          <StatusBadge status={post.status} />
          {post.alterado && (
            <Badge variant="outline" className="text-[9px] px-1 py-0 h-4 border-amber-500/50 text-amber-500 bg-background/70 backdrop-blur-sm gap-0.5">
              <RotateCcw className="w-2.5 h-2.5" />
              Alterado
            </Badge>
          )}
        </div>
        <div className="absolute top-2 right-2">
          <TypeBadge type={post.tipo} />
        </div>
      </div>

      <div className="p-3 space-y-2">
        <h3 className="font-display font-semibold text-sm text-foreground truncate group-hover:text-primary transition-colors">
          {post.titulo}
        </h3>
        <p className="text-xs text-foreground truncate">{client?.nome}</p>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-xs text-foreground">
            <Calendar className="w-3 h-3" />
            <span>{format(new Date(post.dataPublicacao), "dd MMM", { locale: ptBR })}</span>
          </div>
          <UserAvatar user={user} size="sm" />
        </div>
      </div>
    </div>
  );
}
