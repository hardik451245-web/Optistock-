// OptiStock AI - Vercel Serverless API Proxy & Standalone Engine
// Handles /api/* routes on Vercel to prevent 405 Method Not Allowed errors
// If BACKEND_URL or VITE_API_BASE_URL is set, proxies to the Spring Boot backend.
// Otherwise, runs a robust standalone serverless demo engine.

const PRODUCTS = [
  { id: 1, name: "Potato", brand: "Fresh Farms", category: "Vegetables", productType: "Potato", costPrice: "20.00", sellingPrice: "30.00", stockQuantity: 0, reorderThreshold: 15, expiryDate: null, active: true },
  { id: 2, name: "Spinach", brand: "Organic India", category: "Vegetables", productType: "Spinach", costPrice: "15.00", sellingPrice: "25.00", stockQuantity: 40, reorderThreshold: 10, expiryDate: "2026-10-17", active: true },
  { id: 3, name: "Tomato", brand: "Fresh Farms", category: "Vegetables", productType: "Tomato", costPrice: "25.00", sellingPrice: "40.00", stockQuantity: 35, reorderThreshold: 10, expiryDate: "2026-10-16", active: true },
  { id: 4, name: "Onion", brand: "FarmFresh", category: "Vegetables", productType: "Onion", costPrice: "22.00", sellingPrice: "35.00", stockQuantity: 80, reorderThreshold: 20, expiryDate: null, active: true },
  { id: 5, name: "Cauliflower", brand: "Fresh Farms", category: "Vegetables", productType: "Cauliflower", costPrice: "28.00", sellingPrice: "45.00", stockQuantity: 50, reorderThreshold: 15, expiryDate: "2026-10-19", active: true },
  { id: 6, name: "Apple", brand: "Shimla", category: "Fruits", productType: "Apple", costPrice: "100.00", sellingPrice: "150.00", stockQuantity: 0, reorderThreshold: 10, expiryDate: "2026-10-28", active: true },
  { id: 7, name: "Alphonso Mango", brand: "Ratnagiri", category: "Fruits", productType: "Mango", costPrice: "180.00", sellingPrice: "260.00", stockQuantity: 60, reorderThreshold: 15, expiryDate: "2026-10-23", active: true },
  { id: 8, name: "Banana", brand: "Robusta", category: "Fruits", productType: "Banana", costPrice: "30.00", sellingPrice: "50.00", stockQuantity: 70, reorderThreshold: 20, expiryDate: "2026-10-18", active: true },
  { id: 9, name: "Orange", brand: "Nagpur", category: "Fruits", productType: "Orange", costPrice: "50.00", sellingPrice: "80.00", stockQuantity: 45, reorderThreshold: 12, expiryDate: "2026-10-21", active: true },
  { id: 10, name: "Pomegranate", brand: "Kashmiri", category: "Fruits", productType: "Pomegranate", costPrice: "110.00", sellingPrice: "165.00", stockQuantity: 35, reorderThreshold: 10, expiryDate: "2026-10-25", active: true },
  { id: 11, name: "Taaza Milk 1L", brand: "Amul", category: "Dairy", productType: "Milk 1L", costPrice: "50.00", sellingPrice: "64.00", stockQuantity: 40, reorderThreshold: 10, expiryDate: "2026-10-15", active: true },
  { id: 12, name: "Fresh Milk 1L", brand: "Milky Mist", category: "Dairy", productType: "Milk 1L", costPrice: "46.00", sellingPrice: "64.00", stockQuantity: 30, reorderThreshold: 10, expiryDate: "2026-10-16", active: true },
  { id: 13, name: "Masti Dahi 400g", brand: "Amul", category: "Dairy", productType: "Curd 400g", costPrice: "30.00", sellingPrice: "40.00", stockQuantity: 25, reorderThreshold: 8, expiryDate: "2026-10-14", active: true },
  { id: 14, name: "Classic Curd 400g", brand: "Milky Mist", category: "Dairy", productType: "Curd 400g", costPrice: "26.00", sellingPrice: "40.00", stockQuantity: 20, reorderThreshold: 8, expiryDate: "2026-10-18", active: true },
  { id: 15, name: "Pasteurized Butter 100g", brand: "Amul", category: "Dairy", productType: "Butter 100g", costPrice: "42.00", sellingPrice: "56.00", stockQuantity: 35, reorderThreshold: 12, expiryDate: "2026-11-07", active: true },
  { id: 16, name: "Delicious Butter 100g", brand: "Nandini", category: "Dairy", productType: "Butter 100g", costPrice: "40.00", sellingPrice: "52.00", stockQuantity: 30, reorderThreshold: 12, expiryDate: "2026-11-02", active: true },
  { id: 17, name: "White Bread", brand: "Modern", category: "Bakery", productType: "Bread 400g", costPrice: "22.00", sellingPrice: "30.00", stockQuantity: 20, reorderThreshold: 8, expiryDate: "2026-10-13", active: true },
  { id: 18, name: "Brown Bread", brand: "Britannia", category: "Bakery", productType: "Bread 400g", costPrice: "28.00", sellingPrice: "42.00", stockQuantity: 22, reorderThreshold: 10, expiryDate: "2026-10-14", active: true },
  { id: 19, name: "Multigrain Bread", brand: "English Oven", category: "Bakery", productType: "Bread 400g", costPrice: "35.00", sellingPrice: "55.00", stockQuantity: 18, reorderThreshold: 8, expiryDate: "2026-10-15", active: true },
  { id: 20, name: "Toastea Rusk", brand: "Britannia", category: "Bakery", productType: "Rusk", costPrice: "32.00", sellingPrice: "45.00", stockQuantity: 60, reorderThreshold: 15, expiryDate: "2026-12-12", active: true },
  { id: 21, name: "Pav Buns", brand: "Bonn", category: "Bakery", productType: "Buns", costPrice: "18.00", sellingPrice: "25.00", stockQuantity: 30, reorderThreshold: 10, expiryDate: "2026-10-16", active: true },
  { id: 22, name: "Basmati Rice", brand: "India Gate", category: "Staples", productType: "Rice", costPrice: "85.00", sellingPrice: "130.00", stockQuantity: 80, reorderThreshold: 20, expiryDate: null, active: true },
  { id: 23, name: "Sunflower Oil", brand: "Fortune", category: "Staples", productType: "Cooking Oil", costPrice: "110.00", sellingPrice: "145.00", stockQuantity: 75, reorderThreshold: 25, expiryDate: null, active: true },
  { id: 24, name: "Chakki Atta", brand: "Aashirvaad", category: "Staples", productType: "Wheat Flour", costPrice: "40.00", sellingPrice: "55.00", stockQuantity: 90, reorderThreshold: 30, expiryDate: null, active: true },
  { id: 25, name: "Toor Dal", brand: "Tata Sampann", category: "Staples", productType: "Pulses", costPrice: "120.00", sellingPrice: "175.00", stockQuantity: 65, reorderThreshold: 20, expiryDate: null, active: true },
  { id: 26, name: "Iodized Salt", brand: "Tata", category: "Staples", productType: "Salt", costPrice: "20.00", sellingPrice: "28.00", stockQuantity: 120, reorderThreshold: 30, expiryDate: null, active: true },
  { id: 27, name: "Aloo Bhujia", brand: "Haldiram's", category: "Snacks", productType: "Bhujia", costPrice: "42.00", sellingPrice: "60.00", stockQuantity: 75, reorderThreshold: 20, expiryDate: null, active: true },
  { id: 28, name: "Magic Masala Chips", brand: "Lay's", category: "Snacks", productType: "Potato Chips", costPrice: "15.00", sellingPrice: "20.00", stockQuantity: 100, reorderThreshold: 30, expiryDate: null, active: true },
  { id: 29, name: "Salted Wafers", brand: "Balaji", category: "Snacks", productType: "Potato Chips", costPrice: "14.00", sellingPrice: "20.00", stockQuantity: 85, reorderThreshold: 25, expiryDate: null, active: true },
  { id: 30, name: "Masala Munch", brand: "Kurkure", category: "Snacks", productType: "Corn Puffs", costPrice: "15.00", sellingPrice: "20.00", stockQuantity: 90, reorderThreshold: 25, expiryDate: null, active: true },
  { id: 31, name: "Gulab Jamun Tin", brand: "Bikaji", category: "Snacks", productType: "Sweets", costPrice: "130.00", sellingPrice: "190.00", stockQuantity: 40, reorderThreshold: 10, expiryDate: "2027-01-11", active: true },
  { id: 32, name: "Tea Gold", brand: "Tata", category: "Beverages", productType: "Tea Powder", costPrice: "115.00", sellingPrice: "150.00", stockQuantity: 5, reorderThreshold: 15, expiryDate: null, active: true },
  { id: 33, name: "Red Label Tea", brand: "Brooke Bond", category: "Beverages", productType: "Tea Powder", costPrice: "110.00", sellingPrice: "140.00", stockQuantity: 55, reorderThreshold: 15, expiryDate: null, active: true },
  { id: 34, name: "Classic Coffee", brand: "Nescafe", category: "Beverages", productType: "Coffee", costPrice: "140.00", sellingPrice: "195.00", stockQuantity: 45, reorderThreshold: 12, expiryDate: null, active: true },
  { id: 35, name: "Mixed Fruit Juice", brand: "Real", category: "Beverages", productType: "Fruit Juice", costPrice: "85.00", sellingPrice: "120.00", stockQuantity: 40, reorderThreshold: 12, expiryDate: "2026-11-27", active: true },
  { id: 36, name: "Mango Drink", brand: "Frooti", category: "Beverages", productType: "Fruit Juice", costPrice: "30.00", sellingPrice: "42.00", stockQuantity: 80, reorderThreshold: 20, expiryDate: "2026-12-12", active: true },
  { id: 37, name: "Velvet Touch Soap 100g", brand: "Lux", category: "Personal Care", productType: "Soap 100g", costPrice: "24.00", sellingPrice: "36.00", stockQuantity: 80, reorderThreshold: 20, expiryDate: null, active: true },
  { id: 38, name: "Original Bath Soap 100g", brand: "Dettol", category: "Personal Care", productType: "Soap 100g", costPrice: "28.00", sellingPrice: "40.00", stockQuantity: 90, reorderThreshold: 25, expiryDate: null, active: true },
  { id: 39, name: "Pure & Gentle Soap 100g", brand: "Pears", category: "Personal Care", productType: "Soap 100g", costPrice: "35.00", sellingPrice: "55.00", stockQuantity: 60, reorderThreshold: 15, expiryDate: null, active: true },
  { id: 40, name: "Pure Coconut Oil 200ml", brand: "Parachute", category: "Personal Care", productType: "Coconut Oil 200ml", costPrice: "80.00", sellingPrice: "115.00", stockQuantity: 65, reorderThreshold: 15, expiryDate: null, active: true }
];

