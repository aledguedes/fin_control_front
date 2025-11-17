import { Component, ChangeDetectionStrategy, signal, computed, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DataService } from '../../services/data.service';
import { InstallmentEntry, Transaction } from '../../models/transaction.model';

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule],
})
export class DashboardComponent {
  editTransaction = output<Transaction>();
  
  currentDate = signal(new Date());

  monthlyTransactions = computed(() => {
    return this.dataService.getTransactionsForMonth(this.currentDate());
  });

  constructor(public dataService: DataService) {}

  monthlySummary = computed(() => {
    const transactions = this.monthlyTransactions();
    let totalRevenue = 0;
    let totalExpense = 0;

    transactions.forEach(t => {
      if ('type' in t) { // It's a Transaction
        if (t.type === 'revenue') {
          totalRevenue += t.amount;
        } else if (!t.isInstallment) {
          totalExpense += t.amount;
        }
      } else { // It's an InstallmentEntry
        totalExpense += t.amount;
      }
    });

    return {
      totalRevenue,
      totalExpense,
      balance: totalRevenue - totalExpense,
    };
  });

  changeMonth(offset: number): void {
    this.currentDate.update(date => {
      const newDate = new Date(date);
      newDate.setMonth(newDate.getMonth() + offset);
      return newDate;
    });
  }
  
  getCategoryName(categoryId: string): string {
    return this.dataService.getCategoryById(categoryId)?.name ?? 'Sem Categoria';
  }

  isInstallmentEntry(item: Transaction | InstallmentEntry): item is InstallmentEntry {
    return 'parentTransactionId' in item;
  }

  trackById(index: number, item: Transaction | InstallmentEntry): string {
      if(this.isInstallmentEntry(item)) {
          return item.parentTransactionId + item.installmentNumber;
      }
      return item.id;
  }
  
  onEdit(item: Transaction | InstallmentEntry) {
    if(this.isInstallmentEntry(item)) {
        // Find the parent transaction to edit
        const parent = this.dataService.allTransactions().find(t => t.id === item.parentTransactionId);
        if(parent) {
            this.editTransaction.emit(parent);
        }
    } else {
        this.editTransaction.emit(item);
    }
  }

  onDelete(item: Transaction | InstallmentEntry) {
    const idToDelete = this.isInstallmentEntry(item) ? item.parentTransactionId : item.id;
    if (confirm('Tem certeza que deseja excluir este lançamento e todas as suas parcelas (se houver)?')) {
        this.dataService.deleteTransaction(idToDelete);
    }
  }
}
