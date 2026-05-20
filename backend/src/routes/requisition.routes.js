const router = require('express').Router();
const c = require('../controllers/requisition.controller');
const { protect, authorize } = require('../middleware/auth');

router.use(protect);

router.get('/stats',          c.stats);
router.get('/',               c.getAll);
router.get('/:id',            c.getOne);
router.post('/',              c.create);
router.patch('/:id/approve',  authorize('admin','procurement_manager'), c.approve);
router.patch('/:id/reject',   authorize('admin','procurement_manager'), c.reject);
router.delete('/:id',         authorize('admin','procurement_manager'), c.remove);

module.exports = router;
