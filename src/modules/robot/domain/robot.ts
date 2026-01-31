export type RobotStatus = 'idle' | 'moving'
/**
 * Robot domain entity
 */
export interface Robot {
    id: number,
    name: string,
    status: RobotStatus,
    lat: number,
    lon: number,
    updated_at: Date;
}

/**
 * Leipzig city bounds for robot movement
 */
export const LEIPZIG_BOUNDS = {
    minLat: 51.280,
    maxLat: 51.420,
    minLon: 12.280,
    maxLon: 12.500,
}