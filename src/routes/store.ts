import checkout from './checkout.ts';
import products from './products.ts';
import express from 'express';
import carts from './carts.ts';
import buy from './buy.ts';

const router = express.Router();

router.use('/buy', buy);
router.use('/carts', carts);
router.use('/products', products);
router.use('/checkout', checkout);

export default router;
