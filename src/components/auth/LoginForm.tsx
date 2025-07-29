import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Eye, EyeOff, Lock, Mail, User } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import itapecericaLogo from "@/assets/itapecerica-logo.png";

interface LoginFormProps {
  onLogin: (credentials: { email: string; password: string; role: string }) => void;
}

export const LoginForm = ({ onLogin }: LoginFormProps) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !password || !role) {
      toast({
        title: "Erro",
        description: "Por favor, preencha todos os campos.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    
    try {
      // Simular verificação de login
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      onLogin({ email, password, role });
      
      toast({
        title: "Login realizado com sucesso",
        description: `Bem-vindo(a) ao sistema HabitaFácil!`,
      });
    } catch (error) {
      toast({
        title: "Erro no login",
        description: "Credenciais inválidas. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-accent p-4">
      <Card className="w-full max-w-md shadow-government">
        <CardHeader className="text-center space-y-4">
          <div className="flex justify-center">
            <img 
              src={itapecericaLogo} 
              alt="Prefeitura de Itapecerica da Serra" 
              className="h-16 w-16"
            />
          </div>
          <div>
            <CardTitle className="text-2xl font-bold text-primary">HabitaFácil</CardTitle>
            <CardDescription className="text-muted-foreground">
              Sistema de Cadastro Social e Habitacional<br />
              Prefeitura Municipal de Itapecerica da Serra
            </CardDescription>
          </div>
        </CardHeader>
        
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="role">Tipo de Usuário</Label>
              <Select value={role} onValueChange={setRole} required>
                <SelectTrigger>
                  <User className="h-4 w-4" />
                  <SelectValue placeholder="Selecione seu perfil" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="admin">Administração</SelectItem>
                  <SelectItem value="social_worker">Assistente Social</SelectItem>
                  <SelectItem value="citizen">Cidadão</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email ou CPF</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  id="email"
                  type="text"
                  placeholder="Digite seu email ou CPF"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-10"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Senha</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Digite sua senha"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-10 pr-10"
                  required
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-2 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>
            </div>
          </CardContent>

          <CardFooter className="flex flex-col space-y-4">
            <Button
              type="submit"
              variant="government"
              className="w-full"
              disabled={isLoading}
            >
              {isLoading ? "Entrando..." : "Entrar no Sistema"}
            </Button>
            
            <div className="text-center text-sm text-muted-foreground">
              <p>Esqueceu sua senha? Entre em contato com a administração.</p>
            </div>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
};