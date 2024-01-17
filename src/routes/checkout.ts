import express from 'express';
import { authuser } from 'middleware/auth.ts';
const router = express.Router();

// Start checkout process
router.post('/', authuser, async (req, res) => {
    /**
     * #swagger.tags = ['Cart']
     * #swagger.description = 'Create a new product'
     * #swagger.operationId = 'createProduct'
     * #swagger.security = [{ ApiKeyAuth: [] }]
     */
    console.log('start checkout process')
    res.end();
});

// Get checkout status
router.get('/', authuser, async (req, res) => {
    /**
     * #swagger.tags = ['Cart']
     * #swagger.description = 'Get own app products'
     * #swagger.operationId = 'getOwnAppProducts'
     * #swagger.security = [{ ApiKeyAuth: [] }]
     */
    console.log('get checkout status')
    res.end();
});

export default router;
