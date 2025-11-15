/**
 * Product Service
 *
 * Gerencia produtos customizáveis do sistema
 */

import type { Product, ProductSettings } from '../types/products';
import { DEFAULT_PRODUCTS } from '../types/products';

const STORAGE_KEY = 'partners_crm_products';

class ProductService {
  /**
   * Obter todos os produtos
   */
  getProducts(): Product[] {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        const settings: ProductSettings = JSON.parse(stored);
        return settings.products.sort((a, b) => a.order - b.order);
      } catch (error) {
        console.error('Error parsing products:', error);
        return DEFAULT_PRODUCTS;
      }
    }
    return DEFAULT_PRODUCTS;
  }

  /**
   * Obter produtos ativos
   */
  getActiveProducts(): Product[] {
    return this.getProducts().filter(p => p.isActive);
  }

  /**
   * Obter produto por ID
   */
  getProductById(id: string): Product | undefined {
    return this.getProducts().find(p => p.id === id);
  }

  /**
   * Salvar produtos
   */
  saveProducts(products: Product[], updatedBy: string): void {
    const settings: ProductSettings = {
      products,
      lastUpdated: new Date().toISOString(),
      updatedBy,
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
  }

  /**
   * Adicionar novo produto
   */
  addProduct(product: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>, updatedBy: string): Product {
    const products = this.getProducts();
    const newProduct: Product = {
      ...product,
      id: `product-${Date.now()}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    products.push(newProduct);
    this.saveProducts(products, updatedBy);
    return newProduct;
  }

  /**
   * Atualizar produto
   */
  updateProduct(id: string, updates: Partial<Product>, updatedBy: string): Product | null {
    const products = this.getProducts();
    const index = products.findIndex(p => p.id === id);

    if (index === -1) return null;

    products[index] = {
      ...products[index],
      ...updates,
      id: products[index].id, // Preserve ID
      createdAt: products[index].createdAt, // Preserve creation date
      updatedAt: new Date().toISOString(),
    };

    this.saveProducts(products, updatedBy);
    return products[index];
  }

  /**
   * Deletar produto
   */
  deleteProduct(id: string, updatedBy: string): boolean {
    const products = this.getProducts();
    const filtered = products.filter(p => p.id !== id);

    if (filtered.length === products.length) return false;

    this.saveProducts(filtered, updatedBy);
    return true;
  }

  /**
   * Reordenar produtos
   */
  reorderProducts(productIds: string[], updatedBy: string): void {
    const products = this.getProducts();
    const reordered = productIds.map((id, index) => {
      const product = products.find(p => p.id === id);
      if (!product) return null;
      return { ...product, order: index + 1 };
    }).filter(Boolean) as Product[];

    this.saveProducts(reordered, updatedBy);
  }

  /**
   * Restaurar produtos padrão
   */
  resetToDefaults(updatedBy: string): void {
    this.saveProducts(DEFAULT_PRODUCTS, updatedBy);
  }
}

export const productService = new ProductService();
export default productService;
