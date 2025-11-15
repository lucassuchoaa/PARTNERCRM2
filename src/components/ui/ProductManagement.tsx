/**
 * Product Management Component
 *
 * Interface administrativa para gerenciar produtos customizáveis
 */

import { useState, useEffect } from 'react';
import { Dialog } from '@headlessui/react';
import {
  PlusIcon,
  PencilIcon,
  TrashIcon,
  ArrowUpIcon,
  ArrowDownIcon,
  CheckIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';
import * as HeroIcons from '@heroicons/react/24/outline';
import { productService } from '../../services/productService';
import type { Product } from '../../types/products';

const AVAILABLE_ICONS = [
  'CreditCardIcon',
  'BanknotesIcon',
  'GiftIcon',
  'ShoppingCartIcon',
  'TruckIcon',
  'DevicePhoneMobileIcon',
  'ComputerDesktopIcon',
  'HomeIcon',
  'BuildingOfficeIcon',
  'AcademicCapIcon',
  'HeartIcon',
  'ShieldCheckIcon',
];

const AVAILABLE_COLORS = [
  { name: 'Blue', value: 'blue', bg: 'bg-blue-100', text: 'text-blue-600' },
  { name: 'Green', value: 'green', bg: 'bg-green-100', text: 'text-green-600' },
  { name: 'Purple', value: 'purple', bg: 'bg-purple-100', text: 'text-purple-600' },
  { name: 'Red', value: 'red', bg: 'bg-red-100', text: 'text-red-600' },
  { name: 'Yellow', value: 'yellow', bg: 'bg-yellow-100', text: 'text-yellow-600' },
  { name: 'Indigo', value: 'indigo', bg: 'bg-indigo-100', text: 'text-indigo-600' },
  { name: 'Pink', value: 'pink', bg: 'bg-pink-100', text: 'text-pink-600' },
  { name: 'Cyan', value: 'cyan', bg: 'bg-cyan-100', text: 'text-cyan-600' },
];

interface ProductManagementProps {
  currentUser: any;
}

export default function ProductManagement({ currentUser }: ProductManagementProps) {
  const [products, setProducts] = useState<Product[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    icon: 'CreditCardIcon',
    color: 'blue',
    isActive: true,
  });

  useEffect(() => {
    loadProducts();
  }, []);

  const loadProducts = () => {
    const loaded = productService.getProducts();
    setProducts(loaded);
  };

  const handleAdd = () => {
    setEditingProduct(null);
    setFormData({
      name: '',
      description: '',
      icon: 'CreditCardIcon',
      color: 'blue',
      isActive: true,
    });
    setIsModalOpen(true);
  };

  const handleEdit = (product: Product) => {
    setEditingProduct(product);
    setFormData({
      name: product.name,
      description: product.description,
      icon: product.icon,
      color: product.color,
      isActive: product.isActive,
    });
    setIsModalOpen(true);
  };

  const handleSave = () => {
    if (!formData.name.trim()) {
      alert('Nome do produto é obrigatório');
      return;
    }

    if (editingProduct) {
      productService.updateProduct(
        editingProduct.id,
        {
          ...formData,
          order: editingProduct.order,
        },
        currentUser?.email || 'admin'
      );
    } else {
      productService.addProduct(
        {
          ...formData,
          order: products.length + 1,
        },
        currentUser?.email || 'admin'
      );
    }

    loadProducts();
    setIsModalOpen(false);
  };

  const handleDelete = (product: Product) => {
    if (!confirm(`Tem certeza que deseja excluir "${product.name}"?`)) return;

    productService.deleteProduct(product.id, currentUser?.email || 'admin');
    loadProducts();
  };

  const handleMoveUp = (index: number) => {
    if (index === 0) return;
    const newProducts = [...products];
    [newProducts[index - 1], newProducts[index]] = [newProducts[index], newProducts[index - 1]];
    productService.reorderProducts(
      newProducts.map(p => p.id),
      currentUser?.email || 'admin'
    );
    loadProducts();
  };

  const handleMoveDown = (index: number) => {
    if (index === products.length - 1) return;
    const newProducts = [...products];
    [newProducts[index], newProducts[index + 1]] = [newProducts[index + 1], newProducts[index]];
    productService.reorderProducts(
      newProducts.map(p => p.id),
      currentUser?.email || 'admin'
    );
    loadProducts();
  };

  const handleToggleActive = (product: Product) => {
    productService.updateProduct(
      product.id,
      { isActive: !product.isActive },
      currentUser?.email || 'admin'
    );
    loadProducts();
  };

  const handleResetDefaults = () => {
    if (!confirm('Tem certeza que deseja restaurar os produtos padrão? Isso vai remover todas as customizações.')) return;

    productService.resetToDefaults(currentUser?.email || 'admin');
    loadProducts();
  };

  const getIconComponent = (iconName: string) => {
    const Icon = (HeroIcons as any)[iconName];
    return Icon ? <Icon className="h-6 w-6" /> : <HeroIcons.QuestionMarkCircleIcon className="h-6 w-6" />;
  };

  const getColorClasses = (color: string) => {
    const colorMap: Record<string, { bg: string; text: string }> = {
      blue: { bg: 'bg-blue-100', text: 'text-blue-600' },
      green: { bg: 'bg-green-100', text: 'text-green-600' },
      purple: { bg: 'bg-purple-100', text: 'text-purple-600' },
      red: { bg: 'bg-red-100', text: 'text-red-600' },
      yellow: { bg: 'bg-yellow-100', text: 'text-yellow-600' },
      indigo: { bg: 'bg-indigo-100', text: 'text-indigo-600' },
      pink: { bg: 'bg-pink-100', text: 'text-pink-600' },
      cyan: { bg: 'bg-cyan-100', text: 'text-cyan-600' },
    };
    return colorMap[color] || colorMap.blue;
  };

  return (
    <div className="px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="sm:flex sm:items-center sm:justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Gerenciar Produtos</h1>
          <p className="mt-2 text-sm text-gray-700">
            Customize os produtos exibidos no sistema. Arraste para reordenar ou edite as informações.
          </p>
        </div>
        <div className="mt-4 sm:mt-0 space-x-3">
          <button
            onClick={handleResetDefaults}
            className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            Restaurar Padrões
          </button>
          <button
            onClick={handleAdd}
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            <PlusIcon className="-ml-1 mr-2 h-5 w-5" />
            Adicionar Produto
          </button>
        </div>
      </div>

      {/* Products List */}
      <div className="bg-white shadow-sm ring-1 ring-gray-900/5 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-300">
            <thead className="bg-gray-50">
              <tr>
                <th className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 sm:pl-6">
                  Ordem
                </th>
                <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                  Produto
                </th>
                <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                  Descrição
                </th>
                <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                  Status
                </th>
                <th className="relative py-3.5 pl-3 pr-4 sm:pr-6">
                  <span className="sr-only">Ações</span>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 bg-white">
              {products.map((product, index) => {
                const colorClasses = getColorClasses(product.color);
                return (
                  <tr key={product.id} className={!product.isActive ? 'opacity-50' : ''}>
                    <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm sm:pl-6">
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => handleMoveUp(index)}
                          disabled={index === 0}
                          className="p-1 text-gray-400 hover:text-gray-600 disabled:opacity-30 disabled:cursor-not-allowed"
                        >
                          <ArrowUpIcon className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleMoveDown(index)}
                          disabled={index === products.length - 1}
                          className="p-1 text-gray-400 hover:text-gray-600 disabled:opacity-30 disabled:cursor-not-allowed"
                        >
                          <ArrowDownIcon className="h-4 w-4" />
                        </button>
                        <span className="font-medium text-gray-900">{product.order}</span>
                      </div>
                    </td>
                    <td className="whitespace-nowrap px-3 py-4 text-sm">
                      <div className="flex items-center">
                        <div className={`flex-shrink-0 h-10 w-10 rounded-lg ${colorClasses.bg} ${colorClasses.text} flex items-center justify-center`}>
                          {getIconComponent(product.icon)}
                        </div>
                        <div className="ml-4">
                          <div className="font-medium text-gray-900">{product.name}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-3 py-4 text-sm text-gray-500">
                      {product.description}
                    </td>
                    <td className="whitespace-nowrap px-3 py-4 text-sm">
                      <button
                        onClick={() => handleToggleActive(product)}
                        className={`inline-flex items-center px-2.5 py-1.5 rounded-full text-xs font-medium ${
                          product.isActive
                            ? 'bg-green-100 text-green-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}
                      >
                        {product.isActive ? 'Ativo' : 'Inativo'}
                      </button>
                    </td>
                    <td className="relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-6">
                      <button
                        onClick={() => handleEdit(product)}
                        className="text-blue-600 hover:text-blue-900 mr-4"
                      >
                        <PencilIcon className="h-5 w-5" />
                      </button>
                      <button
                        onClick={() => handleDelete(product)}
                        className="text-red-600 hover:text-red-900"
                      >
                        <TrashIcon className="h-5 w-5" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      <Dialog open={isModalOpen} onClose={() => setIsModalOpen(false)} className="relative z-50">
        <div className="fixed inset-0 bg-black/30" aria-hidden="true" />

        <div className="fixed inset-0 flex items-center justify-center p-4">
          <Dialog.Panel className="mx-auto max-w-2xl w-full rounded-xl bg-white p-6 shadow-2xl">
            <Dialog.Title className="text-2xl font-bold text-gray-900 mb-6">
              {editingProduct ? 'Editar Produto' : 'Novo Produto'}
            </Dialog.Title>

            <div className="space-y-6">
              {/* Nome */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nome do Produto *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="block w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  placeholder="Ex: Folha de Pagamento"
                />
              </div>

              {/* Descrição */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Descrição
                </label>
                <input
                  type="text"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="block w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  placeholder="Ex: Pagamento 100% digital"
                />
              </div>

              {/* Ícone */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Ícone
                </label>
                <div className="grid grid-cols-6 gap-2">
                  {AVAILABLE_ICONS.map((iconName) => {
                    const Icon = (HeroIcons as any)[iconName];
                    const colorClasses = getColorClasses(formData.color);
                    return (
                      <button
                        key={iconName}
                        onClick={() => setFormData({ ...formData, icon: iconName })}
                        className={`p-3 rounded-lg border-2 ${
                          formData.icon === iconName
                            ? `border-blue-500 ${colorClasses.bg}`
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        {Icon && <Icon className={`h-6 w-6 mx-auto ${formData.icon === iconName ? colorClasses.text : 'text-gray-400'}`} />}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Cor */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Cor
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {AVAILABLE_COLORS.map((color) => (
                    <button
                      key={color.value}
                      onClick={() => setFormData({ ...formData, color: color.value })}
                      className={`p-3 rounded-lg border-2 ${
                        formData.color === color.value
                          ? 'border-blue-500'
                          : 'border-gray-200 hover:border-gray-300'
                      } ${color.bg}`}
                    >
                      <div className="flex items-center justify-center">
                        <div className={`h-6 w-6 rounded-full ${color.bg} ${color.text} flex items-center justify-center font-medium text-sm`}>
                          {formData.color === color.value && <CheckIcon className="h-4 w-4" />}
                        </div>
                        <span className={`ml-2 text-sm font-medium ${color.text}`}>
                          {color.name}
                        </span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Status */}
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="isActive"
                  checked={formData.isActive}
                  onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label htmlFor="isActive" className="ml-2 block text-sm text-gray-900">
                  Produto ativo
                </label>
              </div>
            </div>

            <div className="mt-8 flex justify-end space-x-3">
              <button
                onClick={() => setIsModalOpen(false)}
                className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Cancelar
              </button>
              <button
                onClick={handleSave}
                className="px-4 py-2 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
              >
                {editingProduct ? 'Salvar Alterações' : 'Criar Produto'}
              </button>
            </div>
          </Dialog.Panel>
        </div>
      </Dialog>
    </div>
  );
}
