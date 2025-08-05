import React from 'react';
import { Dashboard } from './Dashboard';
import AdminDashboard from './AdminDashboard';
import SocialWorkerDashboard from './SocialWorkerDashboard';

interface UserProfile {
  id: string;
  full_name: string | null;
  email: string | null;
  role: string | null;
}

interface DashboardWrapperProps {
  userRole: string;
  userName: string;
  onNavigate: (page: string) => void;
  userProfile: UserProfile;
}

export const DashboardWrapper: React.FC<DashboardWrapperProps> = ({ 
  userRole, 
  userName, 
  onNavigate, 
  userProfile 
}) => {
  // For admin and social_worker roles, use dedicated dashboard components
  if (userRole === 'admin') {
    return (
      <AdminDashboard 
        userProfile={userProfile} 
        onNavigate={onNavigate} 
      />
    );
  }

  if (userRole === 'social_worker') {
    return (
      <SocialWorkerDashboard 
        userProfile={userProfile} 
        onNavigate={onNavigate} 
      />
    );
  }

  // For citizens, use the original dashboard
  return (
    <Dashboard 
      userRole={userRole as 'citizen'} 
      userName={userName} 
      onNavigate={onNavigate} 
    />
  );
};