import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { CalendarDays, MapPin, User, Home, Zap } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface SocialRegistrationData {
  // Informações do Cadastro
  nucleo: string;
  ctm: string;
  selo: string;
  entrevistador: string;
  data: string;

  // 1º Responsável
  rg1: string;
  orgaoExpedidor1: string;
  uf1: string;
  cpf1: string;
  dataNascimento1: string;
  naturalidade1: string;
  ufNaturalidade1: string;
  estadoCivil1: string;
  regime1: string;
  tempoMoradiaBairro1: string;
  tempoMoradiaItapecerica1: string;
  nis1: string;
  eleitorItapecerica1: boolean;
  profissao1: string;
  empregado1: boolean;

  // 2º Responsável
  rg2: string;
  orgaoExpedidor2: string;
  uf2: string;
  cpf2: string;
  dataNascimento2: string;
  naturalidade2: string;
  ufNaturalidade2: string;
  estadoCivil2: string;
  regime2: string;
  eleitorItapecerica2: boolean;
  profissao2: string;
  empregado2: boolean;

  // Programa de Complementação de Renda
  programaRenda: string;
  valorPrograma: string;

  // Gastos Adicionais
  gastoAlimentacao: string;
  gastoMedicamentos: string;
  gastoTransporte: string;
  gastoOutros: string;

  // Dados da Moradia
  endereco: string;
  numero: string;
  bairro: string;
  telefones: string;
  usoSolo: string;
  condicaoMoradia: string;
  nomeProprietario: string;
  valorAluguel: string;
  pagaIPTU: boolean;
  comoAdquiriu: string;
  documentacaoImovel: string;

  // Serviços Básicos
  ligacaoEsgoto: string;
  ligacaoAgua: string;
  valorAgua: string;
  ligacaoEnergia: string;
  valorEnergia: string;

  // Informações da Comunidade
  equipamentoMaiorUso: string;
  maiorProblema: string;

  // Observações
  observacoes: string;
}

interface SocialRegistrationFormProps {
  onNext: (data: SocialRegistrationData) => void;
  initialData?: Partial<SocialRegistrationData>;
}

