"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const authRoutes_1 = require("./modules/auth/api/authRoutes");
const logger_1 = require("./shared/logger");
const database_1 = require("./config/database");
const env_1 = require("./config/env");
const app = (0, express_1.default)();
app.use(express_1.default.json());
// Public routes
app.use('/auth', (0, authRoutes_1.createAuthRoutes)(database_1.db));
// Protected route
/*app.get('/robots', authMiddleware, (req, res) => {
    logger.info('Authenticated user:', req.user);
    res.json({ message: 'Protected route', user: req.user })
})*/
console.log("Server.ts reached before listen, port =", env_1.config.port);
app.listen(env_1.config.port, () => {
    console.log(`Listening on http://localhost:${env_1.config.port}`);
    logger_1.logger.info(`Server listening on http://localhost:${env_1.config.port}`);
});
//# sourceMappingURL=server.js.map