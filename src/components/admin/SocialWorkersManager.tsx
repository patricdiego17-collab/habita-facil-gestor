
import React, { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Edit, Users } from 'lucide-react';

interface SocialWorkerProfile {
  id: string;
  user_id: string;
  full_name: string | null;
  email: string | null;
  cress: string | null;
  cpf: string | null;
  functional_code: string | null;
}

const SocialWorkersManager: React.FC = () => {
  const { toast } = useToast();
  const [workers, setWorkers] = useState<SocialWorkerProfile[]>([]);
  const [loading, setLoading] = useState(true);

  const [selected, setSelected] = useState<SocialWorkerProfile | null>(null);
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [cress, setCress] = useState('');
  const [cpf, setCpf] = useState('');
  const [functional, setFunctional] = useState('');

  useEffect(() => {
    loadWorkers();
  }, []);

  const loadWorkers = async () => {
    setLoading(true);
    console.log('[SocialWorkersManager] Loading social workers...');
    const { data, error } = await supabase
      .from('profiles')
      .select('id, user_id, full_name, email, cress, cpf, functional_code')
      .eq('role', 'social_worker')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('[SocialWorkersManager] Error loading workers:', error);
      toast({
        title: 'Erro ao carregar assistentes sociais',
        description: 'Verifique suas permissões ou tente novamente.',
        variant: 'destructive',
      });
      setWorkers([]);
    } else {
      setWorkers((data as any[]) as SocialWorkerProfile[]);
    }
    setLoading(false);
  };

  const openEdit = (p: SocialWorkerProfile) => {
    setSelected(p);
    setFullName(p.full_name ?? '');
    setEmail(p.email ?? '');
    setCress(p.cress ?? '');
    setCpf(p.cpf ?? '');
    setFunctional(p.functional_code ?? '');
  };

  const saveProfile = async () => {
    if (!selected) return;
    console.log('[SocialWorkersManager] Saving profile for:', selected.user_id);

    const { error } = await supabase.rpc('admin_update_profile', {
      p_user_id: selected.user_id,
      p_full_name: fullName || null,
      p_email: email || null,
      p_cress: cress || null,
      p_cpf: cpf || null,
      p_functional_code: functional || null,
    });

    if (error) {
      console.error('[SocialWorkersManager] Error saving profile:', error);
      toast({
        title: 'Erro ao salvar',
        description: 'Não foi possível salvar os dados do perfil. Confira os campos obrigatórios.',
        variant: 'destructive',
      });
      return;
    }

    toast({
      title: 'Perfil atualizado',
      description: 'Os dados do assistente social foram atualizados.',
    });
    setSelected(null);
    await loadWorkers();
  };

  return (
    <Card>
      <CardHeader className="flex items-center justify-between space-y-0">
        <div>
          <CardTitle>Assistentes Sociais</CardTitle>
          <CardDescription>Visualize e edite os dados dos Assistentes Sociais</CardDescription>
        </div>
        <Badge variant="outline" className="ml-auto">
          {workers.length} cadastrados
        </Badge>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="text-sm text-muted-foreground">Carregando...</div>
        ) : workers.length === 0 ? (
          <div className="text-center py-8">
            <Users className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">Nenhum assistente social cadastrado.</p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>CRESS</TableHead>
                <TableHead>CPF</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {workers.map((w) => (
                <TableRow key={w.id}>
                  <TableCell className="font-medium">{w.full_name || '-'}</TableCell>
                  <TableCell>{w.email || '-'}</TableCell>
                  <TableCell>{w.cress || '-'}</TableCell>
                  <TableCell>{w.cpf || '-'}</TableCell>
                  <TableCell className="text-right">
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button size="sm" variant="outline" onClick={() => openEdit(w)}>
                          <Edit className="h-4 w-4 mr-2" />
                          Ver/Editar
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-md">
                        <DialogHeader>
                          <DialogTitle>Editar Assistente Social</DialogTitle>
                          <DialogDescription>Atualize os dados do perfil selecionado.</DialogDescription>
                        </DialogHeader>
                        <div className="space-y-3">
                          <div>
                            <label className="text-sm font-medium">Nome completo</label>
                            <Input value={fullName} onChange={(e) => setFullName(e.target.value)} />
                          </div>
                          <div>
                            <label className="text-sm font-medium">Email</label>
                            <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
                          </div>
                          <div>
                            <label className="text-sm font-medium">CRESS (obrigatório p/ Assistente Social)</label>
                            <Input value={cress} onChange={(e) => setCress(e.target.value)} />
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            <div>
                              <label className="text-sm font-medium">CPF</label>
                              <Input value={cpf} onChange={(e) => setCpf(e.target.value)} />
                            </div>
                            <div>
                              <label className="text-sm font-medium">Matrícula funcional</label>
                              <Input value={functional} onChange={(e) => setFunctional(e.target.value)} />
                            </div>
                          </div>
                          <Button className="w-full" onClick={saveProfile}>
                            Salvar
                          </Button>
                        </div>
                      </DialogContent>
                    </Dialog>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
};

export default SocialWorkersManager;
