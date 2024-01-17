import jwt from "jsonwebtoken";
import Config from "./Config.ts";
import HTTPError from "errors/HTTPError.ts";
import HTTP from "./HTTP.ts";
import Lang from "./Lang.ts";

type TokenType = 'access' | 'refresh';
type TokenResource = 'user' | 'app';
export interface TokenData {
    type: TokenType;
    resource: TokenResource;
    id: number;
    payload?: any;
    expiration?: string;
}
export interface TokenDataAccess extends TokenData {
    payload: { roles: string; };
}
export interface TokenDataRefresh extends TokenData {
    payload: undefined;
}
export interface TokenDataApp extends TokenData {
    payload: { authorId: number; }
}

export class TokenUtils {
    private static invalidTokenContext = Lang.CreateTranslationContext('errors', 'InvalidToken');
    private static errUnauthorized = new HTTPError(HTTP.UNAUTHORIZED, Lang.GetText(this.invalidTokenContext));

    private static isValidData(data: TokenData): boolean {
        return data.type === 'access' || data.type === 'refresh'
            && data.resource === 'user' || data.resource === 'app'
            && data.id > 0;
    }

    private static getExpiration(exp: string|undefined): string|number|undefined {
        if (exp === undefined || exp.trim() === '') return undefined;
        const nbr = parseInt(exp.match(/^\d+$/)?.[0] ?? '');
        if (isNaN(nbr)) return exp;
        return nbr;
    }

    static async encode(data: TokenData): Promise<string> {
        const payload: any = {
            type: data.type,
            resource: data.resource,
            id: data.id
        };
        if (data.payload !== undefined) payload.payload = data.payload;
        return await this.encodePayload(payload, data.expiration);
    }

    static async decode(token: string): Promise<TokenData> {
        const data = await this.decodePayload(token) as TokenData;
        if (!this.isValidData(data))
            throw this.errUnauthorized;
        return data;
    }

    static async encodePayload(payload: object, expiration?: string): Promise<string> {
        return new Promise((resolve, reject) => {
            const exp = this.getExpiration(expiration);
            jwt.sign(
                payload,
                Config.security.jwtSecret,
                exp ? { expiresIn: exp } : {},
                (err, token) => {
                if (err) reject(err);
                else if (!token?.trim()) reject('Empty token');
                else resolve(token ?? '');
            });
        });
    }

    static async decodePayload(token: string): Promise<object> {
        return new Promise((resolve, reject) => {
            jwt.verify(token, Config.security.jwtSecret, (err, decoded) => {
                if (err) reject(new HTTPError(HTTP.INVALID_TOKEN, Lang.GetText(this.invalidTokenContext)));
                else if (!decoded) reject(this.errUnauthorized);
                else resolve(decoded as object);
            });
        });
    }
}
