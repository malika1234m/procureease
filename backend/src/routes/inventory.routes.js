const router = require('express').Router();
const c = require('../controllers/inventory.controller');
const { protect, authorize } = require('../middleware/auth');

router.use(protect);

const mgr = authorize('admin','procurement_manager','store_keeper');
const adm = authorize('admin','procurement_manager');

// Stats & alerts
router.get('/stats',          c.stats);
router.get('/low-stock',      c.getLowStockItems);

// Categories (must be before /:id)
router.get('/categories',          c.getCategories);
router.post('/categories',    adm, c.createCategory);
router.put('/categories/:id', adm, c.updateCategory);
router.delete('/categories/:id', authorize('admin'), c.deleteCategory);

// GRN (must be before /:id so 'grn' is not treated as an item id)
router.get('/grn/all',   c.getGRNs);
router.post('/grn',  mgr, c.createGRN);

// Items
router.get('/',          c.getItems);
router.get('/:id',       c.getItem);
router.post('/',    mgr, c.createItem);
router.put('/:id',  mgr, c.updateItem);
router.delete('/:id', authorize('admin'), c.deleteItem);
router.patch('/:id/adjust', mgr, c.adjustStock);

module.exports = router;
