import { Component, ChangeDetectionStrategy, signal, output, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DashboardComponent } from '../dashboard/dashboard.component';
import { InstallmentsComponent } from '../installments/installments.component';
import { CategoriesComponent } from '../categories/categories.component';
import { Transaction } from '../../models/transaction.model';
import { DataService } from '../../services/data.service';

@Component({
  selector: 'app-financial-home',
  templateUrl: './financial-home.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, DashboardComponent, InstallmentsComponent, CategoriesComponent],
  standalone: true,
})
export class FinancialHomeComponent {
  activeView = signal<'dashboard' | 'installments' | 'categories'>('dashboard');

  openTransactionModal = output<Partial<Transaction> | null>();
  editTransaction = output<Transaction>();

  constructor(private dataService: DataService) {
    effect(() => {
      if (this.dataService.navigateToInstallments()) {
        this.setView('installments');
        this.dataService.resetInstallmentsNavigation();
      }
    });
  }

  setView(view: 'dashboard' | 'installments' | 'categories'): void {
    this.activeView.set(view);
  }

  onNewTransaction(): void {
    this.openTransactionModal.emit(null);
  }
}