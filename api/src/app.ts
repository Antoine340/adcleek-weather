import express, { Express, Request, Response } from 'express';
import cors from 'cors';
import { Database } from './helper/Database';
import { createAPIRoutes } from './routes/api.routes';

export function createApp(): Express {
  const app = express();

  // CORS - Required by PDF for front-end communication
  app.use(cors());

  // Body parsing middleware
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // Initialize database once
  let database: Database;
  let apiRoutesRouter: any;

  // Root endpoint - Simple API info
  app.get('/', (req: Request, res: Response) => {
    res.json({
      message: 'Weather API Server',
      version: '1.0.0',
      endpoints: {
        cities: 'GET /cities - List all cities',
        weather: 'GET /weather/:insee - Get weather forecast for city',
        addCity: 'POST /cities - Add new city by INSEE code'
      }
    });
  });

  // Simple middleware to ensure database is initialized and setup routes
  app.use(async (req: Request, res: Response, next) => {
    try {
      if (!database) {
        database = new Database();
        await database.init();
        apiRoutesRouter = createAPIRoutes(database);
      }
      (req as any).database = database;
      
      // Skip root path since it's handled above
      if (req.path === '/') {
        return next();
      }
      
      // Use API routes for all other paths
      apiRoutesRouter(req, res, next);
    } catch (error) {
      console.error('Database initialization failed:', error);
      res.status(500).json({ error: 'Database initialization failed' });
    }
  });

  // 404 handler
  app.use('*', (req: Request, res: Response) => {
    res.status(404).json({
      error: 'Route not found',
      path: req.originalUrl
    });
  });

  // Error handler
  app.use((error: any, req: Request, res: Response, next: any) => {
    console.error('Server error:', error);
    res.status(500).json({
      error: 'Internal server error'
    });
  });

  return app;
} 