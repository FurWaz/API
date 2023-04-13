import type express from 'express';
import { ErrLog, Log } from '../tools/log';

module.exports = (req: express.Request, res: express.Response, next: express.NextFunction) => {
    if (res.locals.user === undefined) {
        console.error('User is undefined in emailVerified middleware');
        new ErrLog(res.locals.lang.error.generic.internalError, Log.CODE.INTERNAL_SERVER_ERROR).sendTo(res);
        return;
    }

    if (res.locals.user.emailVerifiedOn === null) {
        new ErrLog(res.locals.lang.error.auth.emailNotVerified, Log.CODE.FORBIDDEN).sendTo(res);
        return;
    }

    next();
};
