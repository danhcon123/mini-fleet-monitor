"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createAuthRoutes = void 0;
const express_1 = require("express");
const auth_controller_1 = require("./auth.controller");
const createAuthRoutes = (db) => {
    const router = (0, express_1.Router)();
    const authController = new auth_controller_1.AuthController(db);
    router.post('/login', authController.login);
    return router;
};
exports.createAuthRoutes = createAuthRoutes;
//# sourceMappingURL=auth.router.js.map