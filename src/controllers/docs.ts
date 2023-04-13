import type express from 'express';
import { Log, ErrLog } from '../tools/log';

exports.getDocs = (req: express.Request, res: express.Response, _: express.NextFunction) => {
    res.sendFile('docs/index.html', { root: '.' });
}

exports.getDocsYaml = (req: express.Request, res: express.Response, _: express.NextFunction) => {
    res.download('docs' + req.url, 'openapi.yaml');
}

exports.getFavicon = (req: express.Request, res: express.Response, _: express.NextFunction) => {
    if (process.env.FAVICON_URL === undefined) {
        new ErrLog(res.locals.lang.error.documentation.favicon, Log.CODE.NOT_FOUND).sendTo(res);
    } else res.redirect(process.env.FAVICON_URL);
}
