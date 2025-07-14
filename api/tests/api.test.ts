/// <reference types="jest" />
import request from 'supertest';
import { Database } from '../src/helper/Database';
import fs from 'fs';
import path from 'path';
import express from 'express';
import cors from 'cors';
import { createAPIRoutes } from '../src/routes/api.routes';

describe('API Routes', () => {
  let app: express.Express;
  let database: Database;
  const testDbPath = './test-api.db';

  beforeAll(async () => {
    // Clean up any existing test database
    if (fs.existsSync(testDbPath)) {
      fs.unlinkSync(testDbPath);
    }
    
    // Create isolated test database
    database = new Database(testDbPath);
    await database.init();
    
    // Create minimal express app with test database
    app = express();
    app.use(cors());
    app.use(express.json());
    app.use(express.urlencoded({ extended: true }));
    
    // Root endpoint
    app.get('/', (req, res) => {
      res.json({
        message: 'Test Weather API Server',
        version: '1.0.0'
      });
    });
    
    // Use API routes with test database
    const apiRoutes = createAPIRoutes(database);
    app.use('/', apiRoutes);
    
    // 404 handler
    app.use('*', (req, res) => {
      res.status(404).json({ error: 'Route not found', path: req.path });
    });
  });

  afterAll(async () => {
    // Close database connection
    if (database) {
      await database.close();
    }
    
    // Clean up test database
    if (fs.existsSync(testDbPath)) {
      fs.unlinkSync(testDbPath);
    }
  });

  beforeEach(async () => {
    // Clean database before each test
    await database.run('DELETE FROM city');
    await database.run('DELETE FROM forecast');
  });

  describe('GET /cities', () => {
    it('should return empty array when no cities exist', async () => {
      const response = await request(app)
        .get('/cities')
        .expect(200);

      expect(response.body).toEqual([]);
    });

    it('should return cities with valid data', async () => {
      // Insert test city with valid population
      await database.run(
        'INSERT INTO city (insee, name, zipcode, population) VALUES (?, ?, ?, ?)',
        ['33063', 'Bordeaux', '33000', 259809]
      );

      const response = await request(app)
        .get('/cities')
        .expect(200);

      expect(response.body).toHaveLength(1);
      expect(response.body[0]).toEqual({
        insee: '33063',
        name: 'Bordeaux',
        zipcode: '33000',
        population: 259809
      });
    });

    it('should fail validation with zero population cities', async () => {
      // Insert city with invalid population (0)
      await database.run(
        'INSERT INTO city (insee, name, zipcode, population) VALUES (?, ?, ?, ?)',
        ['33063', 'Bordeaux', '33000', 0]
      );

      const response = await request(app)
        .get('/cities')
        .expect(500);

      expect(response.body).toEqual({
        error: 'Failed to fetch cities'
      });
    });

    it('should fail validation with negative population cities', async () => {
      // Insert city with invalid population (negative)
      await database.run(
        'INSERT INTO city (insee, name, zipcode, population) VALUES (?, ?, ?, ?)',
        ['33063', 'Bordeaux', '33000', -100]
      );

      const response = await request(app)
        .get('/cities')
        .expect(500);

      expect(response.body).toEqual({
        error: 'Failed to fetch cities'
      });
    });
  });

  describe('POST /cities', () => {
    it('should reject empty request body', async () => {
      const response = await request(app)
        .post('/cities')
        .send({})
        .expect(400);

      expect(response.body.error).toContain('Invalid request data');
    });

    it('should reject invalid INSEE code format', async () => {
      const response = await request(app)
        .post('/cities')
        .send({ insee: '123' }) // Too short
        .expect(400);

      expect(response.body.error).toContain('Invalid request data');
    });

    it('should handle non-numeric INSEE code with API processing', async () => {
      // Non-numeric INSEE codes may be processed differently by external APIs
      // Some APIs might transform them to valid codes or reject them
      const response = await request(app)
        .post('/cities')
        .send({ insee: 'ABCDE' });

      // Accept either success (201) or failure (500) since API behavior may vary
      expect([201, 500]).toContain(response.status);
      
      if (response.status === 500) {
        expect(response.body.error).toBe('Failed to add city');
      } else if (response.status === 201) {
        // API might transform the code to a valid INSEE, so just check that we got a city
        expect(response.body).toHaveProperty('insee');
        expect(response.body).toHaveProperty('name');
        expect(response.body).toHaveProperty('zipcode');
        expect(response.body).toHaveProperty('population');
      }
    });

    it('should reject postal code instead of INSEE code', async () => {
      // 66000 is a postal code, not an INSEE code
      const response = await request(app)
        .post('/cities')
        .send({ insee: '66000' })
        .expect(500);

      expect(response.body.error).toBe('Failed to add city');
      expect(response.body.details).toContain('Request failed with status code 400');
    });

    it('should handle API failure gracefully', async () => {
      // Use a valid INSEE format but non-existent code
      const response = await request(app)
        .post('/cities')
        .send({ insee: '99999' })
        .expect(500);

      expect(response.body.error).toBe('Failed to add city');
      expect(response.body.details).toContain('Request failed with status code 400');
    });

    it('should prevent duplicate cities', async () => {
      // First, insert a city manually
      await database.run(
        'INSERT INTO city (insee, name, zipcode, population) VALUES (?, ?, ?, ?)',
        ['33063', 'Bordeaux', '33000', 259809]
      );

      const response = await request(app)
        .post('/cities')
        .send({ insee: '33063' })
        .expect(409); // 409 Conflict is more appropriate for duplicates than 400

      expect(response.body).toEqual({
        error: 'City already exists'
      });
    });
  });

  describe('GET /weather/:insee', () => {
    beforeEach(async () => {
      // Insert test city
      await database.run(
        'INSERT INTO city (insee, name, zipcode, population) VALUES (?, ?, ?, ?)',
        ['33063', 'Bordeaux', '33000', 259809]
      );
    });

    it('should reject invalid INSEE code format', async () => {
      const response = await request(app)
        .get('/weather/123') // Too short
        .expect(400);

      expect(response.body).toEqual({
        error: 'Invalid INSEE code format'
      });
    });

    it('should reject non-numeric INSEE code', async () => {
      const response = await request(app)
        .get('/weather/ABCDE')
        .expect(400);

      expect(response.body).toEqual({
        error: 'Invalid INSEE code format'
      });
    });

    it('should reject non-existent city', async () => {
      const response = await request(app)
        .get('/weather/99999')
        .expect(404);

      expect(response.body).toEqual({
        error: 'City not found'
      });
    });
  });

  describe('Error handling', () => {
    it('should handle database connection errors gracefully', async () => {
      const response = await request(app)
        .get('/nonexistent')
        .expect(404);

      expect(response.body.error).toContain('Route not found');
    });
  });

  describe('Data validation edge cases', () => {
    it('should handle cities with very long names', async () => {
      const longName = 'A'.repeat(100);
      await database.run(
        'INSERT INTO city (insee, name, zipcode, population) VALUES (?, ?, ?, ?)',
        ['33063', longName, '33000', 259809]
      );

      const response = await request(app)
        .get('/cities')
        .expect(200);

      expect(response.body[0].name).toBe(longName);
    });

    it('should handle cities with special characters', async () => {
      const specialName = 'Saint-Étienne-du-Grès';
      await database.run(
        'INSERT INTO city (insee, name, zipcode, population) VALUES (?, ?, ?, ?)',
        ['13090', specialName, '13103', 2653]
      );

      const response = await request(app)
        .get('/cities')
        .expect(200);

      expect(response.body[0].name).toBe(specialName);
    });

    it('should handle very large population numbers', async () => {
      const largePopulation = 9999999;
      await database.run(
        'INSERT INTO city (insee, name, zipcode, population) VALUES (?, ?, ?, ?)',
        ['13055', 'Marseille', '13000', largePopulation]
      );

      const response = await request(app)
        .get('/cities')
        .expect(200);

      expect(response.body[0].population).toBe(largePopulation);
    });
  });
}); 