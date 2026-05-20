const router = require('express').Router();
const c      = require('../controllers/reports.controller');
const { protect } = require('../middleware/auth');

router.use(protect);

router.get('/overview',    c.overview);
router.get('/procurement', c.procurement);
router.get('/inventory',   c.inventory);
router.get('/hr',          c.hr);
router.get('/finance',     c.finance);

module.exports = router;
