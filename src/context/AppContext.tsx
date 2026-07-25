import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { Post, Client, User, PostStatus, ViewMode, StatusConfig, TypeConfig } from '@/types';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/context/AuthContext';
import { toast } from 'sonner';

export interface FilterState {
  status: PostStatus | null;
  responsavelId: string | null;
  clienteId: string | null;
  mes: number | null;
  semana: number | null;
}

export interface UserClientAssignment {
  user_id: string;
  client_id: string;
}

export interface UserTypeAssignment {
  user_id: string;
  type_id: string;
}

export interface UserStatusAssignment {
  user_id: string;
  status_id: string;
}

interface AppContextType {
  posts: Post[];
  clients: Client[];
  users: User[];
  statuses: StatusConfig[];
  types: TypeConfig[];
  viewMode: ViewMode;
  searchQuery: string;
  filters: FilterState;
  selectedPostId: string | null;
  loading: boolean;
  userClientAssignments: UserClientAssignment[];
  userTypeAssignments: UserTypeAssignment[];
  userStatusAssignments: UserStatusAssignment[];
  visibleClients: Client[];
  visibleTypes: TypeConfig[];
  visibleStatuses: StatusConfig[];
  setViewMode: (mode: ViewMode) => void;
  setSearchQuery: (q: string) => void;
  setFilters: (f: FilterState) => void;
  setSelectedPostId: (id: string | null) => void;
  addPost: (post: Omit<Post, 'id' | 'criadoEm' | 'atualizadoEm'>) => void;
  updatePost: (id: string, updates: Partial<Post>) => void;
  deletePost: (id: string) => void;
  updatePostStatus: (id: string, status: PostStatus) => void;
  getClient: (id: string) => Client | undefined;
  getUser: (id: string) => User | undefined;
  getStatusLabel: (id: string) => string;
  getStatusColor: (id: string) => string;
  getTypeLabel: (id: string) => string;
  getTypeColor: (id: string) => string;
  addClient: (client: Omit<Client, 'id' | 'criadoEm'>) => void;
  updateClient: (id: string, updates: Partial<Client>) => void;
  deleteClient: (id: string) => Promise<boolean>;
  addUser: (user: Omit<User, 'id'>) => void;
  updateUser: (id: string, updates: Partial<User>) => void;
  deleteUser: (id: string) => Promise<boolean>;
  addStatus: (status: StatusConfig) => void;
  updateStatus: (id: string, updates: Partial<StatusConfig>) => void;
  deleteStatus: (id: string) => Promise<boolean>;
  reorderStatuses: (statuses: StatusConfig[]) => void;
  addType: (type: TypeConfig) => void;
  updateType: (id: string, updates: Partial<TypeConfig>) => void;
  deleteType: (id: string) => Promise<boolean>;
  assignClientToUser: (userId: string, clientId: string) => Promise<void>;
  removeClientFromUser: (userId: string, clientId: string) => Promise<void>;
  getUserClientIds: (userId: string) => string[];
  assignTypeToUser: (userId: string, typeId: string) => Promise<void>;
  removeTypeFromUser: (userId: string, typeId: string) => Promise<void>;
  getUserTypeIds: (userId: string) => string[];
  assignStatusToUser: (userId: string, statusId: string) => Promise<void>;
  removeStatusFromUser: (userId: string, statusId: string) => Promise<void>;
  getUserStatusIds: (userId: string) => string[];
  setUserRole: (userId: string, role: 'admin' | 'user') => Promise<void>;
  getUserRole: (userId: string) => 'admin' | 'user';
  userRoles: Record<string, 'admin' | 'user'>;
  refreshAssignments: () => Promise<void>;
}

const defaultFilters: FilterState = {
  status: null, responsavelId: null, clienteId: null, mes: null, semana: null,
};

const AppContext = createContext<AppContextType | null>(null);

async function uploadArtes(artes: string[]): Promise<string[]> {
  const urls: string[] = [];
  for (const arte of artes) {
    if (arte.startsWith('blob:')) {
      try {
        const resp = await fetch(arte);
        const blob = await resp.blob();
        const ext = blob.type.split('/')[1] || 'png';
        const fileName = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
        const { error } = await supabase.storage.from('post-artes').upload(fileName, blob);
        if (error) throw error;
        const { data: { publicUrl } } = supabase.storage.from('post-artes').getPublicUrl(fileName);
        urls.push(publicUrl);
      } catch {
        // skip
      }
    } else {
      urls.push(arte);
    }
  }
  return urls;
}

