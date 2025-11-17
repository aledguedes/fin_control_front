import { Component, ChangeDetectionStrategy, output, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ShoppingService } from '../../services/shopping.service';
import { CartItem, Product } from '../../models/shopping.model';
import { CurrencyMaskDirective } from '../../directives/currency-mask.directive';

@Component({
  selector: 'app-shopping-cart',
  templateUrl: './shopping-cart.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, FormsModule, CurrencyMaskDirective],
})
export class ShoppingCartComponent {
  completePurchase = output<void>();

  newItem = signal({ productId: '', quantity: 1, price: undefined as number | undefined });
  viewMode = signal<'list' | 'category'>('list'); // 'list' is the new default
  sortDirection = signal<'asc' | 'desc'>('asc');

  constructor(public shoppingService: ShoppingService) {}
  
  productsByCategory = computed(() => {
    const products = this.shoppingService.products();
    const categories = this.shoppingService.shoppingCategories();
    const grouped: { categoryName: string; products: Product[] }[] = [];

    categories.forEach(category => {
      const productsInCategory = products.filter(p => p.categoryId === category.id);
      if (productsInCategory.length > 0) {
        grouped.push({
          categoryName: category.name,
          products: productsInCategory.sort((a, b) => a.name.localeCompare(b.name)),
        });
      }
    });
    return grouped;
  });

  groupedItems = computed(() => {
    const items = this.shoppingService.items();
    const categories = this.shoppingService.shoppingCategories();
    const grouped: { categoryName: string; items: CartItem[] }[] = [];

    categories.forEach(category => {
      const itemsInCategory = items.filter(item => item.categoryId === category.id);
      if (itemsInCategory.length > 0) {
        grouped.push({
          categoryName: category.name,
          items: itemsInCategory.sort((a,b) => a.name.localeCompare(b.name)),
        });
      }
    });

    const uncategorizedItems = items.filter(item => !item.categoryId || !categories.some(c => c.id === item.categoryId));
    if (uncategorizedItems.length > 0) {
      grouped.push({
        categoryName: 'Sem Categoria',
        items: uncategorizedItems.sort((a,b) => a.name.localeCompare(b.name)),
      });
    }

    return grouped;
  });

  sortedItems = computed(() => {
    const direction = this.sortDirection() === 'asc' ? 1 : -1;
    return this.shoppingService.items().slice().sort((a, b) => {
        return a.name.localeCompare(b.name) * direction;
    });
  });
  
  availableProductsForTags = computed(() => {
    const allProducts = this.shoppingService.products();
    const itemsInCart = this.shoppingService.items();
    const productIdsInCart = new Set(itemsInCart.map(item => item.productId));
    return allProducts.filter(p => !productIdsInCart.has(p.id)).sort((a, b) => a.name.localeCompare(b.name));
  });

  setViewMode(mode: 'list' | 'category'): void {
    this.viewMode.set(mode);
  }

  toggleSortDirection(): void {
    this.sortDirection.update(dir => dir === 'asc' ? 'desc' : 'asc');
  }

  addItem(): void {
    const { productId, quantity, price } = this.newItem();
    if (productId && quantity > 0 && price !== undefined && price >= 0) {
      this.shoppingService.addItem({ productId, price, quantity });
      this.newItem.set({ productId: '', quantity: 1, price: undefined });
    } else {
        alert('Por favor, selecione um produto e informe a quantidade e o preço.');
    }
  }
  
  addItemFromTag(product: Product): void {
    this.shoppingService.addItem({
      productId: product.id,
      quantity: 1,
      price: 0
    });
  }

  updateItem(item: CartItem): void {
    this.shoppingService.updateItem({ ...item });
  }

  removeItem(id: string): void {
    this.shoppingService.removeItem(id);
  }

  toggleCheck(id: string): void {
    this.shoppingService.toggleItemChecked(id);
  }
  
  onCompletePurchase(): void {
    const total = this.shoppingService.total();
    if (total > 0) {
        if(confirm('Concluir a compra irá arquivar a lista atual e abrir o formulário de lançamento. Deseja continuar?')) {
            this.completePurchase.emit();
        }
    }
  }

  trackById(index: number, item: CartItem): string {
    return item.id;
  }
}