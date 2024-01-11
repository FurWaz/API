import type express from 'express';
import { prisma } from '../app';
import * as validator from '../tools/validator';
import { Log, ErrLog, ResLog } from '../tools/log';
import { type User } from '@prisma/client';
import { createTokens, hashPassword, verifyPassword } from './auth';
import * as Formatter from '../tools/formatter';
import properties from '../properties.json';
import { sanitizeIdField } from '../tools/sanitizer';

export async function _login (email: string, password: string, req: express.Request, res: express.Response): Promise<object> {
    return new Promise((resolve, reject) => {
        prisma.user.findUnique({ where: { email } }).then((user: User | null) => {
            if (user === null) {
                new ErrLog(res.locals.lang.error.user.notFound, Log.CODE.NOT_FOUND).sendTo(res);
                return;
            }

            verifyPassword(password, user.password).then(result => {
                if (!result) {
                    reject(new ErrLog(res.locals.lang.error.user.wrongPassword, Log.CODE.FORBIDDEN));
                    return;
                }

                resolve(user);
            }).catch(err => {
                console.error(err);
                reject(new ErrLog(res.locals.lang.error.generic.internalError, Log.CODE.INTERNAL_SERVER_ERROR));
            });
        }).catch((err) => {
            console.error(err);
            reject(new ErrLog(res.locals.lang.error.generic.internalError, Log.CODE.INTERNAL_SERVER_ERROR));
        });
    });
}

export function userfromId (id: number, req: express.Request, res: express.Response, callback: (user: User) => void) {
    prisma.user.findUnique({ where: { id } }).then((user: User | null) => {
        if (user === null) {
            new ErrLog(res.locals.lang.error.user.notFound, Log.CODE.NOT_FOUND).sendTo(res);
            return;
        }

        callback(user);
    }).catch((err) => {
        console.error(err);
        new ErrLog(res.locals.lang.error.generic.internalError, Log.CODE.INTERNAL_SERVER_ERROR).sendTo(res);
    });
}

export function create (req: express.Request, res: express.Response) {
    const { pseudo, email, password } = req.body;

    if (!validator.checkPseudoField(pseudo, req, res)) return;
    if (!validator.checkEmailField(email, req, res)) return;
    if (!validator.checkPasswordField(password, req, res)) return;

    prisma.user.count({ where: { email } }).then((count: number) => {
        if (count > 0) {
            new ErrLog(res.locals.lang.error.user.alreadyExists, Log.CODE.CONFLICT).sendTo(res);
            return;
        }

        hashPassword(password).then((hash) => {
            prisma.user.create({ data: { pseudo, email, password: hash, roleId: 1 } }).then((user: User) => {
                const tokens = createTokens(user);
                new ResLog(res.locals.lang.info.user.registered, { user: Formatter.PrivateUser(user), tokens }, Log.CODE.CREATED).sendTo(res);
            }).catch((err) => {
                console.error(err);
                new ErrLog(res.locals.lang.error.generic.internalError, Log.CODE.INTERNAL_SERVER_ERROR).sendTo(res);
            });
        }).catch((err) => {
            console.error(err);
            new ErrLog(res.locals.lang.error.generic.internalError, Log.CODE.INTERNAL_SERVER_ERROR).sendTo(res);
        });
    }).catch((err) => {
        console.error(err);
        new ErrLog(res.locals.lang.error.generic.internalError, Log.CODE.INTERNAL_SERVER_ERROR).sendTo(res);
    });
};

export function update (req: express.Request, res: express.Response) {
    const id = req.params.id;
    if (!validator.checkIdField(id, req, res)) return;

    if (res.locals.user.id !== id && res.locals.user.role < properties.role.admin) {
        new ErrLog(res.locals.lang.error.generic.notEnoughPerms, Log.CODE.UNAUTHORIZED).sendTo(res);
        return;
    }

    // eslint-disable-next-line @typescript-eslint/naming-convention
    const { pseudo, email, send_email } = req.body;
    if (pseudo !== undefined && !validator.checkPseudoField(pseudo, req, res)) return;
    if (email !== undefined && !validator.checkPseudoField(email, req, res)) return;
    if (send_email !== undefined && !validator.checkBooleanField(send_email, req, res)) return;

    const infos = { pseudo, email, send_email };

    if (Object.keys(infos).length === 0) {
        new ErrLog(res.locals.lang.error.generic.noUpdateInfos).sendTo(res);
        return;
    }

    prisma.user.update({
        where: { id: res.locals.user.id },
        data: infos
    }).then(user => {
        new ResLog(res.locals.lang.info.user.updated, { user }).sendTo(res);
    }).catch(err => {
        console.error(err);
        new ErrLog(res.locals.lang.error.generic.internalError, Log.CODE.INTERNAL_SERVER_ERROR).sendTo(res);
    });
}

export function get (req: express.Request, res: express.Response) {
    const id = sanitizeIdField(req.params.id, req, res);
    if (id === null) return;

    if (res.locals.user.id !== id && res.locals.user.role < properties.role.admin) {
        new ErrLog(res.locals.lang.error.generic.notEnoughPerms, Log.CODE.UNAUTHORIZED).sendTo(res);
        return;
    }

    prisma.user.findUnique({ where: { id } }).then((user: User | null) => {
        if (user === null) {
            new ErrLog(res.locals.lang.error.user.notFound, Log.CODE.NOT_FOUND).sendTo(res);
            return;
        }

        new ResLog(res.locals.lang.info.user.fetched, { user: Formatter.PrivateUser(user) }, Log.CODE.OK).sendTo(res);
    }).catch(err => {
        console.error(err);
        new ErrLog(res.locals.lang.error.generic.internalError, Log.CODE.INTERNAL_SERVER_ERROR).sendTo(res);
    });
}

export function remove (req: express.Request, res: express.Response) {
    const id = sanitizeIdField(req.params.id, req, res);
    if (id === null) return;

    if (res.locals.user.id !== id && res.locals.user.role < properties.role.admin) {
        new ErrLog(res.locals.lang.error.generic.notEnoughPerms, Log.CODE.UNAUTHORIZED).sendTo(res);
        return;
    }

    prisma.user.findUnique({ where: { id } }).then((user: User | null) => {
        if (user === null) {
            new ErrLog(res.locals.lang.error.user.notFound, Log.CODE.NOT_FOUND).sendTo(res);
            return;
        }

        prisma.user.delete({ where: { id } }).then(() => {
            new ResLog(res.locals.lang.info.user.deleted, { user }).sendTo(res);
        }).catch(err => {
            console.error(err);
            new ErrLog(res.locals.lang.error.generic.internalError, Log.CODE.INTERNAL_SERVER_ERROR).sendTo(res);
        });
    }).catch(err => {
        console.error(err);
        new ErrLog(res.locals.lang.error.generic.internalError, Log.CODE.INTERNAL_SERVER_ERROR).sendTo(res);
    });
}

export function getMe (req: express.Request, res: express.Response) {
    req.params.id = res.locals.user.id;
    get(req, res);
}

export function updateMe (req: express.Request, res: express.Response) {
    req.params.id = res.locals.user.id;
    update(req, res);
}

export function removeMe (req: express.Request, res: express.Response) {
    req.params.id = res.locals.user.id;
    remove(req, res);
}
