const router = require('express').Router();
const auth = require('../middleware/auth');
const { getLeads, getLeadStats, getLead, createLead, updateLead, deleteLead } = require('../controllers/leadController');

router.use(auth);
router.get('/stats', getLeadStats);
router.get('/', getLeads);
router.get('/:id', getLead);
router.post('/', createLead);
router.put('/:id', updateLead);
router.delete('/:id', deleteLead);

module.exports = router;
