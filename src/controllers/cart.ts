import type express from 'express';
import * as validator from '../tools/validator';
import * as formatter from '../tools/formatter';
import { prisma } from '../app';
import { ErrLog, Log, ResLog } from '../tools/log';

export async function getUserCart (req: express.Request, res: express.Response) {
    const id = req.params.id;
    if (!validator.checkIdField(id, req, res)) return;
};

export async function getCart (req: express.Request, res: express.Response) {
    const user = res.locals.user;
    if (user === null || user === undefined) {
        new ErrLog(res.locals.lang.error.generic.internalError, Log.CODE.NOT_FOUND).sendTo(res);
        return;
    }
};

export async function getOwnProducts (req: express.Request, res: express.Response) {
    const app = res.locals.app;
    if (app === null || app === undefined) {
        new ErrLog(res.locals.lang.error.generic.internalError, Log.CODE.NOT_FOUND).sendTo(res);
        return;
    }

    prisma.product.findMany({
        where: {
            app: {
                id: app.id
            }
        }
    }).then((products) => {
        new ResLog(res.locals.lang.infos.product.found, products.map(p => formatter.PublicProduct(p)), Log.CODE.OK).sendTo(res);
    }).catch((err) => {
        console.error(err);
        new ErrLog(res.locals.lang.error.generic.internalError, Log.CODE.NOT_FOUND).sendTo(res);
    });
};

export async function getProduct (req: express.Request, res: express.Response) {
    const id = req.params.id;
    if (!validator.checkIdField(id, req, res)) return;

    prisma.product.findUnique({
        where: {
            id: Number(id)
        }
    }).then((product) => {
        if (product === null || product === undefined) {
            new ErrLog(res.locals.lang.error.generic.notFound, Log.CODE.NOT_FOUND).sendTo(res);
            return;
        }
        new ResLog(res.locals.lang.infos.product.found, formatter.PublicProduct(product), Log.CODE.OK).sendTo(res);
    }).catch((err) => {
        console.error(err);
        new ErrLog(res.locals.lang.error.generic.internalError, Log.CODE.NOT_FOUND).sendTo(res);
    });
};

export async function updateProduct (req: express.Request, res: express.Response) {
    const id = req.params.id;
    const { name, description, price } = req.body;
    if (!validator.checkIdField(id, req, res)) return;
    if (!validator.checkStringField(name, req, res)) return;
    if (!validator.checkStringField(description, req, res)) return;
    if (!validator.checkNumberField(price, req, res)) return;

    prisma.product.update({
        data: {
            name,
            description,
            price
        },
        where: {
            id: Number(id)
        }
    }).then((product) => {
        new ResLog(res.locals.lang.infos.product.created, formatter.PublicProduct(product), Log.CODE.OK).sendTo(res);
    }).catch((err) => {
        console.error(err);
        new ErrLog(res.locals.lang.error.generic.internalError, Log.CODE.NOT_FOUND).sendTo(res);
    });
};

export async function deleteProduct (req: express.Request, res: express.Response) {
    const id = req.params.id;
    if (!validator.checkIdField(id, req, res)) return;

    prisma.product.delete({
        where: {
            id: Number(id)
        }
    }).then((product) => {
        new ResLog(res.locals.lang.infos.product.deleted, formatter.PublicProduct(product), Log.CODE.OK).sendTo(res);
    }).catch((err) => {
        console.error(err);
        new ErrLog(res.locals.lang.error.generic.internalError, Log.CODE.NOT_FOUND).sendTo(res);
    });
};
