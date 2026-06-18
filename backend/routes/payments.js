const router = require('express').Router();
const auth = require('../middleware/auth');
const { getPayments, getSummary, getPayment, updatePaymentStatus, updatePayment } = require('../controllers/paymentController');

router.use(auth);
router.get('/summary', getSummary);
router.get('/', getPayments);
router.get('/:clientId', getPayment);
router.patch('/:clientId/status', updatePaymentStatus);
router.put('/:clientId', updatePayment);

module.exports = router;
