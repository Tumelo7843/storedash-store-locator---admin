import { Route, Routes } from 'react-router-dom';
import { Layout } from './components/Layout';
import { AuthProvider } from './context/AuthContext';
import { CartProvider } from './context/CartContext';
import { AccountPage } from './pages/AccountPage';
import { CartPage } from './pages/CartPage';
import { HomePage } from './pages/HomePage';
import { OrderDetailPage } from './pages/OrderDetailPage';
import { OrdersPage } from './pages/OrdersPage';
import { StorePage } from './pages/StorePage';

export default function App() {
  return (
    <AuthProvider>
      <CartProvider>
        <Layout>
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/stores/:id" element={<StorePage />} />
            <Route path="/cart" element={<CartPage />} />
            <Route path="/orders" element={<OrdersPage />} />
            <Route path="/orders/:id" element={<OrderDetailPage />} />
            <Route path="/account" element={<AccountPage />} />
          </Routes>
        </Layout>
      </CartProvider>
    </AuthProvider>
  );
}
