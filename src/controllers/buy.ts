import { randomBytes } from 'crypto';
import HTTPError from 'errors/HTTPError.ts';
import type { Response } from 'express';
import { UserProduct } from 'models/UserProduct.ts';
import Lang from 'tools/Lang.ts';
import { respond } from 'tools/Responses.ts';
import { delayFromNow } from 'tools/Tasks.ts';

interface buyInfos {
    appId: number;
    userId?: number;
    productId: number;
    quantity: number;
    accepted: boolean;
    expiration: Date;
    response?: Response;
    timeout?: NodeJS.Timeout;
}
const buyTokens: { [token: string]: buyInfos } = {};

function deleteBuy(token: string) {
    const infos = buyTokens[token];
    if (infos === undefined) return;
    if (infos.timeout !== undefined) clearTimeout(infos.timeout);
    delete buyTokens[token];
}

async function resolveBuy(token: string, res?: Response) {
    const infos = buyTokens[token];
    if (infos === undefined) return;

    if (res !== undefined && infos.response === undefined) {
        infos.response = res;
        if (!infos.accepted) {
            // Resolve the request after 10 seconds if no user is connected
            setTimeout(() => {
                const newInfos = buyTokens[token];
                if (newInfos === undefined) return;
                if (!newInfos.accepted) {
                    newInfos.response = undefined;
                    res.status(204).end();
                }
            }, 10 * 1000); // 10 seconds
        }
    }
    if (!infos.accepted || infos.response === undefined) return;
    
    deleteBuy(token);
    respond(infos.response, {
        message: Lang.GetText(Lang.CreateTranslationContext('responses', 'BuyAccepted')),
        status: 200
    });
}

export async function generateBuyToken(appId: number, userId: number, productId: number, quantity: number) {
    const code = (await randomBytes(32)).toString('hex');
    buyTokens[code] = {
        appId,
        userId,
        productId,
        quantity,
        accepted: false,
        expiration: delayFromNow(5, 'm'),
        timeout: setTimeout(() => {
            if (buyTokens[code] !== undefined)
                delete buyTokens[code];
        }, 5 * 60 * 1000) // 5 minutes
    };
    return code;
}

export async function getBuyStatus(res: Response, token: string, appId: number) {
    const infos = buyTokens[token];
    if (infos === undefined) throw HTTPError.TokenExpired();
    if (infos.appId !== appId) throw HTTPError.Unauthorized();

    if (infos.expiration < new Date()) {
        deleteBuy(token);
        throw HTTPError.TokenExpired();
    }

    await resolveBuy(token, res);
}

export async function getBuyInfos(token: string, userId: number) {
    const infos = buyTokens[token];
    if (infos === undefined) throw HTTPError.TokenExpired();
    if (infos.userId !== userId || infos.accepted) throw HTTPError.Unauthorized();

    if (infos.expiration < new Date()) {
        deleteBuy(token);
        throw HTTPError.TokenExpired();
    }

    return {
        appId: infos.appId,
        productId: infos.productId,
        quantity: infos.quantity
    };
}

export async function acceptBuy(token: string, userId: number) {
    const infos = buyTokens[token];
    if (infos === undefined) throw HTTPError.TokenExpired();
    if (infos.userId !== userId || infos.accepted) throw HTTPError.Unauthorized();

    if (infos.expiration < new Date()) {
        deleteBuy(token);
        throw HTTPError.TokenExpired();
    }

    await UserProduct.addProduct(userId, infos.productId, infos.quantity);

    infos.accepted = true;
    await resolveBuy(token);
}
