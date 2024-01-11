import express from 'express';
import { PrismaClient } from '@prisma/client';
import { Log, ErrLog } from './tools/log';

const dbNeeded = require('./middlewares/dbNeeded');
const translation = require('./middlewares/translation');
const logConnection = require('./middlewares/logConnection');

const settings: any = { errorFormat: 'pretty' };
// const settings: any = { errorFormat: 'pretty', log: ['query', 'info', 'warn'] };
const prisma = new PrismaClient(settings);

const app = express();
app.use(express.raw({ type: 'application/json' }));
app.use((req, res, next) => { (req as any).rawBody = req.body; next(); });
app.use(express.json());

app.use((req, res, next) => {
    process.env.NODE_ENV === 'development'
        ? console.log(`${req.method} ${req.url}`, { body: req.body })
        : console.log(`${req.method} ${req.url}`); // don't log the body in production to avoid leaking sensitive data
    next();
});

app.use((req, res, next) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content, Accept, Content-Type, Authorization');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');

    if (req.method === 'OPTIONS') res.sendStatus(200);
    else next();
});

app.get('/', (req, res) => {
    res.redirect('/docs');
});

app.use('/docs', require('./routes/docs'));
app.use('/auth', translation, require('./routes/auth'));
app.use('/apps', translation, require('./routes/apps'));
app.use('/users', translation, dbNeeded, logConnection, require('./routes/users'));
app.use('/portal', translation, dbNeeded, logConnection, require('./routes/portal'));
app.use('/store', translation, require('./routes/store'));

app.use(translation, (req, res) => {
    new ErrLog(res.locals.lang.error.generic.routeNotFound, Log.CODE.NOT_FOUND).sendTo(res);
});

export { app, prisma };
