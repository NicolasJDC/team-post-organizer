import { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';

export default function AuthPage() {
  const { signIn, signUp, devBypass } = useAuth();
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [nome, setNome] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    if (isLogin) {
      const { error } = await signIn(email, password);
      if (error) toast.error(error.message);
    } else {
      if (!nome.trim()) {
        toast.error('Informe seu nome');
        setLoading(false);
        return;
      }
      const { error } = await signUp(email, password, nome);
      if (error) toast.error(error.message);
      else toast.success('Conta criada! Verifique seu email para confirmar.');
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <div className="w-full max-w-sm space-y-8">
        <div className="text-center">
          <h1 className="text-3xl font-display font-bold text-foreground tracking-tight">
            VOID<span className="text-primary"> de Conteúdo</span>
          </h1>
          <p className="text-sm text-muted-foreground mt-2">
            Gestão visual de conteúdo para Instagram
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 bg-card p-6 rounded-lg border border-border">
          <h2 className="font-display font-semibold text-lg text-foreground text-center">
            {isLogin ? 'Entrar' : 'Criar conta'}
          </h2>

          {!isLogin && (
            <div>
              <label className="text-xs text-muted-foreground font-display uppercase tracking-wider mb-1.5 block">Nome</label>
              <Input value={nome} onChange={e => setNome(e.target.value)} placeholder="Seu nome" className="bg-secondary border-border" />
            </div>
          )}

          <div>
            <label className="text-xs text-muted-foreground font-display uppercase tracking-wider mb-1.5 block">Email</label>
            <Input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="seu@email.com" className="bg-secondary border-border" required />
          </div>

          <div>
            <label className="text-xs text-muted-foreground font-display uppercase tracking-wider mb-1.5 block">Senha</label>
            <Input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" className="bg-secondary border-border" required minLength={6} />
          </div>

          <Button type="submit" disabled={loading} className="w-full bg-primary text-primary-foreground hover:bg-primary/90 font-display">
            {loading ? 'Aguarde...' : isLogin ? 'Entrar' : 'Criar conta'}
          </Button>

          <p className="text-center text-sm text-muted-foreground">
            {isLogin ? 'Não tem conta?' : 'Já tem conta?'}{' '}
            <button type="button" onClick={() => setIsLogin(!isLogin)} className="text-primary hover:underline font-medium">
              {isLogin ? 'Criar conta' : 'Entrar'}
            </button>
          </p>

          <div className="border-t border-border pt-4">
            <Button type="button" variant="outline" onClick={devBypass} className="w-full text-muted-foreground">
              Acessar sem conta (dev)
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
