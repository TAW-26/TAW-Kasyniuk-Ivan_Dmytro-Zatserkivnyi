const router = require('express').Router();
const auth = require('../middleware/authMiddleware');
const { getAll, getOne, create, update, remove, getByUser, markAsSold, markAsActive } =
  require('../controllers/listingController');
const optionalAuth = require('../middleware/optionalAuthMiddleware');

router.get('/', optionalAuth, getAll);
router.get('/user/my', auth, getByUser);
router.get('/:id', optionalAuth, getOne);

router.post('/', auth, create);
router.post('/:id/mark-sold', auth, markAsSold);
router.post('/:id/mark-active', auth, markAsActive);
router.put('/:id', auth, update);
router.delete('/:id', auth, remove);

module.exports = router;
