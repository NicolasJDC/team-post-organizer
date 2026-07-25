export type PostStatus = string;
export type PostType = string;

export interface StatusConfig {
  id: string;
  label: string;
  color: string; // HSL values like "220 85% 60%"
}

export interface TypeConfig {
  id: string;
  label: string;
  color: string;
}

export interface User {
  id: string;
  nome: string;
  email: string;
  avatar: string;
}

export interface Client {
  id: string;
  nome: string;
  descricao: string;
  criadoEm: string;
}

export interface ChecklistItem {
  id: string;
  texto: string;
  concluido: boolean;
}


export interface Post {
  id: string;
  titulo: string;
  clienteId: string;
  responsavelId: string;
  dataPublicacao: string;
  legenda: string;
  status: PostStatus;
  tipo: PostType;
  artes: string[];
  linkApresentacao: string;
  linkCopywriting: string;
  observacoes: string;
  alterado: boolean;
  criadoEm: string;
  atualizadoEm: string;
}

export const DEFAULT_STATUSES: StatusConfig[] = [
  { id: 'criacao', label: 'Criação', color: '220 85% 60%' },
  { id: 'revisao', label: 'Revisão', color: '40 95% 55%' },
  { id: 'aprovado', label: 'Aprovado', color: '150 70% 45%' },
  { id: 'agendado', label: 'Agendado', color: '175 65% 45%' },
];

export const DEFAULT_TYPES: TypeConfig[] = [
  { id: 'reel', label: 'Reel', color: '280 70% 60%' },
  { id: 'carrossel', label: 'Carrossel', color: '200 80% 55%' },
  { id: 'story', label: 'Story', color: '330 75% 55%' },
  { id: 'post', label: 'Post Simples', color: '16 85% 60%' },
];

export type ViewMode = 'grade' | 'calendario' | 'kanban';
