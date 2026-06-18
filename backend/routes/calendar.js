const router = require('express').Router();
const auth = require('../middleware/auth');
const { getEvents, getUpcoming } = require('../controllers/calendarController');

router.use(auth);
router.get('/events', getEvents);
router.get('/upcoming', getUpcoming);

module.exports = router;
