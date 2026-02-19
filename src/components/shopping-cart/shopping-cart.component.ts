import {
  Component,
  ChangeDetectionStrategy,
  output,
  signal,
  computed,
  inject,
  effect,
  DestroyRef,
} from '@angular/core';
import { toObservable, takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { debounceTime } from 'rxjs/operators';
import { CommonModule } from '@angular/common';
import {
  FormsModule,
  ReactiveFormsModule,
  FormBuilder,
  Validators,
  FormGroup,
} from '@angular/forms';
import { ShoppingService } from '../../services/shopping.service';
import {
  ShoppingListItem,
  Product,
  ShoppingList,
  productUnits,
  ProductUnit,
} from '../../models/shopping.model';
import { CurrencyMaskDirective } from '../../directives/currency-mask.directive';
import { NotificationService } from '../../services/notification.service';
import { v4 as uuidv4 } from 'uuid';

@Component({
  selector: 'app-shopping-cart',
  templateUrl: './shopping-cart.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, CurrencyMaskDirective],
})
export class ShoppingCartComponent {
  completePurchase = output<ShoppingList>();

  shoppingService = inject(ShoppingService);
  notificationService = inject(NotificationService);
  destroyRef = inject(DestroyRef);
  private fb = inject(FormBuilder);

  productUnits = productUnits;
  productForm!: FormGroup;

  localList = signal<ShoppingList | null>(null);

  viewMode = signal<'list' | 'category'>('list');
  sortDirection = signal<'asc' | 'desc'>('asc');

  isQuickAddModalOpen = signal(false);
  quickAddSearchTerm = signal('');
  quickAddSelectedProductIds = signal<string[]>([]);
  isQuickAdding = signal(false);
  isAddingNewProduct = signal(false);

  items = computed(() => this.localList()?.items ?? []);
  total = computed(() => {
    return this.items().reduce((sum, item) => sum + item.price * item.quantity, 0);
  });

  constructor() {
    this.productForm = this.fb.group({
      name: ['', Validators.required],
      category_id: [null],
      unit: ['un' as ProductUnit, Validators.required],
    });

    effect(
      () => {
        const activeList = this.shoppingService.activeList();
        if (activeList) {
          const savedDraft = localStorage.getItem(`shopping_list_draft_${activeList.id}`);
          if (savedDraft) {
            try {
              const parsedDraft = JSON.parse(savedDraft);
              this.localList.set(parsedDraft);
              // Sync draft to API immediately on entry as requested
              this.shoppingService.syncList(parsedDraft, false).subscribe();
            } catch (e) {
              console.error('Failed to parse draft from local storage', e);
              this.localList.set(JSON.parse(JSON.stringify(activeList)));
            }
          } else {
            this.localList.set(JSON.parse(JSON.stringify(activeList)));
          }
        } else {
          this.localList.set(null);
        }
      },
      { allowSignalWrites: true },
    );

    toObservable(this.localList)
      .pipe(debounceTime(1000), takeUntilDestroyed(this.destroyRef))
      .subscribe((currentList) => {
        if (currentList && currentList.status === 'pending') {
          localStorage.setItem(
            `shopping_list_draft_${currentList.id}`,
            JSON.stringify(currentList),
          );
        }
      });
  }

  groupedItems = computed(() => {
    const items = this.items();
    const categories = this.shoppingService.shoppingCategories();

    const grouped: { categoryName: string; items: ShoppingListItem[] }[] = categories
      .map((category) => ({
        categoryName: category.name,
        items: items
          .filter((item) => String(item.category_id) === String(category.id))
          .sort((a, b) => a.name.localeCompare(b.name)),
      }))
      .filter((g) => g.items.length > 0);

    const uncategorizedItems = items.filter(
      (item) =>
        !item.category_id || !categories.some((c) => String(c.id) === String(item.category_id)),
    );
    if (uncategorizedItems.length > 0) {
      grouped.push({
        categoryName: 'Sem Categoria',
        items: uncategorizedItems.sort((a, b) => a.name.localeCompare(b.name)),
      });
    }
    return grouped;
  });

  sortedItems = computed(() => {
    const direction = this.sortDirection() === 'asc' ? 1 : -1;
    return [...this.items()].sort((a, b) => a.name.localeCompare(b.name) * direction);
  });

  private availableProducts = computed(() => {
    const productIdsInCart = new Set(this.items().map((item) => item.productId));
    return this.shoppingService.products().filter((p) => !productIdsInCart.has(p.id));
  });

  groupedAndFilteredQuickAddProducts = computed(() => {
    const searchTerm = this.quickAddSearchTerm().toLowerCase();
    const available = this.availableProducts();

    const filteredProducts = searchTerm
      ? available.filter((p) => p.name.toLowerCase().includes(searchTerm))
      : available;

    const categories = this.shoppingService.shoppingCategories();

    return categories
      .map((category) => ({
        categoryName: category.name,
        products: filteredProducts
          .filter((p) => p.category_id === category.id)
          .sort((a, b) => a.name.localeCompare(b.name)),
      }))
      .filter((g) => g.products.length > 0);
  });

  setViewMode(mode: 'list' | 'category'): void {
    this.viewMode.set(mode);
  }
  toggleSortDirection(): void {
    this.sortDirection.update((dir) => (dir === 'asc' ? 'desc' : 'asc'));
  }

  toggleQuickAddSelection(productId: string): void {
    this.quickAddSelectedProductIds.update((ids) => {
      const set = new Set(ids);
      if (set.has(productId)) {
        set.delete(productId);
      } else {
        set.add(productId);
      }
      return Array.from(set);
    });
  }

  showNewProductForm(): void {
    const searchTerm = this.quickAddSearchTerm().trim();
    this.productForm.patchValue({
      name: searchTerm,
      unit: 'un',
      category_id: null,
    });
    this.isAddingNewProduct.set(true);
  }

  cancelNewProduct(): void {
    this.isAddingNewProduct.set(false);
    this.productForm.reset({ unit: 'un', category_id: null });
  }

  addNewProduct(): void {
    if (this.productForm.invalid) return;

    this.isQuickAdding.set(true);
    const productData = this.productForm.getRawValue();

    this.shoppingService.addProduct(productData).subscribe({
      next: (newProduct) => {
        // Automatically select the newly created product
        this.toggleQuickAddSelection(newProduct.id);
        this.cancelNewProduct();
        this.isQuickAdding.set(false);
      },
      error: () => {
        this.isQuickAdding.set(false);
      },
    });
  }

  confirmQuickAdd(): void {
    const selectedIds = this.quickAddSelectedProductIds();
    if (selectedIds.length === 0) return;

    this.localList.update((list) => {
      if (!list) return null;
      const newItems: ShoppingListItem[] = selectedIds
        .map((productId) => {
          const product = this.shoppingService.products().find((p) => p.id === productId);
          if (!product) return null;
          return {
            id: uuidv4(),
            productId: product.id,
            name: product.name,
            quantity: 1,
            price: 0,
            checked: false,
            category_id: product.category_id,
            unit: product.unit,
          };
        })
        .filter((item) => item !== null);

      const updatedItems = [...list.items, ...newItems];
      return {
        ...list,
        items: updatedItems,
        total_amount: updatedItems.reduce((sum, item) => sum + item.price * item.quantity, 0),
      };
    });

    this.notificationService.show(`${selectedIds.length} itens adicionados!`, 'success');
    this.closeQuickAddModal();
  }

  closeQuickAddModal(): void {
    this.isQuickAddModalOpen.set(false);
    this.quickAddSelectedProductIds.set([]);
    this.quickAddSearchTerm.set('');
    this.isAddingNewProduct.set(false);
    this.productForm.reset({ unit: 'un', category_id: null });
  }

  updateItem(
    itemId: string,
    field: 'quantity' | 'price' | 'checked',
    value: number | boolean,
  ): void {
    this.localList.update((list) => {
      if (!list) return null;
      const updatedItems = list.items.map((item) => {
        if (item.id === itemId) {
          return { ...item, [field]: value };
        }
        return item;
      });

      return {
        ...list,
        items: updatedItems,
        total_amount: updatedItems.reduce((sum, item) => sum + item.price * item.quantity, 0),
      };
    });
  }

  removeItem(itemId: string): void {
    this.localList.update((list) => {
      if (!list) return null;
      const updatedItems = list.items.filter((item) => item.id !== itemId);
      return {
        ...list,
        items: updatedItems,
        total_amount: updatedItems.reduce((sum, item) => sum + item.price * item.quantity, 0),
      };
    });
  }

  toggleCheck(item: ShoppingListItem): void {
    this.updateItem(item.id, 'checked', !item.checked);
  }

  isCompletionModalOpen = signal(false);

  onCompletePurchase(): void {
    if (this.total() > 0) {
      this.isCompletionModalOpen.set(true);
    }
  }

  confirmCompletion(): void {
    const list = this.localList();
    if (list) {
      this.completePurchase.emit(list);
    }
    this.isCompletionModalOpen.set(false);
  }

  closeCompletionModal(): void {
    this.isCompletionModalOpen.set(false);
  }

  trackById(index: number, item: ShoppingListItem | Product): string {
    return item.id;
  }
}
