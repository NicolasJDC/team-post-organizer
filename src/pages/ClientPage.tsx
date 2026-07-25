import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useApp } from '@/context/AppContext';
import { PostCard } from '@/components/PostCard';
import { PostDetailModal } from '@/components/PostDetailModal';
import { GeneratePresentationPanel } from '@/components/GeneratePresentationPanel';
import { ArrowLeft, Building2, Presentation } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const ClientPage = () => {
  const { id } = useParams();
  const { posts, getClient } = useApp();
  const [presentationOpen, setPresentationOpen] = useState(false);
  const client = getClient(id || '');
  const clientPosts = posts.filter(p => p.clienteId === id).sort((a, b) => a.dataPublicacao.localeCompare(b.dataPublicacao));

  if (!client) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">Cliente não encontrado</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-[1400px] mx-auto px-4 md:px-6 py-6 space-y-6">
        {/* Header */}
        <div>
          <Link to="/" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-4">
            <ArrowLeft className="w-4 h-4" /> Voltar
          </Link>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-primary/15 flex items-center justify-center">
              <Building2 className="w-6 h-6 text-primary" />
            </div>
            <div className="flex-1">
              <h1 className="font-display font-bold text-2xl text-foreground">{client.nome}</h1>
              <p className="text-sm text-muted-foreground">{client.descricao} · Desde {format(new Date(client.criadoEm), "MMM yyyy", { locale: ptBR })}</p>
            </div>
            <Button variant="outline" size="sm" onClick={() => setPresentationOpen(true)} className="shrink-0">
              <Presentation className="w-4 h-4 mr-2" />
              Apresentação
            </Button>
          </div>
        </div>

        {/* Posts */}
        <div>
          <h2 className="font-display font-semibold text-sm text-muted-foreground uppercase tracking-wider mb-4">
            {clientPosts.length} post{clientPosts.length !== 1 ? 's' : ''}
          </h2>
          {clientPosts.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {clientPosts.map((post, i) => (
                <PostCard key={post.id} post={post} index={i} />
              ))}
            </div>
          ) : (
            <div className="text-center py-16 text-muted-foreground">
              <p>Nenhum post para este cliente</p>
            </div>
          )}
        </div>
      </div>

      <PostDetailModal />
      <GeneratePresentationPanel open={presentationOpen} onClose={() => setPresentationOpen(false)} defaultClientId={id} />
    </div>
  );
};

export default ClientPage;
