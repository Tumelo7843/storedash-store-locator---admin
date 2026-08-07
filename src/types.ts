export interface UserProfile {
  id?: number;
  uid: string;
  email: string;
  name?: string;
  role?: string;
  avatarUrl?: string;
}

export interface Store {
  id: number;
  name: string;
  category: string;
  address: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  phone: string;
  managerName: string;
  status: 'Active' | 'Inactive';
  rating: string;
  reviewCount: number;
  imageUrl?: string;
  bannerUrl?: string;
  lat: string;
  lng: string;
  operatingHours?: string;
  website?: string;
}

export interface Product {
  id: number;
  storeId?: number;
  name: string;
  sku: string;
  category: string;
  brand: string;
  price: string;
  stock: number;
  status: 'In Stock' | 'Low Stock' | 'Out of Stock';
  imageUrl: string;
  description?: string;
  unit?: string;
}

export interface CartItem {
  product: Product;
  quantity: number;
}

export interface DashboardMetrics {
  totalRevenue: string;
  totalRevenueValue: number;
  revenueChange: string;
  activeStores: number;
  activeStoresChange: string;
  totalProducts: number;
  totalProductsChange: string;
  newOrdersToday: number;
  newOrdersChange: string;
  sales30Days: string;
  sales30DaysChange: string;
  salesChart: Array<{ label: string; sales: number }>;
  topStores: Array<{
    id: number;
    name: string;
    category: string;
    revenue: number;
    imageUrl?: string;
  }>;
}
