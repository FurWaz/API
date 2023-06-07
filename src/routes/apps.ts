import express from 'express';
import * as controller from '../controllers/apps';

const auth = require('../middlewares/auth');
const log = require('../middlewares/logConnection');
const router = express.Router();

router.post('/', auth, log, controller.create);
router.patch('/:id', log, controller.get);
router.patch('/:id', auth, log, controller.update);
router.delete('/:id', auth, log, controller.remove);

module.exports = router;
