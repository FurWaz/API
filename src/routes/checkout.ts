import express from 'express';
import { authuser } from 'middleware/auth.ts';
import * as controller from '../controllers/checkout.ts';
import { TokenDataAccess } from 'tools/Token.ts';
import { respond, respondError } from 'tools/Responses.ts';
import Lang from 'tools/Lang.ts';
import Joi from 'joi';
import { Checkout } from 'models/Checkout.ts';
const router = express.Router();

// Start checkout process
router.post('/', authuser, async (req, res) => {
    /**
     * #swagger.tags = ['Cart']
     * #swagger.description = 'Start a checkout process with user infos'
     * #swagger.operationId = 'startCheckoutProcess'
     * #swagger.security = [{ ApiKeyAuth: [] }]
     */
    const schema = Joi.object({
        firstname: Joi.string().required(),
        lastname: Joi.string().required(),
        address: Joi.string().required(),
        city: Joi.string().required(),
        zipcode: Joi.string().required(),
        saveInfos: Joi.boolean().required()
    });
    const { error } = schema.validate(req.body);
    if (error) return respondError(res, error);

    try {
        const token = res.locals.token as TokenDataAccess;
        const intent = await controller.createPayementIntent(
            token.id,
            {
                firstname: req.body.firstname,
                lastname: req.body.lastname,
                address: req.body.address,
                city: req.body.city,
                zipcode: req.body.zipcode
            },
            req.body.saveInfos as boolean
        );
        respond(res, {
            message: Lang.GetText(Lang.CreateTranslationContext('responses', 'PayementIntentCreated')),
            status: 200
        }, {
            clientSecret: intent.client_secret
        });
    } catch (err) {
        respondError(res, err);
    }
});

// Get checkout status
router.get('/:id', authuser, async (req, res) => {
    /**
     * #swagger.tags = ['Cart']
     * #swagger.description = 'Get the checkout status'
     * #swagger.operationId = 'getCheckoutStatus'
     * #swagger.security = [{ ApiKeyAuth: [] }]
     */
    const schema = Joi.object({
        id: Joi.string().required()
    });
    const { error } = schema.validate(req.params);
    if (error) return respondError(res, error);

    const id = req.params.id;
        
    try {
        const status = await controller.getCheckoutStatus(id);
        respond(res, Checkout.MESSAGES.FETCHED, status);
    } catch (err) {
        respondError(res, err);
    }
});

router.post('/webhook', async (req, res) => {
    /**
     * #swagger.ignore = true
     */
    const key = req.headers['stripe-signature'] as string;
    const rawBody = (req as any).rawBody;

    try {
        await controller.stripeWebhook(key, rawBody);
        res.status(200).end();
    } catch (err) {
        respondError(res, err);
    }
});

export default router;
