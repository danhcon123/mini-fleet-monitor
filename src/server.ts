import express from 'express';
import { createAuthRoutes } from './modules/auth/api/authRoutes';
import { authMiddleware } from './modules/auth/api/authMiddleware';
import { logger } from './shared/logger';
import { db } from './config/database';
import { config } from './config/env';

const app = express();
app.use(express.json());

// Public routes
app.use('/auth', createAuthRoutes(db));

// Protected route
/*app.get('/robots', authMiddleware, (req, res) => {
    logger.info('Authenticated user:', req.user);
    res.json({ message: 'Protected route', user: req.user })
})*/

console.log("Server.ts reached before listen, port =", config.port);

app.listen(config.port, () => {
  console.log(`Listening on http://localhost:${config.port}`);
  logger.info(`Server listening on http://localhost:${config.port}`);
});