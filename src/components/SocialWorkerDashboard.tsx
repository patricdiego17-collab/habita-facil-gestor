import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Users, FileText, Clock, Plus, Edit, MessageCircle, Trash2, Printer, Download } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import RegistrationHistory from './registration/RegistrationHistory';
import RegistrationMessages from './registration/RegistrationMessages';
import RegistrationDocuments from './registration/RegistrationDocuments';
import { generateRegistrationPrint } from '@/utils/print/generateRegistrationPrint';
import { downloadDossierZip } from '@/utils/zip/downloadDossierZip';


interface UserProfile {
  id: string;
  user_id: string;
  full_name: string | null;
  email: string | null;
  role: string | null;
}

interface SocialWorkerDashboardProps {
  userProfile: UserProfile;
  onNavigate: (page: string) => void;
}

interface SocialRegistration {
  id: string;
  name: string;
  cpf: string;
  status: string;
  created_at: string;
  user_id: string;
  email?: string;
}

const SocialWorkerDashboard: React.FC<SocialWorkerDashboardProps> = ({ userProfile, onNavigate }) => {
  const [assignedRegistrations, setAssignedRegistrations] = useState<SocialRegistration[]>([]);
  const [allRegistrations, setAllRegistrations] = useState<SocialRegistration[]>([]);
  const [selectedRegistration, setSelectedRegistration] = useState<SocialRegistration | null>(null);
  const [statusUpdate, setStatusUpdate] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      // Carrega casos atribuídos (sem embed) e mapeia e-mails
      const { data: assignedData, error: assignedError } = await supabase
        .from('social_registrations')
        .select('*')
        .eq('assigned_social_worker_id', userProfile.id)
        .order('created_at', { ascending: false });

      if (assignedError) {
        console.error('Error loading assigned registrations:', assignedError);
        setAssignedRegistrations([]);
      } else {
        const assigned = assignedData || [];
        const assignedUserIds = Array.from(new Set(assigned.map((r: any) => r.user_id).filter(Boolean)));
        let emailMap: Record<string, string | null> = {};
        if (assignedUserIds.length > 0) {
          const { data: profsA, error: profErrA } = await supabase
            .from('profiles')
            .select('user_id, email')
            .in('user_id', assignedUserIds);
          if (profErrA) {
            console.error('Error loading emails for assigned registrations:', profErrA);
          } else {
            (profsA || []).forEach((p: any) => {
              emailMap[p.user_id as string] = (p as any).email ?? null;
            });
          }
        }
        const formattedAssigned = assigned.map((reg: any) => ({
          ...reg,
          email: emailMap[reg.user_id] || 'N/A',
        }));
        setAssignedRegistrations(formattedAssigned);
      }

      // Carrega todos os cadastros (sem embed) e mapeia e-mails
      const { data: allData, error: allError } = await supabase
        .from('social_registrations')
        .select('*')
        .order('created_at', { ascending: false });

      if (allError) {
        console.error('Error loading all registrations:', allError);
        setAllRegistrations([]);
      } else {
        const all = allData || [];
        const allUserIds = Array.from(new Set(all.map((r: any) => r.user_id).filter(Boolean)));
        let emailMapAll: Record<string, string | null> = {};
        if (allUserIds.length > 0) {
          const { data: profsAll, error: profErrAll } = await supabase
            .from('profiles')
            .select('user_id, email')
            .in('user_id', allUserIds);
          if (profErrAll) {
            console.error('Error loading emails for all registrations:', profErrAll);
          } else {
            (profsAll || []).forEach((p: any) => {
              emailMapAll[p.user_id as string] = (p as any).email ?? null;
            });
          }
        }
        const formattedAll = all.map((reg: any) => ({
          ...reg,
          email: emailMapAll[reg.user_id] || 'N/A',
        }));
        setAllRegistrations(formattedAll);
      }
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateRegistrationStatus = async () => {
    if (!selectedRegistration || !statusUpdate) return;

    try {
      const { error: updateError } = await supabase
        .from('social_registrations')
        .update({ status: statusUpdate })
        .eq('id', selectedRegistration.id);

      if (updateError) throw updateError;

      const { error: trackingError } = await supabase
        .from('registration_tracking')
        .insert({
          social_registration_id: selectedRegistration.id,
          user_id: selectedRegistration.user_id,
          updated_by: userProfile.user_id,
          status: statusUpdate,
          message: message || null
        });

      if (trackingError) throw trackingError;

      toast({
        title: "Status atualizado",
        description: "O status do cadastro foi atualizado com sucesso.",
      });

      setSelectedRegistration(null);
      setStatusUpdate('');
      setMessage('');
      loadData();
    } catch (error) {
      console.error('Error updating status:', error);
      toast({
        title: "Erro",
        description: "Erro ao atualizar o status do cadastro.",
        variant: "destructive",
      });
    }
  };

  const deleteRegistration = async (registrationId: string) => {
    console.log('[SocialWorkerDashboard] Deleting registration:', registrationId);
    const { error } = await supabase.rpc('admin_delete_registration', {
      p_registration_id: registrationId,
    });

    if (error) {
      console.error('Error deleting registration:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível excluir o cadastro.',
        variant: 'destructive',
      });
      return;
    }

    toast({
      title: 'Cadastro excluído',
      description: 'O cadastro foi removido com sucesso.',
    });
    loadData();
  };

  const getStatusBadge = (status: string) => {
    const statusColors: { [key: string]: string } = {
      'pending': 'bg-yellow-100 text-yellow-800',
      'approved': 'bg-green-100 text-green-800',
      'rejected': 'bg-red-100 text-red-800',
      'in_review': 'bg-blue-100 text-blue-800',
      'waiting_documents': 'bg-orange-100 text-orange-800'
    };

    const statusLabels: { [key: string]: string } = {
      'pending': 'Pendente',
      'approved': 'Aprovado',
      'rejected': 'Rejeitado',
      'in_review': 'Em Análise',
      'waiting_documents': 'Aguardando Documentos'
    };

    return (
      <Badge className={statusColors[status] || 'bg-gray-100 text-gray-800'}>
        {statusLabels[status] || status}
      </Badge>
    );
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR');
  };

