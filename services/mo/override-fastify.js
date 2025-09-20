// Fastify host override
process.env.HOST_BIND = process.env.HOST_BIND || '0.0.0.0';

// Import the real app after overriding
require('./src/index');
