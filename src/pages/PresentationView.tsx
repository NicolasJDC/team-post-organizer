import { useState, useEffect, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { toDirectImageUrl } from '@/lib/driveUtils';
import { ChevronLeft, ChevronRight, Image as ImageIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { toast } from 'sonner';

interface PostData {
  id: string;
  titulo: string;
  legenda: string | null;
  data_publicacao: string;
  status: string | null;
  tipo: string | null;
  artes: string[] | null;
}

interface PresentationData {
  link: { id: string; client_id: string; status_filter: string[] | null; date_from: string | null; date_to: string | null };
  client: { id: string; nome: string };
  posts: PostData[];
}

interface PresentationButton {
  id: string;
  label: string;
  target_status: string | null;
  is_alteracao: boolean;
  color: string;
  position: number;
}

const PresentationView = () => {
  const { token } = useParams<{ token: string }>();
  const [data, setData] = useState<PresentationData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentSlide, setCurrentSlide] = useState(0);
  
  const [buttons, setButtons] = useState<PresentationButton[]>([]);

  // Change request state
  const [changeModalOpen, setChangeModalOpen] = useState(false);
  const [changeMotivo, setChangeMotivo] = useState('');
  const [requestingChange, setRequestingChange] = useState(false);
  const [changesRequested, setChangesRequested] = useState<Set<string>>(new Set());
  const [activeButton, setActiveButton] = useState<PresentationButton | null>(null);

  useEffect(() => {
    if (!token) return;
    const projectId = import.meta.env.VITE_SUPABASE_PROJECT_ID;

    // Fetch presentation data and buttons in parallel
    Promise.all([
      fetch(`https://${projectId}.supabase.co/functions/v1/get-presentation?token=${token}`).then(r => r.json()),
      fetch(`https://${projectId}.supabase.co/rest/v1/presentation_buttons?order=position.asc`, {
        headers: {
          'apikey': import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
      }).then(r => r.json()),
    ])
      .then(([presentationData, buttonsData]) => {
        if (presentationData.error) setError(presentationData.error);
        else setData(presentationData);
        if (Array.isArray(buttonsData)) setButtons(buttonsData);
      })
      .catch(() => setError('Erro ao carregar apresentação'))
      .finally(() => setLoading(false));
  }, [token]);

  const next = useCallback(() => {
    if (data) setCurrentSlide(prev => Math.min(prev + 1, data.posts.length - 1));
  }, [data]);

  const prev = useCallback(() => {
    setCurrentSlide(prev => Math.max(prev - 1, 0));
  }, []);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (changeModalOpen) return;
      if (e.key === 'ArrowRight' || e.key === ' ') { e.preventDefault(); next(); }
      if (e.key === 'ArrowLeft') { e.preventDefault(); prev(); }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [next, prev, changeModalOpen]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-3">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-sm text-muted-foreground">Carregando apresentação...</p>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-2">
          <p className="text-lg font-display font-bold text-foreground">Ops!</p>
          <p className="text-sm text-muted-foreground">{error || 'Apresentação não encontrada'}</p>
        </div>
      </div>
    );
  }

  if (data.posts.length === 0) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-2">
          <p className="text-lg font-display font-bold text-foreground">{data.client.nome}</p>
          <p className="text-sm text-muted-foreground">Nenhum post encontrado para os filtros selecionados.</p>
        </div>
      </div>
    );
  }

  const handleButtonClick = (btn: PresentationButton) => {
    if (btn.is_alteracao) {
      setActiveButton(btn);
      setChangeModalOpen(true);
    } else {
      handleDirectAction(btn);
    }
  };

  const handleDirectAction = async (btn: PresentationButton) => {
    if (!token) return;
    const post = data.posts[currentSlide];

    try {
      const projectId = import.meta.env.VITE_SUPABASE_PROJECT_ID;
      const res = await fetch(`https://${projectId}.supabase.co/functions/v1/request-changes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token,
          postId: post.id,
          motivo: `Ação: ${btn.label}`,
          targetStatus: btn.target_status,
          isAlteracao: false,
        }),
      });
      const result = await res.json();
      if (result.success) {
        toast.success(`${btn.label} realizado com sucesso!`);
        setChangesRequested(prev => new Set(prev).add(`${post.id}-${btn.id}`));
        // Update local post status instantly
        if (btn.target_status) {
          setData(prev => {
            if (!prev) return prev;
            const updatedPosts = prev.posts.map(p =>
              p.id === post.id ? { ...p, status: btn.target_status } : p
            );
            return { ...prev, posts: updatedPosts };
          });
        }
      } else {
        toast.error(result.error || 'Erro ao processar ação');
      }
    } catch {
      toast.error('Erro ao processar ação');
    }
  };

  const handleRequestChange = async () => {
    if (!token || !changeMotivo.trim()) {
      toast.error('Descreva o que precisa ser alterado');
      return;
    }

    const post = data.posts[currentSlide];
    setRequestingChange(true);

    try {
      const projectId = import.meta.env.VITE_SUPABASE_PROJECT_ID;
      const res = await fetch(`https://${projectId}.supabase.co/functions/v1/request-changes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token,
          postId: post.id,
          motivo: changeMotivo.trim(),
          targetStatus: activeButton?.target_status || null,
          isAlteracao: true,
        }),
      });
      const result = await res.json();
      if (result.success) {
        toast.success('Solicitação enviada com sucesso!');
        if (activeButton) {
          setChangesRequested(prev => new Set(prev).add(`${post.id}-${activeButton.id}`));
          if (activeButton.target_status) {
            setData(prev => {
              if (!prev) return prev;
              const updatedPosts = prev.posts.map(p =>
                p.id === post.id ? { ...p, status: activeButton.target_status } : p
              );
              return { ...prev, posts: updatedPosts };
            });
          }
        }
        setChangeModalOpen(false);
        setChangeMotivo('');
        setActiveButton(null);
      } else {
        toast.error(result.error || 'Erro ao solicitar alteração');
      }
    } catch {
      toast.error('Erro ao solicitar alteração');
    }
    setRequestingChange(false);
  };


  const post = data.posts[currentSlide];
  const artes = post.artes || [];
  const mainImage = artes[0] ? toDirectImageUrl(artes[0]) : null;

  return (
    <div className="min-h-screen bg-background flex flex-col select-none">
      {/* Header */}
      <div className="bg-card border-b border-border px-4 md:px-8 py-3 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <span className="font-display font-bold text-foreground">{data.client.nome}</span>
          <span className="text-muted-foreground text-sm">|</span>
          <span className="text-sm text-muted-foreground">
            {format(new Date(post.data_publicacao + 'T12:00:00'), "dd 'de' MMM", { locale: ptBR })}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground font-medium">
            {currentSlide + 1} / {data.posts.length}
          </span>
          {/* Dynamic buttons */}
          {buttons.map(btn => {
            const used = changesRequested.has(`${post.id}-${btn.id}`);
            return (
              <Button
                key={btn.id}
                variant="outline"
                size="sm"
                onClick={() => handleButtonClick(btn)}
                disabled={used}
                className="gap-2 border-border"
                style={!used ? { borderColor: `hsl(${btn.color})`, color: `hsl(${btn.color})` } : undefined}
              >
                {used ? '✓ ' : ''}{btn.label}
              </Button>
            );
          })}
        </div>
      </div>

      {/* Slide content */}
      <div className="flex-1 flex flex-col md:flex-row gap-0 overflow-hidden">
        {/* Image area */}
        <div className="flex-1 flex items-center justify-center p-4 md:p-8 relative">
          {mainImage ? (
            <img
              src={mainImage}
              alt={post.titulo}
              className="max-w-full max-h-[calc(100vh-140px)] object-contain rounded-lg shadow-lg"
              loading="eager"
            />
          ) : (
            <div className="w-64 h-64 bg-secondary rounded-xl flex items-center justify-center">
              <ImageIcon className="w-16 h-16 text-muted-foreground/30" />
            </div>
          )}

          {/* Navigation arrows */}
          {currentSlide > 0 && (
            <button
              onClick={prev}
              className="absolute left-2 md:left-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-card/80 backdrop-blur border border-border flex items-center justify-center text-foreground hover:bg-card transition-colors"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
          )}
          {currentSlide < data.posts.length - 1 && (
            <button
              onClick={next}
              className="absolute right-2 md:right-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-card/80 backdrop-blur border border-border flex items-center justify-center text-foreground hover:bg-card transition-colors"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Info panel */}
        <div className="w-full md:w-80 lg:w-96 bg-card border-t md:border-t-0 md:border-l border-border p-5 md:p-6 overflow-y-auto shrink-0">
          <div className="space-y-4">
            <div>
              <h2 className="font-display font-bold text-lg text-foreground">{post.titulo}</h2>
              <p className="text-xs text-muted-foreground mt-1">
                {format(new Date(post.data_publicacao + 'T12:00:00'), "EEEE, dd 'de' MMMM", { locale: ptBR })}
              </p>
            </div>

            {post.legenda && (
              <div className="space-y-1.5">
                <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Legenda</h3>
                <p className="text-sm text-foreground/90 whitespace-pre-wrap leading-relaxed">{post.legenda}</p>
              </div>
            )}

            {/* Thumbnail gallery */}
            {artes.length > 1 && (
              <div className="space-y-1.5">
                <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Artes</h3>
                <div className="grid grid-cols-3 gap-2">
                  {artes.map((arte, i) => (
                    <img
                      key={i}
                      src={toDirectImageUrl(arte)}
                      alt={`Arte ${i + 1}`}
                      className="w-full aspect-square object-cover rounded-md"
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Dynamic buttons in panel */}
            <div className="space-y-2">
              {buttons.map(btn => {
                const used = changesRequested.has(`${post.id}-${btn.id}`);
                return (
                  <Button
                    key={btn.id}
                    variant="outline"
                    className="w-full gap-2 border-border"
                    onClick={() => handleButtonClick(btn)}
                    disabled={used}
                    style={!used ? { borderColor: `hsl(${btn.color})`, color: `hsl(${btn.color})` } : undefined}
                  >
                    {used ? '✓ ' : ''}{btn.label}
                  </Button>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Bottom dots */}
      {data.posts.length > 1 && (
        <div className="flex justify-center gap-1.5 py-3 bg-card border-t border-border">
          {data.posts.map((p, i) => (
            <button
              key={i}
              onClick={() => setCurrentSlide(i)}
              className={cn(
                'w-2 h-2 rounded-full transition-all relative',
                i === currentSlide ? 'bg-primary w-6' : 'bg-muted-foreground/30 hover:bg-muted-foreground/50',
              )}
            />
          ))}
        </div>
      )}

      {/* Change request modal (for alteração buttons) */}
      <Dialog open={changeModalOpen} onOpenChange={(v) => { if (!v) { setChangeModalOpen(false); setActiveButton(null); setChangeMotivo(''); } }}>
        <DialogContent className="max-w-md bg-card border-border">
          <DialogHeader>
            <DialogTitle className="font-display">{activeButton?.label || 'Solicitar Alteração'}</DialogTitle>
            <DialogDescription className="text-muted-foreground">
              Descreva o que precisa ser alterado no post <strong className="text-foreground">"{post.titulo}"</strong>
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <Textarea
              value={changeMotivo}
              onChange={e => setChangeMotivo(e.target.value)}
              placeholder="Ex: Trocar a imagem principal, corrigir o texto da legenda, ajustar as cores..."
              className="bg-secondary border-border min-h-[120px]"
              autoFocus
            />
            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => { setChangeModalOpen(false); setChangeMotivo(''); setActiveButton(null); }} className="border-border">
                Cancelar
              </Button>
              <Button
                onClick={handleRequestChange}
                disabled={requestingChange || !changeMotivo.trim()}
                className="gap-2"
              >
                {requestingChange ? 'Enviando...' : 'Enviar'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default PresentationView;
