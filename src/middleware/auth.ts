import { type Request, type Response, type NextFunction } from 'express';
import HTTPError from 'errors/HTTPError.ts';
import { TokenDataAccess, TokenUtils } from 'tools/Token.ts';
import { respondError } from 'tools/Responses.ts';
import { Role } from 'tools/Roles.ts';

/**
 * Authentication middleware, authenticates the request's resource (user, app, ...)
 * @param {Request} req The request object
 * @param {Response} res The response object
 * @param {NextFunction} next The next function
 */
export async function auth(req: Request, res: Response, next: NextFunction) {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader) {
            console.debug("Rejecting logged request : no auth header")
            throw HTTPError.Unauthorized();
        }
    
        const [type, token] = authHeader.split(' ');
        if (type !== 'Bearer') {
            console.debug("Rejecting logged request : wrong auth type")
            throw HTTPError.Unauthorized();
        }

        const data = await TokenUtils.decode(token);
        if (data.type !== 'access') {
            console.debug("Rejecting logged request : wrong token type")
            throw HTTPError.Unauthorized();
        }

        res.locals.token = data;

        next();
    } catch (err) {
        respondError(res, err);
        return;
    }
}

export async function mayAuth(req: Request, res: Response, next: NextFunction) {
    if (!req.headers.authorization) {
        next();
        return;
    }
    await auth(req, res, next);
}

export async function authuser(req: Request, res: Response, next: NextFunction) {
    await auth(req, res, () => {
        const { token } = res.locals;

        if (token.resource !== 'user')
            return respondError(res, HTTPError.Unauthorized());
        next();
    });
}

export async function authapp(req: Request, res: Response, next: NextFunction) {
    await auth(req, res, () => {
        const { token } = res.locals;

        if (token.resource !== 'app')
            return respondError(res, HTTPError.Unauthorized());
        next();
    });
}

export function hasPerm(perm: Role) {
    return async (req: Request, res: Response, next: NextFunction) => {
        await authuser(req, res, () => {
            const token = res.locals.token as TokenDataAccess;

            if (!perm.hasPerm(token.payload.roles)) {
                return respondError(res, HTTPError.Forbidden());
            }
            next();
        });
    }
}
