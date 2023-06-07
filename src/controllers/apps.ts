import type express from 'express';
import { prisma } from '../app';
import * as validator from '../tools/validator';
import * as sanitizer from '../tools/sanitizer';
import { Log, ErrLog, ResLog } from '../tools/log';
import { type App } from '@prisma/client';
import jwt from 'jsonwebtoken';
import properties from '../properties.json';
const SECRET_KEY = process.env.JWT_SECRET ?? 'secret';

function createAppKey (app: App): string {
    const token = jwt.sign(
        { type: properties.token.type.app, id: app.id },
        SECRET_KEY
    );
    return token;
}

export function create (req: express.Request, res: express.Response) {
    const { name, description } = req.body;

    if (!validator.checkNameField(name, req, res)) return;
    if (!validator.checkStringField(description, req, res)) return;

    prisma.app.count({
        where: {
            author_id: res.locals.user.id
        }
    }).then((count) => {
        if (count >= properties.apps.maxPerUser) {
            new ErrLog(res.locals.lang.error.app.maxPerUser, Log.CODE.ENHANCE_YOUR_CALM).sendTo(res);
            return;
        }

        prisma.app.create({
            data: {
                name,
                description,
                author_id: res.locals.user.id,
                key: ''
            }
        }).then((app: App) => {
            app.key = createAppKey(app);
            prisma.app.update({
                where: { id: app.id },
                data: { key: app.key }
            }).then(() => {
                new ResLog(res.locals.lang.info.app.created, { app }).sendTo(res);
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

export function get (req: express.Request, res: express.Response) {
    const id = sanitizer.sanitizeIdField(req.params.id, req, res);
    if (id === null) return;

    prisma.app.findUnique({ where: { id } }).then(app => {
        if (app === null) {
            new ErrLog(res.locals.lang.error.app.notFound, Log.CODE.NOT_FOUND).sendTo(res);
            return;
        }

        new ResLog(res.locals.lang.info.app.fetched, { app }).sendTo(res);
    }).catch((err) => {
        console.error(err);
        new ErrLog(res.locals.lang.error.generic.internalError, Log.CODE.INTERNAL_SERVER_ERROR).sendTo(res);
    });
}

export function update (req: express.Request, res: express.Response) {
    const { name, description } = req.body;
    const id = sanitizer.sanitizeIdField(req.params.id, req, res);
    if (id === null) return;

    if (name !== undefined && !validator.checkStringField(name, req, res)) return;
    if (description !== undefined && !validator.checkStringField(description, req, res)) return;

    prisma.app.findMany({ where: { id } }).then((apps: App[]) => {
        if (apps.length === 0) {
            new ErrLog(res.locals.lang.error.app.notFound, Log.CODE.NOT_FOUND).sendTo(res);
            return;
        }

        const app = apps[0];
        if (app.author_id !== res.locals.user.id && res.locals.user.role !== properties.role.admin) {
            new ErrLog(res.locals.lang.error.app.notYours, Log.CODE.FORBIDDEN).sendTo(res);
            return;
        }

        prisma.app.update({
            where: { id },
            data: {
                name,
                description,
                verified: (name !== undefined) ? false : undefined
            }
        }).then((app: App) => {
            new ResLog(res.locals.lang.info.app.updated, { app }).sendTo(res);
        }).catch((err) => {
            console.error(err);
            new ErrLog(res.locals.lang.error.generic.internalError, Log.CODE.INTERNAL_SERVER_ERROR).sendTo(res);
        });
    }).catch((err) => {
        console.error(err);
        new ErrLog(res.locals.lang.error.generic.internalError, Log.CODE.INTERNAL_SERVER_ERROR).sendTo(res);
    });
}

export function remove (req: express.Request, res: express.Response) {
    const id = sanitizer.sanitizeIdField(req.params.id, req, res);
    if (id === null) return;

    prisma.app.findMany({ where: { id } }).then((apps: App[]) => {
        if (apps.length === 0) {
            new ErrLog(res.locals.lang.error.app.notFound, Log.CODE.NOT_FOUND).sendTo(res);
            return;
        }

        const app = apps[0];
        if (app.author_id !== res.locals.user.id && res.locals.user.role !== properties.role.admin) {
            new ErrLog(res.locals.lang.error.app.notYours, Log.CODE.FORBIDDEN).sendTo(res);
            return;
        }

        prisma.app.delete({ where: { id } }).then(() => {
            new ResLog(res.locals.lang.info.app.deleted).sendTo(res);
        }).catch((err) => {
            console.error(err);
            new ErrLog(res.locals.lang.error.generic.internalError, Log.CODE.INTERNAL_SERVER_ERROR).sendTo(res);
        });
    }).catch((err) => {
        console.error(err);
        new ErrLog(res.locals.lang.error.generic.internalError, Log.CODE.INTERNAL_SERVER_ERROR).sendTo(res);
    });
}
