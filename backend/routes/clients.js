const router = require('express').Router();
const auth = require('../middleware/auth');
const { getClients, getClient, createClient, updateClient, deleteClient } = require('../controllers/clientController');

router.use(auth);
router.get('/', getClients);
router.get('/:id', getClient);
router.post('/', createClient);
router.put('/:id', updateClient);
router.delete('/:id', deleteClient);

module.exports = router;
