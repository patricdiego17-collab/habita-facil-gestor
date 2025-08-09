import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Users, FileText, Clock, Plus, Edit, MessageCircle, Check, X } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface UserProfile {
  id: string;
  user_id: string;
  full_name: string | null;
  email: string | null;
  role: string | null;
}

interface AdminDashboardProps {
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
  assigned_social_worker_id: string | null;
  email?: string;
}

interface SocialWorker {
  id: string;
  full_name: string | null;
  email: string | null;
}

interface RoleRequest {
  id: string;
  requester_user_id: string;
  requested_role: 'admin' | 'social_worker';
  status: 'pending' | 'approved' | 'rejected';
  notes?: string | null;
  reviewed_by?: string | null;
  reviewed_at?: string | null;
  created_at: string;
  updated_at: string;
}

const AdminDashboard: React.FC<AdminDashboardProps> = ({ userProfile, onNavigate }) => {
  const [registrations, setRegistrations] = useState<SocialRegistration[]>([]);
  const [socialWorkers, setSocialWorkers] = useState<SocialWorker[]>([]);
  const [selectedRegistration, setSelectedRegistration] = useState<SocialRegistration | null>(null);
  const [statusUpdate, setStatusUpdate] = useState('');
  const [message, setMessage] = useState('');
  const [assignedWorker, setAssignedWorker] = useState('');
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  // --- Novos estados para solicitações de papel ---
  const [roleRequests, setRoleRequests] = useState<RoleRequest[]>([]);
  const [requesterInfo, setRequesterInfo] = useState<Record<string, { full_name: string | null; email: string | null }>>({});
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);
  const [loadingRequests, setLoadingRequests] = useState(true);

  useEffect(() => {
    loadData();
    loadRoleRequests();
    loadSuperAdminInfo();
  }, []);

  const loadSuperAdminInfo = async () => {
    console.log('[AdminDashboard] Checking super admin...');
    const { data, error } = await supabase.rpc('get_super_admin_user_id');
    if (error) {
      console.error('Error loading super admin id:', error);
      setIsSuperAdmin(false);
      return;
    }
    setIsSuperAdmin(data === userProfile.user_id);
    console.log('[AdminDashboard] isSuperAdmin:', data === userProfile.user_id);
  };

  const loadRoleRequests = async () => {
    setLoadingRequests(true);
    console.log('[AdminDashboard] Loading role requests...');
    const { data: requests, error } = await supabase
      .from('role_requests')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error loading role requests:', error);
      setRoleRequests([]);
      setRequesterInfo({});
      setLoadingRequests(false);
      return;
    }

    setRoleRequests(requests || []);

    const ids = Array.from(new Set((requests || []).map(r => r.requester_user_id)));
    if (ids.length > 0) {
      const { data: profs, error: profErr } = await supabase
        .from('profiles')
        .select('user_id, full_name, email')
        .in('user_id', ids);

      if (profErr) {
        console.error('Error loading requester profiles:', profErr);
        setRequesterInfo({});
      } else {
        const map: Record<string, { full_name: string | null; email: string | null }> = {};
        (profs || []).forEach(p => {
          map[p.user_id as string] = { full_name: (p as any).full_name ?? null, email: (p as any).email ?? null };
        });
        setRequesterInfo(map);
      }
    } else {
      setRequesterInfo({});
    }

    setLoadingRequests(false);
  };

  const approveOrRejectRequest = async (requestId: string, approve: boolean) => {
    if (!isSuperAdmin) {
      toast({
        title: 'Permissão negada',
        description: 'Apenas o primeiro administrador pode aprovar ou rejeitar solicitações.',
        variant: 'destructive',
      });
      return;
    }

    console.log('[AdminDashboard] Approving/Rejecting request:', requestId, approve);
    const { error } = await supabase.rpc('approve_role_request', {
      p_request_id: requestId,
      p_approve: approve,
      p_notes: null,
    });

    if (error) {
      console.error('Error updating role request:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível processar a solicitação.',
        variant: 'destructive',
      });
      return;
    }

    toast({
      title: approve ? 'Solicitação aprovada' : 'Solicitação rejeitada',
      description: 'A solicitação foi processada com sucesso.',
    });
    loadRoleRequests();
  };

  const loadData = async () => {
    try {
      // Load all registrations with user data
      const { data: registrationsData, error: regError } = await supabase
        .from('social_registrations')
        .select(`
          *,
          profiles(email)
        `)
        .order('created_at', { ascending: false });

      if (regError) {
        console.error('Error loading registrations:', regError);
      } else {
        const formattedRegs = registrationsData?.map(reg => ({
          ...reg,
          email: (reg.profiles as any)?.email || 'N/A'
        })) || [];
        setRegistrations(formattedRegs);
      }

      // Load social workers
      const { data: workersData, error: workersError } = await supabase
        .from('profiles')
        .select('id, full_name, email')
        .eq('role', 'social_worker');

      if (workersError) {
        console.error('Error loading social workers:', workersError);
      } else {
        setSocialWorkers(workersData || []);
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
      // Update registration status
      const { error: updateError } = await supabase
        .from('social_registrations')
        .update({ 
          status: statusUpdate,
          assigned_social_worker_id: assignedWorker || null
        })
        .eq('id', selectedRegistration.id);

      if (updateError) throw updateError;

      // Add tracking entry
      const { error: trackingError } = await supabase
        .from('registration_tracking')
        .insert({
          social_registration_id: selectedRegistration.id,
          user_id: selectedRegistration.user_id,
          updated_by: userProfile.id,
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
      setAssignedWorker('');
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
        <h1 className="text-3xl font-bold">Painel Administrativo</h1>
        <Button onClick={() => onNavigate('social-registration')}>
          <Plus className="h-4 w-4 mr-2" />
          Novo Cadastro
        </Button>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Cadastros</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{registrations.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pendentes</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {registrations.filter(r => r.status === 'pending').length}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Assistentes Sociais</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{socialWorkers.length}</div>
          </CardContent>
        </Card>
      </div>

      {/* Registrations Table */}
      <Card>
        <CardHeader>
          <CardTitle>Cadastros Sociais</CardTitle>
          <CardDescription>
            Gerencie todos os cadastros sociais e acompanhe o status
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>CPF</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Data de Cadastro</TableHead>
                <TableHead>Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {registrations.map((registration) => (
                <TableRow key={registration.id}>
                  <TableCell className="font-medium">{registration.name}</TableCell>
                  <TableCell>{registration.cpf}</TableCell>
                  <TableCell>{registration.email}</TableCell>
                  <TableCell>{getStatusBadge(registration.status)}</TableCell>
                  <TableCell>{formatDate(registration.created_at)}</TableCell>
                  <TableCell>
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => {
                            setSelectedRegistration(registration);
                            setStatusUpdate(registration.status);
                            setAssignedWorker(registration.assigned_social_worker_id || '');
                          }}
                        >
                          <Edit className="h-4 w-4 mr-2" />
                          Gerenciar
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-md">
                        <DialogHeader>
                          <DialogTitle>Gerenciar Cadastro</DialogTitle>
                          <DialogDescription>
                            Atualize o status e adicione comentários para {registration.name}
                          </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4">
                          <div>
                            <label className="text-sm font-medium">Status</label>
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
                            <label className="text-sm font-medium">Assistente Social</label>
                            <Select value={assignedWorker} onValueChange={setAssignedWorker}>
                              <SelectTrigger>
                                <SelectValue placeholder="Selecione um assistente social" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="">Nenhum</SelectItem>
                                {socialWorkers.map((worker) => (
                                  <SelectItem key={worker.id} value={worker.id}>
                                    {worker.full_name || worker.email}
                                  </SelectItem>
                                ))}
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
                        </div>
                      </DialogContent>
                    </Dialog>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Role Requests Management */}
      <Card>
        <CardHeader>
          <CardTitle>Solicitações de Função</CardTitle>
          <CardDescription>
            {isSuperAdmin
              ? 'Aprovar ou rejeitar pedidos de promoção para Administrador ou Assistente Social.'
              : 'Você pode visualizar todas as solicitações. Apenas o primeiro administrador pode aprovar/rejeitar.'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loadingRequests ? (
            <div className="text-sm text-muted-foreground">Carregando solicitações...</div>
          ) : roleRequests.length === 0 ? (
            <div className="text-sm text-muted-foreground">Nenhuma solicitação encontrada.</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Solicitante</TableHead>
                  <TableHead>Pedido</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Criada em</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {roleRequests.map((req) => {
                  const info = requesterInfo[req.requester_user_id] || { full_name: null, email: null };
                  return (
                    <TableRow key={req.id}>
                      <TableCell className="font-medium">
                        {info.full_name || info.email || req.requester_user_id}
                        <div className="text-xs text-muted-foreground">{info.email}</div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {req.requested_role === 'admin' ? 'Administrador' : 'Assistente Social'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {req.status === 'pending' && <Badge className="bg-yellow-100 text-yellow-800">Pendente</Badge>}
                        {req.status === 'approved' && <Badge className="bg-green-100 text-green-800">Aprovada</Badge>}
                        {req.status === 'rejected' && <Badge className="bg-red-100 text-red-800">Rejeitada</Badge>}
                      </TableCell>
                      <TableCell>{formatDate(req.created_at)}</TableCell>
                      <TableCell className="text-right">
                        {req.status === 'pending' ? (
                          <div className="flex justify-end gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              disabled={!isSuperAdmin}
                              onClick={() => approveOrRejectRequest(req.id, true)}
                            >
                              <Check className="h-4 w-4 mr-1" />
                              Aprovar
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              disabled={!isSuperAdmin}
                              onClick={() => approveOrRejectRequest(req.id, false)}
                            >
                              <X className="h-4 w-4 mr-1" />
                              Rejeitar
                            </Button>
                          </div>
                        ) : (
                          <span className="text-sm text-muted-foreground">Sem ações</span>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminDashboard;
