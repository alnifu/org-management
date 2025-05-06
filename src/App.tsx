import '@mantine/core/styles.css';
import '@mantine/dates/styles.css';
import '@mantine/notifications/styles.css';

import { BrowserRouter as Router, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { MantineProvider, MantineThemeOverride } from '@mantine/core';
import { Notifications } from '@mantine/notifications';
import { AuthProvider } from './context/AuthContext';
import { AppShell } from './components/AppShell';
import { OrganizationsPage } from './pages/OrganizationsPage';
import { OrganizationFormPage } from './pages/OrganizationFormPage';
import { OrganizationTablePage } from './pages/OrganizationTablePage';
import { OrganizationViewPage } from './pages/OrganizationViewPage';
import { OfficersPage } from './pages/OfficersPage';
import { OfficerFormPage } from './pages/OfficerFormPage';
import { MembersPage } from './pages/MembersPage';
import { MemberFormPage } from './pages/MemberFormPage';
import { PostsPage } from './pages/PostsPage';
import { PostFormPage } from './pages/PostFormPage';
import Profile from './pages/Profile';
import Login from './pages/Login';
import { ProtectedRoute } from './components/ProtectedRoute';
import { TestLayoutPage } from './pages/TestLayoutPage';
import { ProfileSetupPage } from './pages/ProfileSetupPage';

// DLSU Green theme
const theme: MantineThemeOverride = {
  primaryColor: 'green',
  colors: {
    green: [
      '#E8F5E9',
      '#C8E6C9',
      '#A5D6A7',
      '#81C784',
      '#66BB6A',
      '#4CAF50', // Primary
      '#43A047',
      '#388E3C',
      '#2E7D32',
      '#1B5E20',
    ] as const,
  },
};

export default function App() {
  return (
    <MantineProvider theme={theme}>
      <Notifications />
      <AuthProvider>
        <Router>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/profile-setup" element={<ProfileSetupPage />} />
            
            <Route element={
              <ProtectedRoute>
                <AppShell>
                  <Outlet />
                </AppShell>
              </ProtectedRoute>
            }>
              <Route path="/" element={<Navigate to="/organizations" replace />} />
              <Route path="/organizations" element={<OrganizationsPage />} />
              <Route path="/organizations/table" element={<OrganizationTablePage />} />
              <Route path="/organizations/new" element={<OrganizationFormPage />} />
              <Route path="/organizations/:id" element={<OrganizationViewPage />} />
              <Route path="/organizations/:id/edit" element={<OrganizationFormPage />} />
              
              <Route element={<ProtectedRoute require_admin={true}><Outlet /></ProtectedRoute>}>
                <Route path="/officers" element={<OfficersPage />} />
                <Route path="/officers/new" element={<OfficerFormPage />} />
                <Route path="/officers/:id/edit" element={<OfficerFormPage />} />
                
                <Route path="/members" element={<MembersPage />} />
                <Route path="/members/new" element={<MemberFormPage />} />
                <Route path="/members/:id/edit" element={<MemberFormPage />} />
              </Route>
              
              <Route path="/posts" element={<PostsPage />} />
              <Route path="/posts/new" element={<PostFormPage />} />
              <Route path="/posts/:id/edit" element={<PostFormPage />} />

              <Route path="/profile" element={<Profile />} />
              
              <Route path="/test-layout" element={<TestLayoutPage />} />
            </Route>
          </Routes>
        </Router>
      </AuthProvider>
    </MantineProvider>
  );
}
