import type { Request, Response } from 'express';
import express from 'express';

import routerDocs from './docs.ts';
import routerAuth from './auth.ts';
import routerUsers from './users.ts';
import routerApps from './apps.ts';
import routerPortal from './portal.ts';
import routerVerify from './verify.ts';

const router = express.Router();

router.get('/', (req: Request, res: Response) => {
    /* #swagger.ignore = true */
    res.redirect('/docs');
});

router.use('/docs', routerDocs);
router.use('/auth', routerAuth);
router.use('/users', routerUsers);
router.use('/apps', routerApps);
router.use('/portal', routerPortal);
router.use('/verify', routerVerify);

export default router;
