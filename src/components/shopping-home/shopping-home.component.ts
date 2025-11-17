import { Component, ChangeDetectionStrategy, output, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ShoppingCartComponent } from '../shopping-cart/shopping-cart.component';
import { ShoppingService } from '../../services/shopping.service';
import { ShoppingList, ShoppingCategory, Product, ProductUnit, productUnits } from '../../models/shopping.model';

@Component({
  selector: 'app-shopping-home',
  templateUrl: './shopping-home.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, ShoppingCartComponent, FormsModule],
})
export class ShoppingHomeComponent {
  completePurchase = output<{ total: number; name: string }>();
  
  // Expose to template
  productUnits = productUnits;

  // View management
  view = signal<'dashboard' | 'categories' | 'products'>('dashboard');

  // Modal state for creating a list
  isCreateListModalOpen = signal(false);
  newListName = signal('');
  
  // Category management state
  newCategoryName = signal('');
  editingCategoryId = signal<string | null>(null);
  editingCategoryName = signal('');
  
  // Product management state
  newProductName = signal('');
  newProductCategoryId = signal('');
  newProductUnit = signal<ProductUnit>('un');
  editingProductId = signal<string | null>(null);
  // FIX: The Product type already includes 'unit', so the intersection was redundant.
  editingProduct = signal<Product | null>(null);
  
  constructor(public shoppingService: ShoppingService) {}
  
  sortedShoppingLists = computed(() => {
    return this.shoppingService.shoppingLists().slice().sort((a, b) => {
      if (a.status === 'andamento' && b.status === 'finalizada') return -1;
      if (a.status === 'finalizada' && b.status === 'andamento') return 1;
      
      const dateA = new Date(a.completedAt || a.createdAt).getTime();
      const dateB = new Date(b.completedAt || b.createdAt).getTime();
      return dateB - dateA;
    });
  });

  productsGroupedByCategory = computed(() => {
      const products = this.shoppingService.products();
      const categories = this.shoppingService.shoppingCategories();
      const grouped = categories.map(cat => ({
          ...cat,
          products: products.filter(p => p.categoryId === cat.id).sort((a,b) => a.name.localeCompare(b.name))
      }));
      return grouped.filter(g => g.products.length > 0);
  });

  handleCompletePurchase(): void {
    const activeList = this.shoppingService.activeList();
    if (!activeList) return;

    const eventPayload = {
      total: this.shoppingService.total(),
      name: activeList.name,
    };
    
    this.shoppingService.completeActiveList();
    this.completePurchase.emit(eventPayload);
  }
  
  trackById(index: number, item: ShoppingCategory | ShoppingList | Product): string {
    return item.id;
  }

  getUnitLabel(unitValue: ProductUnit | undefined): string {
    if (!unitValue) return '';
    return this.productUnits.find(u => u.value === unitValue)?.label ?? unitValue;
  }
  
  selectList(listId: string): void {
    this.shoppingService.setActiveList(listId);
  }

  createList(): void {
    const name = this.newListName().trim();
    if (name) {
      const newList = this.shoppingService.createList(name);
      this.shoppingService.setActiveList(newList.id);
      this.newListName.set('');
      this.isCreateListModalOpen.set(false);
    }
  }

  deleteList(listId: string): void {
    this.shoppingService.deleteList(listId);
  }

  goBackToDashboard(): void {
    this.shoppingService.setActiveList(null);
    this.view.set('dashboard');
  }
  
  // --- Category Management Methods ---
  addCategory(): void {
    const name = this.newCategoryName().trim();
    if (name) {
      this.shoppingService.addShoppingCategory(name);
      this.newCategoryName.set('');
    }
  }
  
  deleteCategory(id: string): void {
    if (confirm('Tem certeza que deseja excluir esta categoria?')) {
      this.shoppingService.deleteShoppingCategory(id);
    }
  }

  startEditCategory(category: ShoppingCategory): void {
    this.editingCategoryId.set(category.id);
    this.editingCategoryName.set(category.name);
  }

  cancelEditCategory(): void {
    this.editingCategoryId.set(null);
    this.editingCategoryName.set('');
  }

  saveCategory(id: string): void {
    const name = this.editingCategoryName().trim();
    if (name && id) {
      this.shoppingService.updateShoppingCategory({ id, name });
      this.cancelEditCategory();
    }
  }
  
  // --- Product Management Methods ---
  addProduct(): void {
    const name = this.newProductName().trim();
    const categoryId = this.newProductCategoryId();
    const unit = this.newProductUnit();
    if (name && categoryId) {
      this.shoppingService.addProduct({ name, categoryId, unit });
      this.newProductName.set('');
      this.newProductCategoryId.set('');
      this.newProductUnit.set('un');
    }
  }
  
  deleteProduct(id: string): void {
    if (confirm('Tem certeza que deseja excluir este produto?')) {
      this.shoppingService.deleteProduct(id);
    }
  }
  
  startEditProduct(product: Product): void {
    this.editingProductId.set(product.id);
    this.editingProduct.set({...product});
  }

  cancelEditProduct(): void {
    this.editingProductId.set(null);
    this.editingProduct.set(null);
  }
  
  saveProduct(): void {
    const product = this.editingProduct();
    // FIX: Replaced 'and' with the correct logical AND operator '&&'.
    if (product && product.name.trim() && product.categoryId) {
      this.shoppingService.updateProduct(product);
      this.cancelEditProduct();
    }
  }
}
