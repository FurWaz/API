import express from 'express';
import * as controller from '../controllers/users.ts';
import { respondError, respond } from 'tools/Responses.ts';
import Lang from 'tools/Lang.ts';
import Joi from 'joi';
import { TokenUtils } from 'tools/Token.ts';
import HTTPError from 'errors/HTTPError.ts';
import HTTP from 'tools/HTTP.ts';
const router = express.Router();

router.post('/email', async (req, res) => {
    /**
     * #swagger.tags = ['Verifications']
     * #swagger.description = 'Validate a user email address'
     * #swagger.operationId = 'verifyUserEmail'
     */
    const schema = Joi.object({
        token: Joi.string().required()
    });
    const { error } = schema.validate(req.body);
    if (error) return respondError(res, error);

    const { token } = req.body;

    try {
        await controller.verifyUserEmail(token);
        respond(res, {
            message: Lang.GetText(Lang.CreateTranslationContext('responses', 'UserEmailVerified')),
            status: 200
        });
    } catch (err) {
        respondError(res, err);
        return;
    }
});

router.get('/token', async (req, res) => {
    /**
     * #swagger.tags = ['Verifications']
     * #swagger.description = 'Verify an API token'
     * #swagger.operationId = 'verifyToken'
     */
    const schema = Joi.object({
        token: Joi.string().required()
    });
    const { error } = schema.validate(req.query);
    if (error) return respondError(res, error);

    try {
        const token = req.query.token as string;
        const data = await TokenUtils.decode(token);
        respond(res, new HTTPError(
            HTTP.OK,
            Lang.GetText(Lang.CreateTranslationContext('responses', 'TokenVerified'))
        ), data);
    } catch (err) { respondError(res, err); }
});

export default router;
