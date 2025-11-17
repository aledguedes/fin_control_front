import { Injectable, signal, computed, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Transaction, Category, InstallmentEntry, InstallmentPlan } from '../models/transaction.model';

@Injectable({
  providedIn: 'root',
})
export class DataService {
  private http = inject(HttpClient);
  private baseUrl = '/api'; // Placeholder for the backend API URL

  private transactions = signal<Transaction[]>([]);
  private categories = signal<Category[]>([]);
  private _navigateToInstallments = signal(false);

  allTransactions = this.transactions.asReadonly();
  allCategories = this.categories.asReadonly();
  navigateToInstallments = this._navigateToInstallments.asReadonly();

  constructor() {
    this.loadInitialData();
  }

  private loadInitialData(): void {
    this.http.get<Transaction[]>(`${this.baseUrl}/transactions`).subscribe({
      next: data => this.transactions.set(data),
      error: err => console.error('Failed to load transactions', err)
    });

    this.http.get<Category[]>(`${this.baseUrl}/categories`).subscribe({
      next: data => this.categories.set(data),
      error: err => console.error('Failed to load categories', err)
    });
  }

  // --- Transactions ---
  addTransaction(transaction: Omit<Transaction, 'id'>): void {
    this.http.post<Transaction>(`${this.baseUrl}/transactions`, transaction).subscribe({
        next: newTransaction => this.transactions.update(transactions => [...transactions, newTransaction]),
        error: err => console.error('Failed to add transaction', err)
    });
  }

  updateTransaction(updatedTransaction: Transaction): void {
    this.http.put<Transaction>(`${this.baseUrl}/transactions/${updatedTransaction.id}`, updatedTransaction).subscribe({
        next: returnedTransaction => this.transactions.update(transactions =>
            transactions.map(t => (t.id === returnedTransaction.id ? returnedTransaction : t))
        ),
        error: err => console.error('Failed to update transaction', err)
    });
  }

  deleteTransaction(id: string): void {
    this.http.delete<void>(`${this.baseUrl}/transactions/${id}`).subscribe({
        next: () => this.transactions.update(transactions => transactions.filter(t => t.id !== id)),
        error: err => console.error('Failed to delete transaction', err)
    });
  }

  // This method is not used in the UI, but it's here for completeness.
  // We can add a UI to mark installments as paid later if needed.
  markInstallmentAsPaid(transactionId: string, upToInstallmentNumber: number): void {
    // This would require a specific backend endpoint, e.g., PUT /api/transactions/:id/installments
    const transaction = this.transactions().find(t => t.id === transactionId);
    if(transaction && transaction.isInstallment && transaction.installments) {
        const updatedTransaction = { ...transaction };
        updatedTransaction.installments!.paidInstallments = Math.max(
            transaction.installments.paidInstallments,
            upToInstallmentNumber
        );
        this.updateTransaction(updatedTransaction);
    }
  }

  // --- Categories ---
  addCategory(category: Omit<Category, 'id'>): void {
    this.http.post<Category>(`${this.baseUrl}/categories`, category).subscribe({
        next: newCategory => this.categories.update(categories => [...categories, newCategory]),
        error: err => console.error('Failed to add category', err)
    });
  }

  // --- Navigation ---
  triggerInstallmentsNavigation(): void {
    this._navigateToInstallments.set(true);
  }

  resetInstallmentsNavigation(): void {
    this._navigateToInstallments.set(false);
  }

  // --- Derived Data / Business Logic ---
  getCategoryById(id: string): Category | undefined {
    return this.categories().find(c => c.id === id);
  }

  getTransactionsForMonth(date: Date): (Transaction | InstallmentEntry)[] {
    const year = date.getFullYear();
    const month = date.getMonth();

    const singleEntries = this.transactions().filter(t => {
      if (t.isInstallment) return false;
      const tDate = new Date(t.date + 'T00:00:00'); // Ensure proper date parsing
      return tDate.getFullYear() === year && tDate.getMonth() === month;
    });

    const installmentEntries = this.generateAllInstallmentEntries().filter(i => {
      return i.dueDate.getFullYear() === year && i.dueDate.getMonth() === month;
    });

    return [...singleEntries, ...installmentEntries].sort((a, b) => {
        // FIX: Use a type guard ('date' in item) to correctly access properties of Transaction or InstallmentEntry.
        const dateA = 'date' in a ? new Date(a.date + 'T00:00:00') : a.dueDate;
        const dateB = 'date' in b ? new Date(b.date + 'T00:00:00') : b.dueDate;
        return dateB.getTime() - dateA.getTime();
    });
  }
  
  generateAllInstallmentEntries(): InstallmentEntry[] {
    const entries: InstallmentEntry[] = [];
    const installmentExpenses = this.transactions().filter(t => t.isInstallment && t.installments);

    for (const expense of installmentExpenses) {
      if (!expense.installments) continue;

      const { totalInstallments, startDate, paidInstallments } = expense.installments;
      const installmentAmount = expense.amount / totalInstallments;
      const start = new Date(startDate + 'T00:00:00');

      for (let i = 1; i <= totalInstallments; i++) {
        const dueDate = new Date(start);
        dueDate.setMonth(start.getMonth() + (i - 1));

        const category = this.getCategoryById(expense.categoryId);
        if (!category) continue; // Skip if category not found

        entries.push({
          parentTransactionId: expense.id,
          installmentNumber: i,
          totalInstallments,
          dueDate,
          amount: installmentAmount,
          status: i <= paidInstallments ? 'paid' : 'pending',
          description: expense.description,
          category: category,
          paymentMethod: expense.paymentMethod,
        });
      }
    }
    return entries;
  }

  getAllInstallmentPlans = computed<InstallmentPlan[]>(() => {
    return this.transactions()
      .filter(t => t.isInstallment && t.installments)
      .map(t => {
        const { totalInstallments, paidInstallments, startDate } = t.installments!;
        const installmentAmount = t.amount / totalInstallments;
        const start = new Date(startDate + 'T00:00:00');
        const end = new Date(start);
        end.setMonth(start.getMonth() + totalInstallments - 1);
        const now = new Date();
        now.setHours(0,0,0,0);
        
        let status: 'ativo' | 'concluído' | 'atrasado' = 'ativo';
        if (paidInstallments === totalInstallments) {
          status = 'concluído';
        } else {
            const nextDueDate = new Date(start);
            nextDueDate.setMonth(start.getMonth() + paidInstallments);
            if (nextDueDate < now) {
                status = 'atrasado';
            }
        }

        const category = this.getCategoryById(t.categoryId);
        if(!category) return null; // Should not happen if data is consistent

        return {
          id: t.id,
          description: t.description,
          paymentMethod: t.paymentMethod,
          totalAmount: t.amount,
          startDate: startDate,
          endDate: end.toISOString().split('T')[0],
          totalInstallments,
          paidInstallments,
          pendingInstallments: totalInstallments - paidInstallments,
          paidAmount: paidInstallments * installmentAmount,
          pendingAmount: (totalInstallments - paidInstallments) * installmentAmount,
          status: status,
          category: category,
        };
      })
      .filter((p): p is InstallmentPlan => p !== null)
      .sort((a, b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime());
  });
}
