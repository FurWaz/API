import checkout from './checkout.ts';
import product from './product.ts';
import express from 'express';
import cart from './cart.ts';
import buy from './buy.ts';

const router = express.Router();

router.use('/buy', buy);
router.use('/cart', cart);
router.use('/product', product);
router.use('/checkout', checkout);

export default router;
