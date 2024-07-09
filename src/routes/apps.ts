import express from 'express';
import Joi from 'joi';
import * as controller from '../controllers/apps.ts';
import { App } from 'models/App.ts';
import { respondError, respond } from 'tools/Responses.ts';
import { mayAuth, authuser } from 'middleware/auth.ts';
import { getRequestPagination, getPaginationResult } from 'tools/Pagination.ts';
import { prisma } from 'index.ts';
const router = express.Router();

// Get all apps
router.get('/', async (req, res) => {
    /**
     * #swagger.tags = ['Apps']
     * #swagger.description = 'Get all apps'
     * #swagger.operationId = 'getApps'
     */
    try {
        const pag = getRequestPagination(req);
        const apps = await controller.getAllApps(pag);
        const pagination = await getPaginationResult(pag, async () => await prisma.app.count());
        respond(res, App.MESSAGES.FETCHED, { apps, pagination });
    } catch (err) { respondError(res, err); }
});

// Create a new app
router.post('/', authuser, async (req, res) => {
    /**
     * #swagger.tags = ['Apps']
     * #swagger.description = 'Create a new app'
     * #swagger.operationId = 'createApp'
     * #swagger.security = [{ ApiKeyAuth: [] }]
     */
    const schema = Joi.object({
        name: Joi.string().required(),
        description: Joi.string().required(),
    });
    console.log(req.body);
    const { error } = schema.validate(req.body);
    if (error) return respondError(res, error);
    
    const { token } = res.locals;
    const { name, description } = req.body;

    try {
        const app = await controller.createApp(token.id, name, description);
        respond(res, App.MESSAGES.CREATED, app);
    } catch (err) { respondError(res, err); }
});

// Get own apps
router.get('/me', authuser, async (req, res) => {
    /**
     * #swagger.tags = ['Apps']
     * #swagger.description = 'Get the apps that the user owns'
     * #swagger.operationId = 'getOwnApps'
     * #swagger.security = [{ ApiKeyAuth: [] }]
     */
    const { token } = res.locals;
    const pag = getRequestPagination(req);

    try {
        const apps = await controller.getOwnApps(token.id, pag);
        const pagination = await getPaginationResult(pag, async () => await prisma.app.count({ where: { authorId: token.id } }));
        respond(res, App.MESSAGES.FETCHED, { apps, pagination });
    } catch (err) { respondError(res, err); }
});

// Get an app by its ID
router.get('/:id', mayAuth, async (req, res) => {
    /**
     * #swagger.tags = ['Apps']
     * #swagger.description = 'Get an app by its ID'
     * #swagger.operationId = 'getAppById'
     * #swagger.security = [{ ApiKeyAuth: [] }]
     */
    const schema = Joi.object({
        id: Joi.number().required()
    });
    const { error } = schema.validate(req.params);
    if (error) return respondError(res, error);

    const { token } = res.locals;
    const id = parseInt(req.params.id);

    try {
        const app = await controller.getAppAsUser(token?.id, id);
        respond(res, App.MESSAGES.FETCHED, app);
    } catch (err) { respondError(res, err); }
});

// Update an app by its ID
router.patch('/:id', authuser, async (req, res) => {
    /**
     * #swagger.tags = ['Apps']
     * #swagger.description = 'Update an app by its ID'
     * #swagger.operationId = 'updateAppById'
     * #swagger.security = [{ ApiKeyAuth: [] }]
     */
    const schema = Joi.object({
        id: Joi.number().required(),
        name: Joi.string(),
        description: Joi.string()
    });
    const { error } = schema.validate({ ...req.params, ...req.body });
    if (error) return respondError(res, error);

    const id = parseInt(req.params.id);
    const { token } = res.locals;
    const { name, description } = req.body;

    try {
        const app = await controller.updateApp(token.id, id, { name, description });
        respond(res, App.MESSAGES.UPDATED, app);
    } catch (err) { respondError(res, err); }
});

// Delete an app by its ID
router.delete('/:id', authuser, async (req, res) => {
    /**
     * #swagger.tags = ['Apps']
     * #swagger.description = 'Delete an app by its ID'
     * #swagger.operationId = 'deleteAppById'
     * #swagger.security = [{ ApiKeyAuth: [] }]
     */
    const schema = Joi.object({
        id: Joi.number().required()
    });
    const { error } = schema.validate(req.params);
    if (error) return respondError(res, error);

    const id = parseInt(req.params.id);
    const { token } = res.locals;

    try {
        await controller.deleteApp(token.id, id);
        respond(res, App.MESSAGES.DELETED);
    } catch (err) { respondError(res, err); }
});

export default router;
