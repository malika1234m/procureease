import api from './api';

const params = (from, to) => ({ params: { from, to } });

export const getOverviewReport    = (from, to) => api.get('/reports/overview',    params(from, to));
export const getProcurementReport = (from, to) => api.get('/reports/procurement', params(from, to));
export const getInventoryReport   = (from, to) => api.get('/reports/inventory',   params(from, to));
export const getHRReport          = (from, to) => api.get('/reports/hr',          params(from, to));
export const getFinanceReport     = (from, to) => api.get('/reports/finance',     params(from, to));
