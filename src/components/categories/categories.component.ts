import { Component, ChangeDetectionStrategy, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DataService } from '../../services/data.service';
import { Category } from '../../models/transaction.model';

@Component({
  selector: 'app-categories',
  templateUrl: './categories.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, FormsModule],
})
export class CategoriesComponent {
  newCategoryName = signal('');
  newCategoryType = signal<'revenue' | 'expense'>('expense');

  constructor(public dataService: DataService) {}

  addCategory(): void {
    const name = this.newCategoryName().trim();
    if (name) {
      this.dataService.addCategory({ name, type: this.newCategoryType() });
      this.newCategoryName.set('');
    }
  }

  getRevenueCategories() {
    return this.dataService.allCategories().filter(c => c.type === 'revenue');
  }

  getExpenseCategories() {
    return this.dataService.allCategories().filter(c => c.type === 'expense');
  }
}
