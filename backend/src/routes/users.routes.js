const router = require('express').Router();
const c      = require('../controllers/users.controller');
const { protect, authorize } = require('../middleware/auth');

router.use(protect);
const adm = authorize('admin');

router.get('/stats',               adm, c.stats);
router.get('/',                    adm, c.getAll);
router.get('/:id',                 adm, c.getOne);
router.post('/',                   adm, c.create);
router.put('/:id',                 adm, c.update);
router.patch('/:id/reset-password',adm, c.resetPassword);
router.delete('/:id',              adm, c.remove);

module.exports = router;
