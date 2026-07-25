import { useMemo, useState } from 'react';
import { useFilteredPosts, useApp } from '@/context/AppContext';
import { PostStatus } from '@/types';
import { StatusBadge, TypeBadge } from '@/components/StatusBadge';
import { UserAvatar } from '@/components/UserAvatar';
import { Badge } from '@/components/ui/badge';
import { Calendar, ImageIcon, GripVertical, RotateCcw } from 'lucide-react';
import { format, startOfWeek } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { DndContext, closestCenter, DragEndEvent, useDroppable, useDraggable } from '@dnd-kit/core';
import { cn } from '@/lib/utils';
import { toDirectImageUrl } from '@/lib/driveUtils';
import { ResponsavelSelectDialog } from '@/components/ResponsavelSelectDialog';

function DraggableCard({ post }: { post: any }) {
  const { getClient, getUser, setSelectedPostId } = useApp();
  const client = getClient(post.clienteId);
  const user = getUser(post.responsavelId);

  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: post.id,
    data: { post },
  });

  const style = transform ? {
    transform: `translate(${transform.x}px, ${transform.y}px)`,
    zIndex: 50,
    opacity: isDragging ? 0.8 : 1,
  } : undefined;

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn("bg-card border border-border rounded-lg overflow-hidden cursor-pointer card-hover shadow-card", isDragging && "shadow-elevated")}
    >
      <div className="flex items-start gap-2 p-3">
        <button {...listeners} {...attributes} className="mt-1 text-muted-foreground hover:text-foreground cursor-grab active:cursor-grabbing shrink-0">
          <GripVertical className="w-3.5 h-3.5" />
        </button>
        <div className="flex-1 min-w-0" onClick={() => setSelectedPostId(post.id)}>
          <div className="flex items-center gap-2 mb-1.5">
            {post.artes.length > 0 ? (
              <img src={toDirectImageUrl(post.artes[0])} className="w-8 h-8 rounded object-cover shrink-0" />
            ) : (
              <div className="w-8 h-8 rounded bg-muted flex items-center justify-center shrink-0">
                <ImageIcon className="w-4 h-4 text-muted-foreground/40" />
              </div>
            )}
            <div className="min-w-0">
              <h4 className="text-sm font-semibold text-foreground truncate">{post.titulo}</h4>
              <p className="text-[11px] text-muted-foreground truncate">{client?.nome}</p>
            </div>
          </div>
          <div className="flex items-center justify-between mt-2">
            <div className="flex items-center gap-2">
              <TypeBadge type={post.tipo} />
              {post.alterado && (
                <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-4 border-amber-500/50 text-amber-500 gap-0.5">
                  <RotateCcw className="w-2.5 h-2.5" />
                  Alterado
                </Badge>
              )}
              <span className="text-[11px] text-muted-foreground flex items-center gap-1">
                <Calendar className="w-3 h-3" />
                {format(new Date(post.dataPublicacao), 'dd/MM')}
              </span>
            </div>
            <UserAvatar user={user} size="sm" />
          </div>
        </div>
      </div>
    </div>
  );
}

function DroppableColumn({ status, color, children }: { status: PostStatus; color: string; children: React.ReactNode }) {
  const { setNodeRef, isOver } = useDroppable({ id: status });

  return (
    <div
      ref={setNodeRef}
      className={cn(
        'flex-1 min-w-[280px] bg-secondary/50 rounded-lg border-t-2 p-3 transition-colors',
        isOver && 'bg-accent/50'
      )}
      style={{ borderTopColor: `hsl(${color})` }}
    >
      {children}
    </div>
  );
}

export function KanbanView() {
  const posts = useFilteredPosts();
  const { updatePostStatus, visibleStatuses } = useApp();

  const columns = useMemo(() => {
    const cols: Record<string, typeof posts> = {};
    visibleStatuses.forEach(s => { cols[s.id] = []; });
    posts.forEach(p => { if (cols[p.status]) cols[p.status].push(p); });
    // Sort: alterado posts first, then by date
    Object.values(cols).forEach(arr => arr.sort((a, b) => {
      if (a.alterado && !b.alterado) return -1;
      if (!a.alterado && b.alterado) return 1;
      return a.dataPublicacao.localeCompare(b.dataPublicacao);
    }));
    return cols;
  }, [posts, visibleStatuses]);

  const groupByWeek = (postList: typeof posts) => {
    const groups: Record<string, typeof posts> = {};
    postList.forEach(p => {
      const weekStart = startOfWeek(new Date(p.dataPublicacao), { locale: ptBR });
      const key = format(weekStart, 'dd/MM', { locale: ptBR });
      if (!groups[key]) groups[key] = [];
      groups[key].push(p);
    });
    return groups;
  };

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over) return;
    const postId = active.id as string;
    const newStatus = over.id as PostStatus;
    const post = posts.find(p => p.id === postId);
    if (!post) return;
    if (!visibleStatuses.some(s => s.id === newStatus)) return;
    if (post.status === newStatus) return;

    // Allow moving to any status (forward or backward)
    updatePostStatus(postId, newStatus);
  }

  return (
    <DndContext collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
      <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-thin">
        {visibleStatuses.map(statusConfig => {
          const colPosts = columns[statusConfig.id] || [];
          const weekGroups = groupByWeek(colPosts);

          return (
            <DroppableColumn key={statusConfig.id} status={statusConfig.id} color={statusConfig.color}>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <StatusBadge status={statusConfig.id} size="md" />
                  <span className="text-xs text-muted-foreground">{colPosts.length}</span>
                </div>
              </div>

              <div className="space-y-4">
                {Object.entries(weekGroups).map(([weekLabel, weekPosts]) => (
                  <div key={weekLabel}>
                    <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-2 font-display">
                      Semana de {weekLabel}
                    </p>
                    <div className="space-y-2">
                      {weekPosts.map(post => (
                        <DraggableCard key={post.id} post={post} />
                      ))}
                    </div>
                  </div>
                ))}

                {colPosts.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground/50">
                    <p className="text-xs">Sem posts</p>
                  </div>
                )}
              </div>
            </DroppableColumn>
          );
        })}
      </div>
    </DndContext>
  );
}
