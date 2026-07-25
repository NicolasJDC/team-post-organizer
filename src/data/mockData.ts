import { User, Client, Post } from '@/types';

export const mockUsers: User[] = [
  { id: 'u1', nome: 'Ana Silva', email: 'ana@void.com', avatar: '' },
  { id: 'u2', nome: 'Carlos Lima', email: 'carlos@void.com', avatar: '' },
  { id: 'u3', nome: 'Marina Costa', email: 'marina@void.com', avatar: '' },
];

export const mockClients: Client[] = [
  { id: 'c1', nome: 'Café Origem', descricao: 'Cafeteria artesanal premium', criadoEm: '2025-01-15' },
  { id: 'c2', nome: 'Studio Flex', descricao: 'Academia e wellness', criadoEm: '2025-02-01' },
  { id: 'c3', nome: 'Nova Estética', descricao: 'Clínica de estética', criadoEm: '2025-02-20' },
];

export const mockPosts: Post[] = [
  {
    id: 'p1', titulo: 'Lançamento blend especial', clienteId: 'c1', responsavelId: 'u1',
    dataPublicacao: '2026-03-14', legenda: 'Conheça nosso novo blend especial ☕', status: 'criacao',
    tipo: 'carrossel', artes: [], linkApresentacao: '', linkCopywriting: '', observacoes: 'Prioridade alta', alterado: false, criadoEm: '2026-03-01', atualizadoEm: '2026-03-10',
  },
  {
    id: 'p2', titulo: 'Treino da semana', clienteId: 'c2', responsavelId: 'u2',
    dataPublicacao: '2026-03-15', legenda: 'Treino funcional de 30min 💪', status: 'revisao',
    tipo: 'reel', artes: [], linkApresentacao: 'https://canva.com/treino-semana', linkCopywriting: '', observacoes: '', alterado: false, criadoEm: '2026-03-02', atualizadoEm: '2026-03-11',
  },
  {
    id: 'p3', titulo: 'Promoção março', clienteId: 'c3', responsavelId: 'u3',
    dataPublicacao: '2026-03-17', legenda: 'Março de ofertas especiais ✨', status: 'aprovado',
    tipo: 'post', artes: [], linkApresentacao: '', linkCopywriting: '', observacoes: 'Cliente confirmou desconto de 20%', alterado: false, criadoEm: '2026-03-03', atualizadoEm: '2026-03-12',
  },
  {
    id: 'p4', titulo: 'Bastidores café', clienteId: 'c1', responsavelId: 'u2',
    dataPublicacao: '2026-03-18', legenda: 'Um dia na nossa torrefação 🫘', status: 'agendado',
    tipo: 'story', artes: [], linkApresentacao: '', linkCopywriting: '', observacoes: '', alterado: false, criadoEm: '2026-03-05', atualizadoEm: '2026-03-12',
  },
  {
    id: 'p5', titulo: 'Depoimento cliente', clienteId: 'c2', responsavelId: 'u1',
    dataPublicacao: '2026-03-20', legenda: 'Resultados reais de alunos 🏆', status: 'criacao',
    tipo: 'carrossel', artes: [], linkApresentacao: '', linkCopywriting: '', observacoes: 'Aguardando resposta do aluno', alterado: false, criadoEm: '2026-03-06', atualizadoEm: '2026-03-10',
  },
  {
    id: 'p6', titulo: 'Skincare routine', clienteId: 'c3', responsavelId: 'u3',
    dataPublicacao: '2026-03-22', legenda: 'Rotina matinal para pele perfeita 🌟', status: 'revisao',
    tipo: 'reel', artes: [], linkApresentacao: 'https://canva.com/skincare', linkCopywriting: '', observacoes: '', alterado: false, criadoEm: '2026-03-07', atualizadoEm: '2026-03-11',
  },
];
