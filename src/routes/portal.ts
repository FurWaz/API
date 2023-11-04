import express from 'express';
import * as controller from '../controllers/portal';

const auth = require('../middlewares/auth');
const router = express.Router();

router.get('/generate', auth, controller.generate);
router.get('/user', auth, controller.retreiveUser);
router.get('/app', controller.retreiveApp);
router.post('/:token', auth, controller.connect);

module.exports = router;
