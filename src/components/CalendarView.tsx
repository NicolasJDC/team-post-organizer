import { useState, useMemo } from 'react';
import { useFilteredPosts, useApp } from '@/context/AppContext';
import { format, startOfMonth, endOfMonth, startOfWeek, endOfWeek, eachDayOfInterval, isSameMonth, isSameDay, addMonths, subMonths, addWeeks, subWeeks } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { ChevronLeft, ChevronRight, Plus, ImageIcon } from 'lucide-react';
import { StatusBadge } from '@/components/StatusBadge';
import { cn } from '@/lib/utils';
import { toDirectImageUrl } from '@/lib/driveUtils';

type ViewMode = 'month' | 'week';

interface CalendarViewProps {
  onNewPost: (date: string) => void;
}

export function CalendarView({ onNewPost }: CalendarViewProps) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [mode, setMode] = useState<ViewMode>('month');
  const posts = useFilteredPosts();
  const { setSelectedPostId } = useApp();

  const days = useMemo(() => {
    if (mode === 'month') {
      const monthStart = startOfMonth(currentDate);
      const monthEnd = endOfMonth(currentDate);
      const start = startOfWeek(monthStart, { locale: ptBR });
      const end = endOfWeek(monthEnd, { locale: ptBR });
      return eachDayOfInterval({ start, end });
    } else {
      const start = startOfWeek(currentDate, { locale: ptBR });
      const end = endOfWeek(currentDate, { locale: ptBR });
      return eachDayOfInterval({ start, end });
    }
  }, [currentDate, mode]);

  const postsByDate = useMemo(() => {
    const map: Record<string, typeof posts> = {};
    posts.forEach(p => {
      const key = p.dataPublicacao;
      if (!map[key]) map[key] = [];
      map[key].push(p);
    });
    return map;
  }, [posts]);

  const weekDays = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

  const goBack = () => {
    setCurrentDate(prev => mode === 'month' ? subMonths(prev, 1) : subWeeks(prev, 1));
  };

  const goForward = () => {
    setCurrentDate(prev => mode === 'month' ? addMonths(prev, 1) : addWeeks(prev, 1));
  };

  const headerLabel = useMemo(() => {
    if (mode === 'month') {
      return format(currentDate, 'MMMM yyyy', { locale: ptBR });
    }
    const start = startOfWeek(currentDate, { locale: ptBR });
    const end = endOfWeek(currentDate, { locale: ptBR });
    return `${format(start, 'dd MMM', { locale: ptBR })} – ${format(end, 'dd MMM yyyy', { locale: ptBR })}`;
  }, [currentDate, mode]);

  const maxPostsPerDay = mode === 'week' ? 6 : 3;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <button onClick={goBack} className="p-2 hover:bg-secondary rounded-lg text-muted-foreground hover:text-foreground transition-colors">
          <ChevronLeft className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3">
          <h2 className="font-display font-semibold text-lg capitalize">
            {headerLabel}
          </h2>
          <div className="flex bg-secondary rounded-lg p-0.5">
            <button
              onClick={() => setMode('month')}
              className={cn(
                'px-3 py-1 text-xs font-medium rounded-md transition-colors',
                mode === 'month' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground'
              )}
            >
              Mês
            </button>
            <button
              onClick={() => setMode('week')}
              className={cn(
                'px-3 py-1 text-xs font-medium rounded-md transition-colors',
                mode === 'week' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground'
              )}
            >
              Semana
            </button>
          </div>
        </div>

        <button onClick={goForward} className="p-2 hover:bg-secondary rounded-lg text-muted-foreground hover:text-foreground transition-colors">
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>

      <div className="grid grid-cols-7 gap-px bg-border rounded-lg overflow-hidden">
        {weekDays.map(d => (
          <div key={d} className="bg-secondary p-2 text-center text-xs font-medium text-muted-foreground">
            {d}
          </div>
        ))}

        {days.map(day => {
          const key = format(day, 'yyyy-MM-dd');
          const dayPosts = postsByDate[key] || [];
          const isCurrentMonth = mode === 'month' ? isSameMonth(day, currentDate) : true;
          const isToday = isSameDay(day, new Date());

          return (
            <div
              key={key}
              className={cn(
                'bg-card p-1.5 relative group',
                mode === 'week' ? 'min-h-[200px]' : 'min-h-[100px] md:min-h-[120px]',
                !isCurrentMonth && 'opacity-30'
              )}
            >
              <div className="flex items-center justify-between mb-1">
                <span className={cn(
                  'text-xs font-medium w-6 h-6 flex items-center justify-center rounded-full',
                  isToday ? 'bg-primary text-primary-foreground' : 'text-muted-foreground'
                )}>
                  {format(day, 'd')}
                </span>
                {isCurrentMonth && (
                  <button
                    onClick={() => onNewPost(key)}
                    className="opacity-0 group-hover:opacity-100 transition-opacity p-0.5 hover:bg-secondary rounded"
                  >
                    <Plus className="w-3.5 h-3.5 text-muted-foreground" />
                  </button>
                )}
              </div>

              <div className="space-y-1 overflow-hidden">
                {dayPosts.slice(0, maxPostsPerDay).map(p => (
                  <button
                    key={p.id}
                    onClick={() => setSelectedPostId(p.id)}
                    className="w-full flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] bg-secondary hover:bg-accent truncate transition-colors"
                  >
                    {p.artes.length > 0 ? (
                      <img src={toDirectImageUrl(p.artes[0])} className="w-4 h-4 rounded-sm object-cover shrink-0" />
                    ) : (
                      <ImageIcon className="w-3 h-3 shrink-0 text-muted-foreground" />
                    )}
                    <span className="truncate text-foreground">{p.titulo}</span>
                  </button>
                ))}
                {dayPosts.length > maxPostsPerDay && (
                  <span className="text-[10px] text-muted-foreground px-1.5">+{dayPosts.length - maxPostsPerDay} mais</span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
