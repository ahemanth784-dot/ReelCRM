const router = require('express').Router();
const auth = require('../middleware/auth');
const { getNotifications } = require('../controllers/notificationController');

router.use(auth);
router.get('/', getNotifications);

module.exports = router;
