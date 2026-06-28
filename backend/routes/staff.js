const router = require('express').Router();
const auth = require('../middleware/auth');
const { adminOnly } = require('../middleware/auth');
const { getStaff, createStaff, updateStaff, resetStaffPassword, deleteStaff } = require('../controllers/staffController');

router.use(auth, adminOnly);
router.get('/', getStaff);
router.post('/', createStaff);
router.put('/:id', updateStaff);
router.patch('/:id/password', resetStaffPassword);
router.delete('/:id', deleteStaff);

module.exports = router;
