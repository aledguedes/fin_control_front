import { Transaction, Category } from '../models/transaction.model';

export const MOCK_CATEGORIES: Category[] = [
  { id: 'c1', name: 'Salário', type: 'revenue' },
  { id: 'c2', name: 'Freelance', type: 'revenue' },
  { id: 'c3', name: 'Moradia', type: 'expense' },
  { id: 'c4', name: 'Alimentação', type: 'expense' },
  { id: 'c5', name: 'Transporte', type: 'expense' },
  { id: 'c6', name: 'Lazer', type: 'expense' },
  { id: 'c7', name: 'Educação', type: 'expense' },
  { id: 'c8', name: 'Saúde', type: 'expense' },
];

export const MOCK_TRANSACTIONS: Transaction[] = [
  // Receitas
  {
    id: 't1',
    type: 'revenue',
    amount: 5000,
    date: '2024-07-05',
    description: 'Salário Mensal',
    categoryId: 'c1',
    paymentMethod: 'Transferência',
    isInstallment: false,
  },
  // Despesas à vista
  {
    id: 't2',
    type: 'expense',
    amount: 1500,
    date: '2024-07-10',
    description: 'Aluguel',
    categoryId: 'c3',
    paymentMethod: 'Boleto',
    isInstallment: false,
  },
  {
    id: 't3',
    type: 'expense',
    amount: 800,
    date: '2024-07-15',
    description: 'Compras do Mês',
    categoryId: 'c4',
    paymentMethod: 'Crédito',
    isInstallment: false,
  },
  // Despesa Parcelada 1 (Em andamento)
  {
    id: 't4',
    type: 'expense',
    amount: 2400,
    date: '2024-05-20',
    description: 'Curso de Inglês',
    categoryId: 'c7',
    paymentMethod: 'Carnê',
    isInstallment: true,
    installments: {
      totalInstallments: 12,
      paidInstallments: 2, // Junho e Julho pagos
      startDate: '2024-06-10',
    },
  },
  // Despesa Parcelada 2 (Atrasada)
  {
    id: 't5',
    type: 'expense',
    amount: 3000,
    date: '2024-02-15',
    description: 'Notebook Novo',
    categoryId: 'c7',
    paymentMethod: 'Crédito',
    isInstallment: true,
    installments: {
      totalInstallments: 6,
      paidInstallments: 3, // Março, Abril, Maio pagos. Junho está atrasado.
      startDate: '2024-03-25',
    },
  },
  // Despesa Parcelada 3 (Concluída)
  {
    id: 't6',
    type: 'expense',
    amount: 1200,
    date: '2024-01-10',
    description: 'Academia (Plano Anual)',
    categoryId: 'c8',
    paymentMethod: 'Financiamento',
    isInstallment: true,
    installments: {
      totalInstallments: 6,
      paidInstallments: 6,
      startDate: '2024-01-15',
    },
  },
];
