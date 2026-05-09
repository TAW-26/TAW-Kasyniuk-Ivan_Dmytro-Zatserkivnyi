const router = require('express').Router();
const auth = require('../middleware/authMiddleware');
const { send, getConversation, listConversations, unreadCount } = require('../controllers/messageController');

router.use(auth);

router.get('/', listConversations);
router.get('/unread-count', unreadCount);
router.get('/with/:userId', getConversation);
router.post('/', send);

module.exports = router;
