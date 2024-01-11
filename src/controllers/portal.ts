import { randomBytes } from 'crypto';
import HTTPError from 'errors/HTTPError.ts';
import type { Response } from 'express';
import { App } from 'models/App.ts';
import { User } from 'models/User.ts';
import { respond } from 'tools/Responses.ts';
import { delayFromNow } from 'tools/Tasks.ts';

interface portalInfos {
    appId: number;
    userId?: number;
    expiration: Date;
    response?: Response;
    timeout?: NodeJS.Timeout;
}
const portalTokens: { [token: string]: portalInfos } = {};

function deletePortal(token: string) {
    const infos = portalTokens[token];
    if (infos === undefined) return;
    if (infos.timeout !== undefined) clearTimeout(infos.timeout);
    delete portalTokens[token];
}

async function resolvePortal(token: string, res?: Response) {
    const infos = portalTokens[token];
    if (infos === undefined) return;

    if (res !== undefined && infos.response === undefined) {
        infos.response = res;
        if (infos.userId === undefined) {
            // Resolve the request after 10 seconds if no user is connected
            setTimeout(() => {
                const newInfos = portalTokens[token];
                if (newInfos === undefined) return;
                if (newInfos.userId === undefined) {
                    newInfos.response = undefined;
                    res.status(204).end();
                }
            }, 10 * 1000);
        }
    }
    if (infos.userId === undefined || infos.response === undefined) return;

    const user = await User.getAsPublic(infos.userId);
    if (user === null)
        throw new HTTPError(
            User.MESSAGES.NOT_FOUND.status,
            User.MESSAGES.NOT_FOUND.message
        );
    
    deletePortal(token);
    respond(infos.response, User.MESSAGES.FETCHED, user);
}

export async function generatePortalToken(appId: number) {
    const code = (await randomBytes(32)).toString('hex');
    portalTokens[code] = {
        appId,
        expiration: delayFromNow(5, 'm'),
        timeout: setTimeout(() => {
            if (portalTokens[code] !== undefined)
                delete portalTokens[code];
        }, 5 * 60 * 1000)
    };
    return code;
}

export async function getPortalUser(res: Response, token: string, appId: number) {
    const infos = portalTokens[token];
    if (infos === undefined) throw HTTPError.TokenExpired();
    if (infos.appId !== appId) throw HTTPError.Unauthorized();

    if (infos.expiration < new Date()) {
        deletePortal(token);
        throw HTTPError.TokenExpired();
    }

    await resolvePortal(token, res);
}

export async function getPortalApp(token: string) {
    const infos = portalTokens[token];
    if (infos === undefined)
        throw HTTPError.TokenExpired();

    if (infos.expiration < new Date()) {
        deletePortal(token);
        throw HTTPError.TokenExpired();
    }

    const app = await App.getAsPublic(infos.appId);
    if (app === null)
        throw new HTTPError(
            App.MESSAGES.NOT_FOUND.status,
            App.MESSAGES.NOT_FOUND.message
        );
    
    return app;
}

export async function connectPortalUser(token: string, userId: number) {
    const infos = portalTokens[token];
    if (infos === undefined)
        throw HTTPError.TokenExpired();

    if (infos.expiration < new Date()) {
        deletePortal(token);
        throw HTTPError.TokenExpired();
    }

    infos.userId = userId;
    await resolvePortal(token);
}
