import { useState } from "react";
import { LoginForm } from "@/components/auth/LoginForm";
import { Header } from "@/components/Header";
import { Dashboard } from "@/components/Dashboard";
import { SocialRegistrationForm } from "@/components/forms/SocialRegistrationForm";
import { FamilyCompositionForm } from "@/components/forms/FamilyCompositionForm";
import { DocumentUploadForm } from "@/components/forms/DocumentUploadForm";
import { TermsAgreementForm } from "@/components/forms/TermsAgreementForm";

interface User {
  email: string;
  role: 'admin' | 'social_worker' | 'citizen';
  name: string;
}

interface FormDataState {
  socialRegistration: {
    cpf1: string;
    [key: string]: any;
  } | null;
  familyComposition: any[] | null;
  documents: any | null;
  signature: any | null;
}

const Index = () => {
  const [user, setUser] = useState<User | null>(null);
  const [currentPage, setCurrentPage] = useState('dashboard');
  const [formData, setFormData] = useState<FormDataState>({
    socialRegistration: null,
    familyComposition: null,
    documents: null,
    signature: null
  });

  const handleLogin = (credentials: { email: string; password: string; role: string }) => {
    const userData: User = {
      email: credentials.email,
      role: credentials.role as 'admin' | 'social_worker' | 'citizen',
      name: getNameFromEmail(credentials.email)
    };
    
    setUser(userData);
    setCurrentPage('dashboard');
  };

  const handleLogout = () => {
    setUser(null);
    setCurrentPage('dashboard');
  };

  const handleNavigate = (page: string) => {
    setCurrentPage(page);
  };

  const getNameFromEmail = (email: string) => {
    // Simple name extraction from email for demo
    const namePart = email.split('@')[0];
    return namePart.charAt(0).toUpperCase() + namePart.slice(1);
  };

  const renderCurrentPage = () => {
    if (!user) return null;

    switch (currentPage) {
      case 'dashboard':
        return <Dashboard userRole={user.role} userName={user.name} onNavigate={handleNavigate} />;
      case 'social-registration':
        return <SocialRegistrationForm 
          onNext={(data) => {
            setFormData(prev => ({ ...prev, socialRegistration: data }));
            setCurrentPage('dashboard');
          }}
          onBack={() => setCurrentPage('dashboard')}
        />;
      case 'family-composition':
        return <FamilyCompositionForm 
          onNext={(data) => {
            // Verificar se há cadastro social vinculado
            if (!formData.socialRegistration?.cpf1) {
              alert('É necessário preencher o Cadastro Social primeiro.');
              setCurrentPage('social-registration');
              return;
            }
            setFormData(prev => ({ ...prev, familyComposition: data }));
            setCurrentPage('dashboard');
          }}
          onBack={() => setCurrentPage('dashboard')}
        />;
      case 'new-registration':
        return <SocialRegistrationForm 
          onNext={(data) => {
            setFormData(prev => ({ ...prev, socialRegistration: data }));
            setCurrentPage('family-composition-flow');
          }}
          onBack={() => setCurrentPage('dashboard')}
        />;
      case 'family-composition-flow':
        return <FamilyCompositionForm 
          onNext={(data) => {
            setFormData(prev => ({ ...prev, familyComposition: data }));
            setCurrentPage('documents');
          }}
          onBack={() => setCurrentPage('new-registration')}
        />;
      case 'documents':
        return <DocumentUploadForm 
          onNext={(data) => {
            setFormData(prev => ({ ...prev, documents: data }));
            setCurrentPage('terms');
          }}
          onBack={() => {
            // Se veio do fluxo completo, volta para family-composition-flow
            // Se veio individualmente, volta para dashboard
            if (formData.familyComposition) {
              setCurrentPage('family-composition-flow');
            } else {
              setCurrentPage('dashboard');
            }
          }}
        />;
      case 'terms':
        return <TermsAgreementForm 
          onFinish={(signature) => {
            setFormData(prev => ({ ...prev, signature }));
            // Salvar cadastro completo
            console.log('Cadastro completo:', { ...formData, signature });
            if (formData.socialRegistration?.cpf1) {
              alert(`Cadastro finalizado com sucesso para CPF: ${formData.socialRegistration.cpf1}`);
            } else {
              alert('Termo assinado com sucesso!');
            }
            setCurrentPage('dashboard');
          }}
          onBack={() => setCurrentPage('documents')}
        />;
      default:
        return <div className="container mx-auto px-4 py-8">
          <h1 className="text-3xl font-bold mb-6">Página em Desenvolvimento</h1>
          <p className="text-muted-foreground">Esta funcionalidade será implementada em breve.</p>
        </div>;
    }
  };

  if (!user) {
    return <LoginForm onLogin={handleLogin} />;
  }

  return (
    <div className="min-h-screen bg-background">
      <Header 
        userRole={user.role} 
        userName={user.name} 
        onLogout={handleLogout} 
      />
      {renderCurrentPage()}
    </div>
  );
};

export default Index;