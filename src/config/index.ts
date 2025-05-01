// src/config/index.ts
export const config = {
    port: process.env.PORT || 3001,
    nodeEnv: process.env.NODE_ENV || 'development',
    redisUrl:
        `${process.env.REDIS_URL}?family=0` ||
        'redis://localhost:6379?family=0',
    nextjsUrl: process.env.NEXT_PRIVATE_URL || 'http://localhost:3000',
    appEnv: process.env.RAILWAY_ENVIRONMENT_NAME || 'development',
};
