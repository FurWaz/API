import { PrismaClient } from '@prisma/client'
import cors from 'cors';
import Logger from 'tools/Logger.ts';
import Config from 'tools/Config.ts'
import express from 'express';
import getReqLang from 'middleware/getReqLang.ts';
import 'tools/Tasks.ts';

const prisma = new PrismaClient(Logger.prismaSettings);
const app = express();
Logger.init();

app.use(cors({ origin: '*' }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(getReqLang);

import('./routes/index.ts').then(router => app.use('/', router.default));

app.listen(Config.port, () => {
    console.info('Server is listening on port ' + Config.port);
});

export { app, prisma };
