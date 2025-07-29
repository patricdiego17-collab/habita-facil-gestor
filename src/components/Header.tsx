import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { LogOut, User, Menu } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import itapecericaLogo from "@/assets/itapecerica-logo.png";

interface HeaderProps {
  userRole?: 'admin' | 'social_worker' | 'citizen';
  userName?: string;
  onLogout?: () => void;
}

export const Header = ({ userRole = 'citizen', userName = 'Usuário', onLogout }: HeaderProps) => {
  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'admin': return 'Administração';
      case 'social_worker': return 'Assistente Social';
      case 'citizen': return 'Cidadão';
      default: return 'Usuário';
    }
  };

  return (
    <header className="bg-card shadow-md border-b border-border sticky top-0 z-50">
      <div className="container mx-auto px-4 py-3">
        <div className="flex items-center justify-between">
          {/* Logo e Título */}
          <div className="flex items-center space-x-4">
            <img 
              src={itapecericaLogo} 
              alt="Prefeitura de Itapecerica da Serra" 
              className="h-12 w-12"
            />
            <div className="hidden md:block">
              <h1 className="text-xl font-bold text-foreground">HabitaFácil</h1>
              <p className="text-sm text-muted-foreground">
                Prefeitura Municipal de Itapecerica da Serra
              </p>
            </div>
            <Button variant="ghost" size="icon" className="md:hidden">
              <Menu className="h-5 w-5" />
            </Button>
          </div>

          {/* User Menu */}
          <div className="flex items-center space-x-4">
            <div className="hidden md:block text-right">
              <p className="text-sm font-medium text-foreground">{userName}</p>
              <p className="text-xs text-muted-foreground">{getRoleLabel(userRole)}</p>
            </div>
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-10 w-10 rounded-full">
                  <Avatar className="h-10 w-10">
                    <AvatarFallback className="bg-primary text-primary-foreground">
                      {userName.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56" align="end">
                <DropdownMenuItem>
                  <User className="mr-2 h-4 w-4" />
                  <span>Perfil</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={onLogout}>
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Sair</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>
    </header>
  );
};