const handlePrint = async (registrationId: string) => {
  try {
    await generateRegistrationPrint(registrationId);
  } catch (e) {
    console.error('[SocialWorkerDashboard] print error:', e);
    toast({
      title: 'Erro ao imprimir',
      description: 'Não foi possível gerar a página de impressão.',
      variant: 'destructive',
    });
  }
};

const handleDownloadDossier = async (registrationId: string) => {
  try {
    await downloadDossierZip(registrationId);
    toast({ title: 'Gerando dossiê', description: 'O arquivo .zip será baixado em instantes.' });
  } catch (e) {
    console.error('[SocialWorkerDashboard] dossier download error:', e);
    toast({
      title: 'Erro ao baixar dossiê',
      description: 'Não foi possível gerar o ZIP com anexos.',
      variant: 'destructive',
    });
  }
};

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p>Carregando dados...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Painel do Assistente Social</h1>
        <Button onClick={() => onNavigate('social-registration')}>
          <Plus className="h-4 w-4 mr-2" />
          Novo Cadastro
        </Button>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Casos Atribuídos</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{assignedRegistrations.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Em Análise</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {assignedRegistrations.filter(r => r.status === 'in_review').length}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Geral</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{allRegistrations.length}</div>
          </CardContent>
        </Card>
      </div>

      {/* Assigned Registrations */}
      <Card>
        <CardHeader>
          <CardTitle>Meus Casos</CardTitle>
          <CardDescription>
            Cadastros atribuídos a você para acompanhamento
          </CardDescription>
        </CardHeader>
        <CardContent>
          {assignedRegistrations.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>CPF</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Data de Cadastro</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {assignedRegistrations.map((registration) => (
                  <TableRow key={registration.id}>
                    <TableCell className="font-medium">{registration.name}</TableCell>
                    <TableCell>{registration.cpf}</TableCell>
                    <TableCell>{registration.email}</TableCell>
                    <TableCell>{getStatusBadge(registration.status)}</TableCell>
                    <TableCell>{formatDate(registration.created_at)}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => {
                                setSelectedRegistration(registration);
                                setStatusUpdate(registration.status);
                              }}
                            >
                              <Edit className="h-4 w-4 mr-2" />
                              Gerenciar
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-2xl">
                            <DialogHeader>
                              <DialogTitle>Gerenciar Cadastro</DialogTitle>
                              <DialogDescription>
                                {registration.name} — aprove, edite, consulte histórico e envie mensagens
                              </DialogDescription>
<div className="mt-2 flex gap-2">
  <Button
    variant="outline"
    size="sm"
    onClick={() => handlePrint(registration.id)}
    className="inline-flex items-center gap-2"
  >
    <Printer className="h-4 w-4" />
    Imprimir cadastro
  </Button>
  <Button
    variant="outline"
    size="sm"
    onClick={() => handleDownloadDossier(registration.id)}
    className="inline-flex items-center gap-2"
  >
    <Download className="h-4 w-4" />
    Baixar dossiê (.zip)
  </Button>
</div>
                            </DialogHeader>

                              <Tabs defaultValue="atualizar" className="w-full">
                                <TabsList>
                                  <TabsTrigger value="atualizar">Atualizar</TabsTrigger>
                                  <TabsTrigger value="historico">Histórico</TabsTrigger>
                                  <TabsTrigger value="documentos">Documentos</TabsTrigger>
                                  <TabsTrigger value="mensagens">Mensagens</TabsTrigger>
                                </TabsList>

                                <TabsContent value="atualizar" className="space-y-4">
                                  <div>
                                    <label className="text-sm font-medium">Novo Status</label>
                                    <Select value={statusUpdate} onValueChange={setStatusUpdate}>
                                      <SelectTrigger>
                                        <SelectValue placeholder="Selecione o status" />
                                      </SelectTrigger>
                                      <SelectContent>
                                        <SelectItem value="pending">Pendente</SelectItem>
                                        <SelectItem value="in_review">Em Análise</SelectItem>
                                        <SelectItem value="waiting_documents">Aguardando Documentos</SelectItem>
                                        <SelectItem value="approved">Aprovado</SelectItem>
                                        <SelectItem value="rejected">Rejeitado</SelectItem>
                                      </SelectContent>
                                    </Select>
                                  </div>

                                  <div>
                                    <label className="text-sm font-medium">Comentário</label>
                                    <Textarea
                                      placeholder="Adicione um comentário sobre a evolução do cadastro..."
                                      value={message}
                                      onChange={(e) => setMessage(e.target.value)}
                                    />
                                  </div>

                                  <Button onClick={updateRegistrationStatus} className="w-full">
                                    <MessageCircle className="h-4 w-4 mr-2" />
                                    Atualizar
                                  </Button>
                                </TabsContent>

                                <TabsContent value="historico">
                                  {selectedRegistration && (
                                    <div className="max-h-[60vh] overflow-auto pr-1">
                                      <RegistrationHistory socialRegistrationId={selectedRegistration.id} />
                                    </div>
                                  )}
                                </TabsContent>

                                <TabsContent value="documentos">
                                  {selectedRegistration && (
                                    <RegistrationDocuments socialRegistrationId={selectedRegistration.id} />
                                  )}
                                </TabsContent>

                                <TabsContent value="mensagens">
                                  {selectedRegistration && (
                                    <RegistrationMessages
                                      socialRegistrationId={selectedRegistration.id}
                                      currentUserId={userProfile.user_id}
                                    />
                                  )}
                                </TabsContent>
                              </Tabs>
                          </DialogContent>
                        </Dialog>

                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button size="sm" variant="destructive">
                              <Trash2 className="h-4 w-4 mr-2" />
                              Excluir
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
                              <AlertDialogDescription>
                                Esta ação é irreversível. Tem certeza que deseja excluir o cadastro de {registration.name}?
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancelar</AlertDialogCancel>
                              <AlertDialogAction onClick={() => deleteRegistration(registration.id)}>
                                Confirmar
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-8">
              <Users className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">
                Nenhum caso atribuído a você ainda.
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* All Registrations Overview */}
      <Card>
        <CardHeader>
          <CardTitle>Visão Geral - Todos os Cadastros</CardTitle>
          <CardDescription>
            Visualização geral de todos os cadastros do sistema
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>CPF</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Data de Cadastro</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {allRegistrations.map((registration) => (
                <TableRow key={registration.id}>
                  <TableCell className="font-medium">{registration.name}</TableCell>
                  <TableCell>{registration.cpf}</TableCell>
                  <TableCell>{getStatusBadge(registration.status)}</TableCell>
                  <TableCell>{formatDate(registration.created_at)}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => {
                              setSelectedRegistration(registration);
                              setStatusUpdate(registration.status);
                            }}
                          >
                            <Edit className="h-4 w-4 mr-2" />
                            Gerenciar
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-2xl">
                          <DialogHeader>
                            <DialogTitle>Gerenciar Cadastro</DialogTitle>
                            <DialogDescription>
                              {registration.name} — aprove, edite, consulte histórico e envie mensagens
                            </DialogDescription>
<div className="mt-2 flex gap-2">
  <Button
    variant="outline"
    size="sm"
    onClick={() => handlePrint(registration.id)}
    className="inline-flex items-center gap-2"
  >
    <Printer className="h-4 w-4" />
    Imprimir cadastro
  </Button>
  <Button
    variant="outline"
    size="sm"
    onClick={() => handleDownloadDossier(registration.id)}
    className="inline-flex items-center gap-2"
  >
    <Download className="h-4 w-4" />
    Baixar dossiê (.zip)
  </Button>
</div>
                          </DialogHeader>

                            <Tabs defaultValue="atualizar" className="w-full">
                              <TabsList>
                                <TabsTrigger value="atualizar">Atualizar</TabsTrigger>
                                <TabsTrigger value="historico">Histórico</TabsTrigger>
                                <TabsTrigger value="documentos">Documentos</TabsTrigger>
                                <TabsTrigger value="mensagens">Mensagens</TabsTrigger>
                              </TabsList>

                              <TabsContent value="atualizar" className="space-y-4">
                                <div>
                                  <label className="text-sm font-medium">Novo Status</label>
                                  <Select value={statusUpdate} onValueChange={setStatusUpdate}>
                                    <SelectTrigger>
                                      <SelectValue placeholder="Selecione o status" />
                                    </SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="pending">Pendente</SelectItem>
                                      <SelectItem value="in_review">Em Análise</SelectItem>
                                      <SelectItem value="waiting_documents">Aguardando Documentos</SelectItem>
                                      <SelectItem value="approved">Aprovado</SelectItem>
                                      <SelectItem value="rejected">Rejeitado</SelectItem>
                                    </SelectContent>
                                  </Select>
                                </div>

                                <div>
                                  <label className="text-sm font-medium">Comentário</label>
                                  <Textarea
                                    placeholder="Adicione um comentário sobre a evolução do cadastro..."
                                    value={message}
                                    onChange={(e) => setMessage(e.target.value)}
                                  />
                                </div>

                                <Button onClick={updateRegistrationStatus} className="w-full">
                                  <MessageCircle className="h-4 w-4 mr-2" />
                                  Atualizar
                                </Button>
                              </TabsContent>

                              <TabsContent value="historico">
                                {selectedRegistration && (
                                  <div className="max-h-[60vh] overflow-auto pr-1">
                                    <RegistrationHistory socialRegistrationId={selectedRegistration.id} />
                                  </div>
                                )}
                              </TabsContent>

                              <TabsContent value="documentos">
                                {selectedRegistration && (
                                  <RegistrationDocuments socialRegistrationId={selectedRegistration.id} />
                                )}
                              </TabsContent>

                              <TabsContent value="mensagens">
                                {selectedRegistration && (
                                  <RegistrationMessages
                                    socialRegistrationId={selectedRegistration.id}
                                    currentUserId={userProfile.user_id}
                                  />
                                )}
                              </TabsContent>
                            </Tabs>
                        </DialogContent>
                      </Dialog>

                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button size="sm" variant="destructive">
                            <Trash2 className="h-4 w-4 mr-2" />
                            Excluir
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
                            <AlertDialogDescription>
                              Esta ação é irreversível. Tem certeza que deseja excluir o cadastro de {registration.name}?
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancelar</AlertDialogCancel>
                            <AlertDialogAction onClick={() => deleteRegistration(registration.id)}>
                              Confirmar
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

export default SocialWorkerDashboard;
