import { useState } from "react";
import { LoginForm } from "@/components/auth/LoginForm";
import { Header } from "@/components/Header";
import { Dashboard } from "@/components/Dashboard";

interface User {
  email: string;
  role: 'admin' | 'social_worker' | 'citizen';
  name: string;
}

const Index = () => {
  const [user, setUser] = useState<User | null>(null);
  const [currentPage, setCurrentPage] = useState('dashboard');

  const handleLogin = (credentials: { email: string; password: string; role: string }) => {
    // Simulate login - in real app, this would make an API call
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
      case 'new-registration':
        return <div className="container mx-auto px-4 py-8">
          <h1 className="text-3xl font-bold mb-6">Novo Cadastro Social</h1>
          <p className="text-muted-foreground">Funcionalidade em desenvolvimento...</p>
        </div>;
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