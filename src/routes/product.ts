import express from 'express';
import * as controller from '../controllers/product.ts';
import { respondError, respond } from 'tools/Responses.ts';
import Joi from 'joi';
import { authapp, hasPerm } from 'middleware/auth.ts';
import { Roles } from 'tools/Roles.ts';
import { Product } from 'models/Product.ts';
import { getPaginationResult, getRequestPagination } from 'tools/Pagination.ts';
import { prisma } from 'index.ts';
const router = express.Router();

// Create a new product
router.post('/', hasPerm(Roles.ADMIN), async (req, res) => {
    /**
     * #swagger.tags = ['Product']
     * #swagger.description = 'Create a new product'
     * #swagger.operationId = 'createProduct'
     * #swagger.security = [{ ApiKeyAuth: [] }]
     */
    const schema = Joi.object({
        name: Joi.string().required(),
        description: Joi.string().required(),
        price: Joi.number().required(),
        app: Joi.number().required()
    });
    const { error } = schema.validate(req.body);
    if (error) return respondError(res, error);

    const { name, description, price, app } = req.body;

    try {
        const product = await controller.createProduct(name, description, price, app);
        respond(res, Product.MESSAGES.CREATED, product);
    } catch (err) {
        respondError(res, err);
        return;
    }
});

// Get own app products
router.get('/', authapp, async (req, res) => {
    /**
     * #swagger.tags = ['Product']
     * #swagger.description = 'Get own app products'
     * #swagger.operationId = 'getOwnAppProducts'
     * #swagger.security = [{ ApiKeyAuth: [] }]
     */
    try {
        const pag = getRequestPagination(req);
        const products = await controller.getAppProducts(res.locals.token.id, pag);
        const pagination = await getPaginationResult(pag, async () => await prisma.product.count({ where: { appId: res.locals.token.id } }));
        respond(res, Product.MESSAGES.FETCHED, { products, pagination });
    } catch (err) {
        respondError(res, err);
        return;
    }
});

// Get a product
router.get('/:id', hasPerm(Roles.ADMIN), async (req, res) => {
    /**
     * #swagger.tags = ['Product']
     * #swagger.description = 'Get a product'
     * #swagger.operationId = 'getProduct'
     * #swagger.security = [{ ApiKeyAuth: [] }]
     */
    const schema = Joi.object({
        id: Joi.number().required()
    });
    const { error } = schema.validate(req.params);
    if (error) return respondError(res, error);

    const id = parseInt(req.params.id);

    try {
        const product = await controller.getProduct(id);
        respond(res, Product.MESSAGES.FETCHED, product);
    } catch (err) {
        respondError(res, err);
        return;
    }
});

// Update a product
router.patch('/:id', hasPerm(Roles.ADMIN), async (req, res) => {
    /**
     * #swagger.tags = ['Product']
     * #swagger.description = 'Update a product'
     * #swagger.operationId = 'updateProduct'
     * #swagger.security = [{ ApiKeyAuth: [] }]
     */
    const schema = Joi.object({
        id: Joi.number().required(),
        name: Joi.string().required(),
        description: Joi.string().required(),
        price: Joi.number().required()
    });
    const { error } = schema.validate({ ...req.params, ...req.body });
    if (error) return respondError(res, error);

    const { id, name, description, price } = req.body;

    try {
        const product = await controller.updateProduct(id, name, description, price);
        respond(res, Product.MESSAGES.UPDATED, product);
    } catch (err) {
        respondError(res, err);
        return;
    }
});

// Delete a product
router.delete('/:id', hasPerm(Roles.ADMIN), async (req, res) => {
    /**
     * #swagger.tags = ['Product']
     * #swagger.description = 'Delete a product'
     * #swagger.operationId = 'deleteProduct'
     * #swagger.security = [{ ApiKeyAuth: [] }]
     */
    const schema = Joi.object({
        id: Joi.number().required()
    });
    const { error } = schema.validate(req.params);
    if (error) return respondError(res, error);

    const id = parseInt(req.params.id);

    try {
        await controller.deleteProduct(id);
        respond(res, Product.MESSAGES.DELETED);
    } catch (err) {
        respondError(res, err);
        return;
    }
});

export default router;
