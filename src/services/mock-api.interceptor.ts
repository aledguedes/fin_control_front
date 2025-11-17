import { HttpEvent, HttpHandlerFn, HttpInterceptorFn, HttpRequest, HttpResponse } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { delay } from 'rxjs/operators';
import { v4 as uuidv4 } from 'uuid';
import { MOCK_TRANSACTIONS, MOCK_CATEGORIES } from './mock-data';
import { Transaction, Category } from '../models/transaction.model';

// Usar 'let' permite que os arrays sejam modificados para simular a persistência de dados durante a sessão.
let transactions: Transaction[] = JSON.parse(JSON.stringify(MOCK_TRANSACTIONS));
let categories: Category[] = JSON.parse(JSON.stringify(MOCK_CATEGORIES));

export const mockApiInterceptor: HttpInterceptorFn = (
  req: HttpRequest<any>,
  next: HttpHandlerFn
): Observable<HttpEvent<any>> => {

  const { url, method, body } = req;

  // Função para encapsular a resposta e simular a latência da rede
  const handleRequest = () => {
    const response = (data: any, status = 200) => of(new HttpResponse({ status, body: data })).pipe(delay(300));

    // ======== TRANSAÇÕES ========
    if (url.endsWith('/api/transactions') && method === 'GET') {
      return response(transactions);
    }

    if (url.endsWith('/api/transactions') && method === 'POST') {
      const newTransaction = { ...body, id: uuidv4() };
      transactions.push(newTransaction);
      return response(newTransaction, 201);
    }

    if (url.match(/\/api\/transactions\/.+/) && method === 'PUT') {
      const updatedTransaction = body as Transaction;
      transactions = transactions.map(t => t.id === updatedTransaction.id ? updatedTransaction : t);
      return response(updatedTransaction);
    }
    
    if (url.match(/\/api\/transactions\/.+/) && method === 'DELETE') {
        const id = url.split('/').pop();
        transactions = transactions.filter(t => t.id !== id);
        return response(null, 204); // No Content
    }

    // ======== CATEGORIAS ========
    if (url.endsWith('/api/categories') && method === 'GET') {
      return response(categories);
    }
    
    if (url.endsWith('/api/categories') && method === 'POST') {
        const newCategory = { ...body, id: uuidv4() };
        categories.push(newCategory);
        return response(newCategory, 201);
    }

    // Se nenhuma rota corresponder, passa a requisição para o próximo handler.
    return next(req);
  }
  
  // Interceptar apenas chamadas para o nosso endpoint de API simulado.
  if (url.startsWith('/api')) {
      return handleRequest();
  }

  // Para qualquer outra requisição, não fazer nada.
  return next(req);
};
