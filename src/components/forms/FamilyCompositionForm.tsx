import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Users, Plus, Trash2, Edit2, Save, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface FamilyMember {
  id: string;
  nome: string;
  parentesco: string;
  sexo: string;
  idade: string;
  estuda: string;
  escolaridade: string;
  cidadeTrabalha: string;
  profissao: string;
  renda: string;
  origemRenda: string;
  doencaDeficiencia: string;
}

interface FamilyCompositionFormProps {
  onNext: (data: FamilyMember[]) => void;
  onBack?: () => void;
  initialData?: FamilyMember[];
}

export const FamilyCompositionForm = ({ onNext, onBack, initialData = [] }: FamilyCompositionFormProps) => {
  const { toast } = useToast();
  const [familyMembers, setFamilyMembers] = useState<FamilyMember[]>(
    initialData.length > 0 ? initialData : []
  );
  
  const [editingId, setEditingId] = useState<string | null>(null);
  const [newMember, setNewMember] = useState<Partial<FamilyMember>>({});

  const parentescoOptions = [
    'Responsável',
    'Cônjuge/Companheiro(a)',
    'Filho(a)',
    'Enteado(a)',
    'Neto(a)',
    'Pai/Mãe',
    'Sogro(a)',
    'Irmão/Irmã',
    'Cunhado(a)',
    'Primo(a)',
    'Tio(a)',
    'Sobrinho(a)',
    'Outro parente',
    'Não parente'
  ];

  const escolaridadeOptions = [
    'Não alfabetizado',
    'Alfabetizado sem escolaridade',
    'Fundamental Incompleto',
    'Fundamental Completo',
    'Médio Incompleto',
    'Médio Completo',
    'Superior Incompleto',
    'Superior Completo',
    'Pós-graduação',
    'Não se aplica'
  ];

  const handleAddMember = () => {
    if (!newMember.nome) {
      toast({
        title: "Nome obrigatório",
        description: "Por favor, informe o nome do membro da família.",
        variant: "destructive",
      });
      return;
    }

    const member: FamilyMember = {
      id: Date.now().toString(),
      nome: newMember.nome || '',
      parentesco: newMember.parentesco || '',
      sexo: newMember.sexo || '',
      idade: newMember.idade || '',
      estuda: newMember.estuda || 'Não se aplica',
      escolaridade: newMember.escolaridade || '',
      cidadeTrabalha: newMember.cidadeTrabalha || '',
      profissao: newMember.profissao || '',
      renda: newMember.renda || 'R$ 0,00',
      origemRenda: newMember.origemRenda || 'Não se aplica',
      doencaDeficiencia: newMember.doencaDeficiencia || 'Não existe'
    };

    setFamilyMembers([...familyMembers, member]);
    setNewMember({});
    setEditingId(member.id);
    
    toast({
      title: "Membro adicionado",
      description: "Novo membro da família foi adicionado com sucesso.",
    });
  };

  const handleEditMember = (id: string) => {
    setEditingId(id);
  };

  const handleSaveMember = (id: string, updatedData: Partial<FamilyMember>) => {
    setFamilyMembers(familyMembers.map(member => 
      member.id === id ? { ...member, ...updatedData } : member
    ));
    setEditingId(null);
    
    toast({
      title: "Dados salvos",
      description: "Informações do membro da família foram atualizadas.",
    });
  };

  const handleDeleteMember = (id: string) => {
    if (familyMembers.length === 1) {
      toast({
        title: "Ação não permitida",
        description: "Deve haver pelo menos um membro na família.",
        variant: "destructive",
      });
      return;
    }

    setFamilyMembers(familyMembers.filter(member => member.id !== id));
    if (editingId === id) setEditingId(null);
    
    toast({
      title: "Membro removido",
      description: "Membro da família foi removido da lista.",
    });
  };

  const handleSubmit = async () => {
    if (familyMembers.length === 0) {
      toast({
        title: "Lista vazia",
        description: "Adicione pelo menos um membro da família.",
        variant: "destructive",
      });
      return;
    }

    // Garantir que haja pelo menos um responsável
    let submissionMembers = [...familyMembers];
    const hasResponsavel = submissionMembers.some(member => member.parentesco === 'Responsável');
    if (!hasResponsavel && submissionMembers.length > 0) {
      submissionMembers[0] = { ...submissionMembers[0], parentesco: 'Responsável' };
      toast({
        title: 'Responsável definido automaticamente',
        description: `Definimos ${submissionMembers[0].nome} como Responsável familiar. Você pode ajustar depois.`,
      });
    } else if (!hasResponsavel) {
      toast({
        title: 'Lista vazia',
        description: 'Adicione pelo menos um membro da família.',
        variant: 'destructive',
      });
      return;
    }

    // Verificar se todos os membros têm nome
    const hasEmptyNames = familyMembers.some(member => !member.nome.trim());
    if (hasEmptyNames) {
      toast({
        title: "Nomes obrigatórios",
        description: "Todos os membros devem ter nome informado.",
        variant: "destructive",
      });
      return;
    }

    try {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        toast({
          title: "Erro de autenticação",
          description: "Usuário não está logado",
          variant: "destructive",
        });
        return;
      }

      // Get the user's social registration
      const { data: socialRegistration } = await supabase
        .from('social_registrations')
        .select('id')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (socialRegistration) {
        // Delete existing family compositions for this registration
        await supabase
          .from('family_compositions')
          .delete()
          .eq('social_registration_id', socialRegistration.id);

        // Save family members to database
        const familyData = submissionMembers.map(member => ({
          user_id: user.id,
          social_registration_id: socialRegistration.id,
          member_name: member.nome,
          relationship: member.parentesco,
          age: parseInt(member.idade) || null,
          education: member.escolaridade,
          profession: member.profissao,
          income: parseFloat(member.renda.replace(/[^\d,]/g, '').replace(',', '.')) || 0,
          has_disability: member.doencaDeficiencia !== 'Não existe',
          disability_description: member.doencaDeficiencia !== 'Não existe' ? member.doencaDeficiencia : null,
        }));

        const { error } = await supabase
          .from('family_compositions')
          .insert(familyData);

        if (error) {
          console.error('Error saving family composition:', error);
          toast({
            title: "Erro ao salvar",
            description: "Não foi possível salvar a composição familiar. Tente novamente.",
            variant: "destructive",
          });
          return;
        }

        toast({
          title: "Composição familiar salva",
          description: "Dados salvos com sucesso!",
        });
      }

      onNext(submissionMembers);
      toast({
        title: "Composição familiar concluída",
        description: "Avançando para upload de documentos...",
      });
    } catch (error) {
      console.error('Error:', error);
      toast({
        title: "Erro inesperado",
        description: "Tente novamente em alguns instantes.",
        variant: "destructive",
      });
    }
  };

  const EditableCell = ({ 
    member, 
    field, 
    type = "text",
    options 
  }: { 
    member: FamilyMember; 
    field: keyof FamilyMember; 
    type?: "text" | "select";
    options?: string[];
  }) => {
    const [value, setValue] = useState(member[field]);
    const isEditing = editingId === member.id;

    const handleSave = () => {
      handleSaveMember(member.id, { [field]: value });
    };

    const handleCancel = () => {
      setValue(member[field]);
      if (member.id === editingId) setEditingId(null);
    };

    if (!isEditing) {
      return (
        <span className="block min-h-[1.5rem]">
          {member[field] || '-'}
        </span>
      );
    }

    if (type === "select" && options) {
      return (
        <Select value={value} onValueChange={setValue}>
          <SelectTrigger className="w-full min-w-32">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {options.map(option => (
              <SelectItem key={option} value={option}>{option}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      );
    }

    return (
      <Input
        value={value}
        onChange={(e) => setValue(e.target.value)}
        className="w-full min-w-24"
        placeholder={field === 'renda' ? 'R$ 0,00' : ''}
      />
    );
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      <div className="mb-8 text-center">
        <h1 className="text-2xl font-bold text-primary mb-2">Formulário 2 - Composição Familiar</h1>
        <p className="text-muted-foreground">
          Informações detalhadas sobre todos os membros da família
        </p>
      </div>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Users className="h-5 w-5" />
            <span>Membros da Família</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {/* Formulário para novo membro */}
          <div className="mb-6 p-4 bg-accent rounded-lg">
            <h3 className="font-semibold mb-4 flex items-center space-x-2">
              <Plus className="h-4 w-4" />
              <span>Adicionar Novo Membro</span>
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="newName">Nome *</Label>
                <Input
                  id="newName"
                  value={newMember.nome || ''}
                  onChange={(e) => setNewMember({ ...newMember, nome: e.target.value })}
                  placeholder="Nome completo"
                />
              </div>
              <div>
                <Label htmlFor="newParentesco">Parentesco</Label>
                <Select 
                  value={newMember.parentesco || ''} 
                  onValueChange={(value) => setNewMember({ ...newMember, parentesco: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent>
                    {parentescoOptions.map(option => (
                      <SelectItem key={option} value={option}>{option}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="newSexo">Sexo</Label>
                <Select 
                  value={newMember.sexo || ''} 
                  onValueChange={(value) => setNewMember({ ...newMember, sexo: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="M">Masculino</SelectItem>
                    <SelectItem value="F">Feminino</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="newIdade">Idade</Label>
                <Input
                  id="newIdade"
                  value={newMember.idade || ''}
                  onChange={(e) => setNewMember({ ...newMember, idade: e.target.value })}
                  placeholder="Ex: 25 anos"
                />
              </div>
              <div className="md:col-span-2 lg:col-span-1">
                <Button onClick={handleAddMember} className="w-full mt-6">
                  <Plus className="h-4 w-4 mr-2" />
                  Adicionar Membro
                </Button>
              </div>
            </div>
          </div>

          {/* Tabela de membros */}
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="min-w-40">Nome</TableHead>
                  <TableHead className="min-w-32">Parentesco</TableHead>
                  <TableHead className="min-w-20">Sexo</TableHead>
                  <TableHead className="min-w-24">Idade</TableHead>
                  <TableHead className="min-w-24">Estuda</TableHead>
                  <TableHead className="min-w-40">Escolaridade</TableHead>
                  <TableHead className="min-w-32">Cidade Trabalho</TableHead>
                  <TableHead className="min-w-32">Profissão</TableHead>
                  <TableHead className="min-w-28">Renda</TableHead>
                  <TableHead className="min-w-32">Origem Renda</TableHead>
                  <TableHead className="min-w-32">Doença/Deficiência</TableHead>
                  <TableHead className="min-w-24">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {familyMembers.map((member) => (
                  <TableRow key={member.id}>
                    <TableCell>
                      <EditableCell member={member} field="nome" />
                    </TableCell>
                    <TableCell>
                      <EditableCell 
                        member={member} 
                        field="parentesco" 
                        type="select" 
                        options={parentescoOptions}
                      />
                    </TableCell>
                    <TableCell>
                      <EditableCell 
                        member={member} 
                        field="sexo" 
                        type="select" 
                        options={['M', 'F']}
                      />
                    </TableCell>
                    <TableCell>
                      <EditableCell member={member} field="idade" />
                    </TableCell>
                    <TableCell>
                      <EditableCell 
                        member={member} 
                        field="estuda" 
                        type="select" 
                        options={['Sim', 'Não', 'Não se aplica']}
                      />
                    </TableCell>
                    <TableCell>
                      <EditableCell 
                        member={member} 
                        field="escolaridade" 
                        type="select" 
                        options={escolaridadeOptions}
                      />
                    </TableCell>
                    <TableCell>
                      <EditableCell member={member} field="cidadeTrabalha" />
                    </TableCell>
                    <TableCell>
                      <EditableCell member={member} field="profissao" />
                    </TableCell>
                    <TableCell>
                      <EditableCell member={member} field="renda" />
                    </TableCell>
                    <TableCell>
                      <EditableCell member={member} field="origemRenda" />
                    </TableCell>
                    <TableCell>
                      <EditableCell member={member} field="doencaDeficiencia" />
                    </TableCell>
                    <TableCell>
                      <div className="flex space-x-2">
                        {editingId === member.id ? (
                          <>
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => handleSaveMember(member.id, {})}
                            >
                              <Save className="h-3 w-3" />
                            </Button>
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => setEditingId(null)}
                            >
                              <X className="h-3 w-3" />
                            </Button>
                          </>
                        ) : (
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => handleEditMember(member.id)}
                          >
                            <Edit2 className="h-3 w-3" />
                          </Button>
                        )}
                        <Button 
                          size="sm" 
                          variant="destructive"
                          onClick={() => handleDeleteMember(member.id)}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {familyMembers.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Nenhum membro da família adicionado ainda.</p>
              <p>Use o formulário acima para adicionar o primeiro membro.</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Resumo */}
      {familyMembers.length > 0 && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Resumo da Família</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center p-4 bg-primary-light rounded-lg">
                <div className="text-2xl font-bold text-primary">{familyMembers.length}</div>
                <div className="text-sm text-muted-foreground">Total de Membros</div>
              </div>
              <div className="text-center p-4 bg-secondary-light rounded-lg">
                <div className="text-2xl font-bold text-secondary">
                  {familyMembers.filter(m => m.parentesco === 'Responsável').length}
                </div>
                <div className="text-sm text-muted-foreground">Responsáveis</div>
              </div>
              <div className="text-center p-4 bg-success-light rounded-lg">
                <div className="text-2xl font-bold text-success">
                  {familyMembers.filter(m => m.estuda === 'Sim').length}
                </div>
                <div className="text-sm text-muted-foreground">Estudando</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Botões de Ação */}
      <div className="flex justify-between">
        {onBack ? (
          <Button type="button" variant="outline" onClick={onBack}>
            Voltar
          </Button>
        ) : (
          <div></div>
        )}
        <div className="space-x-4">
          <Button type="button" variant="outline">
            Salvar Rascunho
          </Button>
          <Button onClick={handleSubmit} variant="government" size="lg">
            {onBack ? "Salvar e Continuar" : "Avançar para Documentos"}
          </Button>
        </div>
      </div>
    </div>
  );
};