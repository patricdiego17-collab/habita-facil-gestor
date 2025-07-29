import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { FileCheck, AlertTriangle, Pen, Calendar } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface TermsAgreementFormProps {
  onFinish: (signature: { name: string; cpf: string; date: string; ip: string }) => void;
  onBack: () => void;
}

export const TermsAgreementForm = ({ onFinish, onBack }: TermsAgreementFormProps) => {
  const { toast } = useToast();
  const [agreementChecked, setAgreementChecked] = useState(false);
  const [responsibilityChecked, setResponsibilityChecked] = useState(false);
  const [signatureName, setSignatureName] = useState("");
  const [signatureCpf, setSignatureCpf] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!agreementChecked || !responsibilityChecked) {
      toast({
        title: "Aceite obrigatório",
        description: "Você deve concordar com todos os termos para prosseguir.",
        variant: "destructive",
      });
      return;
    }

    if (!signatureName.trim() || !signatureCpf.trim()) {
      toast({
        title: "Assinatura obrigatória",
        description: "Por favor, informe seu nome completo e CPF para assinar digitalmente.",
        variant: "destructive",
      });
      return;
    }

    // Validação básica de CPF
    const cpfRegex = /^\d{3}\.\d{3}\.\d{3}-\d{2}$/;
    if (!cpfRegex.test(signatureCpf)) {
      toast({
        title: "CPF inválido",
        description: "Por favor, digite o CPF no formato 000.000.000-00",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      // Simular processamento
      await new Promise(resolve => setTimeout(resolve, 2000));

      const signature = {
        name: signatureName,
        cpf: signatureCpf,
        date: new Date().toISOString(),
        ip: '192.168.1.1' // Em uma aplicação real, seria obtido do servidor
      };

      onFinish(signature);

      toast({
        title: "Cadastro finalizado com sucesso!",
        description: "Seu cadastro foi enviado e está em análise.",
      });
    } catch (error) {
      toast({
        title: "Erro ao finalizar cadastro",
        description: "Ocorreu um erro. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="mb-8 text-center">
        <h1 className="text-2xl font-bold text-primary mb-2">Termo de Concordância</h1>
        <p className="text-muted-foreground">
          Leia atentamente e aceite os termos para finalizar seu cadastro
        </p>
      </div>

      {/* Cabeçalho Oficial */}
      <Card className="mb-6">
        <CardHeader className="text-center">
          <CardTitle className="text-lg">
            PREFEITURA DO MUNICÍPIO DE ITAPECERICA DA SERRA<br />
            SECRETARIA MUNICIPAL DE HABITAÇÃO E DESENVOLVIMENTO URBANO<br />
            DEPARTAMENTO DE PROJETOS HABITACIONAIS
          </CardTitle>
        </CardHeader>
      </Card>

      {/* Termo de Concordância */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <FileCheck className="h-5 w-5" />
            <span>TERMO DE CONCORDÂNCIA E RESPONSABILIDADE</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-96 w-full border rounded-md p-4">
            <div className="space-y-4 text-sm leading-relaxed">
              <p className="font-semibold text-center">
                TERMO DE CONCORDÂNCIA PARA CADASTRO HABITACIONAL
              </p>

              <Separator />

              <div>
                <p className="font-semibold mb-2">1. FINALIDADE DO CADASTRO</p>
                <p className="text-justify">
                  O presente cadastro tem por finalidade identificar e caracterizar a situação socioeconômica 
                  e habitacional das famílias interessadas em participar dos programas habitacionais promovidos 
                  pela Prefeitura Municipal de Itapecerica da Serra, através da Secretaria Municipal de Habitação 
                  e Desenvolvimento Urbano.
                </p>
              </div>

              <div>
                <p className="font-semibold mb-2">2. VERACIDADE DAS INFORMAÇÕES</p>
                <p className="text-justify">
                  Declaro que todas as informações prestadas neste cadastro são verdadeiras e assumo total 
                  responsabilidade pela veracidade dos dados informados, documentos apresentados e fotos fornecidas. 
                  Estou ciente de que a prestação de informações falsas ou a apresentação de documentos inidôneos 
                  constitui crime previsto no Código Penal Brasileiro (artigo 299) e pode resultar na exclusão 
                  automática do cadastro e dos programas habitacionais.
                </p>
              </div>

              <div>
                <p className="font-semibold mb-2">3. AUTORIZAÇÃO DE VERIFICAÇÃO</p>
                <p className="text-justify">
                  Autorizo a Prefeitura Municipal de Itapecerica da Serra a verificar e confirmar todas as 
                  informações prestadas através de visitas domiciliares, consultas a órgãos públicos, 
                  instituições financeiras e demais fontes necessárias para a comprovação dos dados declarados.
                </p>
              </div>

              <div>
                <p className="font-semibold mb-2">4. COMPROMISSOS E OBRIGAÇÕES</p>
                <p className="text-justify">
                  Comprometo-me a:
                </p>
                <ul className="list-disc list-inside space-y-1 mt-2">
                  <li>Manter atualizadas todas as informações do cadastro;</li>
                  <li>Comunicar imediatamente qualquer mudança na situação familiar, profissional ou habitacional;</li>
                  <li>Comparecer quando convocado para entrevistas, visitas ou complementação de documentos;</li>
                  <li>Aceitar as condições e critérios estabelecidos pelos programas habitacionais;</li>
                  <li>Utilizar o imóvel exclusivamente para fins habitacionais;</li>
                  <li>Não transferir, vender, alugar ou ceder o imóvel a terceiros, caso seja contemplado.</li>
                </ul>
              </div>

              <div>
                <p className="font-semibold mb-2">5. CRITÉRIOS DE SELEÇÃO</p>
                <p className="text-justify">
                  Declaro estar ciente de que o cadastramento não garante o atendimento habitacional, 
                  que dependerá da disponibilidade de recursos, da análise da situação socioeconômica 
                  e do cumprimento dos critérios estabelecidos pelos programas habitacionais vigentes.
                </p>
              </div>

              <div>
                <p className="font-semibold mb-2">6. PROTEÇÃO DE DADOS</p>
                <p className="text-justify">
                  Autorizo o uso dos meus dados pessoais e familiares para os fins específicos dos programas 
                  habitacionais, conforme a Lei Geral de Proteção de Dados (LGPD - Lei nº 13.709/2018). 
                  Os dados serão tratados com confidencialidade e utilizados exclusivamente para as 
                  finalidades relacionadas aos programas habitacionais municipais.
                </p>
              </div>

              <div>
                <p className="font-semibold mb-2">7. VIGÊNCIA</p>
                <p className="text-justify">
                  Este cadastro terá validade de 2 (dois) anos a partir da data de sua realização, 
                  podendo ser renovado mediante solicitação e atualização das informações.
                </p>
              </div>

              <div>
                <p className="font-semibold mb-2">8. PENALIDADES</p>
                <p className="text-justify">
                  O descumprimento das obrigações assumidas neste termo ou a prestação de informações 
                  falsas resultará na exclusão do cadastro e impossibilidade de participação nos 
                  programas habitacionais pelo prazo de 5 (cinco) anos.
                </p>
              </div>

              <Separator />

              <p className="text-justify">
                Declaro que li, compreendi e concordo com todos os termos acima descritos, 
                assumindo integralmente as responsabilidades e compromissos estabelecidos.
              </p>
            </div>
          </ScrollArea>
        </CardContent>
      </Card>

      {/* Checkboxes de Concordância */}
      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="space-y-4">
            <div className="flex items-start space-x-3">
              <Checkbox 
                id="agreement" 
                checked={agreementChecked}
                onCheckedChange={(checked) => setAgreementChecked(checked === true)}
                className="mt-1"
              />
              <Label htmlFor="agreement" className="text-sm leading-5">
                <strong>Li e concordo com todos os termos</strong> descritos no Termo de Concordância 
                e Responsabilidade para Cadastro Habitacional da Prefeitura Municipal de Itapecerica da Serra.
              </Label>
            </div>

            <div className="flex items-start space-x-3">
              <Checkbox 
                id="responsibility" 
                checked={responsibilityChecked}
                onCheckedChange={(checked) => setResponsibilityChecked(checked === true)}
                className="mt-1"
              />
              <Label htmlFor="responsibility" className="text-sm leading-5">
                <strong>Declaro que todas as informações prestadas são verdadeiras</strong> e assumo 
                total responsabilidade pela veracidade dos dados informados, documentos apresentados 
                e fotos fornecidas, estando ciente das penalidades legais cabíveis.
              </Label>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Assinatura Digital */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Pen className="h-5 w-5" />
            <span>Assinatura Digital</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="signatureName">Nome Completo *</Label>
              <Input
                id="signatureName"
                value={signatureName}
                onChange={(e) => setSignatureName(e.target.value)}
                placeholder="Digite seu nome completo"
                required
              />
            </div>
            <div>
              <Label htmlFor="signatureCpf">CPF *</Label>
              <Input
                id="signatureCpf"
                value={signatureCpf}
                onChange={(e) => setSignatureCpf(e.target.value)}
                placeholder="000.000.000-00"
                maxLength={14}
                required
              />
            </div>
          </div>

          <div className="flex items-center space-x-2 text-sm text-muted-foreground">
            <Calendar className="h-4 w-4" />
            <span>Data e hora da assinatura: {new Date().toLocaleString('pt-BR')}</span>
          </div>

          <div className="p-4 bg-warning-light border border-warning rounded-lg">
            <div className="flex items-start space-x-3">
              <AlertTriangle className="h-5 w-5 text-warning mt-0.5" />
              <div>
                <p className="font-medium text-warning">Atenção</p>
                <p className="text-sm text-muted-foreground">
                  Ao assinar digitalmente, você confirma que todas as informações prestadas são 
                  verdadeiras e aceita os termos e condições do programa habitacional.
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Botões de Ação */}
      <div className="flex justify-between">
        <Button type="button" variant="outline" onClick={onBack}>
          Voltar para Documentos
        </Button>
        <Button 
          onClick={handleSubmit} 
          variant="government" 
          size="lg"
          disabled={!agreementChecked || !responsibilityChecked || isSubmitting}
        >
          {isSubmitting ? "Finalizando Cadastro..." : "Finalizar Cadastro"}
        </Button>
      </div>
    </div>
  );
};