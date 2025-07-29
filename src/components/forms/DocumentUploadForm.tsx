import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Upload, FileText, Image, CheckCircle, X, AlertTriangle, Camera } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface UploadedFile {
  id: string;
  name: string;
  type: string;
  size: number;
  category: string;
  status: 'uploading' | 'success' | 'error';
  progress: number;
  url?: string;
}

interface DocumentUploadFormProps {
  onNext: (files: UploadedFile[]) => void;
  onBack: () => void;
  initialFiles?: UploadedFile[];
}

const documentCategories = [
  { id: 'rg', name: 'RG do Responsável', required: true },
  { id: 'cpf', name: 'CPF do Responsável', required: true },
  { id: 'comprovante_residencia', name: 'Comprovante de Residência', required: true },
  { id: 'rg_conjuge', name: 'RG do Cônjuge', required: false },
  { id: 'certidao_nascimento', name: 'Certidão de Nascimento dos Filhos', required: false },
  { id: 'comprovante_renda', name: 'Comprovante de Renda', required: false },
  { id: 'carteira_trabalho', name: 'Carteira de Trabalho', required: false },
  { id: 'titulo_eleitor', name: 'Título de Eleitor', required: false },
  { id: 'cartao_sus', name: 'Cartão do SUS', required: false },
  { id: 'certidao_casamento', name: 'Certidão de Casamento', required: false },
  { id: 'documentos_imovel', name: 'Documentos do Imóvel', required: false },
  { id: 'fotos_residencia', name: 'Fotos da Residência', required: true },
  { id: 'outros', name: 'Outros Documentos', required: false }
];