export function AppProvider({ children }: { children: React.ReactNode }) {
  const { user, isAdmin } = useAuth();
  const [posts, setPosts] = useState<Post[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [statuses, setStatuses] = useState<StatusConfig[]>([]);
  const [types, setTypes] = useState<TypeConfig[]>([]);
  const [viewMode, setViewMode] = useState<ViewMode>('grade');
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState<FilterState>(defaultFilters);
  const [selectedPostId, setSelectedPostId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [userClientAssignments, setUserClientAssignments] = useState<UserClientAssignment[]>([]);
  const [userTypeAssignments, setUserTypeAssignments] = useState<UserTypeAssignment[]>([]);
  const [userStatusAssignments, setUserStatusAssignments] = useState<UserStatusAssignment[]>([]);
  const [userRoles, setUserRoles] = useState<Record<string, 'admin' | 'user'>>({});

  const fetchAssignments = async () => {
    const { data } = await supabase.from('user_client_assignments').select('user_id, client_id');
    if (data) setUserClientAssignments(data);
  };

  const fetchTypeAssignments = async () => {
    const { data } = await supabase.from('user_type_assignments').select('user_id, type_id');
    if (data) setUserTypeAssignments(data);
  };

  const fetchStatusAssignments = async () => {
    const { data } = await supabase.from('user_status_assignments').select('user_id, status_id');
    if (data) setUserStatusAssignments(data);
  };

  const fetchRoles = async () => {
    const { data } = await supabase.from('user_roles').select('user_id, role');
    if (data) {
      const map: Record<string, 'admin' | 'user'> = {};
      data.forEach(r => { map[r.user_id] = r.role as 'admin' | 'user'; });
      setUserRoles(map);
    }
  };

  useEffect(() => {
    const fetchAll = async () => {
      setLoading(true);
      const [postsRes, clientsRes, membersRes, statusesRes, typesRes] = await Promise.all([
        supabase.from('posts').select('*').order('created_at', { ascending: false }),
        supabase.from('clients').select('*').order('nome'),
        supabase.from('team_members').select('*').order('nome'),
        supabase.from('statuses').select('*').order('position'),
        supabase.from('post_types').select('*').order('label'),
      ]);

      if (postsRes.data) {
        setPosts(postsRes.data.map(p => ({
          id: p.id, titulo: p.titulo, clienteId: p.cliente_id || '', responsavelId: p.responsavel_id || '',
          dataPublicacao: p.data_publicacao, legenda: p.legenda || '', status: p.status || '', tipo: p.tipo || '',
          artes: p.artes || [], linkApresentacao: p.link_apresentacao || '', linkCopywriting: (p as any).link_copywriting || '',
          observacoes: p.observacoes || '', alterado: (p as any).alterado || false,
          criadoEm: p.created_at.split('T')[0], atualizadoEm: p.updated_at.split('T')[0],
        })));
      }
      if (clientsRes.data) {
        setClients(clientsRes.data.map(c => ({ id: c.id, nome: c.nome, descricao: c.descricao || '', criadoEm: c.created_at.split('T')[0] })));
      }
      if (membersRes.data) {
        setUsers(membersRes.data.map(m => ({ id: m.id, nome: m.nome, email: m.email || '', avatar: m.avatar || '' })));
      }
      if (statusesRes.data) {
        setStatuses(statusesRes.data.map(s => ({ id: s.id, label: s.label, color: s.color })));
      }
      if (typesRes.data) {
        setTypes(typesRes.data.map(t => ({ id: t.id, label: t.label, color: t.color })));
      }

      await Promise.all([fetchAssignments(), fetchTypeAssignments(), fetchStatusAssignments(), fetchRoles()]);
      setLoading(false);
    };
    fetchAll();
  }, []);

  // Visible clients: admins see all, users see only assigned
  const visibleClients = isAdmin
    ? clients
    : clients.filter(c => {
        if (!user) return false;
        return userClientAssignments.some(a => a.user_id === user.id && a.client_id === c.id);
      });
  // Visible types: admins see all, users see only assigned
  const visibleTypes = isAdmin
    ? types
    : types.filter(t => {
        if (!user) return false;
        return userTypeAssignments.some(a => a.user_id === user.id && a.type_id === t.id);
      });
  // Visible statuses: admins see all, users see only assigned
  const visibleStatuses = isAdmin
    ? statuses
    : statuses.filter(s => {
        if (!user) return false;
        return userStatusAssignments.some(a => a.user_id === user.id && a.status_id === s.id);
      });

  // Post CRUD (same as before)
  const addPost = useCallback(async (post: Omit<Post, 'id' | 'criadoEm' | 'atualizadoEm'>) => {
    const arteUrls = await uploadArtes(post.artes);
    const { data, error } = await supabase.from('posts').insert({
      titulo: post.titulo, cliente_id: post.clienteId || null, responsavel_id: post.responsavelId || null,
      data_publicacao: post.dataPublicacao, legenda: post.legenda, status: post.status || null,
      tipo: post.tipo || null, artes: arteUrls, link_apresentacao: post.linkApresentacao,
      link_copywriting: post.linkCopywriting, observacoes: post.observacoes,
    } as any).select().single();
    if (error) { toast.error('Erro ao criar post'); return; }
    if (data) {
      setPosts(prev => [{
        id: data.id, titulo: data.titulo, clienteId: data.cliente_id || '', responsavelId: data.responsavel_id || '',
        dataPublicacao: data.data_publicacao, legenda: data.legenda || '', status: data.status || '', tipo: data.tipo || '',
        artes: data.artes || [], linkApresentacao: data.link_apresentacao || '', linkCopywriting: (data as any).link_copywriting || '',
        observacoes: data.observacoes || '', alterado: (data as any).alterado || false,
        criadoEm: data.created_at.split('T')[0], atualizadoEm: data.updated_at.split('T')[0],
      }, ...prev]);
    }
  }, []);

  const updatePost = useCallback(async (id: string, updates: Partial<Post>) => {
    const dbUpdates: Record<string, unknown> = {};
    if (updates.titulo !== undefined) dbUpdates.titulo = updates.titulo;
    if (updates.clienteId !== undefined) dbUpdates.cliente_id = updates.clienteId || null;
    if (updates.responsavelId !== undefined) dbUpdates.responsavel_id = updates.responsavelId || null;
    if (updates.dataPublicacao !== undefined) dbUpdates.data_publicacao = updates.dataPublicacao;
    if (updates.legenda !== undefined) dbUpdates.legenda = updates.legenda;
    if (updates.status !== undefined) dbUpdates.status = updates.status || null;
    if (updates.tipo !== undefined) dbUpdates.tipo = updates.tipo || null;
    if (updates.artes !== undefined) dbUpdates.artes = await uploadArtes(updates.artes);
    if (updates.linkApresentacao !== undefined) dbUpdates.link_apresentacao = updates.linkApresentacao;
    if (updates.linkCopywriting !== undefined) dbUpdates.link_copywriting = updates.linkCopywriting;
    if (updates.observacoes !== undefined) dbUpdates.observacoes = updates.observacoes;
    if (updates.alterado !== undefined) dbUpdates.alterado = updates.alterado;
    const { data, error } = await (supabase.from('posts').update(dbUpdates as any) as any).eq('id', id).select().single();
    if (error) { toast.error('Erro ao atualizar post'); return; }
    if (data) {
      setPosts(prev => prev.map(p => p.id === id ? {
        id: data.id, titulo: data.titulo, clienteId: data.cliente_id || '', responsavelId: data.responsavel_id || '',
        dataPublicacao: data.data_publicacao, legenda: data.legenda || '', status: data.status || '', tipo: data.tipo || '',
        artes: data.artes || [], linkApresentacao: data.link_apresentacao || '', linkCopywriting: (data as any).link_copywriting || '',
        observacoes: data.observacoes || '', alterado: (data as any).alterado || false,
        criadoEm: data.created_at.split('T')[0], atualizadoEm: data.updated_at.split('T')[0],
      } : p));
    }
  }, []);

  const deletePost = useCallback(async (id: string) => {
    const { error } = await supabase.from('posts').delete().eq('id', id);
    if (error) { toast.error('Erro ao excluir post'); return; }
    setPosts(prev => prev.filter(p => p.id !== id));
    setSelectedPostId(null);
  }, []);

  const updatePostStatus = useCallback((id: string, status: PostStatus) => {
    updatePost(id, { status });
  }, [updatePost]);

  const getClient = useCallback((id: string) => clients.find(c => c.id === id), [clients]);
  const getUser = useCallback((id: string) => users.find(u => u.id === id), [users]);
  const getStatusLabel = useCallback((id: string) => statuses.find(s => s.id === id)?.label || id, [statuses]);
  const getStatusColor = useCallback((id: string) => statuses.find(s => s.id === id)?.color || '220 10% 50%', [statuses]);
  const getTypeLabel = useCallback((id: string) => types.find(t => t.id === id)?.label || id, [types]);
  const getTypeColor = useCallback((id: string) => types.find(t => t.id === id)?.color || '220 10% 50%', [types]);

  // Client CRUD
  const addClient = useCallback(async (client: Omit<Client, 'id' | 'criadoEm'>) => {
    const { data, error } = await supabase.from('clients').insert({ nome: client.nome, descricao: client.descricao }).select().single();
    if (error) { toast.error('Erro ao adicionar cliente'); return; }
    if (data) setClients(prev => [...prev, { id: data.id, nome: data.nome, descricao: data.descricao || '', criadoEm: data.created_at.split('T')[0] }]);
  }, []);

  const updateClient = useCallback(async (id: string, updates: Partial<Client>) => {
    const { error } = await supabase.from('clients').update({ nome: updates.nome, descricao: updates.descricao }).eq('id', id);
    if (error) { toast.error('Erro ao atualizar cliente'); return; }
    setClients(prev => prev.map(c => c.id === id ? { ...c, ...updates } : c));
  }, []);

  const deleteClient = useCallback(async (id: string): Promise<boolean> => {
    const inUse = posts.some(p => p.clienteId === id);
    if (inUse) return false;
    const { error } = await supabase.from('clients').delete().eq('id', id);
    if (error) { toast.error('Erro ao excluir cliente'); return false; }
    setClients(prev => prev.filter(c => c.id !== id));
    return true;
  }, [posts]);

  // User CRUD
  const addUser = useCallback(async (user: Omit<User, 'id'>) => {
    const { data, error } = await supabase.from('team_members').insert({ nome: user.nome, email: user.email, avatar: user.avatar }).select().single();
    if (error) { toast.error('Erro ao adicionar responsável'); return; }
    if (data) setUsers(prev => [...prev, { id: data.id, nome: data.nome, email: data.email || '', avatar: data.avatar || '' }]);
  }, []);

  const updateUser = useCallback(async (id: string, updates: Partial<User>) => {
    const { error } = await supabase.from('team_members').update({ nome: updates.nome, email: updates.email }).eq('id', id);
    if (error) { toast.error('Erro ao atualizar responsável'); return; }
    setUsers(prev => prev.map(u => u.id === id ? { ...u, ...updates } : u));
  }, []);

  const deleteUser = useCallback(async (id: string): Promise<boolean> => {
    const inUse = posts.some(p => p.responsavelId === id);
    if (inUse) return false;
    const { error } = await supabase.from('team_members').delete().eq('id', id);
    if (error) { toast.error('Erro ao excluir responsável'); return false; }
    setUsers(prev => prev.filter(u => u.id !== id));
    return true;
  }, [posts]);

  // Status CRUD
  const addStatus = useCallback(async (status: StatusConfig) => {
    const maxPos = statuses.length;
    const { error } = await supabase.from('statuses').insert({ id: status.id, label: status.label, color: status.color, position: maxPos });
    if (error) { toast.error('Erro ao adicionar status'); return; }
    setStatuses(prev => [...prev, status]);
  }, [statuses]);

  const updateStatus = useCallback(async (id: string, updates: Partial<StatusConfig>) => {
    const { error } = await supabase.from('statuses').update({ label: updates.label, color: updates.color }).eq('id', id);
    if (error) { toast.error('Erro ao atualizar status'); return; }
    setStatuses(prev => prev.map(s => s.id === id ? { ...s, ...updates } : s));
  }, []);

  const deleteStatus = useCallback(async (id: string): Promise<boolean> => {
    const inUse = posts.some(p => p.status === id);
    if (inUse) return false;
    const { error } = await supabase.from('statuses').delete().eq('id', id);
    if (error) { toast.error('Erro ao excluir status'); return false; }
    setStatuses(prev => prev.filter(s => s.id !== id));
    return true;
  }, [posts]);

  const reorderStatuses = useCallback(async (newStatuses: StatusConfig[]) => {
    setStatuses(newStatuses);
    for (let i = 0; i < newStatuses.length; i++) {
      await supabase.from('statuses').update({ position: i }).eq('id', newStatuses[i].id);
    }
  }, []);

  // Type CRUD
  const addType = useCallback(async (type: TypeConfig) => {
    const { error } = await supabase.from('post_types').insert({ id: type.id, label: type.label, color: type.color });
    if (error) { toast.error('Erro ao adicionar tipo'); return; }
    setTypes(prev => [...prev, type]);
  }, []);

  const updateType = useCallback(async (id: string, updates: Partial<TypeConfig>) => {
    const { error } = await supabase.from('post_types').update({ label: updates.label, color: updates.color }).eq('id', id);
    if (error) { toast.error('Erro ao atualizar tipo'); return; }
    setTypes(prev => prev.map(t => t.id === id ? { ...t, ...updates } : t));
  }, []);

  const deleteType = useCallback(async (id: string): Promise<boolean> => {
    const inUse = posts.some(p => p.tipo === id);
    if (inUse) return false;
    const { error } = await supabase.from('post_types').delete().eq('id', id);
    if (error) { toast.error('Erro ao excluir tipo'); return false; }
    setTypes(prev => prev.filter(t => t.id !== id));
    return true;
  }, [posts]);

  // Client assignment management
  const assignClientToUser = useCallback(async (userId: string, clientId: string) => {
    const { error } = await supabase.from('user_client_assignments').insert({ user_id: userId, client_id: clientId });
    if (error) { toast.error('Erro ao atribuir cliente'); return; }
    setUserClientAssignments(prev => [...prev, { user_id: userId, client_id: clientId }]);
  }, []);

  const removeClientFromUser = useCallback(async (userId: string, clientId: string) => {
    const { error } = await supabase.from('user_client_assignments').delete().eq('user_id', userId).eq('client_id', clientId);
    if (error) { toast.error('Erro ao remover cliente'); return; }
    setUserClientAssignments(prev => prev.filter(a => !(a.user_id === userId && a.client_id === clientId)));
  }, []);

  const getUserClientIds = useCallback((userId: string) => {
    return userClientAssignments.filter(a => a.user_id === userId).map(a => a.client_id);
  }, [userClientAssignments]);

  // Type assignment management
  const assignTypeToUser = useCallback(async (userId: string, typeId: string) => {
    const { error } = await supabase.from('user_type_assignments').insert({ user_id: userId, type_id: typeId });
    if (error) { toast.error('Erro ao atribuir tipo'); return; }
    setUserTypeAssignments(prev => [...prev, { user_id: userId, type_id: typeId }]);
  }, []);

  const removeTypeFromUser = useCallback(async (userId: string, typeId: string) => {
    const { error } = await supabase.from('user_type_assignments').delete().eq('user_id', userId).eq('type_id', typeId);
    if (error) { toast.error('Erro ao remover tipo'); return; }
    setUserTypeAssignments(prev => prev.filter(a => !(a.user_id === userId && a.type_id === typeId)));
  }, []);

  const getUserTypeIds = useCallback((userId: string) => {
    return userTypeAssignments.filter(a => a.user_id === userId).map(a => a.type_id);
  }, [userTypeAssignments]);

  // Status assignment management
  const assignStatusToUser = useCallback(async (userId: string, statusId: string) => {
    const { error } = await supabase.from('user_status_assignments').insert({ user_id: userId, status_id: statusId });
    if (error) { toast.error('Erro ao atribuir status'); return; }
    setUserStatusAssignments(prev => [...prev, { user_id: userId, status_id: statusId }]);
  }, []);

  const removeStatusFromUser = useCallback(async (userId: string, statusId: string) => {
    const { error } = await supabase.from('user_status_assignments').delete().eq('user_id', userId).eq('status_id', statusId);
    if (error) { toast.error('Erro ao remover status'); return; }
    setUserStatusAssignments(prev => prev.filter(a => !(a.user_id === userId && a.status_id === statusId)));
  }, []);

  const getUserStatusIds = useCallback((userId: string) => {
    return userStatusAssignments.filter(a => a.user_id === userId).map(a => a.status_id);
  }, [userStatusAssignments]);

  // Role management
  const setUserRoleFunc = useCallback(async (userId: string, role: 'admin' | 'user') => {
    await supabase.from('user_roles').delete().eq('user_id', userId);
    const { error } = await supabase.from('user_roles').insert({ user_id: userId, role });
    if (error) { toast.error('Erro ao alterar nível'); return; }
    setUserRoles(prev => ({ ...prev, [userId]: role }));
  }, []);

  const getUserRole = useCallback((userId: string): 'admin' | 'user' => {
    return userRoles[userId] || 'user';
  }, [userRoles]);

  const refreshAssignments = useCallback(async () => {
    await Promise.all([fetchAssignments(), fetchTypeAssignments(), fetchStatusAssignments(), fetchRoles()]);
  }, []);

  return (
    <AppContext.Provider value={{
      posts, clients, users, statuses, types, viewMode, searchQuery, filters, selectedPostId, loading,
      userClientAssignments, userTypeAssignments, userStatusAssignments, visibleClients, visibleTypes, visibleStatuses,
      setViewMode, setSearchQuery, setFilters, setSelectedPostId,
      addPost, updatePost, deletePost, updatePostStatus, getClient, getUser,
      getStatusLabel, getStatusColor, getTypeLabel, getTypeColor,
      addClient, updateClient, deleteClient,
      addUser, updateUser, deleteUser,
      addStatus, updateStatus, deleteStatus, reorderStatuses,
      addType, updateType, deleteType,
      assignClientToUser, removeClientFromUser, getUserClientIds,
      assignTypeToUser, removeTypeFromUser, getUserTypeIds,
      assignStatusToUser, removeStatusFromUser, getUserStatusIds,
      setUserRole: setUserRoleFunc, getUserRole, userRoles, refreshAssignments,
    }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}

export function useFilteredPosts() {
  const { posts, searchQuery, filters, getClient, getUser, visibleClients, visibleTypes, visibleStatuses } = useApp();
  const { isAdmin, user } = useAuth();
  const visibleClientIds = new Set(visibleClients.map(c => c.id));
  const visibleTypeIds = new Set(visibleTypes.map(t => t.id));
  const visibleStatusIds = new Set(visibleStatuses.map(s => s.id));

  return posts.filter(post => {
    // Admins see everything; non-admins only see posts assigned to them with matching clients, types, and statuses
    if (!isAdmin) {
      if (post.responsavelId !== user?.id) return false;
      if (post.clienteId && !visibleClientIds.has(post.clienteId)) return false;
      if (post.tipo && !visibleTypeIds.has(post.tipo)) return false;
      if (post.status && !visibleStatusIds.has(post.status)) return false;
    }

    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const client = getClient(post.clienteId);
      const user = getUser(post.responsavelId);
      const match = post.titulo.toLowerCase().includes(q)
        || post.legenda.toLowerCase().includes(q)
        || post.status.toLowerCase().includes(q)
        || client?.nome.toLowerCase().includes(q)
        || user?.nome.toLowerCase().includes(q);
      if (!match) return false;
    }

    if (filters.status && post.status !== filters.status) return false;
    if (filters.responsavelId && post.responsavelId !== filters.responsavelId) return false;
    if (filters.clienteId && post.clienteId !== filters.clienteId) return false;

    if (filters.mes !== null) {
      const month = new Date(post.dataPublicacao).getMonth();
      if (month !== filters.mes) return false;
    }

    return true;
  });
}
