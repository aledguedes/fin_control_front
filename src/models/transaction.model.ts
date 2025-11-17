export interface Category {
  id: string;
  name: string;
  type: 'revenue' | 'expense';
}

export type PaymentMethod = 'Dinheiro' | 'Débito' | 'Crédito' | 'Carnê' | 'Boleto' | 'Transferência' | 'Financiamento' | 'Empréstimo';

export interface InstallmentDetails {
  totalInstallments: number;
  paidInstallments: number;
  startDate: string; // YYYY-MM-DD
}

export interface Transaction {
  id: string;
  type: 'revenue' | 'expense';
  amount: number; // Total amount for installments
  date: string; // YYYY-MM-DD
  description: string;
  categoryId: string;
  paymentMethod: PaymentMethod;
  isInstallment: boolean;
  isRecurrent?: boolean;
  installments?: InstallmentDetails;
}

// This is a derived model, not stored directly. Represents one installment payment.
export interface InstallmentEntry {
  parentTransactionId: string;
  installmentNumber: number;
  totalInstallments: number;
  dueDate: Date;
  amount: number;
  status: 'paid' | 'pending';
  description: string;
  category: Category;
  paymentMethod: PaymentMethod;
}

// This is a derived model for the installments dashboard
export interface InstallmentPlan {
    id: string;
    description: string;
    paymentMethod: PaymentMethod;
    totalAmount: number;
    startDate: string;
    endDate: string;
    totalInstallments: number;
    paidInstallments: number;
    pendingInstallments: number;
    paidAmount: number;
    pendingAmount: number;
    status: 'ativo' | 'concluído' | 'atrasado';
    category: Category;
}