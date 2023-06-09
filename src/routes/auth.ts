import express from 'express';
import * as controller from '../controllers/auth';

const auth = require('../middlewares/auth');
const router = express.Router();

router.get('/token', auth, controller.getToken);

module.exports = router;
