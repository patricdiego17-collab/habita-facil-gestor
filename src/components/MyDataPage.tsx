import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  ArrowLeft, 
  FileText, 
  Users, 
  Upload, 
  Calendar,
  Edit,
  CheckCircle,
  Clock,
  AlertTriangle,
  Download
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface UserProfile {
  id: string;
  full_name: string | null;
  email: string | null;
  role: string | null;
}

interface MyDataPageProps {
  userProfile: UserProfile;
  onBack: () => void;
  onNavigate: (page: string) => void;
}

interface RegistrationTracking {
  id: string;
  status: string;
  message: string | null;
  created_at: string;
  updated_by: string;
  updated_by_name?: string;
}

interface SocialRegistration {
  id: string;
  name: string;
  cpf: string;
  phone?: string;
  status: string;
  created_at: string;
  updated_at: string;
}

interface FamilyMember {
  id: string;
  member_name: string;
  relationship: string;
  age?: number;
  profession?: string;
  income?: number;
}

interface Document {
  id: string;
  document_name: string;
  document_type: string;
  status: string;
  upload_date: string;
  file_path?: string;
}

export const MyDataPage = ({ userProfile, onBack, onNavigate }: MyDataPageProps) => {
  const [socialRegistration, setSocialRegistration] = useState<SocialRegistration | null>(null);
  const [familyMembers, setFamilyMembers] = useState<FamilyMember[]>([]);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [tracking, setTracking] = useState<RegistrationTracking[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadUserData();
  }, []);

  const loadUserData = async () => {
    setLoading(true);
    try {
      // Load social registration
      const { data: socialData, error: socialError } = await supabase
        .from('social_registrations')
        .select('*')
        .eq('user_id', userProfile.user_id)
        .maybeSingle();

      if (socialError) {
        console.error('Error loading social registration:', socialError);
      } else if (socialData) {
        setSocialRegistration(socialData);
      }

      // Load family members
      const { data: familyData, error: familyError } = await supabase
        .from('family_compositions')
        .select('*')
        .eq('user_id', userProfile.user_id);

      if (familyError) {
        console.error('Error loading family data:', familyError);
      } else {
        setFamilyMembers(familyData || []);
      }

      // Load documents
      const { data: documentsData, error: documentsError } = await supabase
        .from('documents')
        .select('*')
        .eq('user_id', userProfile.user_id);

      if (documentsError) {
        console.error('Error loading documents:', documentsError);
      } else {
        setDocuments(documentsData || []);
      }

      // Load tracking data if social registration exists
      if (socialData) {
        const { data: trackingData, error: trackingError } = await supabase
          .from('registration_tracking')
          .select(`
            *,
            updated_by_profile:profiles!registration_tracking_updated_by_fkey(full_name)
          `)
          .eq('social_registration_id', socialData.id)
          .order('created_at', { ascending: false });

        if (trackingError) {
          console.error('Error loading tracking data:', trackingError);
        } else {
          const trackingWithNames = (trackingData || []).map(item => ({
            ...item,
            updated_by_name: item.updated_by_profile?.full_name || 'Sistema'
          }));
          setTracking(trackingWithNames);
        }
      }

    } catch (error) {
      console.error('Error loading user data:', error);
      toast.error('Erro ao carregar dados');
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'approved':
        return <Badge variant="default" className="bg-green-100 text-green-800"><CheckCircle className="w-3 h-3 mr-1" />Aprovado</Badge>;
      case 'pending':
        return <Badge variant="secondary"><Clock className="w-3 h-3 mr-1" />Pendente</Badge>;
      case 'rejected':
        return <Badge variant="destructive"><AlertTriangle className="w-3 h-3 mr-1" />Rejeitado</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR');
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center space-x-4 mb-6">
          <Button variant="ghost" onClick={onBack}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar
          </Button>
        </div>
        <div className="text-center py-12">
          <p>Carregando seus dados...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-4">
          <Button variant="ghost" onClick={onBack}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar
          </Button>
          <div>
            <h1 className="text-3xl font-bold">Meus Dados</h1>
            <p className="text-muted-foreground">Histórico de cadastros e documentos</p>
          </div>
        </div>
        <Button variant="outline" onClick={() => onNavigate('new-registration')}>
          <FileText className="h-4 w-4 mr-2" />
          Novo Cadastro
        </Button>
      </div>

        <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview">Resumo</TabsTrigger>
          <TabsTrigger value="registration">Cadastro Social</TabsTrigger>
          <TabsTrigger value="family">Família</TabsTrigger>
          <TabsTrigger value="documents">Documentos</TabsTrigger>
          <TabsTrigger value="tracking">Acompanhamento</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <FileText className="h-8 w-8 text-primary" />
                  <span className="text-2xl font-bold">
                    {socialRegistration ? '1' : '0'}
                  </span>
                </div>
              </CardHeader>
              <CardContent>
                <CardTitle className="text-lg mb-2">Cadastro Social</CardTitle>
                <CardDescription>
                  {socialRegistration ? 'Cadastro realizado' : 'Nenhum cadastro encontrado'}
                </CardDescription>
                {socialRegistration && getStatusBadge(socialRegistration.status)}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <Users className="h-8 w-8 text-primary" />
                  <span className="text-2xl font-bold">{familyMembers.length}</span>
                </div>
              </CardHeader>
              <CardContent>
                <CardTitle className="text-lg mb-2">Membros da Família</CardTitle>
                <CardDescription>
                  {familyMembers.length > 0 ? 'Composição familiar cadastrada' : 'Nenhum membro cadastrado'}
                </CardDescription>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <Upload className="h-8 w-8 text-primary" />
                  <span className="text-2xl font-bold">{documents.length}</span>
                </div>
              </CardHeader>
              <CardContent>
                <CardTitle className="text-lg mb-2">Documentos</CardTitle>
                <CardDescription>
                  {documents.length > 0 ? 'Documentos enviados' : 'Nenhum documento enviado'}
                </CardDescription>
              </CardContent>
            </Card>
          </div>

          {socialRegistration && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  Status do Último Cadastro
                  {getStatusBadge(socialRegistration.status)}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <p><strong>Nome:</strong> {socialRegistration.name}</p>
                  <p><strong>CPF:</strong> {socialRegistration.cpf}</p>
                  <p><strong>Criado em:</strong> {formatDate(socialRegistration.created_at)}</p>
                  <p><strong>Última atualização:</strong> {formatDate(socialRegistration.updated_at)}</p>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="registration" className="space-y-6">
          {socialRegistration ? (
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Dados do Cadastro Social</CardTitle>
                  <Button variant="outline" size="sm" onClick={() => onNavigate('social-registration')}>
                    <Edit className="h-4 w-4 mr-2" />
                    Editar
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Nome Completo</p>
                    <p className="text-lg">{socialRegistration.name}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">CPF</p>
                    <p className="text-lg">{socialRegistration.cpf}</p>
                  </div>
                  {socialRegistration.phone && (
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Telefone</p>
                      <p className="text-lg">{socialRegistration.phone}</p>
                    </div>
                  )}
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Status</p>
                    {getStatusBadge(socialRegistration.status)}
                  </div>
                </div>
                <Separator />
                <div className="flex justify-between text-sm text-muted-foreground">
                  <span>Criado em: {formatDate(socialRegistration.created_at)}</span>
                  <span>Atualizado em: {formatDate(socialRegistration.updated_at)}</span>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="text-center py-12">
                <FileText className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
                <h3 className="text-lg font-semibold mb-2">Nenhum cadastro encontrado</h3>
                <p className="text-muted-foreground mb-4">Você ainda não possui um cadastro social.</p>
                <Button onClick={() => onNavigate('new-registration')}>
                  Criar Cadastro
                </Button>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="family" className="space-y-6">
          {familyMembers.length > 0 ? (
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Composição Familiar</CardTitle>
                  <Button variant="outline" size="sm" onClick={() => onNavigate('family-composition')}>
                    <Edit className="h-4 w-4 mr-2" />
                    Editar
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {familyMembers.map((member, index) => (
                    <div key={member.id} className="border rounded-lg p-4">
                      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <div>
                          <p className="text-sm font-medium text-muted-foreground">Nome</p>
                          <p>{member.member_name}</p>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-muted-foreground">Parentesco</p>
                          <p>{member.relationship}</p>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-muted-foreground">Idade</p>
                          <p>{member.age || 'Não informado'}</p>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-muted-foreground">Renda</p>
                          <p>{member.income ? formatCurrency(Number(member.income)) : 'Não informado'}</p>
                        </div>
                      </div>
                      {member.profession && (
                        <div className="mt-2">
                          <p className="text-sm font-medium text-muted-foreground">Profissão</p>
                          <p>{member.profession}</p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="text-center py-12">
                <Users className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
                <h3 className="text-lg font-semibold mb-2">Nenhum membro cadastrado</h3>
                <p className="text-muted-foreground mb-4">Adicione os membros da sua família.</p>
                <Button onClick={() => onNavigate('family-composition')}>
                  Adicionar Membros
                </Button>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="documents" className="space-y-6">
          {documents.length > 0 ? (
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Documentos Enviados</CardTitle>
                  <Button variant="outline" size="sm" onClick={() => onNavigate('documents')}>
                    <Upload className="h-4 w-4 mr-2" />
                    Enviar Mais
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {documents.map((doc) => (
                    <div key={doc.id} className="flex items-center justify-between border rounded-lg p-4">
                      <div className="flex items-center space-x-4">
                        <FileText className="h-8 w-8 text-primary" />
                        <div>
                          <p className="font-medium">{doc.document_name}</p>
                          <p className="text-sm text-muted-foreground">{doc.document_type}</p>
                          <p className="text-xs text-muted-foreground">
                            Enviado em {formatDate(doc.upload_date)}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        {getStatusBadge(doc.status)}
                        {doc.file_path && (
                          <Button variant="ghost" size="sm">
                            <Download className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="text-center py-12">
                <Upload className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
                <h3 className="text-lg font-semibold mb-2">Nenhum documento enviado</h3>
                <p className="text-muted-foreground mb-4">Faça upload dos documentos necessários.</p>
                <Button onClick={() => onNavigate('documents')}>
                  Enviar Documentos
                </Button>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="tracking" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Histórico de Acompanhamento
              </CardTitle>
              <CardDescription>
                Acompanhe o status e evolução do seu cadastro
              </CardDescription>
            </CardHeader>
            <CardContent>
              {tracking.length > 0 ? (
                <div className="space-y-4">
                  {tracking.map((item) => (
                    <div key={item.id} className="border-l-2 border-primary pl-4 pb-4">
                      <div className="flex items-center justify-between mb-2">
                        {getStatusBadge(item.status)}
                        <span className="text-sm text-muted-foreground">
                          {formatDate(item.created_at)}
                        </span>
                      </div>
                      {item.message && (
                        <p className="text-sm text-muted-foreground mb-2">
                          {item.message}
                        </p>
                      )}
                      <p className="text-xs text-muted-foreground">
                        Atualizado por: {item.updated_by_name}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Clock className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">
                    Nenhum histórico de acompanhamento encontrado.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};