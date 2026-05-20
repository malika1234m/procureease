import api from './api';

export const getFinanceStats       = ()      => api.get('/finance/stats');
export const getInvoices           = (p)     => api.get('/finance/invoices', { params: p });
export const getApprovedInvoices   = ()      => api.get('/finance/invoices/approved');
export const createInvoice         = (d)     => api.post('/finance/invoices', d);
export const updateInvoiceStatus   = (id, s) => api.patch(`/finance/invoices/${id}/status`, { status: s });
export const getPayments           = (p)     => api.get('/finance/payments', { params: p });
export const createPayment         = (d)     => api.post('/finance/payments', d);
export const getExpenses           = (p)     => api.get('/finance/expenses', { params: p });
export const getExpenseCategories  = ()      => api.get('/finance/expenses/categories');
export const createExpense         = (d)     => api.post('/finance/expenses', d);
export const updateExpenseStatus   = (id, s) => api.patch(`/finance/expenses/${id}/status`, { status: s });
export const deleteExpense         = (id)    => api.delete(`/finance/expenses/${id}`);
