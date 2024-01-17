import express from 'express';
import * as controller from '../controllers/users.ts';
import { respondError, respond } from 'tools/Responses.ts';
import Lang from 'tools/Lang.ts';
import Joi from 'joi';
const router = express.Router();

router.get('/password', async (req, res) => {
    /**
     * #swagger.tags = ['Other']
     * #swagger.description = 'Send a password reset email'
     * #swagger.operationId = 'sendPasswordResetEmail'
     */
    const schema = Joi.object({
        email: Joi.string().email().required()
    });
    const { error } = schema.validate(req.query);
    if (error) return respondError(res, error);

    const { email } = req.query;

    try {
        await controller.sendPasswordResetEmail(email as string);
        respond(res, {
            message: Lang.GetText(Lang.CreateTranslationContext('responses', 'PasswordResetEmailSent')),
            status: 200
        });
    } catch (err) {
        respondError(res, err);
        return;
    }
});

router.post('/password', async (req, res) => {
    /**
     * #swagger.tags = ['Other']
     * #swagger.description = 'Reset a user password'
     * #swagger.operationId = 'resetUserPassword'
     */
    const schema = Joi.object({
        token: Joi.string().required(),
        password: Joi.string().min(8).required()
    });
    const { error } = schema.validate(req.body);
    if (error) return respondError(res, error);

    const { token, password } = req.body;

    try {
        await controller.resetPassword(token, password);
        respond(res, {
            message: Lang.GetText(Lang.CreateTranslationContext('responses', 'UserPasswordReset')),
            status: 200
        });
    } catch (err) {
        respondError(res, err);
        return;
    }
});

export default router;
