import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { User as SupabaseUser, Session } from "@supabase/supabase-js";
import { Header } from "@/components/Header";
import { DashboardWrapper } from "@/components/DashboardWrapper";
import { SocialRegistrationForm } from "@/components/forms/SocialRegistrationForm";
import { FamilyCompositionForm } from "@/components/forms/FamilyCompositionForm";
import { DocumentUploadForm } from "@/components/forms/DocumentUploadForm";
import { TermsAgreementForm } from "@/components/forms/TermsAgreementForm";
import { MyDataPage } from "@/components/MyDataPage";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";

interface UserProfile {
  id: string;
  user_id: string;
  full_name: string;
  email: string;
  role: 'admin' | 'social_worker' | 'citizen';
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
  const navigate = useNavigate();
  const [user, setUser] = useState<SupabaseUser | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState('dashboard');
  const [formData, setFormData] = useState<FormDataState>({
    socialRegistration: null,
    familyComposition: null,
    documents: null,
    signature: null
  });

  useEffect(() => {
    let mounted = true;

    // Check for existing session first
    const checkSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!mounted) return;
        
        setSession(session);
        setUser(session?.user ?? null);
        
        if (session?.user) {
          await fetchUserProfile(session.user.id);
        } else {
          setLoading(false);
        }
      } catch (error) {
        console.error('Error checking session:', error);
        if (mounted) {
          setLoading(false);
        }
      }
    };

    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (!mounted) return;
        
        setSession(session);
        setUser(session?.user ?? null);
        
        if (session?.user) {
          // Use setTimeout to avoid blocking auth state change
          setTimeout(() => {
            if (mounted) {
              fetchUserProfile(session.user.id);
            }
          }, 0);
        } else {
          setUserProfile(null);
          setLoading(false);
        }
      }
    );

    checkSession();

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const fetchUserProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle();

      if (error) {
        console.error('Error fetching profile:', error);
        toast.error('Erro ao carregar perfil do usuário');
        return;
      }

      if (data) {
        setUserProfile({
          id: data.id,
          user_id: data.user_id,
          full_name: data.full_name || data.email || 'Usuário',
          email: data.email || '',
          role: (data.role as 'admin' | 'social_worker' | 'citizen') || 'citizen'
        });
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      toast.success('Logout realizado com sucesso!');
      navigate('/auth');
    } catch (error) {
      console.error('Error signing out:', error);
      toast.error('Erro ao fazer logout');
    }
  };

  const handleNavigate = (page: string) => {
    setCurrentPage(page);
  };

  const renderCurrentPage = () => {
    if (!userProfile) return null;

    switch (currentPage) {
      case 'dashboard-legacy':
        return <div>Dashboard Legacy</div>;
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
            // Se foi acessado individualmente, volta para dashboard
            // Se foi do fluxo completo, avança para terms
            if (formData.socialRegistration && formData.familyComposition) {
              setCurrentPage('terms');
            } else {
              alert('Documentos salvos com sucesso!');
              setCurrentPage('dashboard');
            }
          }}
          onBack={() => {
            // Se veio do fluxo completo, volta para family-composition-flow
            // Se veio individualmente, volta para dashboard
            if (formData.socialRegistration && formData.familyComposition) {
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
          onBack={() => {
            // Se veio do fluxo completo, volta para documents
            // Se veio individualmente, volta para dashboard
            if (formData.socialRegistration && formData.familyComposition && formData.documents) {
              setCurrentPage('documents');
            } else {
              setCurrentPage('dashboard');
            }
          }}
        />;
      case 'my-data':
        return <MyDataPage 
          userProfile={userProfile}
          onBack={() => setCurrentPage('dashboard')}
          onNavigate={handleNavigate}
        />;
      case 'dashboard':
      default:
        return (
          <DashboardWrapper 
            userRole={userProfile.role || 'citizen'} 
            userName={userProfile.full_name || 'Usuário'} 
            onNavigate={handleNavigate}
            userProfile={userProfile}
          />
        );
    }
  };

  // Show loading while checking auth
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <img 
                src="/src/assets/itapecerica-logo.png" 
                alt="Itapecerica da Serra" 
                className="h-16 w-auto"
              />
            </div>
            <CardTitle>HabitaFácil</CardTitle>
            <CardDescription>Carregando...</CardDescription>
          </CardHeader>
          <CardContent className="flex justify-center">
            <Loader2 className="h-6 w-6 animate-spin" />
          </CardContent>
        </Card>
      </div>
    );
  }

  // Redirect to auth if not logged in
  if (!user) {
    navigate('/auth');
    return null;
  }

  // Show loading if user exists but profile is still loading
  if (!userProfile) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <img 
                src="/src/assets/itapecerica-logo.png" 
                alt="Itapecerica da Serra" 
                className="h-16 w-auto"
              />
            </div>
            <CardTitle>HabitaFácil</CardTitle>
            <CardDescription>Carregando perfil...</CardDescription>
          </CardHeader>
          <CardContent className="flex justify-center">
            <Loader2 className="h-6 w-6 animate-spin" />
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header 
        userRole={userProfile.role} 
        userName={userProfile.full_name} 
        onLogout={handleLogout}
        onNavigate={handleNavigate}
      />
      {renderCurrentPage()}
    </div>
  );
};

export default Index;