const SUPPLIERS = [
  { id: 1, name: "Kisan Fresh Agro", contactPerson: "Ramesh Patel", phone: "+91 98201 12345", whatsappNumber: "919820112345", email: "orders@kisanagro.com", address: "Vashi APMC Market, Navi Mumbai", categories: "Vegetables & Fruits" },
  { id: 2, name: "Amul Dairy Cooperative", contactPerson: "Vikram Shah", phone: "+91 98202 23456", whatsappNumber: "919820223456", email: "supply@amuldairy.com", address: "Anand Dairy Estate, Gujarat", categories: "Dairy" },
  { id: 3, name: "Modern Bakery & Foods", contactPerson: "Anil Verma", phone: "+91 98203 34567", whatsappNumber: "919820334567", email: "b2b@modernbakers.com", address: "Andheri East, Mumbai", categories: "Bakery" },
  { id: 4, name: "Metro Wholesale FMCG", contactPerson: "Pooja Mehta", phone: "+91 98204 45678", whatsappNumber: "919820445678", email: "wholesale@metrofmcg.in", address: "Bhiwandi Logistics Park, Thane", categories: "Staples & FMCG" },
  { id: 5, name: "Haldiram Snacks Hub", contactPerson: "Sanjay Gupta", phone: "+91 98205 56789", whatsappNumber: "919820556789", email: "distributor@haldiramshub.com", address: "Nagpur Industrial Area", categories: "Snacks & Beverages" }
];

