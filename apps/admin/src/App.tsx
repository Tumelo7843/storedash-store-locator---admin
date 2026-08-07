import type { ReactNode } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import { AdminLayout } from './components/AdminLayout';
import { Spinner } from './components/ui/States';
import { AuthProvider, useAuth } from './context/AuthContext';
import { StoreProvider } from './context/StoreContext';
import { AccountPage } from './pages/AccountPage';
import { AdminsPage } from './pages/AdminsPage';
import { DashboardPage } from './pages/DashboardPage';
import { LoginPage } from './pages/LoginPage';
import { NewStorePage } from './pages/NewStorePage';
import { OrderDetailPage } from './pages/OrderDetailPage';
import { OrdersPage } from './pages/OrdersPage';
import { ProductsPage } from './pages/ProductsPage';
import { ServicesPage } from './pages/ServicesPage';
import { StoreSettingsPage } from './pages/StoreSettingsPage';

function RequireAuth({ children }: { children: ReactNode }) {
  const { loading, isAuthorized } = useAuth();
  if (loading) return <Spinner label="Loading…" />;
  if (!isAuthorized) return <Navigate to="/login" replace />;
  return (
    <StoreProvider>
      <AdminLayout>{children}</AdminLayout>
    </StoreProvider>
  );
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/" element={<RequireAuth><DashboardPage /></RequireAuth>} />
      <Route path="/products" element={<RequireAuth><ProductsPage /></RequireAuth>} />
      <Route path="/services" element={<RequireAuth><ServicesPage /></RequireAuth>} />
      <Route path="/orders" element={<RequireAuth><OrdersPage /></RequireAuth>} />
      <Route path="/orders/:id" element={<RequireAuth><OrderDetailPage /></RequireAuth>} />
      <Route path="/store-settings" element={<RequireAuth><StoreSettingsPage /></RequireAuth>} />
      <Route path="/admins" element={<RequireAuth><AdminsPage /></RequireAuth>} />
      <Route path="/stores/new" element={<RequireAuth><NewStorePage /></RequireAuth>} />
      <Route path="/account" element={<RequireAuth><AccountPage /></RequireAuth>} />
    </Routes>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppRoutes />
    </AuthProvider>
  );
}
