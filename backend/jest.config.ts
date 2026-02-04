import type { Config } from 'jest';

const config: Config = {
    preset: 'ts-jest',
    testEnvironment: 'node',
    roots: ['<rootDir>/src'],
    testMatch: ['**/*.test.ts'],
    moduleFileExtensions: ['ts', 'js', 'json'],
    // Longer timeout for integration tests hitting real DB/Redis
    testTimeout: 15000,
    "setupFiles": ["dotenv/config"],
};

export default config;
