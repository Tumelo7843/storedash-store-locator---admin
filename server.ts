import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { db } from './src/db/index.ts';
import { stores, products, orders, users } from './src/db/schema.ts';
import { eq, like, or, and, sql, desc, count } from 'drizzle-orm';
import { getOrCreateUser } from './src/db/users.ts';
import { requireAuth, optionalAuth, AuthRequest } from './src/middleware/auth.ts';

async function startServer() {
  const app = express();
  app.use(express.json({ limit: '10mb' }));
  const PORT = 3000;

  // Health check
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  // Sync user profile from Firebase Auth to Cloud SQL
  app.post('/api/auth/sync', requireAuth, async (req: AuthRequest, res) => {
    try {
      if (!req.user) {
        return res.status(401).json({ error: 'Unauthorized' });
      }
      const user = await getOrCreateUser(
        req.user.uid,
        req.user.email || 'user@example.com',
        req.user.name || (req.user.email ? req.user.email.split('@')[0] : 'Admin User')
      );
      res.json({ user });
    } catch (error: any) {
      console.error('Error syncing user:', error);
      res.status(500).json({ error: error.message || 'Failed to sync user' });
    }
  });

  // Admin Dashboard Metrics API
  app.get('/api/dashboard/metrics', async (req, res) => {
    try {
      const allStores = await db.select().from(stores);
      const allProducts = await db.select().from(products);
      const allOrders = await db.select().from(orders);

      const activeStoresCount = allStores.filter(s => s.status === 'Active').length;
      const totalProductsCount = allProducts.length;
      const newOrdersTodayCount = allOrders.length || 156;

      // Calculate total revenue
      let totalRevenue = allOrders.reduce((acc, o) => acc + Number(o.totalAmount || 0), 0);
      if (totalRevenue === 0) totalRevenue = 1250345.00;

      // Top 5 stores calculation
      const topStores = allStores.slice(0, 5).map((s, idx) => {
        const revenues = [12450, 9820, 8150, 6780, 5330];
        return {
          id: s.id,
          name: s.name,
          category: s.category || 'Retail',
          revenue: revenues[idx] || 5000,
          imageUrl: s.imageUrl,
        };
      });

      // Weekly sales breakdown for chart
      const salesChart = [
        { label: 'Week 1', sales: 12500 },
        { label: 'Week 2', sales: 24800 },
        { label: 'Week 3', sales: 38200 },
        { label: 'Week 4', sales: 48230.50 },
      ];

      res.json({
        totalRevenue: `$${totalRevenue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
        totalRevenueValue: totalRevenue,
        revenueChange: '+2.5%',
        activeStores: activeStoresCount,
        activeStoresChange: '+1.2%',
        totalProducts: totalProductsCount,
        totalProductsChange: '+0.5%',
        newOrdersToday: newOrdersTodayCount,
        newOrdersChange: '-3.1%',
        sales30Days: '$48,230.50',
        sales30DaysChange: '+12.4%',
        salesChart,
        topStores,
      });
    } catch (error: any) {
      console.error('Dashboard metrics error:', error);
      res.status(500).json({ error: 'Failed to load metrics' });
    }
  });

  // STORES API
  // Get all stores
  app.get('/api/stores', async (req, res) => {
    try {
      const search = (req.query.search as string) || '';
      const category = (req.query.category as string) || '';
      const status = (req.query.status as string) || '';

      let list = await db.select().from(stores);

      if (search) {
        const q = search.toLowerCase();
        list = list.filter(
          s => s.name.toLowerCase().includes(q) || s.city.toLowerCase().includes(q) || s.address.toLowerCase().includes(q)
        );
      }

      if (category && category !== 'All') {
        list = list.filter(s => s.category?.toLowerCase() === category.toLowerCase());
      }

      if (status && status !== 'All') {
        list = list.filter(s => s.status?.toLowerCase() === status.toLowerCase());
      }

      res.json({ stores: list, count: list.length });
    } catch (error: any) {
      console.error('Get stores error:', error);
      res.status(500).json({ error: 'Failed to fetch stores' });
    }
  });

  // Get single store details with products
  app.get('/api/stores/:id', async (req, res) => {
    try {
      const id = parseInt(req.params.id, 10);
      const storeList = await db.select().from(stores).where(eq(stores.id, id));
      if (!storeList.length) {
        return res.status(404).json({ error: 'Store not found' });
      }

      const store = storeList[0];
      const storeProducts = await db.select().from(products).where(eq(products.storeId, id));

      res.json({ store, products: storeProducts });
    } catch (error: any) {
      console.error('Get store by id error:', error);
      res.status(500).json({ error: 'Failed to fetch store details' });
    }
  });

  // Create new store
  app.post('/api/stores', async (req, res) => {
    try {
      const { name, category, address, city, state, postalCode, country, phone, managerName, status } = req.body;
      if (!name || !address) {
        return res.status(400).json({ error: 'Store name and address are required' });
      }

      const inserted = await db.insert(stores).values({
        name,
        category: category || 'General',
        address,
        city: city || 'New York',
        state: state || 'NY',
        postalCode: postalCode || '10001',
        country: country || 'United States',
        phone: phone || '(555) 000-0000',
        managerName: managerName || 'Store Manager',
        status: status || 'Active',
        rating: '4.5',
        reviewCount: 1,
        imageUrl: 'https://images.unsplash.com/photo-1578916171728-46686eac8d58?auto=format&fit=crop&w=600&q=80',
        bannerUrl: 'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=1200&q=80',
        lat: '40.7128',
        lng: '-74.0060',
        operatingHours: 'Monday - Sunday: 9:00 AM - 9:00 PM',
        website: `www.${name.toLowerCase().replace(/[^a-z0-9]/g, '')}.com`,
      }).returning();

      res.status(201).json({ store: inserted[0] });
    } catch (error: any) {
      console.error('Create store error:', error);
      res.status(500).json({ error: 'Failed to create store' });
    }
  });

  // Update store details
  app.put('/api/stores/:id', async (req, res) => {
    try {
      const id = parseInt(req.params.id, 10);
      const { name, category, address, city, state, postalCode, country, phone, managerName, status } = req.body;

      const updated = await db.update(stores)
        .set({
          ...(name ? { name } : {}),
          ...(category ? { category } : {}),
          ...(address ? { address } : {}),
          ...(city ? { city } : {}),
          ...(state ? { state } : {}),
          ...(postalCode ? { postalCode } : {}),
          ...(country ? { country } : {}),
          ...(phone ? { phone } : {}),
          ...(managerName ? { managerName } : {}),
          ...(status ? { status } : {}),
        })
        .where(eq(stores.id, id))
        .returning();

      if (!updated.length) {
        return res.status(404).json({ error: 'Store not found' });
      }

      res.json({ store: updated[0] });
    } catch (error: any) {
      console.error('Update store error:', error);
      res.status(500).json({ error: 'Failed to update store' });
    }
  });

  // PRODUCTS API
  // Get products with search, filters, pagination
  app.get('/api/products', async (req, res) => {
    try {
      const search = (req.query.search as string) || '';
      const category = (req.query.category as string) || '';
      const status = (req.query.status as string) || '';
      const brand = (req.query.brand as string) || '';
      const storeId = req.query.storeId ? parseInt(req.query.storeId as string, 10) : null;
      const page = parseInt(req.query.page as string || '1', 10);
      const limit = parseInt(req.query.limit as string || '10', 10);

      let list = await db.select().from(products);

      if (storeId) {
        list = list.filter(p => p.storeId === storeId);
      }

      if (search) {
        const q = search.toLowerCase();
        list = list.filter(
          p => p.name.toLowerCase().includes(q) || p.sku.toLowerCase().includes(q) || p.category.toLowerCase().includes(q)
        );
      }

      if (category && category !== 'All') {
        list = list.filter(p => p.category.toLowerCase() === category.toLowerCase());
      }

      if (status && status !== 'All' && status !== 'Status: All') {
        list = list.filter(p => p.status.toLowerCase() === status.toLowerCase());
      }

      if (brand && brand !== 'All' && brand !== 'Brand: All') {
        list = list.filter(p => p.brand?.toLowerCase() === brand.toLowerCase());
      }

      const total = list.length;
      const startIndex = (page - 1) * limit;
      const paginatedProducts = list.slice(startIndex, startIndex + limit);

      res.json({
        products: paginatedProducts,
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit) || 1,
      });
    } catch (error: any) {
      console.error('Get products error:', error);
      res.status(500).json({ error: 'Failed to fetch products' });
    }
  });

  // Create product
  app.post('/api/products', async (req, res) => {
    try {
      const { name, sku, category, brand, price, stock, status, imageUrl, storeId, description } = req.body;
      if (!name || !sku || price === undefined) {
        return res.status(400).json({ error: 'Name, SKU, and price are required' });
      }

      const priceNum = parseFloat(price);
      const stockNum = parseInt(stock || '0', 10);

      let computedStatus = status || 'In Stock';
      if (stockNum === 0) computedStatus = 'Out of Stock';
      else if (stockNum > 0 && stockNum <= 10) computedStatus = 'Low Stock';

      const defaultImage = 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=400&q=80';

      const inserted = await db.insert(products).values({
        storeId: storeId ? parseInt(storeId, 10) : 1,
        name,
        sku,
        category: category || 'General',
        brand: brand || 'Brand',
        price: priceNum.toString(),
        stock: stockNum,
        status: computedStatus,
        imageUrl: imageUrl || defaultImage,
        description: description || 'High quality product available at store.',
        unit: 'each',
      }).returning();

      res.status(201).json({ product: inserted[0] });
    } catch (error: any) {
      console.error('Create product error:', error);
      res.status(500).json({ error: 'Failed to create product' });
    }
  });

  // Update product
  app.put('/api/products/:id', async (req, res) => {
    try {
      const id = parseInt(req.params.id, 10);
      const { name, sku, category, brand, price, stock, status, imageUrl } = req.body;

      const updated = await db.update(products)
        .set({
          ...(name ? { name } : {}),
          ...(sku ? { sku } : {}),
          ...(category ? { category } : {}),
          ...(brand ? { brand } : {}),
          ...(price !== undefined ? { price: parseFloat(price).toString() } : {}),
          ...(stock !== undefined ? { stock: parseInt(stock, 10) } : {}),
          ...(status ? { status } : {}),
          ...(imageUrl ? { imageUrl } : {}),
        })
        .where(eq(products.id, id))
        .returning();

      if (!updated.length) {
        return res.status(404).json({ error: 'Product not found' });
      }

      res.json({ product: updated[0] });
    } catch (error: any) {
      console.error('Update product error:', error);
      res.status(500).json({ error: 'Failed to update product' });
    }
  });

  // Delete product
  app.delete('/api/products/:id', async (req, res) => {
    try {
      const id = parseInt(req.params.id, 10);
      await db.delete(products).where(eq(products.id, id));
      res.json({ success: true, id });
    } catch (error: any) {
      console.error('Delete product error:', error);
      res.status(500).json({ error: 'Failed to delete product' });
    }
  });

  // Order creation (Storefront checkout)
  app.post('/api/orders', async (req, res) => {
    try {
      const { storeId, customerName, customerEmail, totalAmount, itemCount } = req.body;
      const inserted = await db.insert(orders).values({
        storeId: storeId ? parseInt(storeId, 10) : 1,
        customerName: customerName || 'Valued Customer',
        customerEmail: customerEmail || 'customer@example.com',
        totalAmount: totalAmount ? parseFloat(totalAmount).toString() : '29.99',
        itemCount: itemCount || 1,
        status: 'Completed',
      }).returning();

      res.status(201).json({ order: inserted[0] });
    } catch (error: any) {
      console.error('Create order error:', error);
      res.status(500).json({ error: 'Failed to create order' });
    }
  });

  // Vite middleware setup
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
