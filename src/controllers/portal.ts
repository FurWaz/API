import type express from 'express';
import * as sanitizer from '../tools/sanitizer';
import { Log, ErrLog, ResLog } from '../tools/log';
import { type User } from '@prisma/client';
import properties from '../properties.json';
import { randomBytes } from 'crypto';
import { prisma } from '../app';
import { PublicUser } from '../tools/formatter';

class PortalToken {
    token: string;
    appId: number;
    response: express.Response | null;
    user: User | null;
    creation: number;

    constructor (token: string, appId: number) {
        this.token = token;
        this.appId = appId;
        this.response = null;
        this.user = null;
        this.creation = Date.now();
    }

    setUser (user: User) {
        this.user = user;
        this.tryToRespond();
    }

    setResponse (response: express.Response) {
        this.response = response;
        this.tryToRespond();
    }

    isExpired (): boolean {
        return Date.now() > this.creation + Number(properties.portal.tokenExpiration);
    }

    tryToRespond () {
        if (this.response === null || this.user === null) return;
        new ResLog(this.response.locals.lang.info.portal.connected, { user: this.user }).sendTo(this.response);
        portalTokens.splice(portalTokens.indexOf(this), 1);
    }
}

const portalTokens: PortalToken[] = [];

export function generate (req: express.Request, res: express.Response) {
    if (res.locals.app === undefined) {
        new ErrLog(res.locals.lang.error.auth.invalidToken, Log.CODE.FORBIDDEN).sendTo(res);
        return;
    }

    for (let i = 0; i < portalTokens.length; i++) {
        if (portalTokens[i].isExpired()) {
            portalTokens.splice(i, 1);
            i--;
        }
    }

    const token = randomBytes(32).toString('hex');
    const portalToken = new PortalToken(token, res.locals.app.id);
    portalTokens.push(portalToken);

    new ResLog(res.locals.lang.info.portal.generated, { token }).sendTo(res);
}

export function retreive (req: express.Request, res: express.Response) {
    const token = sanitizer.sanitizeStringField(req.params.token, req, res);
    if (token === null) return;

    const portalToken = portalTokens.find((portalToken) => portalToken.token === token);
    if (portalToken === undefined) {
        new ErrLog(res.locals.lang.error.portal.invalidToken, Log.CODE.FORBIDDEN).sendTo(res);
        return;
    }

    if (portalToken.isExpired()) {
        new ErrLog(res.locals.lang.error.portal.expiredToken, Log.CODE.FORBIDDEN).sendTo(res);
        return;
    }

    if (portalToken.response !== null) {
        new ErrLog(res.locals.lang.error.portal.alreadyUsed, Log.CODE.FORBIDDEN).sendTo(res);
        return;
    }

    portalToken.setResponse(res);
}

export function connect (req: express.Request, res: express.Response) {
    if (res.locals.user === undefined) {
        new ErrLog(res.locals.lang.error.auth.invalidToken, Log.CODE.FORBIDDEN).sendTo(res);
        return;
    }

    const token = sanitizer.sanitizeStringField(req.params.token, req, res);
    if (token === null) return;

    const portalToken = portalTokens.find((portalToken) => portalToken.token === token);
    if (portalToken === undefined) {
        new ErrLog(res.locals.lang.error.portal.invalidToken, Log.CODE.FORBIDDEN).sendTo(res);
        return;
    }

    if (portalToken.isExpired()) {
        new ErrLog(res.locals.lang.error.portal.expiredToken, Log.CODE.FORBIDDEN).sendTo(res);
        return;
    }

    if (portalToken.user !== null) {
        new ErrLog(res.locals.lang.error.portal.alreadyUsed, Log.CODE.FORBIDDEN).sendTo(res);
        return;
    }

    prisma.user.findUnique({ where: { id: res.locals.user.id } }).then((user) => {
        if (user === null) {
            new ErrLog(res.locals.lang.error.user.notFound, Log.CODE.FORBIDDEN).sendTo(res);
            return;
        }

        portalToken.setUser(PublicUser(user));
        new ResLog(res.locals.lang.info.portal.connected).sendTo(res);
    }).catch(err => {
        new ErrLog(res.locals.lang.error.generic.internalError, Log.CODE.INTERNAL_SERVER_ERROR, err).sendTo(res);
    });
}
