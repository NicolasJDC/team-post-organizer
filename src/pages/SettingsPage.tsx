import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useApp } from '@/context/AppContext';
import { useAuth } from '@/context/AuthContext';
import { Client, User, StatusConfig, TypeConfig } from '@/types';
import { ArrowLeft, Plus, Pencil, Trash2, AlertTriangle, LogOut, Shield, ShieldCheck, Users, Building2, UserCheck, ListChecks, Tag, Link2, MousePointerClick } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { Switch } from '@/components/ui/switch';
import { cn } from '@/lib/utils';

// ─── Clientes Tab ────────────────────────────────────────────
function ClientesTab() {
  const { clients, addClient, updateClient, deleteClient } = useApp();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Client | null>(null);
  const [nome, setNome] = useState('');
  const [descricao, setDescricao] = useState('');

  const openNew = () => { setEditing(null); setNome(''); setDescricao(''); setOpen(true); };
  const openEdit = (c: Client) => { setEditing(c); setNome(c.nome); setDescricao(c.descricao); setOpen(true); };

  const save = () => {
    if (!nome.trim()) return;
    if (editing) {
      updateClient(editing.id, { nome: nome.trim(), descricao: descricao.trim() });
      toast.success('Cliente atualizado');
    } else {
      addClient({ nome: nome.trim(), descricao: descricao.trim() });
      toast.success('Cliente adicionado');
    }
    setOpen(false);
  };

  const handleDelete = async (id: string) => {
    const ok = await deleteClient(id);
    if (!ok) toast.error('Não é possível excluir: cliente possui posts vinculados');
    else toast.success('Cliente excluído');
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-display font-semibold text-foreground">Clientes</h3>
        <Button size="sm" onClick={openNew}><Plus className="w-4 h-4 mr-1" />Adicionar</Button>
      </div>
      <div className="rounded-lg border border-border overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-secondary/50">
              <TableHead>Nome</TableHead>
              <TableHead>Descrição</TableHead>
              <TableHead className="w-[100px]">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {clients.map(c => (
              <TableRow key={c.id}>
                <TableCell className="font-medium">{c.nome}</TableCell>
                <TableCell className="text-muted-foreground">{c.descricao}</TableCell>
                <TableCell>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(c)}><Pencil className="w-3.5 h-3.5" /></Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive" onClick={() => handleDelete(c.id)}><Trash2 className="w-3.5 h-3.5" /></Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
            {clients.length === 0 && (
              <TableRow><TableCell colSpan={3} className="text-center text-muted-foreground py-8">Nenhum cliente cadastrado</TableCell></TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="bg-card border-border">
          <DialogHeader><DialogTitle className="font-display">{editing ? 'Editar Cliente' : 'Novo Cliente'}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div><Label>Nome</Label><Input value={nome} onChange={e => setNome(e.target.value)} className="mt-1 bg-secondary border-border" /></div>
            <div><Label>Descrição</Label><Input value={descricao} onChange={e => setDescricao(e.target.value)} className="mt-1 bg-secondary border-border" /></div>
          </div>
          <DialogFooter><Button onClick={save}>Salvar</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ─── Responsáveis Tab ────────────────────────────────────────
function ResponsaveisTab() {
  const { users, addUser, updateUser, deleteUser, clients, types, statuses, getUserClientIds, assignClientToUser, removeClientFromUser, getUserTypeIds, assignTypeToUser, removeTypeFromUser, getUserStatusIds, assignStatusToUser, removeStatusFromUser, getUserRole, setUserRole: setUserRoleFunc, userRoles } = useApp();
  const { user: currentUser } = useAuth();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<User | null>(null);
  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [clientsOpen, setClientsOpen] = useState(false);
  const [typesOpen, setTypesOpen] = useState(false);
  const [statusesOpen, setStatusesOpen] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);

  const openNew = () => { setEditing(null); setNome(''); setEmail(''); setOpen(true); };
  const openEdit = (u: User) => { setEditing(u); setNome(u.nome); setEmail(u.email); setOpen(true); };

  const save = () => {
    if (!nome.trim() || !email.trim()) return;
    if (editing) {
      updateUser(editing.id, { nome: nome.trim(), email: email.trim() });
      toast.success('Responsável atualizado');
    } else {
      addUser({ nome: nome.trim(), email: email.trim(), avatar: '' });
      toast.success('Responsável adicionado');
    }
    setOpen(false);
  };

  const handleDelete = async (id: string) => {
    const ok = await deleteUser(id);
    if (!ok) toast.error('Não é possível excluir: responsável possui posts vinculados');
    else toast.success('Responsável excluído');
  };

  const handleRoleChange = async (userId: string, role: string) => {
    await setUserRoleFunc(userId, role as 'admin' | 'user');
    toast.success('Nível atualizado');
  };

  const openClientAssignment = (userId: string) => {
    setSelectedUserId(userId);
    setClientsOpen(true);
  };

  const toggleClient = async (clientId: string) => {
    if (!selectedUserId) return;
    const assigned = getUserClientIds(selectedUserId);
    if (assigned.includes(clientId)) {
      await removeClientFromUser(selectedUserId, clientId);
    } else {
      await assignClientToUser(selectedUserId, clientId);
    }
  };

  const openTypeAssignment = (userId: string) => {
    setSelectedUserId(userId);
    setTypesOpen(true);
  };

  const toggleType = async (typeId: string) => {
    if (!selectedUserId) return;
    const assigned = getUserTypeIds(selectedUserId);
    if (assigned.includes(typeId)) {
      await removeTypeFromUser(selectedUserId, typeId);
    } else {
      await assignTypeToUser(selectedUserId, typeId);
    }
  };

  const openStatusAssignment = (userId: string) => {
    setSelectedUserId(userId);
    setStatusesOpen(true);
  };

  const toggleStatus = async (statusId: string) => {
    if (!selectedUserId) return;
    const assigned = getUserStatusIds(selectedUserId);
    if (assigned.includes(statusId)) {
      await removeStatusFromUser(selectedUserId, statusId);
    } else {
      await assignStatusToUser(selectedUserId, statusId);
    }
  };

  const selectedUserClientIds = selectedUserId ? getUserClientIds(selectedUserId) : [];
  const selectedUserTypeIds = selectedUserId ? getUserTypeIds(selectedUserId) : [];
  const selectedUserStatusIds = selectedUserId ? getUserStatusIds(selectedUserId) : [];
  const selectedUser = selectedUserId ? users.find(u => u.id === selectedUserId) : null;

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-display font-semibold text-foreground">Responsáveis</h3>
        <Button size="sm" onClick={openNew}><Plus className="w-4 h-4 mr-1" />Adicionar</Button>
      </div>
      <div className="rounded-lg border border-border overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-secondary/50">
              <TableHead>Nome</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Nível</TableHead>
              <TableHead>Clientes</TableHead>
              <TableHead>Tipos</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="w-[100px]">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
          {users.map(u => {
              const role = getUserRole(u.id);
              const assignedClients = getUserClientIds(u.id);
              const assignedTypes = getUserTypeIds(u.id);
              const assignedStatuses = getUserStatusIds(u.id);
              return (
                <TableRow key={u.id}>
                  <TableCell className="font-medium">{u.nome}</TableCell>
                  <TableCell className="text-muted-foreground">{u.email}</TableCell>
                  <TableCell>
                    <Select value={role} onValueChange={v => handleRoleChange(u.id, v)} disabled={u.id === currentUser?.id}>
                      <SelectTrigger className="w-[140px] h-8 bg-secondary border-border text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="admin">
                          <span className="flex items-center gap-1.5"><ShieldCheck className="w-3.5 h-3.5" />Administrador</span>
                        </SelectItem>
                        <SelectItem value="user">
                          <span className="flex items-center gap-1.5"><Shield className="w-3.5 h-3.5" />Usuário</span>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1 flex-wrap">
                      {role === 'admin' ? (
                        <Badge variant="outline" className="text-xs">Todos</Badge>
                      ) : assignedClients.length > 0 ? (
                        <Badge variant="secondary" className="text-xs">{assignedClients.length} {assignedClients.length === 1 ? 'cliente' : 'clientes'}</Badge>
                      ) : (
                        <span className="text-xs text-muted-foreground">Nenhum</span>
                      )}
                      {role !== 'admin' && (
                        <Button variant="ghost" size="icon" className="h-6 w-6 ml-1" onClick={() => openClientAssignment(u.id)}>
                          <Users className="w-3 h-3" />
                        </Button>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1 flex-wrap">
                      {role === 'admin' ? (
                        <Badge variant="outline" className="text-xs">Todos</Badge>
                      ) : assignedTypes.length > 0 ? (
                        <Badge variant="secondary" className="text-xs">{assignedTypes.length} {assignedTypes.length === 1 ? 'tipo' : 'tipos'}</Badge>
                      ) : (
                        <span className="text-xs text-muted-foreground">Nenhum</span>
                      )}
                      {role !== 'admin' && (
                        <Button variant="ghost" size="icon" className="h-6 w-6 ml-1" onClick={() => openTypeAssignment(u.id)}>
                          <Users className="w-3 h-3" />
                        </Button>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1 flex-wrap">
                      {role === 'admin' ? (
                        <Badge variant="outline" className="text-xs">Todos</Badge>
                      ) : assignedStatuses.length > 0 ? (
                        <Badge variant="secondary" className="text-xs">{assignedStatuses.length} {assignedStatuses.length === 1 ? 'status' : 'status'}</Badge>
                      ) : (
                        <span className="text-xs text-muted-foreground">Nenhum</span>
                      )}
                      {role !== 'admin' && (
                        <Button variant="ghost" size="icon" className="h-6 w-6 ml-1" onClick={() => openStatusAssignment(u.id)}>
                          <Users className="w-3 h-3" />
                        </Button>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(u)}><Pencil className="w-3.5 h-3.5" /></Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive" onClick={() => handleDelete(u.id)} disabled={u.id === currentUser?.id}><Trash2 className="w-3.5 h-3.5" /></Button>
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
            {users.length === 0 && (
              <TableRow><TableCell colSpan={7} className="text-center text-muted-foreground py-8">Nenhum responsável cadastrado</TableCell></TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Edit/Add user dialog */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="bg-card border-border">
          <DialogHeader><DialogTitle className="font-display">{editing ? 'Editar Responsável' : 'Novo Responsável'}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div><Label>Nome</Label><Input value={nome} onChange={e => setNome(e.target.value)} className="mt-1 bg-secondary border-border" /></div>
            <div><Label>Email</Label><Input value={email} onChange={e => setEmail(e.target.value)} type="email" className="mt-1 bg-secondary border-border" /></div>
          </div>
          <DialogFooter><Button onClick={save}>Salvar</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Client assignment dialog */}
      <Dialog open={clientsOpen} onOpenChange={setClientsOpen}>
        <DialogContent className="bg-card border-border">
          <DialogHeader>
            <DialogTitle className="font-display">Clientes de {selectedUser?.nome}</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">Selecione os clientes que este responsável pode visualizar:</p>
          <div className="space-y-2 max-h-[300px] overflow-y-auto">
            {clients.map(c => (
              <label key={c.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-secondary cursor-pointer">
                <Checkbox
                  checked={selectedUserClientIds.includes(c.id)}
                  onCheckedChange={() => toggleClient(c.id)}
                />
                <span className="text-sm font-medium">{c.nome}</span>
              </label>
            ))}
            {clients.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-4">Nenhum cliente cadastrado</p>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Type assignment dialog */}
      <Dialog open={typesOpen} onOpenChange={setTypesOpen}>
        <DialogContent className="bg-card border-border">
          <DialogHeader>
            <DialogTitle className="font-display">Tipos de {selectedUser?.nome}</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">Selecione os tipos de post que este responsável pode visualizar:</p>
          <div className="space-y-2 max-h-[300px] overflow-y-auto">
            {types.map(t => (
              <label key={t.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-secondary cursor-pointer">
                <Checkbox
                  checked={selectedUserTypeIds.includes(t.id)}
                  onCheckedChange={() => toggleType(t.id)}
                />
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: `hsl(${t.color})` }} />
                  <span className="text-sm font-medium">{t.label}</span>
                </div>
              </label>
            ))}
            {types.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-4">Nenhum tipo cadastrado</p>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Status assignment dialog */}
      <Dialog open={statusesOpen} onOpenChange={setStatusesOpen}>
        <DialogContent className="bg-card border-border">
          <DialogHeader>
            <DialogTitle className="font-display">Status de {selectedUser?.nome}</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">Selecione os status que este responsável pode visualizar:</p>
          <div className="space-y-2 max-h-[300px] overflow-y-auto">
            {statuses.map(s => (
              <label key={s.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-secondary cursor-pointer">
                <Checkbox
                  checked={selectedUserStatusIds.includes(s.id)}
                  onCheckedChange={() => toggleStatus(s.id)}
                />
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: `hsl(${s.color})` }} />
                  <span className="text-sm font-medium">{s.label}</span>
                </div>
              </label>
            ))}
            {statuses.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-4">Nenhum status cadastrado</p>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ─── Status Tab ──────────────────────────────────────────────
function StatusTab() {
  const { statuses, addStatus, updateStatus, deleteStatus, reorderStatuses } = useApp();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<StatusConfig | null>(null);
  const [id, setId] = useState('');
  const [label, setLabel] = useState('');
  const [color, setColor] = useState('220 85% 60%');

  const openNew = () => { setEditing(null); setId(''); setLabel(''); setColor('220 85% 60%'); setOpen(true); };
  const openEdit = (s: StatusConfig) => { setEditing(s); setId(s.id); setLabel(s.label); setColor(s.color); setOpen(true); };

  const save = () => {
    if (!label.trim()) return;
    if (editing) {
      updateStatus(editing.id, { label: label.trim(), color: color.trim() });
      toast.success('Status atualizado');
    } else {
      if (!id.trim()) return;
      addStatus({ id: id.trim().toLowerCase().replace(/\s+/g, '_'), label: label.trim(), color: color.trim() });
      toast.success('Status adicionado');
    }
    setOpen(false);
  };

  const handleDelete = async (sid: string) => {
    const ok = await deleteStatus(sid);
    if (!ok) toast.error('Não é possível excluir: status possui posts vinculados');
    else toast.success('Status excluído');
  };

  const moveUp = (index: number) => {
    if (index === 0) return;
    const arr = [...statuses];
    [arr[index - 1], arr[index]] = [arr[index], arr[index - 1]];
    reorderStatuses(arr);
  };

  const moveDown = (index: number) => {
    if (index === statuses.length - 1) return;
    const arr = [...statuses];
    [arr[index], arr[index + 1]] = [arr[index + 1], arr[index]];
    reorderStatuses(arr);
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-display font-semibold text-foreground">Status do Fluxo</h3>
        <Button size="sm" onClick={openNew}><Plus className="w-4 h-4 mr-1" />Adicionar</Button>
      </div>
      <p className="text-xs text-muted-foreground">A ordem dos status define o fluxo do Kanban. Use as setas para reordenar.</p>
      <div className="rounded-lg border border-border overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-secondary/50">
              <TableHead className="w-[60px]">Ordem</TableHead>
              <TableHead>Label</TableHead>
              <TableHead>Cor</TableHead>
              <TableHead className="w-[120px]">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {statuses.map((s, i) => (
              <TableRow key={s.id}>
                <TableCell>
                  <div className="flex flex-col gap-0.5">
                    <button onClick={() => moveUp(i)} className="text-muted-foreground hover:text-foreground text-xs disabled:opacity-30" disabled={i === 0}>▲</button>
                    <button onClick={() => moveDown(i)} className="text-muted-foreground hover:text-foreground text-xs disabled:opacity-30" disabled={i === statuses.length - 1}>▼</button>
                  </div>
                </TableCell>
                <TableCell className="font-medium">{s.label}</TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full shrink-0" style={{ backgroundColor: `hsl(${s.color})` }} />
                    <span className="text-xs text-muted-foreground font-mono">{s.color}</span>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(s)}><Pencil className="w-3.5 h-3.5" /></Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive" onClick={() => handleDelete(s.id)}><Trash2 className="w-3.5 h-3.5" /></Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="bg-card border-border">
          <DialogHeader><DialogTitle className="font-display">{editing ? 'Editar Status' : 'Novo Status'}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            {!editing && (
              <div><Label>ID (identificador único)</Label><Input value={id} onChange={e => setId(e.target.value)} placeholder="ex: em_producao" className="mt-1 bg-secondary border-border" /></div>
            )}
            <div><Label>Label</Label><Input value={label} onChange={e => setLabel(e.target.value)} placeholder="ex: Em Produção" className="mt-1 bg-secondary border-border" /></div>
            <div>
              <Label>Cor (HSL)</Label>
              <div className="flex items-center gap-3 mt-1">
                <Input value={color} onChange={e => setColor(e.target.value)} placeholder="220 85% 60%" className="bg-secondary border-border flex-1" />
                <span className="w-8 h-8 rounded-full shrink-0 border border-border" style={{ backgroundColor: `hsl(${color})` }} />
              </div>
            </div>
          </div>
          <DialogFooter><Button onClick={save}>Salvar</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ─── Tipos Tab ───────────────────────────────────────────────
function TiposTab() {
  const { types, addType, updateType, deleteType } = useApp();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<TypeConfig | null>(null);
  const [id, setId] = useState('');
  const [label, setLabel] = useState('');
  const [color, setColor] = useState('220 85% 60%');

  const openNew = () => { setEditing(null); setId(''); setLabel(''); setColor('220 85% 60%'); setOpen(true); };
  const openEdit = (t: TypeConfig) => { setEditing(t); setId(t.id); setLabel(t.label); setColor(t.color); setOpen(true); };

  const save = () => {
    if (!label.trim()) return;
    if (editing) {
      updateType(editing.id, { label: label.trim(), color: color.trim() });
      toast.success('Tipo atualizado');
    } else {
      if (!id.trim()) return;
      addType({ id: id.trim().toLowerCase().replace(/\s+/g, '_'), label: label.trim(), color: color.trim() });
      toast.success('Tipo adicionado');
    }
    setOpen(false);
  };

  const handleDelete = async (tid: string) => {
    const ok = await deleteType(tid);
    if (!ok) toast.error('Não é possível excluir: tipo possui posts vinculados');
    else toast.success('Tipo excluído');
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-display font-semibold text-foreground">Tipos de Post</h3>
        <Button size="sm" onClick={openNew}><Plus className="w-4 h-4 mr-1" />Adicionar</Button>
      </div>
      <div className="rounded-lg border border-border overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-secondary/50">
              <TableHead>Label</TableHead>
              <TableHead>Cor</TableHead>
              <TableHead className="w-[100px]">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {types.map(t => (
              <TableRow key={t.id}>
                <TableCell className="font-medium">{t.label}</TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full shrink-0" style={{ backgroundColor: `hsl(${t.color})` }} />
                    <span className="text-xs text-muted-foreground font-mono">{t.color}</span>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(t)}><Pencil className="w-3.5 h-3.5" /></Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive" onClick={() => handleDelete(t.id)}><Trash2 className="w-3.5 h-3.5" /></Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
            {types.length === 0 && (
              <TableRow><TableCell colSpan={3} className="text-center text-muted-foreground py-8">Nenhum tipo cadastrado</TableCell></TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="bg-card border-border">
          <DialogHeader><DialogTitle className="font-display">{editing ? 'Editar Tipo' : 'Novo Tipo'}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            {!editing && (
              <div><Label>ID (identificador único)</Label><Input value={id} onChange={e => setId(e.target.value)} placeholder="ex: video_curto" className="mt-1 bg-secondary border-border" /></div>
            )}
            <div><Label>Label</Label><Input value={label} onChange={e => setLabel(e.target.value)} placeholder="ex: Vídeo Curto" className="mt-1 bg-secondary border-border" /></div>
            <div>
              <Label>Cor (HSL)</Label>
              <div className="flex items-center gap-3 mt-1">
                <Input value={color} onChange={e => setColor(e.target.value)} placeholder="220 85% 60%" className="bg-secondary border-border flex-1" />
                <span className="w-8 h-8 rounded-full shrink-0 border border-border" style={{ backgroundColor: `hsl(${color})` }} />
              </div>
            </div>
          </div>
          <DialogFooter><Button onClick={save}>Salvar</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ─── Conexão Tab ─────────────────────────────────────────────
function ConexaoTab() {
  const [googleDriveKey, setGoogleDriveKey] = useState('');
  const [saving, setSaving] = useState(false);
  const [masked, setMasked] = useState(true);

  const handleSave = async () => {
    if (!googleDriveKey.trim()) {
      toast.error('Informe a chave da API');
      return;
    }
    setSaving(true);
    try {
      const { error } = await supabase
        .from('app_settings')
        .upsert({ key: 'GOOGLE_DRIVE_API_KEY', value: googleDriveKey.trim(), updated_at: new Date().toISOString() }, { onConflict: 'key' });
      if (error) throw error;
      toast.success('Chave do Google Drive atualizada com sucesso');
      setGoogleDriveKey('');
    } catch {
      toast.error('Erro ao salvar a chave. Verifique suas permissões.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-display font-semibold text-foreground">Conexões</h3>
        <p className="text-sm text-muted-foreground mt-1">Gerencie as chaves de API e integrações externas.</p>
      </div>

      <div className="rounded-lg border border-border p-6 space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-secondary flex items-center justify-center">
            <Link2 className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h4 className="font-medium text-foreground">Google Drive API</h4>
            <p className="text-xs text-muted-foreground">Chave de API usada para listar imagens de pastas do Google Drive.</p>
          </div>
        </div>

        <div className="space-y-2">
          <Label>API Key</Label>
          <div className="flex gap-2">
            <Input
              type={masked ? 'password' : 'text'}
              value={googleDriveKey}
              onChange={e => setGoogleDriveKey(e.target.value)}
              placeholder="Cole a nova chave aqui..."
              className="bg-secondary border-border flex-1"
            />
            <Button variant="outline" size="sm" onClick={() => setMasked(!masked)} className="shrink-0">
              {masked ? 'Mostrar' : 'Ocultar'}
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">
            A chave atual está configurada no servidor. Para alterá-la, insira uma nova chave acima.
          </p>
        </div>

        <Button onClick={handleSave} disabled={saving || !googleDriveKey.trim()}>
          {saving ? 'Salvando...' : 'Salvar Chave'}
        </Button>
      </div>
    </div>
  );
}

// ─── Botões da Apresentação Tab ──────────────────────────────
function BotoesApresentacaoTab() {
  const { statuses } = useApp();
  const [buttons, setButtons] = useState<{ id: string; label: string; target_status: string | null; is_alteracao: boolean; color: string; position: number }[]>([]);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<typeof buttons[0] | null>(null);
  const [label, setLabel] = useState('');
  const [targetStatus, setTargetStatus] = useState<string>('');
  const [isAlteracao, setIsAlteracao] = useState(false);
  const [color, setColor] = useState('220 85% 60%');

  useEffect(() => {
    fetchButtons();
  }, []);

  const fetchButtons = async () => {
    const { data } = await supabase.from('presentation_buttons').select('*').order('position');
    if (data) setButtons(data as any);
  };

  const openNew = () => { setEditing(null); setLabel(''); setTargetStatus(''); setIsAlteracao(false); setColor('220 85% 60%'); setOpen(true); };
  const openEdit = (b: typeof buttons[0]) => { setEditing(b); setLabel(b.label); setTargetStatus(b.target_status || ''); setIsAlteracao(b.is_alteracao); setColor(b.color); setOpen(true); };

  const save = async () => {
    if (!label.trim()) return;
    const payload = {
      label: label.trim(),
      target_status: targetStatus && targetStatus !== 'none' ? targetStatus : null,
      is_alteracao: isAlteracao,
      color: color.trim(),
      position: editing ? editing.position : buttons.length,
    };
    if (editing) {
      await supabase.from('presentation_buttons').update(payload as any).eq('id', editing.id);
      toast.success('Botão atualizado');
    } else {
      await supabase.from('presentation_buttons').insert(payload as any);
      toast.success('Botão adicionado');
    }
    setOpen(false);
    fetchButtons();
  };

  const handleDelete = async (id: string) => {
    await supabase.from('presentation_buttons').delete().eq('id', id);
    toast.success('Botão removido');
    fetchButtons();
  };

  const moveUp = async (index: number) => {
    if (index === 0) return;
    const arr = [...buttons];
    [arr[index - 1], arr[index]] = [arr[index], arr[index - 1]];
    setButtons(arr);
    for (let i = 0; i < arr.length; i++) {
      await supabase.from('presentation_buttons').update({ position: i } as any).eq('id', arr[i].id);
    }
  };

  const moveDown = async (index: number) => {
    if (index === buttons.length - 1) return;
    const arr = [...buttons];
    [arr[index], arr[index + 1]] = [arr[index + 1], arr[index]];
    setButtons(arr);
    for (let i = 0; i < arr.length; i++) {
      await supabase.from('presentation_buttons').update({ position: i } as any).eq('id', arr[i].id);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-display font-semibold text-foreground">Botões da Apresentação</h3>
          <p className="text-xs text-muted-foreground mt-1">Configure os botões que o cliente verá na página de apresentação.</p>
        </div>
        <Button size="sm" onClick={openNew}><Plus className="w-4 h-4 mr-1" />Adicionar</Button>
      </div>
      <div className="rounded-lg border border-border overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-secondary/50">
              <TableHead className="w-[60px]">Ordem</TableHead>
              <TableHead>Label</TableHead>
              <TableHead>Status destino</TableHead>
              <TableHead>Alteração?</TableHead>
              <TableHead>Cor</TableHead>
              <TableHead className="w-[100px]">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {buttons.map((b, i) => (
              <TableRow key={b.id}>
                <TableCell>
                  <div className="flex flex-col gap-0.5">
                    <button onClick={() => moveUp(i)} className="text-muted-foreground hover:text-foreground text-xs disabled:opacity-30" disabled={i === 0}>▲</button>
                    <button onClick={() => moveDown(i)} className="text-muted-foreground hover:text-foreground text-xs disabled:opacity-30" disabled={i === buttons.length - 1}>▼</button>
                  </div>
                </TableCell>
                <TableCell className="font-medium">{b.label}</TableCell>
                <TableCell className="text-muted-foreground text-sm">
                  {b.target_status ? statuses.find(s => s.id === b.target_status)?.label || b.target_status : '—'}
                </TableCell>
                <TableCell>
                  {b.is_alteracao ? (
                    <Badge variant="outline" className="text-xs border-amber-500/50 text-amber-500">Sim</Badge>
                  ) : (
                    <span className="text-xs text-muted-foreground">Não</span>
                  )}
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full shrink-0" style={{ backgroundColor: `hsl(${b.color})` }} />
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(b)}><Pencil className="w-3.5 h-3.5" /></Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive" onClick={() => handleDelete(b.id)}><Trash2 className="w-3.5 h-3.5" /></Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
            {buttons.length === 0 && (
              <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground py-8">Nenhum botão cadastrado</TableCell></TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="bg-card border-border">
          <DialogHeader><DialogTitle className="font-display">{editing ? 'Editar Botão' : 'Novo Botão'}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div><Label>Texto do botão</Label><Input value={label} onChange={e => setLabel(e.target.value)} placeholder="ex: Solicitar Alteração" className="mt-1 bg-secondary border-border" /></div>
            <div>
              <Label>Status destino (para onde mover o post)</Label>
              <Select value={targetStatus} onValueChange={setTargetStatus}>
                <SelectTrigger className="mt-1 bg-secondary border-border">
                  <SelectValue placeholder="Nenhum (não mover)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Nenhum (não mover)</SelectItem>
                  {statuses.map(s => (
                    <SelectItem key={s.id} value={s.id}>
                      <span className="flex items-center gap-2">
                        <span className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: `hsl(${s.color})` }} />
                        {s.label}
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <Label>Botão de alteração?</Label>
                <p className="text-xs text-muted-foreground mt-0.5">Se sim, abrirá uma caixa de texto e o comentário será salvo com prefixo "Alteração:"</p>
              </div>
              <Switch checked={isAlteracao} onCheckedChange={setIsAlteracao} />
            </div>
            <div>
              <Label>Cor (HSL)</Label>
              <div className="flex items-center gap-3 mt-1">
                <Input value={color} onChange={e => setColor(e.target.value)} placeholder="220 85% 60%" className="bg-secondary border-border flex-1" />
                <span className="w-8 h-8 rounded-full shrink-0 border border-border" style={{ backgroundColor: `hsl(${color})` }} />
              </div>
            </div>
          </div>
          <DialogFooter><Button onClick={save}>Salvar</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ─── Settings Sidebar Nav Items ──────────────────────────────
type SettingsSection = 'clientes' | 'responsaveis' | 'status' | 'tipos' | 'botoes' | 'conexao';

const settingsNavItems: { id: SettingsSection; label: string; icon: React.ElementType }[] = [
  { id: 'clientes', label: 'Clientes', icon: Building2 },
  { id: 'responsaveis', label: 'Responsáveis', icon: UserCheck },
  { id: 'status', label: 'Status', icon: ListChecks },
  { id: 'tipos', label: 'Tipos', icon: Tag },
  { id: 'botoes', label: 'Botões Apresentação', icon: MousePointerClick },
  { id: 'conexao', label: 'Conexão', icon: Link2 },
];

// ─── Settings Page ───────────────────────────────────────────
const SettingsPage = () => {
  const { signOut } = useAuth();
  const navigate = useNavigate();
  const [activeSection, setActiveSection] = useState<SettingsSection>('clientes');

  const handleLogout = async () => {
    await signOut();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-background flex">
      {/* Settings Sidebar */}
      <aside className="w-56 shrink-0 border-r border-border bg-card flex flex-col">
        <div className="p-4 border-b border-border">
          <Link to="/" className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="w-4 h-4" />
            <span className="text-sm">Voltar</span>
          </Link>
        </div>
        <div className="px-4 pt-4 pb-2">
          <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Configurações</h2>
        </div>
        <nav className="flex-1 px-2 space-y-0.5">
          {settingsNavItems.map(item => (
            <button
              key={item.id}
              onClick={() => setActiveSection(item.id)}
              className={cn(
                'w-full flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors',
                activeSection === item.id
                  ? 'bg-primary text-primary-foreground font-medium'
                  : 'text-muted-foreground hover:bg-secondary hover:text-foreground'
              )}
            >
              <item.icon className="w-4 h-4" />
              {item.label}
            </button>
          ))}
        </nav>
        <div className="p-2 border-t border-border">
          <Button variant="ghost" size="sm" onClick={handleLogout} className="w-full justify-start text-muted-foreground hover:text-destructive">
            <LogOut className="w-4 h-4 mr-2" /> Sair
          </Button>
        </div>
      </aside>

      {/* Content */}
      <main className="flex-1 overflow-auto">
        <div className="max-w-[1000px] mx-auto px-6 py-6">
          {activeSection === 'clientes' && <ClientesTab />}
          {activeSection === 'responsaveis' && <ResponsaveisTab />}
          {activeSection === 'status' && <StatusTab />}
          {activeSection === 'tipos' && <TiposTab />}
          {activeSection === 'botoes' && <BotoesApresentacaoTab />}
          {activeSection === 'conexao' && <ConexaoTab />}
        </div>
      </main>
    </div>
  );
};

export default SettingsPage;
