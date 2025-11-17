import { Injectable, signal, computed, effect } from '@angular/core';
import { v4 as uuidv4 } from 'uuid';
import { CartItem, ShoppingCategory, ShoppingList, Product } from '../models/shopping.model';

const SHOPPING_LISTS_STORAGE_KEY = 'shopping_lists';
const ACTIVE_LIST_ID_STORAGE_KEY = 'shopping_active_list_id';
const SHOPPING_CATEGORIES_STORAGE_KEY = 'shopping_categories';
const PRODUCTS_STORAGE_KEY = 'shopping_products';

@Injectable({ providedIn: 'root' })
export class ShoppingService {
  shoppingLists = signal<ShoppingList[]>(this.getListsFromStorage());
  activeListId = signal<string | null>(this.getActiveListIdFromStorage());
  shoppingCategories = signal<ShoppingCategory[]>(this.getCategoriesFromStorage());
  products = signal<Product[]>(this.getProductsFromStorage());
  
  activeList = computed(() => this.shoppingLists().find(l => l.id === this.activeListId()) || null);
  items = computed(() => this.activeList()?.items ?? []);
  total = computed(() => {
    return this.items().reduce((sum, item) => sum + item.price * item.quantity, 0);
  });

  constructor() {
    effect(() => {
      this.saveListsToStorage(this.shoppingLists());
      this.saveActiveListIdToStorage(this.activeListId());
      this.saveCategoriesToStorage(this.shoppingCategories());
      this.saveProductsToStorage(this.products());
    });
  }

  // --- List Management ---
  private getListsFromStorage(): ShoppingList[] { 
    const lists: ShoppingList[] = JSON.parse(localStorage.getItem(SHOPPING_LISTS_STORAGE_KEY) || '[]'); 
    const products = this.getProductsFromStorage();
    
    // Simple migration for old cart items
    return lists.map(list => ({
        ...list,
        items: list.items.map(item => {
            if ((item as any).unit) return item;
            const product = products.find(p => p.id === item.productId);
            return {
                ...item,
                unit: product?.unit || 'un'
            };
        })
    }));
  }
  private saveListsToStorage(lists: ShoppingList[]): void { localStorage.setItem(SHOPPING_LISTS_STORAGE_KEY, JSON.stringify(lists)); }
  private getActiveListIdFromStorage(): string | null { return localStorage.getItem(ACTIVE_LIST_ID_STORAGE_KEY); }
  private saveActiveListIdToStorage(id: string | null): void { id ? localStorage.setItem(ACTIVE_LIST_ID_STORAGE_KEY, id) : localStorage.removeItem(ACTIVE_LIST_ID_STORAGE_KEY); }

  createList(name: string): ShoppingList {
    const newList: ShoppingList = {
      id: uuidv4(),
      name,
      createdAt: new Date().toISOString().split('T')[0],
      items: [],
      status: 'andamento'
    };
    this.shoppingLists.update(lists => [...lists, newList]);
    return newList;
  }

  setActiveList(listId: string | null): void { this.activeListId.set(listId); }

  deleteList(listId: string, confirmDelete = true): void {
    const list = this.shoppingLists().find(l => l.id === listId);
    if (!list) return;
    if (confirmDelete && !confirm(`Tem certeza que deseja excluir a lista "${list.name}"?`)) return;
    this.shoppingLists.update(lists => lists.filter(l => l.id !== listId));
    if (this.activeListId() === listId) this.setActiveList(null);
  }
  
  completeActiveList(): void {
    const list = this.activeList();
    const total = this.total();
    if (!list || list.items.length === 0 || total <= 0) return;

    this.shoppingLists.update(lists =>
      lists.map(l =>
        l.id === list.id
          ? {
              ...l,
              status: 'finalizada',
              completedAt: new Date().toISOString().split('T')[0],
              totalAmount: total,
            }
          : l
      )
    );
    this.setActiveList(null);
  }