export const DocumentUploadForm = ({ onNext, onBack, initialFiles = [] }: DocumentUploadFormProps) => {
  const { toast } = useToast();
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>(initialFiles);
  const [selectedCategory, setSelectedCategory] = useState('rg');

  const handleFileUpload = (files: FileList | null, category: string) => {
    if (!files) return;

    Array.from(files).forEach((file) => {
      // Validar tipo de arquivo
      const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg', 'application/pdf'];
      if (!allowedTypes.includes(file.type)) {
        toast({
          title: "Tipo de arquivo não permitido",
          description: "Apenas imagens (JPG, PNG) e PDFs são aceitos.",
          variant: "destructive",
        });
        return;
      }

      // Validar tamanho (5MB max)
      if (file.size > 5 * 1024 * 1024) {
        toast({
          title: "Arquivo muito grande",
          description: "O arquivo deve ter no máximo 5MB.",
          variant: "destructive",
        });
        return;
      }

      const newFile: UploadedFile = {
        id: Date.now().toString() + Math.random().toString(36),
        name: file.name,
        type: file.type,
        size: file.size,
        category,
        status: 'uploading',
        progress: 0
      };

      setUploadedFiles(prev => [...prev, newFile]);

      // Simular upload
      simulateUpload(newFile.id);
    });
  };

  const simulateUpload = (fileId: string) => {
    const interval = setInterval(() => {
      setUploadedFiles(prev => prev.map(file => {
        if (file.id === fileId) {
          const newProgress = Math.min(file.progress + Math.random() * 20, 100);
          
          if (newProgress >= 100) {
            clearInterval(interval);
            return {
              ...file,
              progress: 100,
              status: 'success',
              url: `#uploaded-${fileId}`
            };
          }
          
          return { ...file, progress: newProgress };
        }
        return file;
      }));
    }, 200);
  };

  const handleDeleteFile = (fileId: string) => {
    setUploadedFiles(prev => prev.filter(file => file.id !== fileId));
    
    toast({
      title: "Arquivo removido",
      description: "O arquivo foi removido da lista.",
    });
  };

  const getFilesByCategory = (categoryId: string) => {
    return uploadedFiles.filter(file => file.category === categoryId);
  };

  const getRequiredDocumentsStatus = () => {
    const requiredCategories = documentCategories.filter(cat => cat.required);
    const uploadedCategories = [...new Set(uploadedFiles.filter(f => f.status === 'success').map(f => f.category))];
    
    return {
      total: requiredCategories.length,
      completed: requiredCategories.filter(cat => uploadedCategories.includes(cat.id)).length
    };
  };

  const handleSubmit = () => {
    const requiredStatus = getRequiredDocumentsStatus();
    
    if (requiredStatus.completed < requiredStatus.total) {
      toast({
        title: "Documentos obrigatórios pendentes",
        description: `Você precisa enviar ${requiredStatus.total - requiredStatus.completed} documento(s) obrigatório(s).`,
        variant: "destructive",
      });
      return;
    }

    const hasFailedUploads = uploadedFiles.some(file => file.status === 'error');
    if (hasFailedUploads) {
      toast({
        title: "Arquivos com erro",
        description: "Remova os arquivos com erro antes de continuar.",
        variant: "destructive",
      });
      return;
    }

    const hasUploading = uploadedFiles.some(file => file.status === 'uploading');
    if (hasUploading) {
      toast({
        title: "Upload em andamento",
        description: "Aguarde o término do upload de todos os arquivos.",
        variant: "destructive",
      });
      return;
    }

    onNext(uploadedFiles);
    toast({
      title: "Documentos enviados com sucesso",
      description: "Avançando para o termo de concordância...",
    });
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const requiredStatus = getRequiredDocumentsStatus();

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="mb-8 text-center">
        <h1 className="text-2xl font-bold text-primary mb-2">Upload de Documentos e Fotos</h1>
        <p className="text-muted-foreground">
          Envie os documentos necessários e fotos da residência
        </p>
      </div>

      {/* Status dos Documentos Obrigatórios */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Status dos Documentos</span>
            <Badge variant={requiredStatus.completed === requiredStatus.total ? "default" : "destructive"}>
              {requiredStatus.completed}/{requiredStatus.total} obrigatórios
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Progress 
            value={(requiredStatus.completed / requiredStatus.total) * 100} 
            className="mb-4"
          />
          <p className="text-sm text-muted-foreground">
            {requiredStatus.completed === requiredStatus.total 
              ? "Todos os documentos obrigatórios foram enviados!" 
              : `Você precisa enviar mais ${requiredStatus.total - requiredStatus.completed} documento(s) obrigatório(s).`
            }
          </p>
        </CardContent>
      </Card>

      {/* Upload por Categoria */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {documentCategories.map((category) => (
          <Card key={category.id} className="h-fit">
            <CardHeader>
              <CardTitle className="flex items-center justify-between text-lg">
                <span className="flex items-center space-x-2">
                  {category.id === 'fotos_residencia' ? (
                    <Camera className="h-5 w-5" />
                  ) : (
                    <FileText className="h-5 w-5" />
                  )}
                  <span>{category.name}</span>
                </span>
                {category.required && (
                  <Badge variant="destructive" className="text-xs">Obrigatório</Badge>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Área de Upload */}
              <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-4 text-center hover:border-primary/50 transition-colors">
                <Input
                  type="file"
                  multiple
                  accept={category.id === 'fotos_residencia' ? 'image/*' : 'image/*,application/pdf'}
                  onChange={(e) => handleFileUpload(e.target.files, category.id)}
                  className="hidden"
                  id={`upload-${category.id}`}
                />
                <Label 
                  htmlFor={`upload-${category.id}`} 
                  className="cursor-pointer flex flex-col items-center space-y-2"
                >
                  <Upload className="h-8 w-8 text-muted-foreground" />
                  <span className="text-sm font-medium">
                    Clique para selecionar arquivos
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {category.id === 'fotos_residencia' 
                      ? 'Apenas imagens (JPG, PNG)' 
                      : 'Imagens ou PDFs (max 5MB)'
                    }
                  </span>
                </Label>
              </div>

              {/* Lista de Arquivos */}
              <div className="space-y-2">
                {getFilesByCategory(category.id).map((file) => (
                  <div 
                    key={file.id} 
                    className="flex items-center space-x-3 p-3 bg-accent rounded-lg"
                  >
                    <div className="flex-shrink-0">
                      {file.type.startsWith('image/') ? (
                        <Image className="h-6 w-6 text-blue-500" />
                      ) : (
                        <FileText className="h-6 w-6 text-red-500" />
                      )}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{file.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {formatFileSize(file.size)}
                      </p>
                      
                      {file.status === 'uploading' && (
                        <Progress value={file.progress} className="h-1 mt-1" />
                      )}
                    </div>

                    <div className="flex items-center space-x-2">
                      {file.status === 'success' && (
                        <CheckCircle className="h-5 w-5 text-green-500" />
                      )}
                      {file.status === 'error' && (
                        <AlertTriangle className="h-5 w-5 text-red-500" />
                      )}
                      
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleDeleteFile(file.id)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>

              {getFilesByCategory(category.id).length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-2">
                  Nenhum arquivo enviado ainda
                </p>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Instruções */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Instruções Importantes</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-start space-x-3">
            <AlertTriangle className="h-5 w-5 text-warning mt-0.5" />
            <div>
              <p className="font-medium">Qualidade das Fotos</p>
              <p className="text-sm text-muted-foreground">
                As fotos da residência devem mostrar a fachada, interior e condições gerais do imóvel.
              </p>
            </div>
          </div>
          <div className="flex items-start space-x-3">
            <FileText className="h-5 w-5 text-primary mt-0.5" />
            <div>
              <p className="font-medium">Documentos Legíveis</p>
              <p className="text-sm text-muted-foreground">
                Certifique-se de que todos os documentos estão legíveis e bem iluminados.
              </p>
            </div>
          </div>
          <div className="flex items-start space-x-3">
            <Upload className="h-5 w-5 text-secondary mt-0.5" />
            <div>
              <p className="font-medium">Tamanho dos Arquivos</p>
              <p className="text-sm text-muted-foreground">
                Cada arquivo deve ter no máximo 5MB. Formatos aceitos: JPG, PNG, PDF.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Resumo */}
      {uploadedFiles.length > 0 && (
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Resumo dos Arquivos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center p-4 bg-primary-light rounded-lg">
                <div className="text-2xl font-bold text-primary">{uploadedFiles.length}</div>
                <div className="text-sm text-muted-foreground">Total de Arquivos</div>
              </div>
              <div className="text-center p-4 bg-success-light rounded-lg">
                <div className="text-2xl font-bold text-success">
                  {uploadedFiles.filter(f => f.status === 'success').length}
                </div>
                <div className="text-sm text-muted-foreground">Enviados com Sucesso</div>
              </div>
              <div className="text-center p-4 bg-warning-light rounded-lg">
                <div className="text-2xl font-bold text-warning">
                  {uploadedFiles.filter(f => f.status === 'uploading').length}
                </div>
                <div className="text-sm text-muted-foreground">Em Upload</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Botões de Ação */}
      <div className="flex justify-between mt-8">
        <Button type="button" variant="outline" onClick={onBack}>
          Voltar
        </Button>
        <div className="space-x-4">
          <Button type="button" variant="outline">
            Salvar Rascunho
          </Button>
          <Button 
            onClick={handleSubmit} 
            variant="government" 
            size="lg"
            disabled={requiredStatus.completed < requiredStatus.total}
          >
            Avançar para Termo de Concordância
          </Button>
        </div>
      </div>
    </div>
  );
};