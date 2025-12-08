export interface FinancialCategory {
  id: string;
  name: string;
  type: 'revenue' | 'expense';
  userId?: string;
  createdAt?: string;
  updatedAt?: string;
}

export type payment_method = 'Dinheiro' | 'Débito' | 'Crédito' | 'Carnê' | 'Boleto' | 'Transferência' | 'Financiamento' | 'Empréstimo';

export interface InstallmentDetails {
  totalInstallments: number;
  paidInstallments: number;
  startDate: string; // YYYY-MM-DD
}

export interface Transaction {
  id: string;
  type: 'revenue' | 'expense';
  amount: number; // Total amount for installments
  transaction_date: string; // YYYY-MM-DD
  description: string;
  category_id: string;
  payment_method: payment_method;
  is_installment: boolean;
  is_recurrent?: boolean;
  installments?: InstallmentDetails;
  userId?: string;
  createdAt?: string;
  updatedAt?: string;
  recurrenceStartDate?: string;
  totalInstallments?: number;
  startDate?: string;
  paidInstallments?: number;
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
  category: FinancialCategory;
  payment_method: payment_method;
}

// This is a derived model for the installments dashboard, aligned with API
export interface InstallmentPlan {
    id: string;
    description: string;
    totalAmount: number;
    installmentAmount: number;
    totalInstallments: number;
    paidInstallments: number;
    remainingInstallments: number;
    startDate: string; // YYYY-MM-DD
    status: 'ativo' | 'atrasado' | 'concluído';
    type: 'revenue' | 'expense';
    category_id: string;
}

export interface MonthlyTransaction {
  id: string;
  parentId?: string;
  description: string;
  amount: number;
  type: 'revenue' | 'expense';
  date: string; // YYYY-MM-DD
  category_id: string;
  is_installment?: boolean;
  is_recurrent?: boolean;
  installmentNumber?: number;
  totalInstallments?: number;
  payment_method?: payment_method;
}

export interface MonthlyView {
  year: number;
  month: number;
  transactions: MonthlyTransaction[];
  summary: {
    totalRevenue: number;
    totalExpense: number;
    balance: number;
  }
}
