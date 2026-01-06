import { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Lock, ArrowRight } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { authService } from '@/services/auth';

const ResetPasswordPage = () => {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [params] = useSearchParams();
  const token = params.get('token') || '';
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      toast({
        title: 'Erro',
        description: 'As senhas não coincidem.',
        variant: 'destructive',
      });
      return;
    }
    setIsLoading(true);
    try {
      await authService.resetPassword(token, password);
      toast({
        title: 'Senha redefinida',
        description: 'Agora você já pode fazer login.',
      });
    } catch (error) {
      toast({
        title: 'Falha ao redefinir',
        description: 'Verifique o link e tente novamente.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="h-screen bg-background grid place-items-center px-4">
      <div className="w-full max-w-md">
        <Card>
          <CardHeader className="text-center space-y-2">
            <Link to="/login" className="inline-flex flex-col items-center">
              <img src="/images/logos/logo-ergo.jpg" alt="Ergo" className="h-20 object-contain" />
            </Link>
            <CardTitle style={{ marginTop: '-1.5rem' }}>Redefinir senha</CardTitle>
            <CardDescription>Crie uma nova senha para sua conta</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="password">Nova senha</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                  <Input
                    id="password"
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-10 h-10 bg-secondary border-border"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirmar senha</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                  <Input
                    id="confirmPassword"
                    type="password"
                    placeholder="••••••••"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="pl-10 h-10 bg-secondary border-border"
                  />
                </div>
              </div>

              <Button type="submit" variant="default" className="w-full h-10" disabled={isLoading}>
                {isLoading ? 'Salvando...' : 'Redefinir senha'}
                <ArrowRight className="w-5 h-5" />
              </Button>
              <div className="text-center text-sm">
                <Link to="/login" className="text-primary hover:underline">Voltar ao login</Link>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ResetPasswordPage;
