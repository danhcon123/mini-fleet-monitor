"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createPositionRoutes = void 0;
const express_1 = require("express");
const robot_position_controller_1 = require("./robot-position.controller");
const robot_position_service_1 = require("../application/robot-position.service");
const redis_cache_service_1 = require("../application/redis-cache.service");
const robot_position_repo_1 = require("../infrastructure/robot-position.repo");
const auth_middleware_1 = require("../../auth/api/auth-middleware");
const createPositionRoutes = (db) => {
    const router = (0, express_1.Router)();
    // Initialize dependencies
    const positionRepository = new robot_position_repo_1.PositionRepository(db);
    const cacheService = new redis_cache_service_1.RedisCacheService();
    const positionService = new robot_position_service_1.PositionService(positionRepository, cacheService);
    const positionController = new robot_position_controller_1.PositionController(positionService);
    // All routes are protected with JWT
    router.get('/robots', auth_middleware_1.authMiddleware, positionController.getAllRobots);
    router.get('/robots/:id', auth_middleware_1.authMiddleware, positionController.getRobotById);
    router.post('/robots/:id/move', auth_middleware_1.authMiddleware, positionController.moveRobot);
    return router;
};
exports.createPositionRoutes = createPositionRoutes;
//# sourceMappingURL=robot-position.router.js.map