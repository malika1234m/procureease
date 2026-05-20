const router = require('express').Router();
const c = require('../controllers/purchaseOrder.controller');
const { protect, authorize } = require('../middleware/auth');

router.use(protect);

router.get('/stats', c.stats);
router.get('/',      c.getAll);
router.get('/:id',   c.getOne);
router.post('/',     authorize('admin','procurement_manager'), c.create);
router.patch('/:id/status', authorize('admin','procurement_manager'), c.updateStatus);

module.exports = router;
