import api from './api';

export const getHRStats           = ()       => api.get('/hr/stats');
export const getDepartments       = ()       => api.get('/hr/departments');

export const getEmployees         = (p)      => api.get('/hr/employees', { params: p });
export const getEmployee          = (id)     => api.get(`/hr/employees/${id}`);
export const createEmployee       = (d)      => api.post('/hr/employees', d);
export const updateEmployee       = (id, d)  => api.put(`/hr/employees/${id}`, d);
export const deleteEmployee       = (id)     => api.delete(`/hr/employees/${id}`);

export const getAttendance        = (p)      => api.get('/hr/attendance', { params: p });
export const getAttendanceSummary = (p)      => api.get('/hr/attendance/summary', { params: p });
export const markAttendance       = (d)      => api.post('/hr/attendance', d);

export const getPayroll           = (p)      => api.get('/hr/payroll', { params: p });
export const getPayslip           = (id)     => api.get(`/hr/payroll/${id}/payslip`);
export const generatePayroll      = (d)      => api.post('/hr/payroll/generate', d);
export const updatePayrollStatus  = (id, s)  => api.patch(`/hr/payroll/${id}/status`, { status: s });
