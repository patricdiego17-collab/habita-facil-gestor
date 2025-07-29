import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  FileText, 
  Users, 
  Home, 
  CheckSquare, 
  Upload,
  BarChart3,
  UserCheck,
  Calendar,
  AlertCircle,
  Plus
} from "lucide-react";

interface DashboardProps {
  userRole: 'admin' | 'social_worker' | 'citizen';
  userName: string;
  onNavigate: (page: string) => void;
}

export const Dashboard = ({ userRole, userName, onNavigate }: DashboardProps) => {
  const adminCards = [
    {
      title: "Formulário 1 – Cadastro Social",
      description: "Acessar formulário de cadastro social",
      icon: FileText,
      action: () => onNavigate('social-registration'),
      variant: "government" as const
    },
    {
      title: "Formulário 2 – Composição Familiar", 
      description: "Acessar formulário de composição familiar",
      icon: Users,
      action: () => onNavigate('family-composition'),
      variant: "government" as const
    },
    {
      title: "Upload de Documentos",
      description: "Enviar documentos necessários",
      icon: Upload,
      action: () => onNavigate('documents'),
      variant: "secondary" as const
    },
    {
      title: "Termo de Concordância",
      description: "Assinar termo de responsabilidade",
      icon: CheckSquare,
      action: () => onNavigate('terms'),
      variant: "secondary" as const
    },
    {
      title: "Cadastros Pendentes",
      description: "Cadastros aguardando aprovação",
      value: "23",
      icon: AlertCircle,
      action: () => onNavigate('pending-registrations'),
      variant: "warning" as const
    },
    {
      title: "Total de Cadastros",
      description: "Cadastros realizados este mês",
      value: "156",
      icon: FileText,
      action: () => onNavigate('all-registrations'),
      variant: "default" as const
    },
    {
      title: "Relatórios",
      description: "Visualizar relatórios e estatísticas",
      value: "",
      icon: BarChart3,
      action: () => onNavigate('reports'),
      variant: "default" as const
    }
  ];

  const socialWorkerCards = [
    {
      title: "Formulário 1 – Cadastro Social",
      description: "Acessar formulário de cadastro social",
      icon: FileText,
      action: () => onNavigate('social-registration'),
      variant: "government" as const
    },
    {
      title: "Formulário 2 – Composição Familiar",
      description: "Acessar formulário de composição familiar", 
      icon: Users,
      action: () => onNavigate('family-composition'),
      variant: "government" as const
    },
    {
      title: "Upload de Documentos",
      description: "Enviar documentos necessários",
      icon: Upload,
      action: () => onNavigate('documents'),
      variant: "secondary" as const
    },
    {
      title: "Termo de Concordância",
      description: "Assinar termo de responsabilidade",
      icon: CheckSquare,
      action: () => onNavigate('terms'),
      variant: "secondary" as const
    },
    {
      title: "Novo Cadastro Completo",
      description: "Iniciar cadastro completo (todos os formulários)",
      icon: Plus,
      action: () => onNavigate('new-registration'),
      variant: "secondary" as const
    },
    {
      title: "Meus Cadastros",
      description: "Visualizar cadastros realizados",
      value: "8",
      icon: FileText,
      action: () => onNavigate('my-registrations'),
      variant: "default" as const
    },
    {
      title: "Agendamentos",
      description: "Próximas visitas agendadas",
      value: "3",
      icon: Calendar,
      action: () => onNavigate('appointments'),
      variant: "default" as const
    }
  ];

  const citizenCards = [
    {
      title: "Meu Cadastro",
      description: "Visualizar status do meu cadastro",
      icon: FileText,
      action: () => onNavigate('my-registration'),
      variant: "default" as const
    },
    {
      title: "Documentos",
      description: "Enviar documentos adicionais",
      icon: Upload,
      action: () => onNavigate('documents'),
      variant: "secondary" as const
    },
    {
      title: "Acompanhamento",
      description: "Acompanhar andamento do processo",
      icon: CheckSquare,
      action: () => onNavigate('tracking'),
      variant: "default" as const
    }
  ];

  const getCards = () => {
    switch (userRole) {
      case 'admin': return adminCards;
      case 'social_worker': return socialWorkerCards;
      case 'citizen': return citizenCards;
      default: return [];
    }
  };

  const getDashboardTitle = () => {
    switch (userRole) {
      case 'admin': return 'Painel Administrativo';
      case 'social_worker': return 'Painel do Assistente Social';
      case 'citizen': return 'Minha Área';
      default: return 'Dashboard';
    }
  };

  const getWelcomeMessage = () => {
    const greeting = new Date().getHours() < 12 ? 'Bom dia' : new Date().getHours() < 18 ? 'Boa tarde' : 'Boa noite';
    return `${greeting}, ${userName}!`;
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground mb-2">{getDashboardTitle()}</h1>
        <p className="text-lg text-muted-foreground">{getWelcomeMessage()}</p>
      </div>

      {/* Status Banner for Citizens */}
      {userRole === 'citizen' && (
        <Card className="mb-6 bg-primary-light border-primary">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <CheckSquare className="h-6 w-6 text-primary" />
                <div>
                  <h3 className="font-semibold text-primary">Status do Cadastro</h3>
                  <p className="text-sm text-muted-foreground">Seu cadastro está em análise</p>
                </div>
              </div>
              <Badge variant="default">Em Análise</Badge>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Quick Actions Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {getCards().map((card, index) => (
          <Card key={index} className="hover:shadow-lg transition-all duration-300 cursor-pointer group" onClick={card.action}>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <card.icon className="h-8 w-8 text-primary group-hover:scale-110 transition-transform duration-300" />
                {card.value && (
                  <span className="text-2xl font-bold text-foreground">{card.value}</span>
                )}
              </div>
            </CardHeader>
            <CardContent>
              <CardTitle className="text-lg mb-2">{card.title}</CardTitle>
              <CardDescription>{card.description}</CardDescription>
              <Button 
                variant={card.variant} 
                size="sm" 
                className="mt-4 w-full"
              >
                Acessar
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Recent Activity Section */}
      {userRole !== 'citizen' && (
        <div className="mt-8">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Calendar className="h-5 w-5" />
                <span>Atividades Recentes</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {[1, 2, 3].map((item) => (
                  <div key={item} className="flex items-center justify-between p-3 bg-accent rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div className="w-2 h-2 bg-primary rounded-full"></div>
                      <div>
                        <p className="font-medium">Cadastro #{String(item).padStart(3, '0')} atualizado</p>
                        <p className="text-sm text-muted-foreground">Há {item} hora{item !== 1 ? 's' : ''}</p>
                      </div>
                    </div>
                    <Badge variant="outline">Concluído</Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};