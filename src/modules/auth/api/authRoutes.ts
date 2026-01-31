import { Router } from 'express';
import { Pool } from 'pg';
import { AuthController } from './authController';

export const createAuthRoutes = (db: Pool): Router => {
    const router = Router();
    const authController = new AuthController(db);

    router.post('/login', authController.login);
    
    return router
}