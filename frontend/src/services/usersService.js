import api from './api';

export const getUserStats    = ()       => api.get('/users/stats');
export const getUsers        = (p)      => api.get('/users', { params: p });
export const getUser         = (id)     => api.get(`/users/${id}`);
export const createUser      = (d)      => api.post('/users', d);
export const updateUser      = (id, d)  => api.put(`/users/${id}`, d);
export const resetPassword   = (id, d)  => api.patch(`/users/${id}/reset-password`, d);
export const deleteUser      = (id)     => api.delete(`/users/${id}`);
