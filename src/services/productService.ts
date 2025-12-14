/**
 * Product Service
 *
 * Gerencia produtos customizáveis do sistema via Supabase API
 */

import type { Product, ProductSettings } from '../types/products';
import { DEFAULT_PRODUCTS } from '../types/products';
import { API_URL } from '../config/api';

const STORAGE_KEY = 'partners_crm_products';

class ProductService {
  private productsCache: Product[] | null = null;

  /**
   * Obter todos os produtos (da API ou cache/localStorage)
   */
  async getProducts(): Promise<Product[]> {
    try {
      const response = await fetch(`${API_URL}/products`, { credentials: 'include' });
      if (response.ok) {
        const data = await response.json();
        // Adaptar formato do banco para o formato esperado pelo frontend
        const products = data.map((p: any) => ({
          id: p.id,
          name: p.name,
          description: p.description || '',
          icon: p.icon,
          color: p.color,
          isActive: p.is_active,
          order: p.order || 1,
          createdAt: p.created_at || new Date().toISOString(),
          updatedAt: p.updated_at || new Date().toISOString()
        })).sort((a: Product, b: Product) => a.order - b.order);
        
        this.productsCache = products;
        return products;
      }
    } catch (error) {
      console.error('Error fetching products from API, using cache:', error);
    }

    // Fallback para localStorage
    if (this.productsCache) {
      return this.productsCache;
    }

    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        const settings: ProductSettings = JSON.parse(stored);
        return settings.products.sort((a, b) => a.order - b.order);
      } catch (error) {
        console.error('Error parsing products:', error);
      }
    }
    
    return DEFAULT_PRODUCTS;
  }

  /**
   * Obter todos os produtos (síncrono, usa cache)
   */
  getProductsSync(): Product[] {
    if (this.productsCache) {
      return this.productsCache;
    }
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        const settings: ProductSettings = JSON.parse(stored);
        return settings.products.sort((a, b) => a.order - b.order);
      } catch (error) {
        console.error('Error parsing products:', error);
      }
    }
    return DEFAULT_PRODUCTS;
  }

  /**
   * Obter produtos ativos
   */
  async getActiveProducts(): Promise<Product[]> {
    const products = await this.getProducts();
    return products.filter(p => p.isActive);
  }

  getActiveProductsSync(): Product[] {
    return this.getProductsSync().filter(p => p.isActive);
  }

  /**
   * Obter produto por ID
   */
  async getProductById(id: string): Promise<Product | undefined> {
    const products = await this.getProducts();
    return products.find(p => p.id === id);
  }

  /**
   * Adicionar novo produto
   */
  async addProduct(product: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>, updatedBy: string): Promise<Product> {
    try {
      const response = await fetch(`${API_URL}/products`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify({
          name: product.name,
          description: product.description,
          icon: product.icon,
          color: product.color,
          isActive: product.isActive,
          order: product.order || 1
        })
      });

      if (response.ok) {
        const result = await response.json();
        const newProduct = result.data || result;
        this.productsCache = null; // Invalidar cache
        return {
          ...newProduct,
          id: newProduct.id,
          createdAt: newProduct.created_at || new Date().toISOString(),
          updatedAt: newProduct.updated_at || new Date().toISOString()
        };
      }
    } catch (error) {
      console.error('Error adding product:', error);
    }

    // Fallback para localStorage
    const products = this.getProductsSync();
    const newProduct: Product = {
      ...product,
      id: `product-${Date.now()}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    products.push(newProduct);
    this.saveProductsSync(products, updatedBy);
    return newProduct;
  }

  /**
   * Atualizar produto
   */
  async updateProduct(id: string, updates: Partial<Product>, updatedBy: string): Promise<Product | null> {
    try {
      const response = await fetch(`${API_URL}/products/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify({
          name: updates.name,
          description: updates.description,
          icon: updates.icon,
          color: updates.color,
          isActive: updates.isActive,
          order: updates.order
        })
      });

      if (response.ok) {
        const result = await response.json();
        const updated = result.data || result;
        this.productsCache = null; // Invalidar cache
        return {
          ...updated,
          id: updated.id,
          createdAt: updated.created_at || new Date().toISOString(),
          updatedAt: updated.updated_at || new Date().toISOString()
        };
      }
    } catch (error) {
      console.error('Error updating product:', error);
    }

    // Fallback para localStorage
    const products = this.getProductsSync();
    const index = products.findIndex(p => p.id === id);
    if (index === -1) return null;

    products[index] = {
      ...products[index],
      ...updates,
      id: products[index].id,
      createdAt: products[index].createdAt,
      updatedAt: new Date().toISOString(),
    };
    this.saveProductsSync(products, updatedBy);
    return products[index];
  }

  /**
   * Deletar produto
   */
  async deleteProduct(id: string, updatedBy: string): Promise<boolean> {
    try {
      const response = await fetch(`${API_URL}/products/${id}`, {
        method: 'DELETE',
        credentials: 'include'
      });

      if (response.ok) {
        this.productsCache = null; // Invalidar cache
        return true;
      }
    } catch (error) {
      console.error('Error deleting product:', error);
    }

    // Fallback para localStorage
    const products = this.getProductsSync();
    const filtered = products.filter(p => p.id !== id);
    if (filtered.length === products.length) return false;
    this.saveProductsSync(filtered, updatedBy);
    return true;
  }

  /**
   * Reordenar produtos
   */
  async reorderProducts(productIds: string[], updatedBy: string): Promise<void> {
    // Atualizar cada produto com sua nova ordem
    for (let i = 0; i < productIds.length; i++) {
      await this.updateProduct(productIds[i], { order: i + 1 }, updatedBy);
    }
    this.productsCache = null; // Invalidar cache
  }

  /**
   * Restaurar produtos padrão
   */
  async resetToDefaults(updatedBy: string): Promise<void> {
    // Primeiro deletar todos os produtos existentes
    const products = await this.getProducts();
    for (const product of products) {
      await this.deleteProduct(product.id, updatedBy);
    }

    // Depois criar os produtos padrão
    for (const defaultProduct of DEFAULT_PRODUCTS) {
      await this.addProduct(defaultProduct, updatedBy);
    }
    this.productsCache = null;
  }

  /**
   * Salvar produtos (fallback localStorage)
   */
  private saveProductsSync(products: Product[], updatedBy: string): void {
    const settings: ProductSettings = {
      products,
      lastUpdated: new Date().toISOString(),
      updatedBy,
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
  }
}

export const productService = new ProductService();
export default productService;
