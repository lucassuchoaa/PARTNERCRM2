/**
 * Product Configuration Types
 *
 * Sistema de produtos customizáveis para o CRM
 */

export interface Product {
  id: string;
  name: string;
  description: string;
  icon: string; // Heroicon name ou URL da imagem
  color: string; // Tailwind color class (e.g., 'blue', 'green', 'purple')
  isActive: boolean;
  order: number;
  createdAt: string;
  updatedAt: string;
}

export interface ProductSettings {
  products: Product[];
  lastUpdated: string;
  updatedBy: string;
}

// Default products (can be customized)
export const DEFAULT_PRODUCTS: Product[] = [
  {
    id: 'product-1',
    name: 'Folha de Pagamento',
    description: 'Pagamento 100% digital',
    icon: 'CreditCardIcon',
    color: 'blue',
    isActive: true,
    order: 1,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'product-2',
    name: 'Crédito Consignado',
    description: 'Crédito pré-aprovado',
    icon: 'BanknotesIcon',
    color: 'green',
    isActive: true,
    order: 2,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'product-3',
    name: 'Benefícios Flexíveis',
    description: 'Cartão de benefícios',
    icon: 'GiftIcon',
    color: 'purple',
    isActive: true,
    order: 3,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];
