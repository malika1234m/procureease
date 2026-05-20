import api from './api';

export const getInventoryStats  = ()      => api.get('/inventory/stats');
export const getLowStockItems   = ()      => api.get('/inventory/low-stock');

export const getCategories      = ()      => api.get('/inventory/categories');
export const createCategory     = (d)     => api.post('/inventory/categories', d);
export const updateCategory     = (id, d) => api.put(`/inventory/categories/${id}`, d);
export const deleteCategory     = (id)    => api.delete(`/inventory/categories/${id}`);

export const getItems           = (p)     => api.get('/inventory', { params: p });
export const getItem            = (id)    => api.get(`/inventory/${id}`);
export const createItem         = (d)     => api.post('/inventory', d);
export const updateItem         = (id, d) => api.put(`/inventory/${id}`, d);
export const deleteItem         = (id)    => api.delete(`/inventory/${id}`);
export const adjustStock        = (id, d) => api.patch(`/inventory/${id}/adjust`, d);

export const getGRNs            = (p)     => api.get('/inventory/grn/all', { params: p });
export const createGRN          = (d)     => api.post('/inventory/grn', d);