  // --- Category Management ---
  private getCategoriesFromStorage(): ShoppingCategory[] { return JSON.parse(localStorage.getItem(SHOPPING_CATEGORIES_STORAGE_KEY) || '[]'); }
  private saveCategoriesToStorage(categories: ShoppingCategory[]): void { localStorage.setItem(SHOPPING_CATEGORIES_STORAGE_KEY, JSON.stringify(categories)); }
  
  addShoppingCategory(name: string): void {
    const newCategory: ShoppingCategory = { id: uuidv4(), name };
    this.shoppingCategories.update(categories => [...categories, newCategory]);
  }

  updateShoppingCategory(updatedCategory: ShoppingCategory): void { this.shoppingCategories.update(c => c.map(cat => cat.id === updatedCategory.id ? updatedCategory : cat)); }

  deleteShoppingCategory(id: string): void {
    const isUsedInProducts = this.products().some(p => p.categoryId === id);
    if (isUsedInProducts) {
      alert('Esta categoria está em uso por um ou mais produtos e não pode ser excluída.');
      return;
    }
    this.shoppingCategories.update(categories => categories.filter(c => c.id !== id));
  }
  
  // --- Product Management ---
  private getProductsFromStorage(): Product[] { 
    const products = JSON.parse(localStorage.getItem(PRODUCTS_STORAGE_KEY) || '[]');
    // Simple migration for old data lacking a unit
    return products.map((p: any) => ({ ...p, unit: p.unit || 'un' }));
  }
  private saveProductsToStorage(products: Product[]): void { localStorage.setItem(PRODUCTS_STORAGE_KEY, JSON.stringify(products)); }

  addProduct(product: Omit<Product, 'id'>): void {
    const newProduct: Product = { ...product, id: uuidv4() };
    this.products.update(p => [...p, newProduct]);
  }

  updateProduct(updatedProduct: Product): void { this.products.update(p => p.map(prod => prod.id === updatedProduct.id ? updatedProduct : prod)); }
  
  deleteProduct(id: string): void {
    const isUsedInLists = this.shoppingLists().some(list => list.items.some(item => item.productId === id));
    if (isUsedInLists) {
      alert('Este produto está em uso em uma ou mais listas de compras e não pode ser excluído.');
      return;
    }
    this.products.update(p => p.filter(prod => prod.id !== id));
  }

  // --- Active List Item Management ---
  addItem(item: { productId: string; quantity: number; price: number }): void {
    const listId = this.activeListId();
    const product = this.products().find(p => p.id === item.productId);
    if (!listId || !product || !item.quantity || item.price === undefined) return;

    const newItem: CartItem = { 
      id: uuidv4(), 
      productId: product.id,
      name: product.name,
      categoryId: product.categoryId,
      unit: product.unit,
      quantity: item.quantity,
      price: item.price,
      checked: false 
    };
    this.shoppingLists.update(lists => lists.map(l => l.id === listId ? { ...l, items: [...l.items, newItem] } : l));
  }

  removeItem(itemId: string): void {
    const listId = this.activeListId();
    if (!listId) return;
    this.shoppingLists.update(l => l.map(list => list.id === listId ? { ...list, items: list.items.filter(i => i.id !== itemId) } : list));
  }

  updateItem(updatedItem: CartItem): void {
    const listId = this.activeListId();
    if (!listId) return;
    this.shoppingLists.update(l => l.map(list => list.id === listId ? { ...list, items: list.items.map(i => i.id === updatedItem.id ? updatedItem : i) } : list));
  }

  toggleItemChecked(itemId: string): void {
    const listId = this.activeListId();
    if (!listId) return;
    this.shoppingLists.update(l => l.map(list => list.id === listId ? { ...list, items: list.items.map(i => i.id === itemId ? { ...i, checked: !i.checked } : i) } : list));
  }

  clearActiveList(): void {
    const list = this.activeList();
    if (!list) return;
    if (confirm(`Tem certeza que deseja limpar todos os itens da lista "${list.name}"?`)) {
        this.shoppingLists.update(l => l.map(li => li.id === list.id ? { ...li, items: [] } : li));
    }
  }
}
