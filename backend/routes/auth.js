const router = require('express').Router();
const { login, forgotPassword, resetPassword, getMe } = require('../controllers/authController');
const auth = require('../middleware/auth');

router.post('/login', login);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);
router.get('/me', auth, getMe);

module.exports = router;
