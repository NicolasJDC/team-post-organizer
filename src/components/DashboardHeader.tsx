import { useApp } from '@/context/AppContext';
import { ViewMode } from '@/types';
import { Search, Plus, LayoutGrid, CalendarDays, Columns3, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn } from '@/lib/utils';

interface DashboardHeaderProps {
  onNewPost: () => void;
}

const viewOptions: { mode: ViewMode; icon: React.ReactNode; label: string }[] = [
  { mode: 'grade', icon: <LayoutGrid className="w-4 h-4" />, label: 'Grade' },
  { mode: 'calendario', icon: <CalendarDays className="w-4 h-4" />, label: 'Calendário' },
  { mode: 'kanban', icon: <Columns3 className="w-4 h-4" />, label: 'Kanban' },
];

export function DashboardHeader({ onNewPost }: DashboardHeaderProps) {
  const { viewMode, setViewMode, searchQuery, setSearchQuery, filters, setFilters, visibleClients, users, statuses } = useApp();
  const clients = visibleClients;

  const hasActiveFilters = filters.status || filters.responsavelId || filters.clienteId;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-display font-bold text-foreground tracking-tight">
            VOID<span className="text-primary"> de Conteúdo</span>
          </h1>
          <p className="text-sm text-foreground mt-0.5 hidden md:block">Gestão visual de conteúdo para Instagram</p>
        </div>

        <div className="flex items-center gap-2">
          <Button onClick={onNewPost} className="bg-primary text-primary-foreground hover:bg-primary/90 font-display font-semibold shadow-glow">
            <Plus className="w-4 h-4 mr-2" />
            Novo Post
          </Button>
        </div>
      </div>

      <div className="flex flex-col gap-3">
        <div className="flex flex-col md:flex-row gap-3">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-foreground" />
            <Input
              placeholder="Buscar posts, clientes, responsáveis..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="pl-9 bg-secondary border-border"
            />
            {searchQuery && (
              <button onClick={() => setSearchQuery('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <div className="flex bg-secondary rounded-lg p-1 ml-auto shrink-0">
            {viewOptions.map(({ mode, icon, label }) => (
              <button
                key={mode}
                onClick={() => setViewMode(mode)}
                className={cn(
                  'flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all',
                  viewMode === mode
                    ? 'bg-primary text-primary-foreground shadow-sm'
                    : 'text-foreground hover:text-primary'
                )}
              >
                {icon}
                <span className="hidden sm:inline">{label}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="flex gap-2 flex-wrap">
          <Select value={filters.status || 'all'} onValueChange={v => setFilters({ ...filters, status: v === 'all' ? null : v })}>
            <SelectTrigger className="w-[130px] bg-secondary border-border text-sm">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos status</SelectItem>
              {statuses.map(s => (
                <SelectItem key={s.id} value={s.id}>{s.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={filters.clienteId || 'all'} onValueChange={v => setFilters({ ...filters, clienteId: v === 'all' ? null : v })}>
            <SelectTrigger className="w-[140px] bg-secondary border-border text-sm">
              <SelectValue placeholder="Cliente" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos clientes</SelectItem>
              {clients.map(c => (
                <SelectItem key={c.id} value={c.id}>{c.nome}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={filters.responsavelId || 'all'} onValueChange={v => setFilters({ ...filters, responsavelId: v === 'all' ? null : v })}>
            <SelectTrigger className="w-[140px] bg-secondary border-border text-sm">
              <SelectValue placeholder="Responsável" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              {users.map(u => (
                <SelectItem key={u.id} value={u.id}>{u.nome}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          {hasActiveFilters && (
            <Button variant="ghost" size="sm" onClick={() => setFilters({ status: null, responsavelId: null, clienteId: null, mes: null, semana: null })} className="text-muted-foreground hover:text-foreground text-xs">
              <X className="w-3 h-3 mr-1" /> Limpar
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
