import * as controller from '../controllers/portal.ts';
import { respondError, respond } from 'tools/Responses.ts';
import { authapp, authuser} from 'middleware/auth.ts';
import Lang from 'tools/Lang.ts';
import express from 'express';
import Joi from 'joi';

const router = express.Router();

const portalSchema = Joi.object({
    portal: Joi.string().required()
});


// Generate a new portal token
router.get('/generate', authapp, async (req, res) => {
    /**
     * #swagger.tags = ['Portal']
     * #swagger.description = 'Generate a new portal token'
     * #swagger.operationId = 'generatePortalToken'
     * #swagger.security = [{ ApiKeyAuth: [] }]
     */
    const { token } = res.locals;

    try {
        const code = await controller.generatePortalToken(token.id);
        respond(res, {
            message: Lang.GetText(Lang.CreateTranslationContext('responses', 'PortalTokenGenerated')),
            status: 200
        }, { token: code });
    } catch (err) { respondError(res, err); }
});

// Get the portal user
router.get('/:portal/user', authapp, async (req, res) => {
    /**
     * #swagger.tags = ['Portal']
     * #swagger.description = 'Get the portal user'
     * #swagger.operationId = 'getPortalUser'
     * #swagger.security = [{ ApiKeyAuth: [] }]
     */
    const { error } = portalSchema.validate(req.params);
    if (error) return respondError(res, error);

    const { portal } = req.params;
    const { token } = res.locals;

    try {
        await controller.getPortalUser(res, portal, token.id);
    } catch (err) { respondError(res, err); }
});

// Get the portal app
router.get('/:portal/app', authuser, async (req, res) => {
    /**
     * #swagger.tags = ['Portal']
     * #swagger.description = 'Get the portal app'
     * #swagger.operationId = 'getPortalApp'
     * #swagger.security = [{ ApiKeyAuth: [] }]
     */
    const { error } = portalSchema.validate(req.params);
    if (error) return respondError(res, error);

    const { portal } = req.params;

    try {
        const app = await controller.getPortalApp(portal);
        respond(res, {
            message: Lang.GetText(Lang.CreateTranslationContext('responses', 'PortalAppRetrieved')),
            status: 200
        }, { app });
    } catch (err) { respondError(res, err); }
});

// Connect a user to the portal
router.post('/:portal', authuser, async (req, res) => {
    /**
     * #swagger.tags = ['Portal']
     * #swagger.description = 'Connect a user to the portal'
     * #swagger.operationId = 'connectPortalUser'
     * #swagger.security = [{ ApiKeyAuth: [] }]
     */
    const { error } = portalSchema.validate(req.params);
    if (error) return respondError(res, error);

    const { portal } = req.params;
    const { token } = res.locals;

    try {
        const user = await controller.connectPortalUser(portal, token.id);
        respond(res, {
            message: Lang.GetText(Lang.CreateTranslationContext('responses', 'PortalUserConnected')),
            status: 200
        }, user);
    } catch (err) { respondError(res, err); }
});

export default router;
