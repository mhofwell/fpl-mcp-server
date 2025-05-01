// Environment configuration

const env = {
    NODE_ENV: process.env.NODE_ENV || 'development',
    PORT: parseInt(process.env.PORT || '3000', 10),
    // Add other environment variables as needed
};

export default env;
