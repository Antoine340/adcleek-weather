import 'dotenv/config'; // Initialize environment variables
import { createApp } from './app';

async function startServer() {
  try {
    const app = createApp();
    
    const port = parseInt(process.env.PORT || '3000', 10);
    
    const server = app.listen(port, () => {
      console.log(`🚀 Weather API Server is running!`);
      console.log(`📍 Environment: ${process.env.NODE_ENV || 'development'}`);
      console.log(`🌐 Server: http://localhost:${port}`);
      console.log(`🏥 Health Check: http://localhost:${port}/api/health`);
      console.log(`📚 API Documentation: http://localhost:${port}/`);
      console.log('');
      console.log('Available endpoints:');
      console.log('  GET  /api/cities - List cities');
      console.log('  GET  /api/weather/:insee - Weather forecast');
      console.log('  POST /api/cities - Add city by INSEE code');
      console.log('  POST /api/weather/refresh/:insee - Refresh weather data');
      console.log('');
    });

    // Graceful shutdown handling
    const gracefulShutdown = (signal: string) => {
      console.log(`\n📡 Received ${signal}. Starting graceful shutdown...`);
      
      server.close(() => {
        console.log('🔒 HTTP server closed.');
        process.exit(0);
      });

      // Force close after 10 seconds
      setTimeout(() => {
        console.error('⚠️  Could not close connections in time, forcefully shutting down');
        process.exit(1);
      }, 10000);
    };

    // Handle different termination signals
    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));

    // Handle unhandled promise rejections
    process.on('unhandledRejection', (reason, promise) => {
      console.error('🚨 Unhandled Rejection at:', promise, 'reason:', reason);
      // Application specific logging, throwing an error, or other logic here
    });

    // Handle uncaught exceptions
    process.on('uncaughtException', (error) => {
      console.error('🚨 Uncaught Exception thrown:', error);
      process.exit(1);
    });

  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
}

// Start the server
startServer();
