import type express from 'express';
import { getLang } from '../tools/langs';

module.exports = (req: express.Request, res: express.Response, next: express.NextFunction) => {
    const langCode = req.headers['accept-language'];
    const lang = getLang(langCode ?? 'en');
    res.locals.lang = lang;
    next();
};
