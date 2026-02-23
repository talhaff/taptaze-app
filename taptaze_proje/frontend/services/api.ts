import axios from 'axios';
import Constants from 'expo-constants';

const API_URL = "https://taptaze-backend.onrender.com";

const api = axios.create({
  baseURL: `${API_URL}/api`,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Kategori servisleri
export const categoryService = {
  getAll: async () => {
    const response = await api.get('/categories');
    return response.data;
  },
};

// Ürün servisleri
export const productService = {
  getAll: async (categoryId?: string, search?: string) => {
    const params = new URLSearchParams();
    if (categoryId) params.append('category_id', categoryId);
    if (search) params.append('search', search);
    const response = await api.get(`/products?${params.toString()}`);
    return response.data;
  },
  getById: async (id: string) => {
    const response = await api.get(`/products/${id}`);
    return response.data;
  },
};

// Sipariş servisleri
export const orderService = {
  create: async (orderData: any) => {
    const response = await api.post('/orders', orderData);
    return response.data;
  },
  getAll: async () => {
    const response = await api.get('/orders');
    return response.data;
  },
  updateStatus: async (orderId: string, status: string) => {
    const response = await api.patch(`/admin/orders/${orderId}`, { status });
    return response.data;
  },
  delete: async (orderId: string) => {
    const response = await api.delete(`/admin/orders/${orderId}`);
    return response.data;
  },
};

// Admin servisleri
export const adminService = {
  login: async (username: string, password: string) => {
    const response = await api.post('/admin/login', { username, password });
    return response.data;
  },
  createProduct: async (productData: any) => {
    const response = await api.post('/admin/products', productData);
    return response.data;
  },
  updateProduct: async (productId: string, productData: any) => {
    const response = await api.put(`/admin/products/${productId}`, productData);
    return response.data;
  },
  deleteProduct: async (productId: string) => {
    const response = await api.delete(`/admin/products/${productId}`);
    return response.data;
  },
  getStats: async () => {
    const response = await api.get('/admin/stats');
    return response.data;
  },
};

// Seed data
export const seedData = async () => {
  const response = await api.post('/seed');
  return response.data;
};

export default api;
