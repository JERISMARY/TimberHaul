/* ============================================================
   TimberHaul — API Client
   All fetch calls to the backend REST API
   ============================================================ */

const API_BASE = (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')
  ? 'http://localhost:5000/api'
  : 'https://your-app-name.koyeb.app/api'; // Replace this with your actual Koyeb URL later

class ApiClient {
  constructor() {
    this.baseUrl = API_BASE;
  }

  // Get auth token from localStorage
  getToken() {
    return localStorage.getItem('th_token');
  }

  // Build request headers
  getHeaders(includeAuth = true) {
    const headers = { 'Content-Type': 'application/json' };
    if (includeAuth) {
      const token = this.getToken();
      if (token) headers['Authorization'] = `Bearer ${token}`;
    }
    return headers;
  }

  // Generic fetch wrapper
  async request(endpoint, options = {}) {
    const url = `${this.baseUrl}${endpoint}`;
    const config = {
      headers: this.getHeaders(options.auth !== false),
      ...options,
    };

    try {
      const response = await fetch(url, config);
      const data = await response.json();

      if (!response.ok) {
        if (response.status === 401 && window.Auth) {
          window.Auth.clearAuth();
          if (!window.location.pathname.includes('login.html')) {
            window.location.href = `login.html?return=${encodeURIComponent(window.location.href)}`;
          }
        }
        throw new Error(data.message || `HTTP ${response.status}`);
      }
      return data;
    } catch (err) {
      // Network error fallback
      if (err.message === 'Failed to fetch') {
        console.warn('API not reachable, using mock data');
        return this.getMockData(endpoint);
      }
      throw err;
    }
  }

  get(endpoint, params = {}) {
    const qs = Object.keys(params).length
      ? '?' + new URLSearchParams(params).toString()
      : '';
    return this.request(`${endpoint}${qs}`, { method: 'GET' });
  }

  post(endpoint, body) {
    return this.request(endpoint, { method: 'POST', body: JSON.stringify(body) });
  }

  put(endpoint, body) {
    return this.request(endpoint, { method: 'PUT', body: JSON.stringify(body) });
  }

  delete(endpoint) {
    return this.request(endpoint, { method: 'DELETE' });
  }

  postForm(endpoint, formData) {
    const token = this.getToken();
    const headers = {};
    if (token) headers['Authorization'] = `Bearer ${token}`;
    return this.request(endpoint, { method: 'POST', headers, body: formData });
  }

  // ─── Mock data for offline / no-backend scenario ──────────
  getMockData(endpoint) {
    if (endpoint.includes('/products/featured') || endpoint.includes('/products')) {
      return {
        success: true,
        products: MOCK_PRODUCTS,
        total: MOCK_PRODUCTS.length,
        pages: 1
      };
    }
    if (endpoint.includes('/categories')) {
      return { success: true, categories: MOCK_CATEGORIES };
    }
    if (endpoint.includes('/blogs')) {
      return { success: true, blogs: MOCK_BLOGS };
    }
    if (endpoint.includes('/auth/login')) {
      return {
        success: true,
        token: 'mock-jwt-token-12345',
        user: {
          _id: 'mock-admin-id',
          name: 'Jeris Mary',
          email: 'jerismary@gmail.com',
          role: 'admin',
          avatar: ''
        }
      };
    }
    return { success: true };
  }

  // ─── Auth ────────────────────────────────────────────────
  register(data) { return this.post('/auth/register', data); }
  login(data) { return this.post('/auth/login', data); }
  getMe() { return this.get('/auth/me'); }
  updateProfile(data) { return this.put('/auth/profile', data); }
  changePassword(data) { return this.put('/auth/change-password', data); }
  logout() { return this.post('/auth/logout', {}); }
  addAddress(data) { return this.post('/auth/addresses', data); }
  deleteAddress(id) { return this.delete(`/auth/addresses/${id}`); }

  // ─── Products ────────────────────────────────────────────
  getProducts(params) { return this.get('/products', params); }
  getFeaturedProducts() { return this.get('/products/featured'); }
  getProduct(id) { return this.get(`/products/${id}`); }
  getRelatedProducts(id) { return this.get(`/products/${id}/related`); }
  createProduct(formData) { return this.postForm('/products', formData); }
  updateProduct(id, formData) {
    const token = this.getToken();
    return fetch(`${this.baseUrl}/products/${id}`, {
      method: 'PUT',
      headers: token ? { 'Authorization': `Bearer ${token}` } : {},
      body: formData
    }).then(r => r.json());
  }
  deleteProduct(id) { return this.delete(`/products/${id}`); }

  // ─── Categories ──────────────────────────────────────────
  getCategories() { return this.get('/categories'); }
  createCategory(data) { return this.post('/categories', data); }
  updateCategory(id, data) { return this.put(`/categories/${id}`, data); }
  deleteCategory(id) { return this.delete(`/categories/${id}`); }

  // ─── Orders ──────────────────────────────────────────────
  placeOrder(data) { return this.post('/orders', data); }
  createOrder(data) { return this.post('/orders', data); }  // alias used by checkout.js
  getMyOrders(params) { return this.get('/orders/my', params); }
  getOrder(id) { return this.get(`/orders/${id}`); }
  cancelOrder(id) { return this.put(`/orders/${id}/cancel`, {}); }
  updateOrderToPaid(id, paymentResult) { return this.put(`/orders/${id}/pay`, paymentResult); }
  getAllOrders(params) { return this.get('/orders', params); }
  updateOrderStatus(id, data) { return this.put(`/orders/${id}/status`, data); }

  // ─── Reviews ─────────────────────────────────────────────
  getProductReviews(productId, params) { return this.get(`/reviews/product/${productId}`, params); }
  addReview(productId, data) { return this.post(`/reviews/product/${productId}`, data); }
  markHelpful(reviewId) { return this.post(`/reviews/${reviewId}/helpful`, {}); }
  deleteReview(id) { return this.delete(`/reviews/${id}`); }

  // ─── Cart ────────────────────────────────────────────────
  getCart() { return this.get('/cart'); }
  addToCart(productId, quantity = 1) { return this.post('/cart/add', { productId, quantity }); }
  updateCart(productId, quantity) { return this.put(`/cart/update/${productId}`, { quantity }); }
  removeFromCart(productId) { return this.delete(`/cart/remove/${productId}`); }
  clearCart() { return this.delete('/cart/clear'); }
  applyCoupon(couponCode) { return this.post('/cart/coupon', { couponCode }); }

  // ─── Wishlist ────────────────────────────────────────────
  getWishlist() { return this.get('/wishlist'); }
  toggleWishlist(productId) { return this.post(`/wishlist/toggle/${productId}`, {}); }
  clearWishlist() { return this.delete('/wishlist/clear'); }

  // ─── Payments ────────────────────────────────────────────
  createStripeIntent(orderId) { return this.post('/payments/stripe/create-intent', { orderId }); }
  confirmStripePayment(data) { return this.post('/payments/stripe/confirm', data); }
  createRazorpayOrder(orderId) { return this.post('/payments/razorpay/create-order', { orderId }); }
  verifyRazorpayPayment(data) { return this.post('/payments/razorpay/verify', data); }
  confirmCOD(orderId) { return this.post('/payments/cod/confirm', { orderId }); }

  // ─── Blogs ───────────────────────────────────────────────
  getBlogs(params) { return this.get('/blogs', params); }
  getBlog(slug) { return this.get(`/blogs/${slug}`); }
  createBlog(data) { return this.post('/blogs', data); }
  updateBlog(id, data) { return this.put(`/blogs/${id}`, data); }
  deleteBlog(id) { return this.delete(`/blogs/${id}`); }

  // ─── Messages ────────────────────────────────────────────
  sendMessage(data) { return this.post('/messages', data); }
  getMessages(params) { return this.get('/messages', params); }

  // ─── Inventory ───────────────────────────────────────────
  getInventory(params) { return this.get('/inventory', params); }

  // ─── Admin Analytics & Logs ──────────────────────────────
  getDashboardStats() { return this.get('/analytics/dashboard'); }
  getSalesAnalytics() { return this.get('/analytics/sales'); }
  getActivityLogs(params) { return this.get('/activity-logs', params); }

  // ─── Settings & Notifications ────────────────────────────
  getSettings() { return this.get('/settings'); }
  updateSettings(data) { return this.put('/settings', data); }
  getNotifications() { return this.get('/notifications'); }
  markNotificationRead(id) { return this.put(`/notifications/${id}/read`); }

  // ─── Customers & Messages ────────────────────────────────
  getCustomers(params) { return this.get('/users', params); } // Assuming /users has admin view
  replyMessage(id, data) { return this.put(`/messages/${id}/reply`, data); }

  // ─── Admin Data Access ───────────────────────────────────
  getAdminProducts(params) { return this.get('/products', params); }
  getAdminOrders(params) { return this.get('/orders', params); }
  getAdminCategories() { return this.get('/categories'); }
  getAdminReviews(params) { return this.get('/reviews', params); }
  updateReviewStatus(id, status) { return this.put(`/reviews/${id}/status`, { status }); }

  // ─── Image Upload (Cloudinary via backend) ───────────────
  // Returns { url, publicId } to save in MongoDB
  uploadProductImage(formData) { return this.postForm('/upload/product-image', formData); }
  uploadAvatar(formData) { return this.postForm('/upload/avatar', formData); }
  uploadBlogImage(formData) { return this.postForm('/upload/blog-image', formData); }
  uploadCategoryImage(formData) { return this.postForm('/upload/category-image', formData); }
  getUploadStatus() { return this.get('/upload/status'); }
  deleteProductImage(productId, imageId) { return this.delete(`/products/${productId}/images/${imageId}`); }
}

// ── Mock Data (for offline / demo) ──────────────────────────
const MOCK_CATEGORIES = [
  { _id: 'c1', name: 'Solid Wood', slug: 'solid-wood', image: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?auto=format&fit=crop&w=800&q=80' },
  { _id: 'c2', name: 'Plywood', slug: 'plywood', image: 'https://images.unsplash.com/photo-1541123437800-1bb1317badc2?auto=format&fit=crop&w=800&q=80' },
  { _id: 'c3', name: 'Doors', slug: 'doors', image: 'https://images.unsplash.com/photo-1506439773649-6e0eb8cfb237?auto=format&fit=crop&w=800&q=80' },
  { _id: 'c4', name: 'Furniture', slug: 'furniture', image: 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?auto=format&fit=crop&w=800&q=80' },
  { _id: 'c5', name: 'Wooden Decor', slug: 'wooden-decor', image: 'https://images.unsplash.com/photo-1493246507139-91e8fad9978e?auto=format&fit=crop&w=800&q=80' },
  { _id: 'c6', name: 'Construction Timber', slug: 'construction-timber', image: 'https://images.unsplash.com/photo-1504307651254-35680f356dfd?auto=format&fit=crop&w=800&q=80' },
];

const MOCK_PRODUCTS = [
  { _id: 'p1', name: 'Premium Teak Hardwood Plank', woodType: 'Teak', price: 4800, finalPrice: 4320, discount: 10, rating: 4.8, numReviews: 124, stock: 85, featured: true, category: { name: 'Solid Wood' }, images: [{ url: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?auto=format&fit=crop&w=800&q=80', isPrimary: true }], dimensions: { length: 2400, width: 150, thickness: 25, unit: 'mm' } },
  { _id: 'p2', name: 'Walnut Dining Table Top', woodType: 'Walnut', price: 28000, finalPrice: 26600, discount: 5, rating: 4.9, numReviews: 86, stock: 12, featured: true, category: { name: 'Furniture' }, images: [{ url: 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?auto=format&fit=crop&w=800&q=80', isPrimary: true }], dimensions: { length: 1800, width: 900, thickness: 50, unit: 'mm' } },
  { _id: 'p3', name: 'Marine Plywood 18mm BWR', woodType: 'Plywood', price: 3200, finalPrice: 3200, discount: 0, rating: 4.6, numReviews: 432, stock: 200, featured: false, category: { name: 'Plywood' }, images: [{ url: 'https://images.unsplash.com/photo-1541123437800-1bb1317badc2?auto=format&fit=crop&w=800&q=80', isPrimary: true }], dimensions: { length: 2400, width: 1200, thickness: 18, unit: 'mm' } },
  { _id: 'p4', name: 'Solid Oak Engineered Door', woodType: 'Oak', price: 15500, finalPrice: 13175, discount: 15, rating: 4.7, numReviews: 64, stock: 30, featured: true, category: { name: 'Doors' }, images: [{ url: 'https://images.unsplash.com/photo-1506439773649-6e0eb8cfb237?auto=format&fit=crop&w=800&q=80', isPrimary: true }], dimensions: { length: 2100, width: 900, thickness: 45, unit: 'mm' } },
  { _id: 'p5', name: 'Mahogany Carved Wall Panel', woodType: 'Mahogany', price: 8900, finalPrice: 8900, discount: 0, rating: 4.9, numReviews: 28, stock: 18, featured: true, category: { name: 'Wooden Decor' }, images: [{ url: 'https://images.unsplash.com/photo-1493246507139-91e8fad9978e?auto=format&fit=crop&w=800&q=80', isPrimary: true }], dimensions: { length: 1200, width: 600, thickness: 20, unit: 'mm' } },
  { _id: 'p6', name: 'Structural Pine Beam 6x4', woodType: 'Pine', price: 2200, finalPrice: 2024, discount: 8, rating: 4.5, numReviews: 312, stock: 350, featured: false, category: { name: 'Construction Timber' }, images: [{ url: 'https://images.unsplash.com/photo-1504307651254-35680f356dfd?auto=format&fit=crop&w=800&q=80', isPrimary: true }], dimensions: { length: 3000, width: 100, thickness: 150, unit: 'mm' } },
  { _id: 'p7', name: 'Rosewood Bookshelf Unit', woodType: 'Rosewood', price: 22000, finalPrice: 19360, discount: 12, rating: 4.8, numReviews: 45, stock: 8, featured: true, category: { name: 'Furniture' }, images: [{ url: 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?auto=format&fit=crop&w=800&q=80', isPrimary: true }], dimensions: { length: 1000, width: 350, thickness: 1800, unit: 'mm' } },
  { _id: 'p8', name: 'Oak Chevron Parquet Flooring', woodType: 'Oak', price: 1850, finalPrice: 1758, discount: 5, rating: 4.7, numReviews: 267, stock: 500, featured: true, category: { name: 'Solid Wood' }, images: [{ url: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?auto=format&fit=crop&w=800&q=80', isPrimary: true }], dimensions: { length: 580, width: 70, thickness: 14, unit: 'mm' } },
];

const MOCK_BLOGS = [
  { _id: 'b1', title: 'How to Maintain Your Wooden Furniture for a Lifetime', slug: 'how-to-maintain-wooden-furniture', excerpt: 'Learn professional wood care techniques to keep your furniture looking pristine for decades.', coverImage: 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?auto=format&fit=crop&w=800&q=80', category: 'Wood Maintenance', readTime: 7, views: 1245, publishedAt: '2025-05-12', author: { name: 'TimberHaul Team' } },
  { _id: 'b2', title: 'Choosing the Right Timber for Your Construction Project', slug: 'choosing-right-timber-construction', excerpt: 'A comprehensive guide to selecting the perfect wood species for structural and aesthetic applications.', coverImage: 'https://images.unsplash.com/photo-1504307651254-35680f356dfd?auto=format&fit=crop&w=800&q=80', category: 'Choosing Timber', readTime: 12, views: 892, publishedAt: '2025-04-28', author: { name: 'Wood Expert' } },
  { _id: 'b3', title: '2025 Furniture Design Trends: Natural Wood Takes Center Stage', slug: 'furniture-design-trends-2025', excerpt: 'Discover the hottest furniture trends of 2025, where organic materials and biophilic design dominate.', coverImage: 'https://images.unsplash.com/photo-1493246507139-91e8fad9978e?auto=format&fit=crop&w=800&q=80', category: 'Furniture Trends', readTime: 6, views: 634, publishedAt: '2025-04-10', author: { name: 'Design Team' } },
  { _id: 'b4', title: 'Construction Tips: Working with Large Timber Beams', slug: 'construction-tips-timber-beams', excerpt: 'Expert advice on handling, cutting, and installing heavy timber beams safely and efficiently.', coverImage: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?auto=format&fit=crop&w=800&q=80', category: 'Construction Tips', readTime: 9, views: 421, publishedAt: '2025-03-22', author: { name: 'Construction Expert' } },
];

// Export single global instance
window.api = new ApiClient();
