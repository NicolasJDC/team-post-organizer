import { useFilteredPosts } from '@/context/AppContext';
import { PostCard } from '@/components/PostCard';
import { ImageIcon } from 'lucide-react';

export function GridView() {
  const posts = useFilteredPosts();

  if (posts.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center mb-4">
          <ImageIcon className="w-8 h-8 text-muted-foreground/40" />
        </div>
        <h3 className="font-display font-semibold text-foreground mb-1">Nenhum post encontrado</h3>
        <p className="text-sm text-muted-foreground">Crie seu primeiro post ou ajuste os filtros</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
      {posts.map((post, i) => (
        <PostCard key={post.id} post={post} index={i} />
      ))}
    </div>
  );
}
