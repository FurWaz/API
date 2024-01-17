import { authapp, authuser } from 'middleware/auth.ts';
import * as controller from '../controllers/buy.ts';
import { TokenDataAccess, TokenDataApp } from 'tools/Token.ts';
import express from 'express';
import Joi from 'joi';
import { respond, respondError } from 'tools/Responses.ts';
import Lang from 'tools/Lang.ts';
import { Product } from 'models/Product.ts';
const router = express.Router();

// Request product addition
router.post('/', authapp, async (req, res) => {
    /**
     * #swagger.tags = ['Product']
     * #swagger.description = 'Request a token for user product addition'
     * #swagger.operationId = 'requestBuyToken'
     * #swagger.security = [{ ApiKeyAuth: [] }]
     */
    const schema = Joi.object({
        productId: Joi.number().required(),
        userId: Joi.number().required(),
        quantity: Joi.number().required()
    });
    const { error } = schema.validate(req.body);
    if (error) return respondError(res, error);

    const token = res.locals.token as TokenDataApp;
    const { productId, userId, quantity } = req.body;

    const buyToken = await controller.generateBuyToken(token.id, userId, productId, quantity);
    respond(res, {
        message: Lang.GetText(Lang.CreateTranslationContext('responses', 'BuyTokenGenerated')),
        status: 200
    }, { token: buyToken });
});

// Get product infos
router.get('/:token/infos', authuser, async (req, res) => {
    /**
     * #swagger.tags = ['Product']
     * #swagger.description = 'Get product infos'
     * #swagger.operationId = 'getBuyInfos'
     * #swagger.security = [{ ApiKeyAuth: [] }]
     */
    const schema = Joi.object({
        token: Joi.string().required()
    });
    const { error } = schema.validate(req.params);
    if (error) return respondError(res, error);

    const buyToken = req.params.token as string;
    const token = res.locals.token as TokenDataAccess;

    try {
        const infos = await controller.getBuyInfos(buyToken, token.id);
        respond(res, {
            message: Lang.GetText(Lang.CreateTranslationContext('responses', 'BuyInfosFetched')),
            status: 200
        }, infos);
    } catch (err) { respondError(res, err); }
});

// Get product status
router.get('/:token/status', authapp, async (req, res) => {
    /**
     * #swagger.tags = ['Product']
     * #swagger.description = 'Get product status'
     * #swagger.operationId = 'getBuyStatus'
     * #swagger.security = [{ ApiKeyAuth: [] }]
     */
    const schema = Joi.object({
        token: Joi.string().required()
    });
    const { error } = schema.validate(req.params);
    if (error) return respondError(res, error);

    const buyToken = req.params.token as string;
    const token = res.locals.token as TokenDataApp;

    await controller.getBuyStatus(res, buyToken, token.id);
});

// Add product to cart
router.post('/:token', authuser, async (req, res) => {
    /**
     * #swagger.tags = ['Product']
     * #swagger.description = 'Add product to cart'
     * #swagger.operationId = 'addProductToCart'
     * #swagger.security = [{ ApiKeyAuth: [] }]
     */
    const schema = Joi.object({
        token: Joi.string().required()
    });
    const { error } = schema.validate(req.params);
    if (error) return respondError(res, error);

    const buyToken = req.params.token as string;
    const token = res.locals.token as TokenDataAccess;

    try {
        await controller.acceptBuy(buyToken, token.id);
        respond(res, Product.MESSAGES.ADDED);
    } catch (err) { respondError(res, err); }
});

export default router;