export const SocialRegistrationForm = ({ onNext, initialData }: SocialRegistrationFormProps) => {
  const { toast } = useToast();
  const [formData, setFormData] = useState<SocialRegistrationData>({
    nucleo: "",
    ctm: "",
    selo: "",
    entrevistador: "",
    data: new Date().toISOString().split('T')[0],
    
    rg1: "",
    orgaoExpedidor1: "",
    uf1: "",
    cpf1: "",
    dataNascimento1: "",
    naturalidade1: "",
    ufNaturalidade1: "",
    estadoCivil1: "",
    regime1: "",
    tempoMoradiaBairro1: "",
    tempoMoradiaItapecerica1: "",
    nis1: "",
    eleitorItapecerica1: false,
    profissao1: "",
    empregado1: false,

    rg2: "",
    orgaoExpedidor2: "",
    uf2: "",
    cpf2: "",
    dataNascimento2: "",
    naturalidade2: "",
    ufNaturalidade2: "",
    estadoCivil2: "",
    regime2: "",
    eleitorItapecerica2: false,
    profissao2: "",
    empregado2: false,

    programaRenda: "",
    valorPrograma: "",

    gastoAlimentacao: "",
    gastoMedicamentos: "",
    gastoTransporte: "",
    gastoOutros: "",

    endereco: "",
    numero: "",
    bairro: "",
    telefones: "",
    usoSolo: "",
    condicaoMoradia: "",
    nomeProprietario: "",
    valorAluguel: "",
    pagaIPTU: false,
    comoAdquiriu: "",
    documentacaoImovel: "",

    ligacaoEsgoto: "",
    ligacaoAgua: "",
    valorAgua: "",
    ligacaoEnergia: "",
    valorEnergia: "",

    equipamentoMaiorUso: "",
    maiorProblema: "",

    observacoes: "",
    ...initialData
  });

  const handleInputChange = (field: keyof SocialRegistrationData, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validações básicas
    if (!formData.rg1 || !formData.cpf1 || !formData.endereco) {
      toast({
        title: "Campos obrigatórios",
        description: "Por favor, preencha pelo menos RG, CPF e endereço do 1º responsável.",
        variant: "destructive",
      });
      return;
    }

    onNext(formData);
    toast({
      title: "Formulário 1 concluído",
      description: "Avançando para composição familiar...",
    });
  };

  const ufs = [
    "AC", "AL", "AP", "AM", "BA", "CE", "DF", "ES", "GO", "MA", 
    "MT", "MS", "MG", "PA", "PB", "PR", "PE", "PI", "RJ", "RN", 
    "RS", "RO", "RR", "SC", "SP", "SE", "TO"
  ];

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="mb-8 text-center">
        <h1 className="text-2xl font-bold text-primary mb-2">Formulário 1 - Cadastro Social</h1>
        <p className="text-muted-foreground">
          Prefeitura do Município de Itapecerica da Serra<br />
          Secretaria Municipal de Habitação e Desenvolvimento Urbano<br />
          Departamento de Projetos Habitacionais
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Informações do Cadastro */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <CalendarDays className="h-5 w-5" />
              <span>Informações do Cadastro</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="nucleo">Núcleo</Label>
              <Input
                id="nucleo"
                value={formData.nucleo}
                onChange={(e) => handleInputChange('nucleo', e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="ctm">CTM</Label>
              <Input
                id="ctm"
                value={formData.ctm}
                onChange={(e) => handleInputChange('ctm', e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="selo">Selo</Label>
              <Input
                id="selo"
                value={formData.selo}
                onChange={(e) => handleInputChange('selo', e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="entrevistador">Entrevistador</Label>
              <Input
                id="entrevistador"
                value={formData.entrevistador}
                onChange={(e) => handleInputChange('entrevistador', e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="data">Data</Label>
              <Input
                id="data"
                type="date"
                value={formData.data}
                onChange={(e) => handleInputChange('data', e.target.value)}
              />
            </div>
          </CardContent>
        </Card>

        {/* 1º Responsável */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <User className="h-5 w-5" />
              <span>1º Responsável</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="rg1">RG *</Label>
                <Input
                  id="rg1"
                  value={formData.rg1}
                  onChange={(e) => handleInputChange('rg1', e.target.value)}
                  required
                />
              </div>
              <div>
                <Label htmlFor="orgaoExpedidor1">Órgão Expedidor</Label>
                <Input
                  id="orgaoExpedidor1"
                  value={formData.orgaoExpedidor1}
                  onChange={(e) => handleInputChange('orgaoExpedidor1', e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="uf1">UF</Label>
                <Select value={formData.uf1} onValueChange={(value) => handleInputChange('uf1', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent>
                    {ufs.map(uf => (
                      <SelectItem key={uf} value={uf}>{uf}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="cpf1">CPF *</Label>
                <Input
                  id="cpf1"
                  value={formData.cpf1}
                  onChange={(e) => handleInputChange('cpf1', e.target.value)}
                  placeholder="000.000.000-00"
                  required
                />
              </div>
              <div>
                <Label htmlFor="dataNascimento1">Data de Nascimento</Label>
                <Input
                  id="dataNascimento1"
                  type="date"
                  value={formData.dataNascimento1}
                  onChange={(e) => handleInputChange('dataNascimento1', e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="naturalidade1">Naturalidade</Label>
                <Input
                  id="naturalidade1"
                  value={formData.naturalidade1}
                  onChange={(e) => handleInputChange('naturalidade1', e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="ufNaturalidade1">UF Naturalidade</Label>
                <Select value={formData.ufNaturalidade1} onValueChange={(value) => handleInputChange('ufNaturalidade1', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent>
                    {ufs.map(uf => (
                      <SelectItem key={uf} value={uf}>{uf}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="estadoCivil1">Estado Civil</Label>
                <Select value={formData.estadoCivil1} onValueChange={(value) => handleInputChange('estadoCivil1', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="solteiro">Solteiro(a)</SelectItem>
                    <SelectItem value="casado">Casado(a)</SelectItem>
                    <SelectItem value="separado">Separado(a)</SelectItem>
                    <SelectItem value="divorciado">Divorciado(a)</SelectItem>
                    <SelectItem value="viuvo">Viúvo(a)</SelectItem>
                    <SelectItem value="uniao_estavel">União Estável</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="regime1">Regime</Label>
                <Input
                  id="regime1"
                  value={formData.regime1}
                  onChange={(e) => handleInputChange('regime1', e.target.value)}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="tempoMoradiaBairro1">Tempo de Moradia no Bairro</Label>
                <Input
                  id="tempoMoradiaBairro1"
                  value={formData.tempoMoradiaBairro1}
                  onChange={(e) => handleInputChange('tempoMoradiaBairro1', e.target.value)}
                  placeholder="Ex: 5 anos"
                />
              </div>
              <div>
                <Label htmlFor="tempoMoradiaItapecerica1">Tempo de Moradia em Itapecerica</Label>
                <Input
                  id="tempoMoradiaItapecerica1"
                  value={formData.tempoMoradiaItapecerica1}
                  onChange={(e) => handleInputChange('tempoMoradiaItapecerica1', e.target.value)}
                  placeholder="Ex: 10 anos"
                />
              </div>
              <div>
                <Label htmlFor="nis1">Número de NIS</Label>
                <Input
                  id="nis1"
                  value={formData.nis1}
                  onChange={(e) => handleInputChange('nis1', e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="profissao1">Profissão</Label>
                <Input
                  id="profissao1"
                  value={formData.profissao1}
                  onChange={(e) => handleInputChange('profissao1', e.target.value)}
                />
              </div>
            </div>

            <div className="flex flex-wrap gap-6">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="eleitorItapecerica1"
                  checked={formData.eleitorItapecerica1}
                  onCheckedChange={(checked) => handleInputChange('eleitorItapecerica1', checked as boolean)}
                />
                <Label htmlFor="eleitorItapecerica1">Eleitor em Itapecerica</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="empregado1"
                  checked={formData.empregado1}
                  onCheckedChange={(checked) => handleInputChange('empregado1', checked as boolean)}
                />
                <Label htmlFor="empregado1">Empregado</Label>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 2º Responsável */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <User className="h-5 w-5" />
              <span>2º Responsável (Opcional)</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="rg2">RG</Label>
                <Input
                  id="rg2"
                  value={formData.rg2}
                  onChange={(e) => handleInputChange('rg2', e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="orgaoExpedidor2">Órgão Expedidor</Label>
                <Input
                  id="orgaoExpedidor2"
                  value={formData.orgaoExpedidor2}
                  onChange={(e) => handleInputChange('orgaoExpedidor2', e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="uf2">UF</Label>
                <Select value={formData.uf2} onValueChange={(value) => handleInputChange('uf2', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent>
                    {ufs.map(uf => (
                      <SelectItem key={uf} value={uf}>{uf}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="cpf2">CPF</Label>
                <Input
                  id="cpf2"
                  value={formData.cpf2}
                  onChange={(e) => handleInputChange('cpf2', e.target.value)}
                  placeholder="000.000.000-00"
                />
              </div>
              <div>
                <Label htmlFor="dataNascimento2">Data de Nascimento</Label>
                <Input
                  id="dataNascimento2"
                  type="date"
                  value={formData.dataNascimento2}
                  onChange={(e) => handleInputChange('dataNascimento2', e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="naturalidade2">Naturalidade</Label>
                <Input
                  id="naturalidade2"
                  value={formData.naturalidade2}
                  onChange={(e) => handleInputChange('naturalidade2', e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="ufNaturalidade2">UF Naturalidade</Label>
                <Select value={formData.ufNaturalidade2} onValueChange={(value) => handleInputChange('ufNaturalidade2', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent>
                    {ufs.map(uf => (
                      <SelectItem key={uf} value={uf}>{uf}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="estadoCivil2">Estado Civil</Label>
                <Select value={formData.estadoCivil2} onValueChange={(value) => handleInputChange('estadoCivil2', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="solteiro">Solteiro(a)</SelectItem>
                    <SelectItem value="casado">Casado(a)</SelectItem>
                    <SelectItem value="separado">Separado(a)</SelectItem>
                    <SelectItem value="divorciado">Divorciado(a)</SelectItem>
                    <SelectItem value="viuvo">Viúvo(a)</SelectItem>
                    <SelectItem value="uniao_estavel">União Estável</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="regime2">Regime</Label>
                <Input
                  id="regime2"
                  value={formData.regime2}
                  onChange={(e) => handleInputChange('regime2', e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="profissao2">Profissão</Label>
                <Input
                  id="profissao2"
                  value={formData.profissao2}
                  onChange={(e) => handleInputChange('profissao2', e.target.value)}
                />
              </div>
            </div>

            <div className="flex flex-wrap gap-6">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="eleitorItapecerica2"
                  checked={formData.eleitorItapecerica2}
                  onCheckedChange={(checked) => handleInputChange('eleitorItapecerica2', checked as boolean)}
                />
                <Label htmlFor="eleitorItapecerica2">Eleitor em Itapecerica</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="empregado2"
                  checked={formData.empregado2}
                  onCheckedChange={(checked) => handleInputChange('empregado2', checked as boolean)}
                />
                <Label htmlFor="empregado2">Empregado</Label>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Programa de Complementação de Renda */}
        <Card>
          <CardHeader>
            <CardTitle>Programa de Complementação de Renda</CardTitle>
          </CardHeader>
          <CardContent>
            <RadioGroup
              value={formData.programaRenda}
              onValueChange={(value) => handleInputChange('programaRenda', value)}
              className="grid grid-cols-2 md:grid-cols-3 gap-4"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="nenhum" id="nenhum" />
                <Label htmlFor="nenhum">Nenhum</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="bpc" id="bpc" />
                <Label htmlFor="bpc">BPC</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="bolsa_familia" id="bolsa_familia" />
                <Label htmlFor="bolsa_familia">Bolsa Família</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="renda_cidada" id="renda_cidada" />
                <Label htmlFor="renda_cidada">Renda Cidadã</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="outro" id="outro" />
                <Label htmlFor="outro">Outro</Label>
              </div>
            </RadioGroup>
            
            {(formData.programaRenda === 'outro' || (formData.programaRenda && formData.programaRenda !== 'nenhum')) && (
              <div className="mt-4">
                <Label htmlFor="valorPrograma">Valor (R$)</Label>
                <Input
                  id="valorPrograma"
                  value={formData.valorPrograma}
                  onChange={(e) => handleInputChange('valorPrograma', e.target.value)}
                  placeholder="0,00"
                />
              </div>
            )}
          </CardContent>
        </Card>

        {/* Gastos Adicionais */}
        <Card>
          <CardHeader>
            <CardTitle>Gastos Adicionais</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="gastoAlimentacao">Alimentação (R$)</Label>
              <Input
                id="gastoAlimentacao"
                value={formData.gastoAlimentacao}
                onChange={(e) => handleInputChange('gastoAlimentacao', e.target.value)}
                placeholder="0,00"
              />
            </div>
            <div>
              <Label htmlFor="gastoMedicamentos">Medicamentos (R$)</Label>
              <Input
                id="gastoMedicamentos"
                value={formData.gastoMedicamentos}
                onChange={(e) => handleInputChange('gastoMedicamentos', e.target.value)}
                placeholder="0,00"
              />
            </div>
            <div>
              <Label htmlFor="gastoTransporte">Transporte (R$)</Label>
              <Input
                id="gastoTransporte"
                value={formData.gastoTransporte}
                onChange={(e) => handleInputChange('gastoTransporte', e.target.value)}
                placeholder="0,00"
              />
            </div>
            <div>
              <Label htmlFor="gastoOutros">Outros (R$)</Label>
              <Input
                id="gastoOutros"
                value={formData.gastoOutros}
                onChange={(e) => handleInputChange('gastoOutros', e.target.value)}
                placeholder="0,00"
              />
            </div>
          </CardContent>
        </Card>

        {/* Dados da Moradia */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Home className="h-5 w-5" />
              <span>Dados da Moradia</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="md:col-span-2">
                <Label htmlFor="endereco">Endereço *</Label>
                <Input
                  id="endereco"
                  value={formData.endereco}
                  onChange={(e) => handleInputChange('endereco', e.target.value)}
                  placeholder="Rua, Avenida..."
                  required
                />
              </div>
              <div>
                <Label htmlFor="numero">Número</Label>
                <Input
                  id="numero"
                  value={formData.numero}
                  onChange={(e) => handleInputChange('numero', e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="bairro">Bairro/Loteamento</Label>
                <Input
                  id="bairro"
                  value={formData.bairro}
                  onChange={(e) => handleInputChange('bairro', e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="telefones">Telefones</Label>
                <Input
                  id="telefones"
                  value={formData.telefones}
                  onChange={(e) => handleInputChange('telefones', e.target.value)}
                  placeholder="(11) 99999-9999"
                />
              </div>
            </div>

            <div>
              <Label>Uso do Solo</Label>
              <RadioGroup
                value={formData.usoSolo}
                onValueChange={(value) => handleInputChange('usoSolo', value)}
                className="grid grid-cols-2 md:grid-cols-3 gap-4 mt-2"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="residencial" id="residencial" />
                  <Label htmlFor="residencial">Residencial</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="comercial" id="comercial" />
                  <Label htmlFor="comercial">Comercial</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="misto" id="misto" />
                  <Label htmlFor="misto">Misto</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="industrial" id="industrial" />
                  <Label htmlFor="industrial">Industrial</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="institucional" id="institucional" />
                  <Label htmlFor="institucional">Institucional</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="outro_uso" id="outro_uso" />
                  <Label htmlFor="outro_uso">Outro</Label>
                </div>
              </RadioGroup>
            </div>

            <div>
              <Label>Condição da Moradia</Label>
              <RadioGroup
                value={formData.condicaoMoradia}
                onValueChange={(value) => handleInputChange('condicaoMoradia', value)}
                className="grid grid-cols-2 md:grid-cols-2 gap-4 mt-2"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="propria" id="propria" />
                  <Label htmlFor="propria">Própria</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="cedida" id="cedida" />
                  <Label htmlFor="cedida">Cedida</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="invasao" id="invasao" />
                  <Label htmlFor="invasao">Invasão</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="alugada" id="alugada" />
                  <Label htmlFor="alugada">Alugada</Label>
                </div>
              </RadioGroup>
            </div>

            {formData.condicaoMoradia === 'alugada' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="nomeProprietario">Nome do Proprietário</Label>
                  <Input
                    id="nomeProprietario"
                    value={formData.nomeProprietario}
                    onChange={(e) => handleInputChange('nomeProprietario', e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="valorAluguel">Valor do Aluguel (R$)</Label>
                  <Input
                    id="valorAluguel"
                    value={formData.valorAluguel}
                    onChange={(e) => handleInputChange('valorAluguel', e.target.value)}
                    placeholder="0,00"
                  />
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="pagaIPTU"
                    checked={formData.pagaIPTU}
                    onCheckedChange={(checked) => handleInputChange('pagaIPTU', checked as boolean)}
                  />
                  <Label htmlFor="pagaIPTU">Paga IPTU</Label>
                </div>
              </div>
            )}

            <div>
              <Label>Como Adquiriu a Moradia?</Label>
              <RadioGroup
                value={formData.comoAdquiriu}
                onValueChange={(value) => handleInputChange('comoAdquiriu', value)}
                className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="comprou_terreno_construiu" id="comprou_terreno_construiu" />
                  <Label htmlFor="comprou_terreno_construiu">Comprou o terreno e construiu</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="comprou_casa" id="comprou_casa" />
                  <Label htmlFor="comprou_casa">Comprou a casa</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="comprou_casa_ampliou" id="comprou_casa_ampliou" />
                  <Label htmlFor="comprou_casa_ampliou">Comprou a casa e ampliou</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="heranca" id="heranca" />
                  <Label htmlFor="heranca">Herança</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="ocupou_terreno_construiu" id="ocupou_terreno_construiu" />
                  <Label htmlFor="ocupou_terreno_construiu">Ocupou o terreno e construiu</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="atendimento_habitacional" id="atendimento_habitacional" />
                  <Label htmlFor="atendimento_habitacional">Atendimento habitacional público</Label>
                </div>
              </RadioGroup>
            </div>

            <div>
              <Label>Documentação do Imóvel</Label>
              <RadioGroup
                value={formData.documentacaoImovel}
                onValueChange={(value) => handleInputChange('documentacaoImovel', value)}
                className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="contrato_compra_venda" id="contrato_compra_venda" />
                  <Label htmlFor="contrato_compra_venda">Contrato de compra e venda</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="matricula" id="matricula" />
                  <Label htmlFor="matricula">Matrícula</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="escritura_registrada" id="escritura_registrada" />
                  <Label htmlFor="escritura_registrada">Escritura registrada no Cartório</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="cessao_prefeitura" id="cessao_prefeitura" />
                  <Label htmlFor="cessao_prefeitura">Cessão da Prefeitura</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="nao_possui" id="nao_possui" />
                  <Label htmlFor="nao_possui">Não possui</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="outro_doc" id="outro_doc" />
                  <Label htmlFor="outro_doc">Outro</Label>
                </div>
              </RadioGroup>
            </div>
          </CardContent>
        </Card>

        {/* Serviços Básicos */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Zap className="h-5 w-5" />
              <span>Serviços Básicos</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <Label>Ligação de Esgoto</Label>
              <RadioGroup
                value={formData.ligacaoEsgoto}
                onValueChange={(value) => handleInputChange('ligacaoEsgoto', value)}
                className="grid grid-cols-3 gap-4 mt-2"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="oficial_sabesp" id="oficial_sabesp" />
                  <Label htmlFor="oficial_sabesp">Oficial da SABESP</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="fossa" id="fossa" />
                  <Label htmlFor="fossa">Fossa</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="clandestina_esgoto" id="clandestina_esgoto" />
                  <Label htmlFor="clandestina_esgoto">Clandestina</Label>
                </div>
              </RadioGroup>
            </div>

            <div>
              <Label>Ligação de Água</Label>
              <RadioGroup
                value={formData.ligacaoAgua}
                onValueChange={(value) => handleInputChange('ligacaoAgua', value)}
                className="grid grid-cols-3 gap-4 mt-2"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="oficial_individual" id="oficial_individual_agua" />
                  <Label htmlFor="oficial_individual_agua">Oficial individual</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="oficial_compartilhada" id="oficial_compartilhada_agua" />
                  <Label htmlFor="oficial_compartilhada_agua">Oficial compartilhada</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="clandestina_agua" id="clandestina_agua" />
                  <Label htmlFor="clandestina_agua">Clandestina</Label>
                </div>
              </RadioGroup>
              
              {(formData.ligacaoAgua === 'oficial_individual' || formData.ligacaoAgua === 'oficial_compartilhada') && (
                <div className="mt-4">
                  <Label htmlFor="valorAgua">Valor (R$)</Label>
                  <Input
                    id="valorAgua"
                    value={formData.valorAgua}
                    onChange={(e) => handleInputChange('valorAgua', e.target.value)}
                    placeholder="0,00"
                  />
                </div>
              )}
            </div>

            <div>
              <Label>Ligação de Energia Elétrica</Label>
              <RadioGroup
                value={formData.ligacaoEnergia}
                onValueChange={(value) => handleInputChange('ligacaoEnergia', value)}
                className="grid grid-cols-3 gap-4 mt-2"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="oficial_individual_energia" id="oficial_individual_energia" />
                  <Label htmlFor="oficial_individual_energia">Oficial individual</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="oficial_compartilhada_energia" id="oficial_compartilhada_energia" />
                  <Label htmlFor="oficial_compartilhada_energia">Oficial compartilhada</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="clandestina_energia" id="clandestina_energia" />
                  <Label htmlFor="clandestina_energia">Clandestina</Label>
                </div>
              </RadioGroup>
              
              {(formData.ligacaoEnergia === 'oficial_individual_energia' || formData.ligacaoEnergia === 'oficial_compartilhada_energia') && (
                <div className="mt-4">
                  <Label htmlFor="valorEnergia">Valor (R$)</Label>
                  <Input
                    id="valorEnergia"
                    value={formData.valorEnergia}
                    onChange={(e) => handleInputChange('valorEnergia', e.target.value)}
                    placeholder="0,00"
                  />
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Informações da Comunidade */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <MapPin className="h-5 w-5" />
              <span>Informações da Comunidade</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <Label>Cite o equipamento de maior uso no bairro:</Label>
              <RadioGroup
                value={formData.equipamentoMaiorUso}
                onValueChange={(value) => handleInputChange('equipamentoMaiorUso', value)}
                className="grid grid-cols-2 md:grid-cols-3 gap-4 mt-2"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="escola" id="escola" />
                  <Label htmlFor="escola">Escola</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="posto_saude" id="posto_saude" />
                  <Label htmlFor="posto_saude">Posto de Saúde</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="pracas_parques" id="pracas_parques" />
                  <Label htmlFor="pracas_parques">Praças/Parques</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="cras_creas" id="cras_creas" />
                  <Label htmlFor="cras_creas">CRAS/CREAS</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="associacoes" id="associacoes" />
                  <Label htmlFor="associacoes">Associações</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="nenhum_equipamento" id="nenhum_equipamento" />
                  <Label htmlFor="nenhum_equipamento">Nenhum</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="outro_equipamento" id="outro_equipamento" />
                  <Label htmlFor="outro_equipamento">Outro</Label>
                </div>
              </RadioGroup>
            </div>

            <div>
              <Label>Cite o maior problema do bairro:</Label>
              <RadioGroup
                value={formData.maiorProblema}
                onValueChange={(value) => handleInputChange('maiorProblema', value)}
                className="grid grid-cols-2 md:grid-cols-3 gap-4 mt-2"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="asfalto" id="asfalto" />
                  <Label htmlFor="asfalto">Asfalto</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="iluminacao_publica" id="iluminacao_publica" />
                  <Label htmlFor="iluminacao_publica">Iluminação Pública</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="coleta_lixo" id="coleta_lixo" />
                  <Label htmlFor="coleta_lixo">Coleta de Lixo</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="posto_saude_problema" id="posto_saude_problema" />
                  <Label htmlFor="posto_saude_problema">Posto de Saúde</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="escola_problema" id="escola_problema" />
                  <Label htmlFor="escola_problema">Escola</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="nenhum_problema" id="nenhum_problema" />
                  <Label htmlFor="nenhum_problema">Nenhum</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="outro_problema" id="outro_problema" />
                  <Label htmlFor="outro_problema">Outro</Label>
                </div>
              </RadioGroup>
            </div>
          </CardContent>
        </Card>

        {/* Observações */}
        <Card>
          <CardHeader>
            <CardTitle>Observações</CardTitle>
          </CardHeader>
          <CardContent>
            <Textarea
              value={formData.observacoes}
              onChange={(e) => handleInputChange('observacoes', e.target.value)}
              placeholder="Digite observações adicionais..."
              rows={4}
            />
          </CardContent>
        </Card>

        {/* Botões de Ação */}
        <div className="flex justify-between">
          <Button type="button" variant="outline">
            Salvar Rascunho
          </Button>
          <Button type="submit" variant="government" size="lg">
            Avançar para Composição Familiar
          </Button>
        </div>
      </form>
    </div>
  );
};