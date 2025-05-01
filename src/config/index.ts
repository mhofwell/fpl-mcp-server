// src/config/index.ts
export const config = {
    port: process.env.PORT || 3001,
    nodeEnv: process.env.NODE_ENV || 'development',
    redisUrl: process.env.REDIS_URL || 'redis://localhost:6379',
    nextjsUrl: process.env.NEXT_PUBLIC_URL || 'http://localhost:3000',
};
