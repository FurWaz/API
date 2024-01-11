import express from 'express';

const router = express.Router();

router.use('/product', require('./product'));
// router.use('/cart', require('./cart'));

module.exports = router;
