const router = require('express').Router();
const c      = require('../controllers/finance.controller');
const { protect, authorize } = require('../middleware/auth');

router.use(protect);
const fin = authorize('admin','procurement_manager','finance_officer');

router.get('/stats',                   c.stats);
router.get('/invoices',                c.getInvoices);
router.get('/invoices/approved',       c.getApprovedInvoices);
router.post('/invoices',          fin, c.createInvoice);
router.patch('/invoices/:id/status',fin,c.updateInvoiceStatus);
router.get('/payments',                c.getPayments);
router.post('/payments',          fin, c.createPayment);
router.get('/expenses',                c.getExpenses);
router.get('/expenses/categories',     c.getExpenseCategories);
router.post('/expenses',               c.createExpense);
router.patch('/expenses/:id/status',fin,c.updateExpenseStatus);
router.delete('/expenses/:id',    authorize('admin','finance_officer'), c.deleteExpense);

module.exports = router;
