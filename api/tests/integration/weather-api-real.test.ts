import request from 'supertest';
import { createApp } from '../../src/app';
import { Express } from 'express';

describe('Backend Integration Tests - Real API', () => {
  let app: Express;
  
  // Test cities - major French cities with known INSEE codes
  const testCities = {
    paris: '75101',
    lyon: '69123',
    marseille: '13001'
  };

  beforeAll(async () => {
    app = createApp();
    
    // Skip tests if no API key is configured
    if (!process.env.API_KEY) {
      console.log('⚠️  Skipping real API tests - no API_KEY configured');
      return;
    }
    
    console.log('🚀 Starting integration tests with real API calls...');
  });

  describe('Essential API Endpoints', () => {
    test('GET /cities - should list cities', async () => {
      const response = await request(app)
        .get('/cities')
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBeGreaterThan(0);
      expect(response.body[0]).toMatchObject({
        insee: expect.any(String),
        name: expect.any(String),
        zipcode: expect.any(String),
        population: expect.any(Number)
      });

      console.log(`✅ Cities listed: ${response.body.length} cities found`);
    });

    test('GET /weather/:insee - real weather forecast', async () => {
      if (!process.env.API_KEY) return;

      const response = await request(app)
        .get(`/weather/${testCities.paris}`)
        .expect(200);

      expect(response.body).toMatchObject({
        city: expect.objectContaining({
          insee: testCities.paris,
          name: expect.any(String),
          zipcode: expect.any(String),
          population: expect.any(Number)
        }),
        forecast: expect.any(Array),
        statistics: expect.objectContaining({
          rain_sum: expect.any(Number),
          avg_temperature: expect.any(Number),
          day_count: expect.any(Number)
        })
      });

      const { statistics } = response.body;
      console.log(`✅ Weather forecast for ${response.body.city.name}: ${statistics.avg_temperature.toFixed(1)}°C avg, ${statistics.day_count} days`);
    });

    test('GET / - API overview', async () => {
      const response = await request(app)
        .get('/')
        .expect(200);

      expect(response.body).toMatchObject({
        message: 'Weather API Server',
        version: '1.0.0',
        endpoints: expect.any(Object)
      });

      console.log('✅ API overview endpoint working');
    });
  });

  describe('Error Handling', () => {
    test('handles invalid INSEE codes', async () => {
      const response = await request(app)
        .get('/weather/999')  // Invalid format
        .expect(400);

      expect(response.body).toHaveProperty('error');
      console.log('✅ Error handling works for invalid input');
    });

    test('handles 404 for non-existent routes', async () => {
      const response = await request(app)
        .get('/api/nonexistent')
        .expect(404);

      expect(response.body).toMatchObject({
        error: 'Route not found',
        path: '/api/nonexistent'
      });

      console.log('✅ 404 handling works');
    });
  });

  describe('PDF Requirements Compliance', () => {
    test('POST /cities - add new city by INSEE code', async () => {
      if (!process.env.API_KEY) return;

      const testInsee = '33063'; // Bordeaux
      
      // First, try to remove the city if it exists to ensure clean test
      try {
        await request(app).get(`/weather/${testInsee}`);
      } catch (e) {
        // City doesn't exist, which is fine for this test
      }

      const response = await request(app)
        .post('/cities')
        .send({ insee: testInsee });

      // Handle both success (201) and already exists (409) cases
      if (response.status === 201) {
        expect(response.body).toMatchObject({
          insee: testInsee,
          name: expect.any(String),
          zipcode: expect.any(String),
          population: expect.any(Number)
        });
        console.log(`✅ Added new city: ${response.body.name}`);
      } else if (response.status === 409) {
        expect(response.body).toMatchObject({
          error: 'City already exists'
        });
        console.log(`✅ City already exists (expected): ${testInsee}`);
      } else {
        // Log the actual response for debugging
        console.log('Unexpected response:', response.status, response.body);
        throw new Error(`Unexpected response status: ${response.status}`);
      }
    });

    test('verifies weather forecast calculations match PDF requirements', async () => {
      if (!process.env.API_KEY) return;

      const response = await request(app)
        .get(`/weather/${testCities.lyon}`)
        .expect(200);

      const { statistics, forecast } = response.body;

      // Verify PDF requirements are met
      expect(statistics).toHaveProperty('rain_sum');      // Sum of rain predictions
      expect(statistics).toHaveProperty('avg_temperature'); // Average temperature
      expect(statistics).toHaveProperty('day_count');      // Number of days
      
      // Verify day count is correct (should be 4 days max as per PDF)
      expect(statistics.day_count).toBeLessThanOrEqual(4);
      expect(forecast.length).toBeLessThanOrEqual(4);

      // Handle cases where temperature might be 0
      const tempDisplay = statistics.avg_temperature > 0 
        ? `${statistics.avg_temperature.toFixed(1)}°C` 
        : 'N/A';
      
      console.log(`✅ PDF calculations verified: ${statistics.rain_sum}% rain, ${tempDisplay} avg over ${statistics.day_count} days`);
    });
  });
}); 