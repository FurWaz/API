import express from 'express';
import { prisma } from 'index.ts';
import { authuser } from 'middleware/auth.ts';
import { getPaginationResult, getRequestPagination } from 'tools/Pagination.ts';
import { respond, respondError } from 'tools/Responses.ts';
import * as controller from '../controllers/cart.ts';
import { TokenDataAccess } from 'tools/Token.ts';
import { UserProduct } from 'models/UserProduct.ts';
import Joi from 'joi';
import { Product } from 'models/Product.ts';
const router = express.Router();

// Get own user cart 
router.get('/', authuser, async (req, res) => {
    /**
     * #swagger.tags = ['Cart']
     * #swagger.description = 'Get own user cart'
     * #swagger.operationId = 'getUserProducts'
     * #swagger.security = [{ ApiKeyAuth: [] }]
     */
    try {
        const token = res.locals.token as TokenDataAccess;
        const pag = getRequestPagination(req);
        const products = await controller.getUserProducts(token.id, pag);
        const pagination = await getPaginationResult(pag, async () => await prisma.userProduct.count({ where: { userId: token.id } }));
        respond(res, UserProduct.MESSAGES.FETCHED, { products, pagination });
    } catch (err) {
        respondError(res, err);
        return;
    }
});

// Empty own user cart 
router.delete('/', authuser, async (req, res) => {
    /**
     * #swagger.tags = ['Cart']
     * #swagger.description = 'Empty own user cart'
     * #swagger.operationId = 'deleteUserProducts'
     * #swagger.security = [{ ApiKeyAuth: [] }]
     */
    try {
        const token = res.locals.token as TokenDataAccess;
        await controller.deleteUserProducts(token.id);
        respond(res, UserProduct.MESSAGES.DELETED);
    } catch (err) {
        respondError(res, err);
        return;
    }
});

// Get cart product
router.get('/product/:productId', authuser, async (req, res) => {
    /**
     * #swagger.tags = ['Cart']
     * #swagger.description = 'Get cart product'
     * #swagger.operationId = 'getUserProduct'
     * #swagger.security = [{ ApiKeyAuth: [] }]
     */
    const schema = Joi.object({
        productId: Joi.number().required()
    });
    const { error } = schema.validate(req.params);
    if (error) return respondError(res, error);

    try {
        const token = res.locals.token as TokenDataAccess;
        const productId = parseInt(req.params.productId);
        const product = await controller.getUserProduct(productId, token.id);
        respond(res, Product.MESSAGES.FETCHED, product);
    } catch (err) {
        respondError(res, err);
        return;
    }
});

// Update cart product
router.patch('/product/:productId', authuser, async (req, res) => {
    /**
     * #swagger.tags = ['Cart']
     * #swagger.description = 'Update cart product'
     * #swagger.operationId = 'updateUserProduct'
     * #swagger.security = [{ ApiKeyAuth: [] }]
     */
    const schema = Joi.object({
        productId: Joi.number().required(),
        quantity: Joi.number().min(1).required()
    });
    const { error } = schema.validate(req.params);
    if (error) return respondError(res, error);

    try {
        const token = res.locals.token as TokenDataAccess;
        const productId = parseInt(req.params.productId);
        const quantity = parseInt(req.params.quantity);
        const product = await controller.updateUserProduct(productId, token.id, quantity);
        respond(res, Product.MESSAGES.UPDATED, product);
    } catch (err) {
        respondError(res, err);
        return;
    }
});

// Delete cart product
router.delete('/product/:productId', authuser, async (req, res) => {
    /**
     * #swagger.tags = ['Cart']
     * #swagger.description = 'Delete cart product'
     * #swagger.operationId = 'deleteUserProduct'
     * #swagger.security = [{ ApiKeyAuth: [] }]
     */
    const schema = Joi.object({
        productId: Joi.number().required()
    });
    const { error } = schema.validate(req.params);
    if (error) return respondError(res, error);

    try {
        const token = res.locals.token as TokenDataAccess;
        const productId = parseInt(req.params.productId);
        await controller.deleteUserProduct(productId, token.id);
        respond(res, Product.MESSAGES.DELETED);
    } catch (err) {
        respondError(res, err);
        return;
    }
});

export default router;
