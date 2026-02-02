import { 
    Robot,
    RobotStatus
} from "./robot";

export interface IPositionRepository {
    getAllRobots() : Promise<Robot[]>;
    getRobotById(id: number): Promise<Robot | null>;
    updateRobotPosition(
        id: number, 
        lat: number, 
        lon: number, 
        status?: RobotStatus): Promise<Robot | null>;
}