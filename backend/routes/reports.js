const router = require('express').Router();
const auth = require('../middleware/auth');
const { getRevenueReport, getProjectReport, getLeadsReport, getDashboardStats, getUpcomingShoots, getPendingDeliveries } = require('../controllers/reportsController');

router.use(auth);
router.get('/dashboard-stats', getDashboardStats);
router.get('/revenue', getRevenueReport);
router.get('/projects', getProjectReport);
router.get('/leads', getLeadsReport);
router.get('/upcoming-shoots', getUpcomingShoots);
router.get('/pending-deliveries', getPendingDeliveries);

module.exports = router;
