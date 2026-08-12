import type { ReactNode } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import { AdminLayout } from './components/AdminLayout';
import { Spinner } from './components/ui/States';
import { AuthProvider, useAuth } from './context/AuthContext';
import { StoreProvider } from './context/StoreContext';
import { ThemeProvider } from './context/ThemeContext';
import { AdminsPage } from './pages/AdminsPage';
import { ApplicationsPage } from './pages/ApplicationsPage';
import { ApprovalsPage } from './pages/ApprovalsPage';
import { DashboardPage } from './pages/DashboardPage';
import { ForgotPasswordPage } from './pages/ForgotPasswordPage';
import { LoginPage } from './pages/LoginPage';
import { NewStorePage } from './pages/NewStorePage';
import { OrderDetailPage } from './pages/OrderDetailPage';
import { OrdersPage } from './pages/OrdersPage';
import { ProductsPage } from './pages/ProductsPage';
import { ServicesPage } from './pages/ServicesPage';
import { SettingsPage } from './pages/SettingsPage';
import { StoreOwnersPage } from './pages/StoreOwnersPage';
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

// Frontend gate for UX only (hides the nav item / redirects) — the backend
// independently rejects every request on these pages' endpoints with 403 for
// anyone whose role isn't super_admin, regardless of what this component does.
function RequireSuperAdmin({ children }: { children: ReactNode }) {
  const { profile } = useAuth();
  if (profile?.role !== 'super_admin') return <Navigate to="/" replace />;
  return <>{children}</>;
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/forgot-password" element={<ForgotPasswordPage />} />
      <Route path="/" element={<RequireAuth><DashboardPage /></RequireAuth>} />
      <Route path="/products" element={<RequireAuth><ProductsPage /></RequireAuth>} />
      <Route path="/services" element={<RequireAuth><ServicesPage /></RequireAuth>} />
      <Route path="/orders" element={<RequireAuth><OrdersPage /></RequireAuth>} />
      <Route path="/orders/:id" element={<RequireAuth><OrderDetailPage /></RequireAuth>} />
      <Route path="/store-settings" element={<RequireAuth><StoreSettingsPage /></RequireAuth>} />
      <Route path="/admins" element={<RequireAuth><AdminsPage /></RequireAuth>} />
      <Route path="/stores/new" element={<RequireAuth><NewStorePage /></RequireAuth>} />
      <Route
        path="/approvals"
        element={
          <RequireAuth>
            <RequireSuperAdmin>
              <ApprovalsPage />
            </RequireSuperAdmin>
          </RequireAuth>
        }
      />
      <Route
        path="/applications"
        element={
          <RequireAuth>
            <RequireSuperAdmin>
              <ApplicationsPage />
            </RequireSuperAdmin>
          </RequireAuth>
        }
      />
      <Route
        path="/store-owners"
        element={
          <RequireAuth>
            <RequireSuperAdmin>
              <StoreOwnersPage />
            </RequireSuperAdmin>
          </RequireAuth>
        }
      />
      <Route path="/settings" element={<RequireAuth><SettingsPage /></RequireAuth>} />
    </Routes>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </ThemeProvider>
  );
}
