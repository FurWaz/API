import type express from 'express';
import { type User } from '@prisma/client';
import properties from '../properties.json';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import { ErrLog, Log, ResLog } from '../tools/log';
import { prisma } from '../app';

const refreshInfos = (user: User) => ({ type: properties.token.type.user, id: user.id });
const accessInfos = (user: User) => ({ type: properties.token.type.user, id: user.id, role: user.role_id });
const SECRET_KEY = process.env.JWT_SECRET ?? 'secret';

export function createAccessToken (user: User) {
    const token = jwt.sign(
        accessInfos(user),
        SECRET_KEY,
        { expiresIn: properties.token.access.expiration }
    );
    return token;
};

export function createRefreshToken (user: User) {
    const token = jwt.sign(
        refreshInfos(user),
        SECRET_KEY
    );
    return token;
};

export function createTokens (user: User) {
    return {
        access: createAccessToken(user),
        refresh: createRefreshToken(user)
    }
};

export async function hashPassword (password: string, rounds: number = -1): Promise<string> {
    return new Promise((resolve, reject) => {
        bcrypt.hash(password, rounds < 0 ? properties.password.salt : rounds).then(hash => {
            resolve(hash);
        }).catch(err => {
            reject(err);
        });
    })
};

export async function verifyPassword (password: string, hash: string): Promise<boolean> {
    return new Promise((resolve, reject) => {
        bcrypt.compare(password, hash).then(result => {
            resolve(result);
        }).catch(err => {
            reject(err);
        });
    })
};

export function verifyToken (token: string): string | jwt.JwtPayload {
    return jwt.verify(token, SECRET_KEY);
}

export function getToken (req: express.Request, res: express.Response) {
    prisma.user.findUnique({ where: { id: res.locals.user.id } }).then(user => {
        if (user === null) {
            new ErrLog(res.locals.lang.error.user.notFound, Log.CODE.FORBIDDEN).sendTo(res);
        } else {
            const tokens = res.locals.token.type === 'refresh'
                ? { access: createAccessToken(user) }
                : createTokens(user);

            new ResLog(res.locals.lang.info.user.logged, { tokens }, Log.CODE.OK).sendTo(res);
        }
    }).catch(err => {
        console.error(err);
        new ErrLog(res.locals.lang.error.generic.internalError, Log.CODE.INTERNAL_SERVER_ERROR, err).sendTo(res);
    });
}

export function getVerify (req: express.Request, res: express.Response) {
    try {
        const givenToken = req.query.token as string;
        if (givenToken === undefined) {
            new ErrLog(res.locals.lang.error.token.missing, Log.CODE.BAD_REQUEST).sendTo(res);
            return;
        }

        const decodedToken = verifyToken(givenToken);
        if (typeof decodedToken === 'string') {
            new ErrLog(res.locals.lang.error.token.invalid, Log.CODE.UNAUTHORIZED).sendTo(res);
            return;
        }
        new ResLog(res.locals.lang.info.token.verified, decodedToken, Log.CODE.OK).sendTo(res);
    } catch (err) {
        if (err instanceof jwt.TokenExpiredError) {
            new ErrLog(res.locals.lang.error.token.expired, Log.CODE.UNAUTHORIZED).sendTo(res);
        } else if (err instanceof jwt.JsonWebTokenError) {
            new ErrLog(res.locals.lang.error.token.invalid as string + ' ( ' + err.message + ' )', Log.CODE.UNAUTHORIZED).sendTo(res);
        } else {
            new ErrLog(res.locals.lang.error.generic.internalError, Log.CODE.INTERNAL_SERVER_ERROR).sendTo(res);
        }
    }
}
