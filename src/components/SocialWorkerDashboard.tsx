import React, { useState, useEffect, useRef } from 'react';
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
  const [docType, setDocType] = useState('Outros');
  const [docsRefreshKey, setDocsRefreshKey] = useState(0);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      // Carrega casos atribuídos e também os aprovados por este assistente (união)
      // 1) Atribuídos diretamente
      const { data: assignedData, error: assignedError } = await supabase
        .from('social_registrations')
        .select('*')
        .eq('assigned_social_worker_id', userProfile.id)
        .order('created_at', { ascending: false });

      const assigned = assignedData || [];
      if (assignedError) {
        console.error('Error loading assigned registrations:', assignedError);
      }

      // 2) Aprovados por este assistente (via histórico)
      const { data: approvalsRt, error: approvalsRtErr } = await supabase
        .from('registration_tracking')
        .select('social_registration_id')
        .eq('status', 'approved')
        .eq('updated_by', userProfile.user_id);

      if (approvalsRtErr) {
        console.error('Error loading approvals from tracking:', approvalsRtErr);
      }

      let approvedRegs: any[] = [];
      const approvedIds: string[] = Array.from(
        new Set(((approvalsRt || []) as any[]).map((r: any) => r.social_registration_id as string).filter(Boolean))
      ) as string[];
      if (approvedIds.length > 0) {
        const { data: approvalsRegsData, error: approvalsRegsErr } = await supabase
          .from('social_registrations')
          .select('*')
          .in('id', approvedIds);
        if (approvalsRegsErr) {
          console.error('Error loading approved registrations:', approvalsRegsErr);
        } else {
          approvedRegs = approvalsRegsData || [];
        }
      }

      // 3) União sem duplicados
      const merged = [...assigned, ...approvedRegs].reduce((acc: any[], reg: any) => {
        if (!acc.some((r: any) => r.id === reg.id)) acc.push(reg);
        return acc;
      }, [] as any[]);

      // 4) Mapear e-mails para a união
      const unionUserIds: string[] = Array.from(
        new Set(merged.map((r: any) => r.user_id as string).filter(Boolean))
      ) as string[];
      let emailMap: Record<string, string | null> = {};
      if (unionUserIds.length > 0) {
        const { data: profs, error: profErr } = await supabase
          .from('profiles')
          .select('user_id, email')
          .in('user_id', unionUserIds);
        if (profErr) {
          console.error('Error loading emails for assigned/approved registrations:', profErr);
        } else {
          (profs || []).forEach((p: any) => {
            emailMap[p.user_id as string] = (p as any).email ?? null;
          });
        }
      }

      const formattedAssigned = merged.map((reg: any) => ({
        ...reg,
        email: emailMap[reg.user_id] || 'N/A',
      }));
      setAssignedRegistrations(formattedAssigned);

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
      const updates: any = { status: statusUpdate };
      if (statusUpdate === 'approved') {
        // Ao aprovar, atribui automaticamente o caso a este assistente social
        updates.assigned_social_worker_id = userProfile.id;
      }

      const { error: updateError } = await supabase
        .from('social_registrations')
        .update(updates)
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
    const { count } = await supabase
      .from('documents')
      .select('*', { count: 'exact', head: true })
      .eq('social_registration_id', registrationId)
      .not('file_path', 'is', null)
      .neq('file_path', '');

    if (!count || count === 0) {
      toast({
        title: 'Nenhum anexo encontrado',
        description: 'O dossiê conterá apenas o formulário do cadastro.',
      });
    } else {
      toast({ title: 'Gerando dossiê', description: 'O arquivo .zip será baixado em instantes.' });
    }

    await downloadDossierZip(registrationId);
  } catch (e) {
    console.error('[SocialWorkerDashboard] dossier download error:', e);
    toast({
      title: 'Erro ao baixar dossiê',
      description: 'Não foi possível gerar o ZIP com anexos.',
      variant: 'destructive',
    });
  }
};

const sanitizeFileName = (name: string) => name.replace(/[^a-zA-Z0-9_\.\-]+/g, '_');

const handleFilesSelected = async (
  fileList: FileList,
  registrationId: string,
  citizenUserId: string
) => {
  const MAX_SIZE = 10 * 1024 * 1024; // 10MB
  const ALLOWED = ['application/pdf', 'image/jpeg'];

  const files = Array.from(fileList);
  let success = 0;

  await Promise.all(
    files.map(async (file) => {
      if (file.size > MAX_SIZE) {
        toast({
          title: 'Arquivo muito grande',
          description: `${file.name} excede 10MB.`,
          variant: 'destructive',
        });
        return;
      }
      if (!ALLOWED.includes(file.type)) {
        toast({
          title: 'Tipo de arquivo não suportado',
          description: `${file.name} deve ser PDF ou JPG.`,
          variant: 'destructive',
        });
        return;
      }

      const path = `${citizenUserId}/${crypto.randomUUID()}_${sanitizeFileName(file.name)}`;

      const { error: uploadErr } = await supabase.storage
        .from('documents')
        .upload(path, file, { upsert: true, contentType: file.type });

      if (uploadErr) {
        console.error('[upload] storage error:', uploadErr);
        toast({ title: 'Falha no upload', description: `${file.name}`, variant: 'destructive' });
        return;
      }

      const { error: insertErr } = await supabase.from('documents').insert({
        user_id: citizenUserId,
        social_registration_id: registrationId,
        document_name: file.name,
        document_type: docType,
        file_path: path,
        file_type: file.type,
        file_size: file.size,
        status: 'documento_enviado',
        upload_date: new Date().toISOString(),
      });

      if (insertErr) {
        console.error('[upload] insert error:', insertErr);
        toast({ title: 'Erro ao salvar metadados', description: `${file.name}`, variant: 'destructive' });
        return;
      }

      success += 1;
    })
  );

  if (success > 0) {
    toast({ title: 'Upload concluído', description: `${success} arquivo(s) anexado(s).` });
    setDocsRefreshKey((k) => k + 1);
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
        <CardContent className="overflow-x-auto">
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
                                <TabsList className="w-full overflow-x-auto whitespace-nowrap">
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
                                    <div className="space-y-3">
                                      <div className="flex items-center gap-2">
                                        <Select value={docType} onValueChange={setDocType}>
                                          <SelectTrigger className="w-56">
                                            <SelectValue placeholder="Tipo do documento" />
                                          </SelectTrigger>
                                          <SelectContent>
                                            <SelectItem value="RG">RG</SelectItem>
                                            <SelectItem value="CPF">CPF</SelectItem>
                                            <SelectItem value="Comprovante de residência">Comprovante de residência</SelectItem>
                                            <SelectItem value="Outros">Outros</SelectItem>
                                          </SelectContent>
                                        </Select>

                                        <input
                                          ref={fileInputRef}
                                          type="file"
                                          accept=".pdf,image/jpeg"
                                          multiple
                                          className="hidden"
                                          onChange={(e) => {
                                            if (e.target.files) {
                                              handleFilesSelected(
                                                e.target.files,
                                                selectedRegistration.id,
                                                selectedRegistration.user_id
                                              );
                                              e.currentTarget.value = '';
                                            }
                                          }}
                                        />

                                        <Button
                                          variant="outline"
                                          size="sm"
                                          onClick={() => fileInputRef.current?.click()}
                                        >
                                          Anexar documentos
                                        </Button>
                                      </div>

                                      <RegistrationDocuments key={docsRefreshKey} socialRegistrationId={selectedRegistration.id} />
                                    </div>
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
        <CardContent className="overflow-x-auto">
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
                             <TabsList className="w-full overflow-x-auto whitespace-nowrap">
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
