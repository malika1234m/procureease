const router  = require('express').Router();
const c       = require('../controllers/hr.controller');
const { protect, authorize } = require('../middleware/auth');

router.use(protect);
const adm = authorize('admin');
const mgr = authorize('admin','procurement_manager');

router.get('/stats',                    c.stats);
router.get('/departments',              c.getDepartments);

// Employees
router.get('/employees',               c.getEmployees);
router.get('/employees/:id',           c.getEmployee);
router.post('/employees',         mgr, c.createEmployee);
router.put('/employees/:id',      mgr, c.updateEmployee);
router.delete('/employees/:id',   adm, c.deleteEmployee);

// Attendance
router.get('/attendance',              c.getAttendance);
router.get('/attendance/summary',      c.getAttendanceSummary);
router.post('/attendance',        mgr, c.markAttendance);

// Payroll
router.get('/payroll',                 c.getPayroll);
router.get('/payroll/:id/payslip',     c.getPayslip);
router.post('/payroll/generate',  mgr, c.generatePayroll);
router.patch('/payroll/:id/status',mgr,c.updatePayrollStatus);

module.exports = router;
