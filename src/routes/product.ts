import express from 'express';
import * as controller from '../controllers/product';

const router = express.Router();

function async2sync (fn: any) {
    return (req: any, res: any) => {
        fn(req, res).then().catch();
    }
}

router.post('/', async2sync(controller.createProduct));
router.get('/', async2sync(controller.getOwnProducts));
router.get('/{id}', async2sync(controller.getProduct));
router.put('/{id}', async2sync(controller.updateProduct));
router.delete('/{id}', async2sync(controller.deleteProduct));

module.exports = router;
