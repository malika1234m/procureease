import api from './api';

// Requisitions
export const getRequisitions     = (p) => api.get('/requisitions', { params: p });
export const getRequisition      = (id) => api.get(`/requisitions/${id}`);
export const createRequisition   = (d)  => api.post('/requisitions', d);
export const approveRequisition  = (id) => api.patch(`/requisitions/${id}/approve`);
export const rejectRequisition   = (id, reason) => api.patch(`/requisitions/${id}/reject`, { reason });
export const deleteRequisition   = (id) => api.delete(`/requisitions/${id}`);
export const getRequisitionStats = ()   => api.get('/requisitions/stats');

// Purchase Orders
export const getPurchaseOrders   = (p)  => api.get('/purchase-orders', { params: p });
export const getPurchaseOrder    = (id) => api.get(`/purchase-orders/${id}`);
export const createPurchaseOrder = (d)  => api.post('/purchase-orders', d);
export const updatePOStatus      = (id, status) => api.patch(`/purchase-orders/${id}/status`, { status });
export const getPOStats          = ()   => api.get('/purchase-orders/stats');
