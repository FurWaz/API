import express from 'express';
import * as controller from '../controllers/users';

const auth = require('../middlewares/auth');
const router = express.Router();

router.post('/', controller.create);
router.get('/me', auth, controller.getMe);
router.patch('/me', auth, controller.updateMe);
router.delete('/me', auth, controller.removeMe);
router.get('/:id', auth, controller.get);
router.patch('/:id', auth, controller.update);
router.delete('/me', auth, controller.remove);

module.exports = router;
