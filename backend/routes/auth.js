const router = require('express').Router();
const { register, login, forgotPassword, getMe } = require('../controllers/authController');
const auth = require('../middleware/auth');

router.post('/register', register);
router.post('/login', login);
router.post('/forgot-password', forgotPassword);
router.get('/me', auth, getMe);

module.exports = router;
