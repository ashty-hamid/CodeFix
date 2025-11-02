import apiClient from './api';
import type { Product } from '@/types/api.types';

export const productService = {

  // Get all products
  async getProducts(): Promise<Product[]> {
    const response = await apiClient.get<Product[]>('/products');
    return response.data;  // ✅ Changed from response.data.data
  },

  // Get single product
  async getProductById(id: number): Promise<Product> {
    const response = await apiClient.get<Product>(`/products/${id}`);
    return response.data;  // ✅ Changed
  },

  // Create new product
  async createProduct(productData: Omit<Product, 'id'>): Promise<Product> {
    const response = await apiClient.post<Product>('/products', productData);
    return response.data;  // ✅ Changed
  },

  // Update product
  async updateProduct(id: number, productData: Partial<Product>): Promise<Product> {
    const response = await apiClient.put<Product>(`/products/${id}`, productData);
    return response.data;  // ✅ Changed
  },

  // Delete product
  async deleteProduct(id: number): Promise<void> {
    await apiClient.delete(`/products/${id}`);
  },
};
