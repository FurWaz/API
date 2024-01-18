import getReqLang from 'middleware/getReqLang.ts';
import { PrismaClient } from '@prisma/client'
import { fileURLToPath } from 'url';
import Logger from 'tools/Logger.ts';
import Config from 'tools/Config.ts'
import express from 'express';
import cors from 'cors';
import 'tools/Tasks.ts';

const prisma = new PrismaClient(Logger.prismaSettings);
const app = express();
Logger.init();

app.use(cors({ origin: '*' }));
app.use(express.raw({ type: 'application/json' }));
app.use((req, res, next) => {
    (req as any).rawBody = req.body;
    try { req.body = JSON.parse(req.body); }
    catch (err) { req.body = req.body.toString(); }
    next();
});
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(getReqLang);

import('./routes/index.ts').then(router => app.use('/', router.default));

app.listen(Config.port, () => {
    console.info('Server is listening on port ' + Config.port);
});

function getRootDir() {
    return fileURLToPath(new URL('.', import.meta.url));
}

export { app, prisma, getRootDir };
