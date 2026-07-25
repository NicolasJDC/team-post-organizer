import { Post } from '@/types';

// Fields required to leave Copywriting
export function validateCopywritingComplete(post: Partial<Post>): string | null {
  if (!post.dataPublicacao) return 'Preencha a data de publicação';
  if (!post.tipo) return 'Selecione o tipo';
  if (!post.clienteId) return 'Selecione o cliente';
  if (!post.legenda?.trim()) return 'Preencha a legenda';
  if (!post.linkCopywriting?.trim()) return 'Preencha o link do documento de copywriting';
  return null;
}

// Fields required to move from Criação to Revisão
export function validateCriacaoComplete(post: Partial<Post>): string | null {
  if (!post.dataPublicacao) return 'Preencha a data de publicação';
  if (!post.tipo) return 'Selecione o tipo';
  if (!post.clienteId) return 'Selecione o cliente';
  if (!post.responsavelId) return 'Selecione o responsável';
  if (!post.legenda?.trim()) return 'Preencha a legenda';
  
  if (!post.artes || post.artes.length === 0) return 'Adicione pelo menos uma arte';
  return null;
}
