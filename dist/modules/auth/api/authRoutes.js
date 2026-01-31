"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createAuthRoutes = void 0;
const express_1 = require("express");
const authController_1 = require("./authController");
const createAuthRoutes = (db) => {
    const router = (0, express_1.Router)();
    const authController = new authController_1.AuthController(db);
    router.post('/login', authController.login);
    return router;
};
exports.createAuthRoutes = createAuthRoutes;
//# sourceMappingURL=authRoutes.js.map