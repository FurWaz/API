import jwt from 'jsonwebtoken';
import type express from 'express';
import { Log, ErrLog } from '../tools/log';
import { verifyToken } from '../controllers/auth';
import * as validator from '../tools/validator';
import { _login } from '../controllers/users';
import properties from '../properties.json';

module.exports = (req: express.Request, res: express.Response, next: express.NextFunction) => {
    try {
        const parts = req.headers.authorization?.split(' ');

        if (parts === undefined) {
            new ErrLog(res.locals.lang.error.auth.noToken, Log.CODE.FORBIDDEN).sendTo(res);
            return;
        }
        if (parts.length !== 2) {
            new ErrLog(res.locals.lang.error.auth.invalidToken, Log.CODE.NOT_ACCEPTABLE).sendTo(res);
            return;
        }

        const type = parts[0].trim();
        const token = parts[1].trim();
        const isAuthUrl = req.originalUrl === '/auth/token';

        if (token === undefined || token === '') {
            new ErrLog(res.locals.lang.error.auth.invalidToken, Log.CODE.FORBIDDEN).sendTo(res);
            return;
        }

        switch (type.toLowerCase()) {
            case 'basic': {
                const decoded = Buffer.from(token, 'base64').toString('utf-8');
                const parts = decoded.split(':');

                if (parts.length !== 2 || !isAuthUrl) {
                    new ErrLog(res.locals.lang.error.auth.invalidToken, Log.CODE.NOT_ACCEPTABLE).sendTo(res);
                    return;
                }

                const email = parts[0].trim();
                const password = parts[1].trim();

                if (!validator.checkEmailField(email, req, res)) return;
                if (!validator.checkPasswordField(password, req, res)) return;

                _login(email, password, req, res).then((user) => {
                    res.locals.user = user;
                    res.locals.token = { type: 'basic' };
                    next();
                }).catch((err) => {
                    err.sendTo(res);
                });
                break;
            }
            case 'bearer': {
                const verified = verifyToken(token);
                const decoded = (verified as jwt.JwtPayload);
                const id = decoded.id;
                const role = decoded.role;
                const type = decoded.type;

                const idFilled = (id !== undefined);
                const roleFilled = (role !== undefined);
                const typeFilled = (type !== undefined);
                const roleValid = roleFilled !== isAuthUrl;

                if (!typeFilled || type !== properties.token.type.user) {
                    new ErrLog(res.locals.lang.error.auth.invalidTokenType, Log.CODE.NOT_ACCEPTABLE).sendTo(res);
                    return;
                }

                if (!idFilled || !roleValid) {
                    new ErrLog(res.locals.lang.error.auth.invalidToken, Log.CODE.NOT_ACCEPTABLE).sendTo(res);
                    return;
                }

                res.locals.user = roleFilled ? { id, role } : { id };
                res.locals.token = { type: roleFilled ? 'access' : 'refresh' };
                next();
                break;
            }
            default: {
                new ErrLog(res.locals.lang.error.auth.invalidTokenType, Log.CODE.NOT_ACCEPTABLE).sendTo(res);
                break;
            }
        }
    } catch (err) {
        if (err instanceof jwt.TokenExpiredError) {
            new ErrLog(res.locals.lang.error.auth.expiredToken, Log.CODE.TOKEN_EXPIRED).sendTo(res);
            return;
        }
        console.error(err);
        new ErrLog(res.locals.lang.error.auth.invalidToken, Log.CODE.NOT_ACCEPTABLE).sendTo(res);
    }
};
