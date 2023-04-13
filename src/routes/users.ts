import express from 'express';
import * as controller from '../controllers/users';

const auth = require('../middlewares/auth');
const log = require('../middlewares/logConnection');
const router = express.Router();

router.post('/', log, controller.create);
router.get('/me', auth, log, controller.getMe);
router.patch('/me', auth, log, controller.updateMe);
router.delete('/me', auth, log, controller.removeMe);
router.get('/:id', auth, log, controller.get);
router.patch('/:id', auth, log, controller.update);
router.delete('/me', auth, log, controller.remove);

module.exports = router;
