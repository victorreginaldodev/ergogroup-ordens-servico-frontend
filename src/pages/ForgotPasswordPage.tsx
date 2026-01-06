import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Mail, ArrowRight } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { authService } from '@/services/auth';

const ForgotPasswordPage = () => {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      await authService.requestPasswordReset(email);
      toast({
        title: 'Verifique seu email',
        description: 'Enviamos instruções para redefinir sua senha.',
      });
    } catch (error) {
      toast({
        title: 'Falha ao enviar',
        description: 'Não foi possível enviar o email de recuperação.',
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
            <CardTitle style={{ marginTop: '-1.5rem' }}>Recuperar senha</CardTitle>
            <CardDescription>Informe seu email para receber o link</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="seu@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-10 h-10 bg-secondary border-border"
                  />
                </div>
              </div>

              <Button type="submit" variant="default" className="w-full h-10" disabled={isLoading}>
                {isLoading ? 'Enviando...' : 'Enviar link'}
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

export default ForgotPasswordPage;
