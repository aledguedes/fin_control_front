export type ProductUnit = 'un' | 'kg' | 'l' | 'dz' | 'm' | 'cx';

export const productUnits: { value: ProductUnit, label: string }[] = [
  { value: 'un', label: 'Unidade (un)' },
  { value: 'kg', label: 'Quilo (kg)' },
  { value: 'l', label: 'Litro (l)' },
  { value: 'dz', label: 'Dúzia (dz)' },
  { value: 'm', label: 'Metro (m)' },
  { value: 'cx', label: 'Caixa (cx)' }
];

export interface ShoppingCategory {
  id: string;
  name: string;
}

export interface Product {
  id: string;
  name: string;
  categoryId: string;
  unit: ProductUnit;
}

export interface CartItem {
  id: string;
  productId: string;
  name: string; // Denormalized for easier display
  quantity: number;
  price: number;
  checked: boolean;
  categoryId: string; // Denormalized for easier grouping
  unit: ProductUnit; // Denormalized for easier display
}

export interface ShoppingList {
  id: string;
  name: string;
  createdAt: string; // YYYY-MM-DD
  items: CartItem[];
  status: 'andamento' | 'finalizada';
  completedAt?: string; // YYYY-MM-DD
  totalAmount?: number;
}
