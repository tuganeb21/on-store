import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';
const API_ORIGIN = API_BASE_URL.replace(/\/api\/?$/, '');

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (err) => {
    const status = err.response?.status;
    const url = err.config?.url || '';
    const hasToken = !!localStorage.getItem('token');
    const isAuthCall = url.includes('/auth/login') || url.includes('/auth/register');

    if (status === 401 && hasToken && !isAuthCall) {
      localStorage.removeItem('token');
      window.location.href = '/auth';
    }
    return Promise.reject(err);
  }
);

export default api;

export const toAssetUrl = (path) => {
  if (!path) return '';
  if (/^https?:\/\//i.test(path)) return path;
  return `${API_ORIGIN}${path.startsWith('/') ? path : `/${path}`}`;
};

// ── AUTH ────────────────────────────────────────────────
export const authAPI = {
  register: (data) => api.post('/auth/register', data),
  login: (data) => api.post('/auth/login', data),
  me: () => api.get('/auth/me'),
  changePassword: (data) => api.put('/auth/change-password', data),
};

// ── PRODUCTS ────────────────────────────────────────────
export const productAPI = {
  list: (params) => api.get('/products', { params }),
  mine: () => api.get('/products/mine'),
  get: (slug) => api.get(`/products/${slug}`),
  create: (data) => api.post('/products', data, { headers: { 'Content-Type': 'multipart/form-data' } }),
  update: (id, data) => api.put(`/products/${id}`, data, { headers: { 'Content-Type': 'multipart/form-data' } }),
  delete: (id) => api.delete(`/products/${id}`),
};

// ── CART ────────────────────────────────────────────────
export const cartAPI = {
  get: () => api.get('/cart'),
  add: (data) => api.post('/cart', data),
  update: (id, qty) => api.patch(`/cart/${id}`, { quantity: qty }),
  remove: (id) => api.delete(`/cart/${id}`),
  clear: () => api.delete('/cart'),
};

// ── ORDERS ──────────────────────────────────────────────
export const orderAPI = {
  place: (data) => api.post('/orders', data),
  myOrders: (params) => api.get('/orders', { params }),
  get: (id) => api.get(`/orders/${id}`),
  cancel: (id) => api.patch(`/orders/${id}/cancel`),
  sellerOrders: (params) => api.get('/orders/seller', { params }),
  updateItemStatus: (orderId, itemId, status) =>
    api.patch(`/orders/${orderId}/items/${itemId}/status`, { status }),
};

// ── REVIEWS ─────────────────────────────────────────────
export const reviewAPI = {
  create: (data) => api.post('/reviews', data),
  byProduct: (productId, params) => api.get(`/reviews/product/${productId}`, { params }),
};

// ── WISHLIST ─────────────────────────────────────────────
export const wishlistAPI = {
  get: () => api.get('/wishlist'),
  toggle: (product_id) => api.post('/wishlist', { product_id }),
};

// ── CATEGORIES ───────────────────────────────────────────
export const categoryAPI = {
  list: () => api.get('/categories'),
  create: (data) => api.post('/categories', data),
  update: (id, data) => api.put(`/categories/${id}`, data),
  delete: (id) => api.delete(`/categories/${id}`),
};

// ── NOTIFICATIONS ─────────────────────────────────────────
export const notifAPI = {
  list: (params) => api.get('/notifications', { params }),
  markAllRead: () => api.patch('/notifications/read-all'),
};

// ── ANALYTICS ─────────────────────────────────────────────
export const analyticsAPI = {
  seller: () => api.get('/analytics/seller'),
};

export const chatAPI = {
  rooms: () => api.get('/chat/rooms'),
};

