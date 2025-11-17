import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TransactionFormComponent } from './components/transaction-form/transaction-form.component';
import { DataService } from './services/data.service';
import { Transaction } from './models/transaction.model';
import { ShoppingHomeComponent } from './components/shopping-home/shopping-home.component';
import { InitialDashboardComponent } from './components/initial-dashboard/initial-dashboard.component';
import { FinancialHomeComponent } from './components/financial-home/financial-home.component';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, InitialDashboardComponent, FinancialHomeComponent, ShoppingHomeComponent, TransactionFormComponent],
})
export class AppComponent {
  activeView = signal<'initial-dashboard' | 'financial' | 'shopping'>('initial-dashboard');
  isModalOpen = signal(false);
  editingTransaction = signal<Partial<Transaction> | null>(null);

  constructor(private dataService: DataService) {}

  setView(view: 'initial-dashboard' | 'financial' | 'shopping'): void {
    this.activeView.set(view);
  }

  openTransactionModal(transaction: Partial<Transaction> | null = null): void {
    this.editingTransaction.set(transaction);
    this.isModalOpen.set(true);
  }

  closeTransactionModal(): void {
    this.isModalOpen.set(false);
    this.editingTransaction.set(null);
  }

  handleSaveTransaction(transaction: Transaction): void {
    const isEditing = this.editingTransaction() && this.editingTransaction()!.id;
    if (isEditing) {
      this.dataService.updateTransaction(transaction);
    } else {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { id, ...newTransactionData } = transaction;
      this.dataService.addTransaction(newTransactionData);
      
      // Se for uma nova despesa parcelada, navega para o módulo financeiro e aciona a visualização de parcelamentos.
      if (transaction.isInstallment) {
        this.setView('financial');
        this.dataService.triggerInstallmentsNavigation();
      }
    }
    this.closeTransactionModal();
  }
  
  handleCompletePurchase(data: { total: number; name: string }): void {
    const purchaseDetails: Partial<Transaction> = {
      type: 'expense',
      amount: data.total,
      description: `Compras: ${data.name}`,
      date: new Date().toISOString().split('T')[0],
      categoryId: 'c4', // 'Alimentação' category from mock data
      paymentMethod: 'Débito',
    };
    this.openTransactionModal(purchaseDetails);
  }
}
