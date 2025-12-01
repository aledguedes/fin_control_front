import { Component, ChangeDetectionStrategy, inject, signal, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { DataService } from '../../services/data.service';
import { finalize } from 'rxjs';
import { FinancialCategory } from '../../models/transaction.model';

@Component({
  selector: 'app-categories',
  templateUrl: './categories.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, ReactiveFormsModule],
})
export class CategoriesComponent {
  dataService = inject(DataService);
  isSubmitting = signal(false);
  backToPanel = output<void>();

  categoryForm = new FormGroup({
    name: new FormControl('', [Validators.required]),
    type: new FormControl<'revenue' | 'expense'>('expense', [Validators.required]),
  });

  addCategory(): void {
    if (this.categoryForm.invalid) {
      return;
    }
    this.isSubmitting.set(true);
    const { name, type } = this.categoryForm.getRawValue();
    if (name && type) {
      this.dataService.addCategory({ name, type } as Omit<FinancialCategory, 'id'>).pipe(
        finalize(() => this.isSubmitting.set(false))
      ).subscribe({
        next: () => {
          this.categoryForm.reset({ name: '', type: 'expense' });
        }
      });
    }
  }
}
