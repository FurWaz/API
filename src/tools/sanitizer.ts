import type express from 'express';
import * as validator from './validator';
import { ErrLog, Log } from './log';

function sanitizeStringField (input: any, req: express.Request, res: express.Response): string | null {
    if (!validator.checkStringField(input, req, res)) return null;
    return input;
}

function sanitizeNumberField (input: any, req: express.Request, res: express.Response): number | null {
    if (input === undefined || input === '' || input === null) {
        new ErrLog(res.locals.error.number.required, Log.CODE.BAD_REQUEST).sendTo(res);
        return null;
    }
    if (typeof input === 'string') input = Number(input);
    if (!validator.checkNumberField(input, req, res)) return null;
    return input;
}

function sanitizeBooleanField (input: any, req: express.Request, res: express.Response): boolean | null {
    if (input === undefined || input === '' || input === null) {
        new ErrLog(res.locals.error.boolean.required, Log.CODE.BAD_REQUEST).sendTo(res);
        return null;
    }
    if (typeof input === 'string') input = Boolean(input);
    if (!validator.checkBooleanField(input, req, res)) return null;
    return input;
}

function sanitizePseudoField (input: any, req: express.Request, res: express.Response): string | null {
    const pseudo = sanitizeStringField(input, req, res);
    if (pseudo === null) return null;
    if (!validator.checkPseudoField(input, req, res)) return null;
    return input;
}

function sanitizeEmailField (input: any, req: express.Request, res: express.Response): string | null {
    const email = sanitizeStringField(input, req, res);
    if (email === null) return null;
    if (!validator.checkEmailField(input, req, res)) return null;
    return input;
}

function sanitizeIdField (input: any, req: express.Request, res: express.Response): number | null {
    const id = sanitizeNumberField(input, req, res);
    if (id === null) return null;
    if (!validator.checkIdField(id, req, res)) return null;
    return input;
}

function sanitizePasswordField (input: any, req: express.Request, res: express.Response): string | null {
    const password = sanitizeStringField(input, req, res);
    if (password === null) return null;
    if (!validator.checkPasswordField(input, req, res)) return null;
    return input;
}

function sanitizeRoleField (input: any, req: express.Request, res: express.Response): number | null {
    const role = sanitizeNumberField(input, req, res);
    if (role === null) return null;
    if (!validator.checkRoleField(input, req, res)) return null;
    return input;
}

export {
    sanitizeNumberField,
    sanitizeStringField,
    sanitizeBooleanField,
    sanitizePseudoField,
    sanitizeEmailField,
    sanitizeIdField,
    sanitizePasswordField,
    sanitizeRoleField
}
