import { respondError, respond } from 'tools/Responses.ts';
import * as controller from '../controllers/auth.ts';
import { User } from 'models/User.ts';
const router = express.Router();
import express from 'express';
import Joi from 'joi';
import HTTPError from 'errors/HTTPError.ts';
import { TokenUtils } from 'tools/Token.ts';

router.post('/login', async (req, res) => {
    /**
     * #swagger.tags = ['Authentication']
     * #swagger.description = 'Log in a user acccount and get its tokens'
     * #swagger.operationId = 'loginUser'
     */
    const schema = Joi.alt(
        Joi.object({
            pseudo: Joi.string().required(),
            password: Joi.string().required()
        }),
        Joi.object({
            email: Joi.string().email().required(),
            password: Joi.string().required()
        })
    );

    const { error } = schema.validate(req.body);
    if (error) return respondError(res, error);

    const { pseudo, email, password } = req.body;

    try {
        const tokens = await controller.getUserTokens(pseudo, email, password);
        respond(res, User.MESSAGES.LOGGED_IN(), tokens);
    } catch (err) { respondError(res, err); }
});

router.get('/token', async (req, res) => {
    /**
     * #swagger.tags = ['Authentication']
     * #swagger.description = 'Refresh a user access token with its refresh token'
     * #swagger.operationId = 'refreshToken'
     * #swagger.security = [{ ApiKeyAuth: [] }]
     */
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader) throw HTTPError.Unauthorized();
    
        const [type, token] = authHeader.split(' ');
        if (type !== 'Bearer') throw HTTPError.Unauthorized();
    
        const data = await TokenUtils.decode(token);

        const accessToken = await controller.getAccessToken(data);
        respond(res, User.MESSAGES.TOKEN_REFRESHED(), { token: accessToken });
    } catch (err) { respondError(res, err); }
});

export default router;
