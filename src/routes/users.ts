import express from 'express';
import Joi from 'joi';
import * as controller from '../controllers/users.ts';
import { PrivateUser, User } from 'models/User.ts';
import { respondError, respond } from 'tools/Responses.ts';
import { auth, authuser } from 'middleware/auth.ts';
import HTTPError from 'errors/HTTPError.ts';
import { TokenDataAccess } from 'tools/Token.ts';
const router = express.Router();

// Create a new user
router.post('/', async (req, res) => {
    /**
     * #swagger.tags = ['Users']
     * #swagger.description = 'Create a new user account'
     * #swagger.operationId = 'createUser'
     */
    const schema = Joi.object({
        pseudo: Joi.string().required(),
        email: Joi.string().email().required(),
        password: Joi.string().min(8).required()
    });
    const { error } = schema.validate(req.body);
    if (error) return respondError(res, error);

    const { pseudo, email, password } = req.body;

    let user: PrivateUser;
    try {
        user = await controller.createUser(pseudo, email, password);
        respond(res, User.MESSAGES.CREATED, user);
    } catch (err) { respondError(res, err); }
});

// Get own user
router.get('/me', authuser, async (req, res) => {
    /**
     * #swagger.tags = ['Users']
     * #swagger.description = 'Get the user that is logged in'
     * #swagger.operationId = 'getOwnUser'
     * #swagger.security = [{ ApiKeyAuth: [] }]
     */
    const { token } = res.locals;
    console.log('token : ', token);

    const user = await User.getAsPrivate(token.id);
    respond(res, User.MESSAGES.FETCHED, user);
});

// Update own user
router.patch('/me', authuser, async (req, res) => {
    /**
     * #swagger.tags = ['Users']
     * #swagger.description = 'Update the user that is logged in'
     * #swagger.operationId = 'updateOwnUser'
     * #swagger.security = [{ ApiKeyAuth: [] }]
     */
    const schema = Joi.alt({
        pseudo: Joi.string(),
        email: Joi.string().email(),
        password: Joi.string().min(8),
        oldPassword: Joi.string()
    });
    const { error } = schema.validate(req.body);
    if (error) return respondError(res, error);

    const { token } = res.locals;

    const newUser = await controller.setUserInfos(token.id, req.body);
    respond(res, User.MESSAGES.UPDATED, newUser);
});

// Delete own user
router.delete('/me', authuser, async (req, res) => {
    /**
     * #swagger.tags = ['Users']
     * #swagger.description = 'Delete the user that is logged in'
     * #swagger.operationId = 'deleteOwnUser'
     * #swagger.security = [{ ApiKeyAuth: [] }]
     */
    const schema = Joi.object({
        password: Joi.string().min(8).required()
    });
    const { error } = schema.validate(req.body);
    if (error) return respondError(res, error);

    const { token } = res.locals;

    try {
        await controller.deleteUser(token.id, req.body.password);
        respond(res, User.MESSAGES.DELETED);
    } catch (err) { respondError(res, err); }
});

// Get my user profile
router.get('/me/profile', authuser, async (req, res) => {
    /**
     * #swagger.tags = ['Users']
     * #swagger.description = 'Get the user profile that is logged in'
     * #swagger.operationId = 'getOwnUserProfile'
     * #swagger.security = [{ ApiKeyAuth: [] }]
     */
    const token = res.locals.token as TokenDataAccess;
    const profile = await controller.getUserProfile(token.id);
    respond(res, User.MESSAGES.FETCHED, profile);
});

// Update my user profile
router.patch('/me/profile', authuser, async (req, res) => {
    /**
     * #swagger.tags = ['Users']
     * #swagger.description = 'Update a user profile by its ID'
     * #swagger.operationId = 'updateUserProfileById'
     * #swagger.security = [{ ApiKeyAuth: [] }]
     */
    const schema = Joi.object({
        firstname: Joi.string(),
        lastname: Joi.string(),
        address: Joi.string(),
        city: Joi.string(),
        zip: Joi.string(),
        country: Joi.string(),
        phone: Joi.string(),
        birthdate: Joi.date()
    });
    const { error } = schema.validate({ ...req.body });
    if (error) return respondError(res, error);

    const token = res.locals.token as TokenDataAccess;
    const { firstname, lastname, address, city, zip, country, phone, birthdate } = req.body;
        
    const newProfile = await controller.setUserProfile(
        token.id,
        { firstname, lastname, address, city, zip, country, phone, birthdate }
    );
    respond(res, User.MESSAGES.UPDATED, newProfile);
});

// Delete my user profile
router.delete('/me/profile', authuser, async (req, res) => {
    /**
     * #swagger.tags = ['Users']
     * #swagger.description = 'Delete a user profile by its ID'
     * #swagger.operationId = 'deleteUserProfileById'
     * #swagger.security = [{ ApiKeyAuth: [] }]
     */

    const token = res.locals.token as TokenDataAccess;
    await controller.deleteUserProfile(token.id);
});

// Get a user by its ID
router.get('/:id', auth, async (req, res) => {
    /**
     * #swagger.tags = ['Users']
     * #swagger.description = 'Get a user by its ID'
     * #swagger.operationId = 'getUserById'
     * #swagger.security = [{ ApiKeyAuth: [] }]
     */
    const schema = Joi.object({
        id: Joi.number().required()
    });
    const { error } = schema.validate(req.params);
    if (error) return respondError(res, error);

    const { token } = res.locals;
    const id = parseInt(req.params.id);

    // TODO : Check if user is admin too
    const shouldBePrivate = token.id === id;

    const user = await (shouldBePrivate? User.getAsPrivate: User.getAsPublic)(id);
    if (!user) return respondError(res, new HTTPError(User.MESSAGES.NOT_FOUND.status, User.MESSAGES.NOT_FOUND.message));
    respond(res, User.MESSAGES.FETCHED, user);
});

// Update a user by its ID
router.patch('/:id', authuser, async (req, res) => {
    /**
     * #swagger.tags = ['Users']
     * #swagger.description = 'Update a user by its ID'
     * #swagger.operationId = 'updateUserById'
     * #swagger.security = [{ ApiKeyAuth: [] }]
     */
    const schema = Joi.alt({
        id: Joi.number().required(),
        pseudo: Joi.string(),
        email: Joi.string().email(),
        password: Joi.string().min(8),
        oldPassword: Joi.string()
    });
    const { error } = schema.validate({ ...req.params, ...req.body });
    if (error) return respondError(res, error);

    const id = parseInt(req.params.id);
    const { token } = res.locals;

    if (id !== token.id) // TODO : Check if user is admin too
        return respondError(res, HTTPError.Unauthorized());

    await controller.setUserInfos(id, req.body);
    respond(res, User.MESSAGES.UPDATED);
});

// Delete a user by its ID
router.delete('/:id', authuser, async (req, res) => {
    /**
     * #swagger.tags = ['Users']
     * #swagger.description = 'Delete a user by its ID'
     * #swagger.operationId = 'deleteUserById'
     * #swagger.security = [{ ApiKeyAuth: [] }]
     */
    const schema = Joi.object({
        id: Joi.number().required(),
        password: Joi.string().min(8).required()
    });
    const { error } = schema.validate({ ...req.params, ...req.body });
    if (error) return respondError(res, error);

    const id = parseInt(req.params.id);
    const { token } = res.locals;

    if (id !== token.id) // TODO : Check if user is admin too
        return respondError(res, HTTPError.Unauthorized());

    try {
        await controller.deleteUser(id, req.body.password);
        respond(res, User.MESSAGES.DELETED);
    } catch (err) { respondError(res, err); }
});

export default router;
