import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './contexts/AuthContext';
import { AppLayout } from './components/layout/AppLayout';
import { LoginPage } from './pages/LoginPage';
import { DashboardPage } from './pages/DashboardPage';
import { CustomerListPage } from './pages/CustomerListPage';
import { InventoryPage } from './pages/InventoryPage';
import { ChallanBuilderPage } from './pages/ChallanBuilderPage';
import { ActivityLogsPage } from './pages/ActivityLogsPage';
import { NotificationsPage } from './pages/NotificationsPage';
import { ProtectedRoute } from './components/layout/ProtectedRoute';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

export const App: React.FC = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route element={<AppLayout />}>
              <Route element={<ProtectedRoute allowedRoles={['ADMIN', 'SALES', 'WAREHOUSE', 'ACCOUNTS']} />}>
                <Route path="/dashboard" element={<DashboardPage />} />
                <Route path="/challans" element={<ChallanBuilderPage />} />
                <Route path="/notifications" element={<NotificationsPage />} />
              </Route>
              
              <Route element={<ProtectedRoute allowedRoles={['ADMIN', 'SALES', 'ACCOUNTS']} />}>
                <Route path="/customers" element={<CustomerListPage />} />
              </Route>
              
              <Route element={<ProtectedRoute allowedRoles={['ADMIN', 'WAREHOUSE', 'SALES']} />}>
                <Route path="/inventory" element={<InventoryPage />} />
              </Route>
              
              <Route element={<ProtectedRoute allowedRoles={['ADMIN']} />}>
                <Route path="/activity" element={<ActivityLogsPage />} />
              </Route>

              <Route path="*" element={<Navigate to="/dashboard" replace />} />
            </Route>
          </Routes>
        </BrowserRouter>
        <Toaster position="top-right" toastOptions={{ className: 'dark:bg-slate-800 dark:text-white text-sm font-medium' }} />
      </AuthProvider>
    </QueryClientProvider>
  );
};
export default App;