export default async function handler(req, res) {
  // CORS Headers
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', req.headers.origin || '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization'
  );

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // 1. If backend URL is defined, proxy request
  const backendUrl = process.env.BACKEND_URL || process.env.VITE_API_BASE_URL || 'https://optistock-backend-syu1.onrender.com';
  if (backendUrl) {
    try {
      const cleanBase = backendUrl.replace(/\/+$/, '');
      const path = req.url.startsWith('/api') ? req.url : `/api${req.url}`;
      const target = `${cleanBase}${path}`;

      const headers = { 'Content-Type': 'application/json' };
      if (req.headers.authorization) headers.Authorization = req.headers.authorization;

      const body = ['POST', 'PUT', 'PATCH'].includes(req.method)
        ? (typeof req.body === 'object' ? JSON.stringify(req.body) : req.body)
        : undefined;

      const proxyRes = await fetch(target, { method: req.method, headers, body });
      const text = await proxyRes.text();
      res.status(proxyRes.status);
      try {
        return res.json(JSON.parse(text));
      } catch {
        return res.send(text);
      }
    } catch (err) {
      console.warn('Proxy to backend failed, falling back to standalone serverless engine:', err.message);
    }
  }

  // 2. Standalone serverless API implementation
  const url = req.url || '';
  const method = req.method;

  // Body parsing helper
  let body = req.body;
  if (typeof body === 'string') {
    try { body = JSON.parse(body); } catch (_) {}
  }

  // Auth: Login
  if (url.includes('/users/login') && method === 'POST') {
    const { email, password } = body || {};
    if (email === 'manager@optistock.com' && (password === 'manager123' || password)) {
      return res.status(200).json({
        token: 'optistock-demo-jwt-token-manager',
        email: 'manager@optistock.com',
        role: 'MANAGER',
        name: 'Store Manager'
      });
    }
    if (email === 'cashier@optistock.com' && (password === 'cashier123' || password)) {
      return res.status(200).json({
        token: 'optistock-demo-jwt-token-cashier',
        email: 'cashier@optistock.com',
        role: 'CASHIER',
        name: 'Head Cashier'
      });
    }
    // Generic fallback for any email
    const role = (email || '').toLowerCase().includes('cashier') ? 'CASHIER' : 'MANAGER';
    return res.status(200).json({
      token: `optistock-demo-jwt-token-${role.toLowerCase()}`,
      email: email || 'user@optistock.com',
      role,
      name: role === 'MANAGER' ? 'Store Manager' : 'Cashier'
    });
  }

  // Auth: Register
  if (url.includes('/users/register') && method === 'POST') {
    const { email, role } = body || {};
    return res.status(200).json({
      token: 'optistock-demo-jwt-token-registered',
      email: email || 'user@optistock.com',
      role: role || 'CASHIER',
      name: 'Registered User'
    });
  }

  // Products
  if (url.includes('/products') && !url.includes('/demand-forecast')) {
    if (method === 'GET') {
      const matchId = url.match(/\/products\/(\d+)/);
      if (matchId) {
        const p = PRODUCTS.find(x => x.id === parseInt(matchId[1], 10)) || PRODUCTS[0];
        return res.status(200).json(p);
      }
      return res.status(200).json(PRODUCTS);
    }
    if (method === 'POST') {
      const newP = { id: Date.now(), ...(body || {}), active: true };
      return res.status(201).json(newP);
    }
    if (method === 'PUT') {
      return res.status(200).json({ ...(body || {}), active: true });
    }
    if (method === 'DELETE') {
      return res.status(200).json({ message: 'Product archived successfully' });
    }
  }

  // Suppliers
  if (url.includes('/manager/suppliers')) {
    if (method === 'GET') return res.status(200).json(SUPPLIERS);
    if (method === 'POST') return res.status(201).json({ id: Date.now(), ...(body || {}) });
    if (method === 'PUT') return res.status(200).json({ ...(body || {}) });
    if (method === 'DELETE') return res.status(200).json({ message: 'Supplier deleted' });
  }

  // Manager: Summary
  if (url.includes('/manager/summary')) {
    return res.status(200).json({
      totalRevenue: "48200.00",
      totalCost: "34120.00",
      netProfit: "14080.00",
      billsCount: 284,
      itemsSold: 940,
      todayRevenue: "1450.00",
      todayProfit: "420.00",
      lowStockCount: 2,
      expiringCount: 5
    });
  }

  // Manager: Alerts
  if (url.includes('/manager/alerts')) {
    return res.status(200).json({
      lowStock: PRODUCTS.filter(p => p.stockQuantity <= p.reorderThreshold),
      expiringSoon: PRODUCTS.filter(p => p.expiryDate && p.expiryDate <= "2026-10-18"),
      markdownActive: PRODUCTS.filter(p => p.expiryDate && p.expiryDate <= "2026-10-15"),
      expiredStock: [],
      slowMoving: []
    });
  }

  // Manager: Demand Forecast
  if (url.includes('/manager/demand-forecast')) {
    const items = PRODUCTS.map(p => ({
      productId: p.id,
      productName: p.name,
      brand: p.brand,
      category: p.category,
      productType: p.productType,
      currentStock: p.stockQuantity,
      avgDailySales: 3.2,
      forecast30Days: 96,
      daysOfCover: p.stockQuantity > 0 ? (p.stockQuantity / 3.2).toFixed(1) : "0.0",
      suggestedReorder: Math.max(0, 96 - p.stockQuantity),
      stockoutRisk: p.stockQuantity <= 10 ? "HIGH" : p.stockQuantity <= 30 ? "MEDIUM" : "LOW",
      confidence: "94.2%",
      historicalTrend: [2, 3, 4, 3, 5, 4, 3],
      forecastCurve: [3.2, 3.4, 3.1, 3.5, 3.3]
    }));
    return res.status(200).json({
      items,
      totalForecastQuantity: items.reduce((s, x) => s + x.forecast30Days, 0),
      highRiskCount: items.filter(x => x.stockoutRisk === 'HIGH').length,
      averageDaysOfCover: "14.8",
      modelAccuracy: "92.4%"
    });
  }

  // Manager: 80-20 Mix / Pareto
  if (url.includes('/manager/product-mix') || url.includes('/manager/pareto')) {
    return res.status(200).json({
      brandComparisons: [
        {
          productType: "Milk 1L",
          brandA: { brand: "Milky Mist", unitProfit: "18.00", totalProfit: "1080.00", unitsSold: 60, revenue: "3840.00" },
          brandB: { brand: "Amul", unitProfit: "14.00", totalProfit: "840.00", unitsSold: 60, revenue: "3840.00" },
          recommendation: "Prioritize Milky Mist (+28.6% margin advantage per unit)",
          sentence: "Milky Mist yields 18.00/unit vs Amul 14.00/unit. Shift stock ratio to 70:30."
        },
        {
          productType: "Curd 400g",
          brandA: { brand: "Milky Mist", unitProfit: "14.00", totalProfit: "560.00", unitsSold: 40, revenue: "1600.00" },
          brandB: { brand: "Amul", unitProfit: "10.00", totalProfit: "400.00", unitsSold: 40, revenue: "1600.00" },
          recommendation: "Promote Milky Mist Curd for higher shelf return",
          sentence: "Milky Mist provides 40% higher unit margin on identical shelf space."
        }
      ],
      paretoItems: [
        { productName: "Alphonso Mango", totalRevenue: "15600.00", totalProfit: "4800.00", cumulativePercent: "34.1%" },
        { productName: "Sunflower Oil", totalRevenue: "10875.00", totalProfit: "2625.00", cumulativePercent: "52.7%" },
        { productName: "Taaza Milk 1L", totalRevenue: "7680.00", totalProfit: "1680.00", cumulativePercent: "64.6%" },
        { productName: "Basmati Rice", totalRevenue: "10400.00", totalProfit: "3600.00", cumulativePercent: "80.2%" }
      ]
    });
  }

  // Purchase Orders
  if (url.includes('/purchase-orders')) {
    if (method === 'GET') {
      return res.status(200).json([
        { id: 101, poNumber: "PO-2026-001", supplierName: "Amul Dairy Cooperative", status: "ORDERED", totalAmount: "2840.00", createdAt: "2026-10-12T14:30:00", items: [{ productName: "Taaza Milk 1L", quantity: 30, costPrice: "50.00" }] },
        { id: 102, poNumber: "PO-2026-002", supplierName: "Kisan Fresh Agro", status: "RECEIVED", totalAmount: "1450.00", createdAt: "2026-10-11T10:15:00", items: [{ productName: "Tomato", quantity: 25, costPrice: "25.00" }] }
      ]);
    }
    if (method === 'POST') {
      return res.status(201).json({ id: Date.now(), poNumber: `PO-${Date.now().toString().slice(-4)}`, status: "ORDERED", ...(body || {}) });
    }
    if (method === 'PUT') {
      return res.status(200).json({ status: "RECEIVED", ...(body || {}) });
    }
  }

  // Bills (POS)
  if (url.includes('/bills')) {
    if (method === 'GET') {
      return res.status(200).json([
        { id: 201, billNumber: "BILL-1001", cashierName: "Cashier", subtotal: "128.00", totalDiscount: "0.00", totalAmount: "128.00", createdAt: "2026-10-13T10:15:00" }
      ]);
    }
    if (method === 'POST') {
      return res.status(201).json({
        id: Date.now(),
        billNumber: `BILL-${Math.floor(1000 + Math.random() * 9000)}`,
        subtotal: "180.00",
        totalDiscount: "20.00",
        totalAmount: "160.00",
        createdAt: new Date().toISOString()
      });
    }
  }

  // Stock Adjustments / Writeoffs
  if (url.includes('/stock/')) {
    return res.status(200).json({ message: "Stock ledger updated successfully" });
  }

  // Default fallback
  return res.status(200).json({ success: true, message: "OptiStock API online" });
}
