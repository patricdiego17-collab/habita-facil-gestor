import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { 
  ArrowLeft, 
  Plus, 
  User, 
  Users, 
  FileText, 
  Clock,
  Calendar,
  MapPin,
  Phone,
  Mail,
  MessageCircle,
  Upload,
  Edit,
  CheckCircle,
  AlertTriangle,
  Download
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { CommunicationPanel } from "./CommunicationPanel";
import { DocumentCard } from "./DocumentCard";
import { EditableDataCard } from "./EditableDataCard";

interface UserProfile {
  id: string;
  user_id: string;
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
  rg?: string;
  birth_date?: string;
  phone?: string;
  marital_status?: string;
  education?: string;
  profession?: string;
  income?: number;
  housing_situation?: string;
  address?: string;
  neighborhood?: string;
  city?: string;
  state?: string;
  zip_code?: string;
  has_children?: boolean;
  receives_benefits?: boolean;
  benefits_description?: string;
  emergency_contact_name?: string;
  emergency_contact_phone?: string;
  observations?: string;
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
  file_path: string | null;
  file_type: string | null;
  file_size: number | null;
  status: string | null;
  upload_date: string;
  observations: string | null;
  social_registration_id?: string;
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
          .select('*')
          .eq('social_registration_id', socialData.id)
          .order('created_at', { ascending: false });

        if (trackingError) {
          console.error('Error loading tracking data:', trackingError);
        } else {
          // Get profile names for each tracking entry
          const trackingWithNames = await Promise.all(
            (trackingData || []).map(async (item) => {
              const { data: profile } = await supabase
                .from('profiles')
                .select('full_name')
                .eq('user_id', item.updated_by)
                .maybeSingle();
              
              return {
                ...item,
                updated_by_name: profile?.full_name || 'Sistema'
              };
            })
          );
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

  // Function to handle updating social registration data
  const handleUpdateSocialRegistration = async (updatedData: Record<string, any>) => {
    if (!socialRegistration?.id) return;

    const { error } = await supabase
      .from('social_registrations')
      .update(updatedData)
      .eq('id', socialRegistration.id);

    if (error) {
      throw new Error('Erro ao atualizar cadastro social');
    }

    // Reload data
    await loadUserData();
  };

  // Function to handle deleting documents
  const handleDocumentDelete = () => {
    loadUserData(); // Reload to refresh the documents list
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'approved':
      case 'aprovado_final':
      case 'documento_aprovado':
        return <Badge variant="default" className="bg-green-100 text-green-800"><CheckCircle className="w-3 h-3 mr-1" />Aprovado</Badge>;
      case 'pending':
      case 'em_analise':
      case 'cadastro_criado':
        return <Badge variant="secondary"><Clock className="w-3 h-3 mr-1" />Pendente</Badge>;
      case 'rejected':
      case 'rejeitado_final':
      case 'documento_rejeitado':
        return <Badge variant="destructive"><AlertTriangle className="w-3 h-3 mr-1" />Rejeitado</Badge>;
      case 'documento_enviado':
        return <Badge className="bg-blue-100 text-blue-800">Documento Enviado</Badge>;
      case 'documentos_solicitados':
        return <Badge className="bg-orange-100 text-orange-800">Documentos Solicitados</Badge>;
      case 'documento_removido':
        return <Badge className="bg-gray-100 text-gray-800">Documento Removido</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
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
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="overview">Resumo</TabsTrigger>
          <TabsTrigger value="registration">Cadastro Social</TabsTrigger>
          <TabsTrigger value="family">Família</TabsTrigger>
          <TabsTrigger value="documents">Documentos</TabsTrigger>
          <TabsTrigger value="tracking">Acompanhamento</TabsTrigger>
          <TabsTrigger value="communication">Comunicação</TabsTrigger>
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
            <EditableDataCard
              title="Dados do Cadastro Social"
              canEdit={true}
              onSave={handleUpdateSocialRegistration}
              fields={[
                { key: 'name', label: 'Nome Completo', type: 'text', value: socialRegistration.name, required: true },
                { key: 'cpf', label: 'CPF', type: 'text', value: socialRegistration.cpf, required: true },
                { key: 'rg', label: 'RG', type: 'text', value: socialRegistration.rg },
                { key: 'birth_date', label: 'Data de Nascimento', type: 'date', value: socialRegistration.birth_date },
                { key: 'phone', label: 'Telefone', type: 'text', value: socialRegistration.phone },
                { 
                  key: 'marital_status', 
                  label: 'Estado Civil', 
                  type: 'select', 
                  value: socialRegistration.marital_status,
                  options: [
                    { value: 'solteiro', label: 'Solteiro(a)' },
                    { value: 'casado', label: 'Casado(a)' },
                    { value: 'divorciado', label: 'Divorciado(a)' },
                    { value: 'viuvo', label: 'Viúvo(a)' },
                    { value: 'uniao_estavel', label: 'União Estável' }
                  ]
                },
                { 
                  key: 'education', 
                  label: 'Escolaridade', 
                  type: 'select', 
                  value: socialRegistration.education,
                  options: [
                    { value: 'fundamental_incompleto', label: 'Ensino Fundamental Incompleto' },
                    { value: 'fundamental_completo', label: 'Ensino Fundamental Completo' },
                    { value: 'medio_incompleto', label: 'Ensino Médio Incompleto' },
                    { value: 'medio_completo', label: 'Ensino Médio Completo' },
                    { value: 'superior_incompleto', label: 'Ensino Superior Incompleto' },
                    { value: 'superior_completo', label: 'Ensino Superior Completo' },
                    { value: 'pos_graduacao', label: 'Pós-graduação' }
                  ]
                },
                { key: 'profession', label: 'Profissão', type: 'text', value: socialRegistration.profession },
                { key: 'income', label: 'Renda', type: 'number', value: socialRegistration.income },
                { 
                  key: 'housing_situation', 
                  label: 'Situação Habitacional', 
                  type: 'select', 
                  value: socialRegistration.housing_situation,
                  options: [
                    { value: 'casa_propria', label: 'Casa Própria' },
                    { value: 'alugada', label: 'Alugada' },
                    { value: 'cedida', label: 'Cedida' },
                    { value: 'financiada', label: 'Financiada' },
                    { value: 'outros', label: 'Outros' }
                  ]
                },
                { key: 'address', label: 'Endereço', type: 'text', value: socialRegistration.address },
                { key: 'neighborhood', label: 'Bairro', type: 'text', value: socialRegistration.neighborhood },
                { key: 'city', label: 'Cidade', type: 'text', value: socialRegistration.city },
                { key: 'state', label: 'Estado', type: 'text', value: socialRegistration.state },
                { key: 'zip_code', label: 'CEP', type: 'text', value: socialRegistration.zip_code },
                { key: 'emergency_contact_name', label: 'Nome do Contato de Emergência', type: 'text', value: socialRegistration.emergency_contact_name },
                { key: 'emergency_contact_phone', label: 'Telefone do Contato de Emergência', type: 'text', value: socialRegistration.emergency_contact_phone },
                { key: 'observations', label: 'Observações', type: 'textarea', value: socialRegistration.observations },
              ]}
            />
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
                {familyMembers.some(m => m.relationship === 'Responsável') && (
                  <div className="mb-4 p-3 rounded-md bg-accent flex items-center gap-2">
                    <Users className="h-4 w-4 text-primary" />
                    <span className="text-sm">Responsável familiar: <strong>{familyMembers.find(m => m.relationship === 'Responsável')?.member_name}</strong></span>
                  </div>
                )}
                <div className="space-y-4">
                  {familyMembers.map((member) => (
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
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Documentos Anexados
              </CardTitle>
              <Button variant="outline" size="sm" onClick={() => onNavigate('documents')}>
                <Plus className="h-4 w-4 mr-2" />
                Anexar Documento
              </Button>
            </CardHeader>
            <CardContent>
              {documents.length > 0 ? (
                <div className="space-y-4">
                  {documents.map((doc) => (
                    <DocumentCard
                      key={doc.id}
                      document={doc}
                      canDelete={true}
                      onDelete={handleDocumentDelete}
                    />
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-medium mb-2">Nenhum documento anexado</h3>
                  <p className="text-muted-foreground mb-4">
                    Você ainda não possui documentos anexados ao seu cadastro.
                  </p>
                  <Button variant="outline" onClick={() => onNavigate('documents')}>
                    <Plus className="h-4 w-4 mr-2" />
                    Anexar Documento
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="tracking" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Histórico do Processo
              </CardTitle>
              <CardDescription>
                Acompanhe o status e evolução do seu cadastro
              </CardDescription>
            </CardHeader>
            <CardContent>
              {tracking.length > 0 ? (
                <div className="relative">
                  {/* Timeline line */}
                  <div className="absolute left-6 top-4 bottom-4 w-0.5 bg-border"></div>
                  
                  <div className="space-y-6">
                    {tracking.map((item) => (
                      <div key={item.id} className="relative flex items-start gap-4">
                        {/* Timeline dot */}
                        <div className="relative flex-shrink-0">
                          <div className="w-3 h-3 bg-primary rounded-full border-2 border-background shadow-sm"></div>
                        </div>
                        
                        {/* Content */}
                        <div className="flex-1 min-w-0 pb-4">
                          <div className="flex items-start justify-between">
                            <div className="space-y-2">
                              <div className="flex items-center gap-2 flex-wrap">
                                {getStatusBadge(item.status)}
                                <span className="text-sm text-muted-foreground">
                                  por {item.updated_by_name}
                                </span>
                              </div>
                              
                              {item.message && (
                                <div className="bg-muted/50 rounded-lg p-3">
                                  <p className="text-sm">{item.message}</p>
                                </div>
                              )}
                              
                              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                <Calendar className="h-3 w-3" />
                                {formatDate(item.created_at)}
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
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

        <TabsContent value="communication" className="space-y-6">
          {socialRegistration ? (
            <CommunicationPanel
              socialRegistrationId={socialRegistration.id}
              userProfile={userProfile}
            />
          ) : (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <MessageCircle className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium mb-2">Comunicação não disponível</h3>
                <p className="text-muted-foreground text-center">
                  É necessário ter um cadastro social para utilizar o sistema de comunicação.
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};