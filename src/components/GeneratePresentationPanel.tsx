import { useState, useEffect } from 'react';
import { useApp } from '@/context/AppContext';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { CalendarIcon, Copy, Link2, Plus, Trash2, ExternalLink } from 'lucide-react';
import { toast } from 'sonner';

interface PresentationLink {
  id: string;
  token: string;
  client_id: string;
  status_filter: string[] | null;
  date_from: string | null;
  date_to: string | null;
  created_at: string;
  expires_at: string | null;
}

interface Props {
  open: boolean;
  onClose: () => void;
  defaultClientId?: string;
}

export function GeneratePresentationPanel({ open, onClose, defaultClientId }: Props) {
  const { visibleClients: clients, statuses } = useApp();
  const { user } = useAuth();
  const [clientId, setClientId] = useState<string>(defaultClientId || '');
  const [statusFilter, setStatusFilter] = useState<string[]>([]);
  const [dateFrom, setDateFrom] = useState<Date | undefined>();
  const [dateTo, setDateTo] = useState<Date | undefined>();
  const [links, setLinks] = useState<PresentationLink[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (defaultClientId) setClientId(defaultClientId);
  }, [defaultClientId]);

  useEffect(() => {
    if (open && user) fetchLinks();
  }, [open, user]);

  const fetchLinks = async () => {
    const { data } = await supabase
      .from('presentation_links')
      .select('*')
      .order('created_at', { ascending: false });
    if (data) setLinks(data as unknown as PresentationLink[]);
  };

  const generateLink = async () => {
    if (!clientId || !user) {
      toast.error('Selecione um cliente');
      return;
    }
    setLoading(true);

    // Check if there are posts matching the filters
    let query = supabase
      .from('posts')
      .select('id')
      .eq('cliente_id', clientId);
    if (statusFilter.length > 0) {
      query = query.in('status', statusFilter);
    }
    if (dateFrom) {
      query = query.gte('data_publicacao', format(dateFrom, 'yyyy-MM-dd'));
    }
    if (dateTo) {
      query = query.lte('data_publicacao', format(dateTo, 'yyyy-MM-dd'));
    }
    const { data: posts } = await query;

    if (!posts || posts.length === 0) {
      toast.error('Nenhum post encontrado para os filtros selecionados.');
      setLoading(false);
      return;
    }

    const token = crypto.randomUUID().replace(/-/g, '').slice(0, 16);
    const { error } = await supabase.from('presentation_links').insert({
      token,
      client_id: clientId,
      status_filter: statusFilter.length > 0 ? statusFilter : null,
      date_from: dateFrom ? format(dateFrom, 'yyyy-MM-dd') : null,
      date_to: dateTo ? format(dateTo, 'yyyy-MM-dd') : null,
      created_by: user.id,
    } as any);
    if (error) {
      toast.error('Erro ao gerar link');
    } else {
      const url = `${window.location.origin}/apresentacao/${token}`;
      await navigator.clipboard.writeText(url);
      toast.success('Link copiado para a área de transferência!');
      fetchLinks();
    }
    setLoading(false);
  };

  const deleteLink = async (id: string) => {
    await supabase.from('presentation_links').delete().eq('id', id);
    setLinks(prev => prev.filter(l => l.id !== id));
    toast.success('Link removido');
  };

  const copyLink = (token: string) => {
    const url = `${window.location.origin}/apresentacao/${token}`;
    navigator.clipboard.writeText(url);
    toast.success('Link copiado!');
  };

  const getClientName = (id: string) => clients.find(c => c.id === id)?.nome || 'Cliente';

  const toggleStatus = (id: string) => {
    setStatusFilter(prev => prev.includes(id) ? prev.filter(s => s !== id) : [...prev, id]);
  };

  return (
    <Sheet open={open} onOpenChange={v => !v && onClose()}>
      <SheetContent className="w-full sm:max-w-md overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="font-display">Gerar Apresentação</SheetTitle>
        </SheetHeader>

        <div className="space-y-5 mt-6">
          {/* Client */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">Cliente</label>
            <Select value={clientId} onValueChange={setClientId}>
              <SelectTrigger className="bg-secondary border-border">
                <SelectValue placeholder="Selecione o cliente" />
              </SelectTrigger>
              <SelectContent>
                {clients.map(c => (
                  <SelectItem key={c.id} value={c.id}>{c.nome}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Status filter */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">Status (opcional)</label>
            <div className="flex flex-wrap gap-2">
              {statuses.map(s => (
                <button
                  key={s.id}
                  onClick={() => toggleStatus(s.id)}
                  className={cn(
                    'px-3 py-1 rounded-full text-xs font-medium border transition-colors',
                    statusFilter.includes(s.id)
                      ? 'bg-primary text-primary-foreground border-primary'
                      : 'bg-secondary text-secondary-foreground border-border hover:border-primary/50'
                  )}
                >
                  {s.label}
                </button>
              ))}
            </div>
          </div>

          {/* Date range */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">De</label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className={cn('w-full justify-start text-left text-sm', !dateFrom && 'text-muted-foreground')}>
                    <CalendarIcon className="w-4 h-4 mr-2" />
                    {dateFrom ? format(dateFrom, 'dd/MM/yy') : 'Início'}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar mode="single" selected={dateFrom} onSelect={setDateFrom} locale={ptBR} className="p-3 pointer-events-auto" />
                </PopoverContent>
              </Popover>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Até</label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className={cn('w-full justify-start text-left text-sm', !dateTo && 'text-muted-foreground')}>
                    <CalendarIcon className="w-4 h-4 mr-2" />
                    {dateTo ? format(dateTo, 'dd/MM/yy') : 'Fim'}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar mode="single" selected={dateTo} onSelect={setDateTo} locale={ptBR} className="p-3 pointer-events-auto" />
                </PopoverContent>
              </Popover>
            </div>
          </div>

          <Button onClick={generateLink} disabled={loading || !clientId} className="w-full">
            <Plus className="w-4 h-4 mr-2" />
            Gerar Link
          </Button>

          {/* Existing links */}
          {links.length > 0 && (
            <div className="space-y-3 pt-4 border-t border-border">
              <h3 className="text-sm font-medium text-muted-foreground">Links gerados</h3>
              {links.map(link => (
                <div key={link.id} className="flex items-center gap-2 bg-secondary rounded-lg p-3">
                  <Link2 className="w-4 h-4 text-primary shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">{getClientName(link.client_id)}</p>
                    <p className="text-xs text-muted-foreground">
                      {link.date_from && link.date_to
                        ? `${format(new Date(link.date_from + 'T12:00:00'), 'dd/MM', { locale: ptBR })} - ${format(new Date(link.date_to + 'T12:00:00'), 'dd/MM', { locale: ptBR })}`
                        : 'Sem filtro de data'}
                    </p>
                  </div>
                  <Button variant="ghost" size="icon" className="shrink-0 h-8 w-8" onClick={() => copyLink(link.token)}>
                    <Copy className="w-3.5 h-3.5" />
                  </Button>
                  <a href={`/apresentacao/${link.token}`} target="_blank" rel="noopener noreferrer">
                    <Button variant="ghost" size="icon" className="shrink-0 h-8 w-8">
                      <ExternalLink className="w-3.5 h-3.5" />
                    </Button>
                  </a>
                  <Button variant="ghost" size="icon" className="shrink-0 h-8 w-8 text-destructive hover:text-destructive" onClick={() => deleteLink(link.id)}>
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
