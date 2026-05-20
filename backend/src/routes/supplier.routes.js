const express = require('express');
const router = express.Router();
const { getAll, getOne, create, update, remove, stats } = require('../controllers/supplier.controller');
const { protect, authorize } = require('../middleware/auth');

router.use(protect);

router.get('/stats', stats);
router.get('/', getAll);
router.get('/:id', getOne);
router.post('/', authorize('admin', 'procurement_manager'), create);
router.put('/:id', authorize('admin', 'procurement_manager'), update);
router.delete('/:id', authorize('admin'), remove);

module.exports = router;
