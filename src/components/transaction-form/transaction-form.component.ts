import { Component, ChangeDetectionStrategy, input, output, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DataService } from '../../services/data.service';
import { Transaction, PaymentMethod } from '../../models/transaction.model';
import { CurrencyMaskDirective } from '../../directives/currency-mask.directive';

@Component({
  selector: 'app-transaction-form',
  templateUrl: './transaction-form.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, FormsModule, CurrencyMaskDirective],
})
export class TransactionFormComponent {
  transactionToEdit = input<Partial<Transaction> | null>(null);
  closeModal = output<void>();
  saveTransaction = output<Transaction>();

  model: Partial<Transaction> & { startDate?: string; totalInstallments?: number; installmentAmount?: number } = this.resetModel();

  paymentMethods: PaymentMethod[] = ['Dinheiro', 'Débito', 'Crédito', 'Carnê', 'Boleto', 'Transferência', 'Financiamento', 'Empréstimo'];

  constructor(public dataService: DataService) {
    effect(() => {
      const data = this.transactionToEdit();
      if (data) {
        const modelData: typeof this.model = {
          ...this.resetModel(),
          ...data,
          startDate: (data as Transaction).installments?.startDate || this.resetModel().startDate,
          totalInstallments: (data as Transaction).installments?.totalInstallments || this.resetModel().totalInstallments,
          isRecurrent: data.isRecurrent ?? false,
        };
        if (data.isInstallment && data.amount && data.installments?.totalInstallments) {
          modelData.installmentAmount = parseFloat((data.amount / data.installments.totalInstallments).toFixed(2));
        }
        this.model = modelData;
      } else {
        this.model = this.resetModel();
      }
    });

    effect(() => {
      if (this.model.isInstallment) {
        const numInstallments = this.model.totalInstallments ?? 0;
        const installmentAmt = this.model.installmentAmount ?? 0;
        if (numInstallments > 0 && installmentAmt > 0) {
          this.model.amount = parseFloat((installmentAmt * numInstallments).toFixed(2));
        }
      }
    });
  }

  private resetModel(): Partial<Transaction> & { startDate?: string; totalInstallments?: number; installmentAmount?: number } {
    return {
      type: 'expense',
      amount: undefined,
      date: new Date().toISOString().split('T')[0],
      description: '',
      categoryId: undefined,
      paymentMethod: 'Débito',
      isInstallment: false,
      isRecurrent: false,
      startDate: new Date().toISOString().split('T')[0],
      totalInstallments: 2,
      installmentAmount: undefined,
    };
  }

  onTypeChange(): void {
    if (this.model.type === 'revenue') {
      this.model.isInstallment = false;
      this.model.isRecurrent = false;
      this.model.paymentMethod = 'Transferência'; // Default for revenue
    } else {
      // When switching back to expense, reset to a common default
      this.model.paymentMethod = 'Débito';
    }
    // Also reset category selection as the list changes
    this.model.categoryId = undefined;
  }

  onInstallmentChange(): void {
    if (this.model.isInstallment) {
      this.model.isRecurrent = false;
    } else {
      this.model.installmentAmount = undefined;
    }
  }

  onRecurrentChange(): void {
    if (this.model.isRecurrent) {
      this.model.isInstallment = false;
    }
  }

  onSubmit(): void {
    if (!this.model.amount || !this.model.categoryId || !this.model.description) {
      alert('Por favor, preencha todos os campos obrigatórios.');
      return;
    }

    const transactionData: Transaction = {
      id: this.model.id || '', // Will be set by service if new
      type: this.model.type!,
      amount: this.model.amount,
      date: this.model.date!,
      description: this.model.description,
      categoryId: this.model.categoryId,
      paymentMethod: this.model.paymentMethod!,
      isInstallment: this.model.isInstallment!,
      isRecurrent: this.model.isRecurrent,
      installments: this.model.isInstallment ? {
        totalInstallments: this.model.totalInstallments || 2,
        paidInstallments: this.model.installments?.paidInstallments || 0,
        startDate: this.model.startDate!
      } : undefined
    };
    
    this.saveTransaction.emit(transactionData);
  }
}
