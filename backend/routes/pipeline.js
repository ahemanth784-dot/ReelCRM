const router = require('express').Router();
const auth = require('../middleware/auth');
const { getPipeline, updateStage, updateClientStage } = require('../controllers/pipelineController');

router.use(auth);
router.get('/', getPipeline);
router.patch('/client/:clientId/stage', updateClientStage);
router.put('/:id/stage', updateStage);

module.exports = router;
