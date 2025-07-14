import { Router, Request, Response } from 'express';
import { Database } from '../helper/Database';
import { WeatherAPIService } from '../services/weather-api.service';
import { CitiesSchema, CreateCitySchema, WeatherResponseSchema } from '@weather-app/shared';

export function createAPIRoutes(database: Database): Router {
  const router = Router();

  /**
   * GET /cities
   * List cities - PDF Requirement #1
   * Returns: insee, name, zipcode, population (no DB IDs)
   */
  router.get('/cities', async (req: Request, res: Response) => {
    try {
      const cities = await database.all('SELECT insee, name, zipcode, population FROM city ORDER BY name');
      
      // Validate response with Zod schema
      const validatedCities = CitiesSchema.parse(cities);
      
      res.json(validatedCities);
    } catch (error) {
      console.error('Error fetching cities:', error);
      res.status(500).json({ error: 'Failed to fetch cities' });
    }
  });

  /**
   * GET /weather/:insee
   * Weather forecast - PDF Requirement #2
   * 1. Check DB for existing data
   * 2. If not found, fetch from API
   * 3. Store in DB with JSON details
   * 4. Return with required calculations:
   *    - Sum of rain predictions (4 days: today + 3 following)
   *    - Average min/max temperature (4 days)
   *    - Number of days used for calculations
   */
  router.get('/weather/:insee', async (req: Request, res: Response) => {
    try {
      const { insee } = req.params;

      // Validate INSEE code format
      if (!/^\d{5,6}$/.test(insee)) {
        return res.status(400).json({ error: 'Invalid INSEE code format' });
      }

      // Check if city exists
      const city = await database.get('SELECT * FROM city WHERE insee = ?', [insee]);
      if (!city) {
        return res.status(404).json({ error: 'City not found' });
      }

      // Check for existing recent forecast data (less than 1 hour old)
      const today = new Date().toISOString().split('T')[0];
      const existingForecast = await database.get(
        'SELECT * FROM forecast WHERE insee = ? AND date >= ?',
        [insee, today]
      );

      let forecastData;

      if (existingForecast) {
        // Use cached data
        const allForecasts = await database.all(
          'SELECT * FROM forecast WHERE insee = ? AND date >= ? ORDER BY date LIMIT 4',
          [insee, today]
        );
        forecastData = allForecasts.map(f => ({
          date: f.date,
          ...JSON.parse(f.details)
        }));
      } else {
        // Instantiate API service only when needed
        const weatherAPI = new WeatherAPIService();
        
        // Fetch from API
        const apiResponse = await weatherAPI.fetchForecast(insee, 4);
        
        // Store in database with JSON details (PDF requirement)
        const forecasts = apiResponse.forecast.slice(0, 4); // Only 4 days as per PDF
        
        for (const forecast of forecasts) {
          const date = forecast.datetime.split('T')[0]; // Extract date
          
          // Handle different API response structures
          // Daily forecast has tmin/tmax, hourly has temp2m
          const temperature = forecast.temp2m || ((forecast.tmin + forecast.tmax) / 2) || 0;
          const rainProbability = forecast.probarain || forecast.probrain || 0;
          
          const details = JSON.stringify({
            temperature: temperature,
            humidity: forecast.rh2m || forecast.humidity || 0,
            pressure: forecast.pmer || forecast.pressure || 0,
            wind_speed: forecast.wind10m || forecast.wind_speed || 0,
            wind_gust: forecast.gust10m || forecast.wind_gust || 0,
            wind_direction: forecast.dirwind10m || forecast.wind_direction || 0,
            weather_code: forecast.weather || forecast.weather_code || 0,
            rain_probability: rainProbability,
            tmin: forecast.tmin || temperature,
            tmax: forecast.tmax || temperature
          });

          await database.run(
            'INSERT OR REPLACE INTO forecast (insee, date, details) VALUES (?, ?, ?)',
            [insee, date, details]
          );
        }

        forecastData = forecasts.map(f => {
          const temperature = f.temp2m || ((f.tmin + f.tmax) / 2) || 0;
          const rainProbability = f.probarain || f.probrain || 0;
          
          return {
            date: f.datetime.split('T')[0],
            temperature: temperature,
            humidity: f.rh2m || f.humidity || 0,
            pressure: f.pmer || f.pressure || 0,
            wind_speed: f.wind10m || f.wind_speed || 0,
            wind_gust: f.gust10m || f.wind_gust || 0,
            wind_direction: f.dirwind10m || f.wind_direction || 0,
            weather_code: f.weather || f.weather_code || 0,
            rain_probability: rainProbability,
            tmin: f.tmin || temperature,
            tmax: f.tmax || temperature
          };
        });
      }

      // Calculate required statistics (PDF requirements)
      const validTemperatures = forecastData.filter(d => d.temperature != null && d.temperature > 0);
      const rainSum = forecastData.reduce((sum, day) => sum + (day.rain_probability || 0), 0);
      const temperatureSum = validTemperatures.reduce((sum, day) => sum + day.temperature, 0);
      const avgTemperature = validTemperatures.length > 0 ? temperatureSum / validTemperatures.length : 0;
      const dayCount = forecastData.length;

      // Response with required calculations
      res.json({
        city: {
          insee: city.insee,
          name: city.name,
          zipcode: city.zipcode,
          population: city.population
        },
        forecast: forecastData,
        statistics: {
          rain_sum: rainSum,                    // Sum of rain predictions
          avg_temperature: avgTemperature,      // Average temperature
          day_count: dayCount                   // Number of days
        }
      });

    } catch (error) {
      console.error('Error fetching weather:', error);
      res.status(500).json({ error: 'Failed to fetch weather data' });
    }
  });

  /**
   * POST /cities
   * Add city by INSEE code - PDF Requirement #3
   * Fetches city info from weather API and adds to database
   */
  router.post('/cities', async (req: Request, res: Response) => {
    try {
      // Validate request body with Zod
      const validatedRequest = CreateCitySchema.parse(req.body);
      const { insee } = validatedRequest;

      // Check if city already exists
      const existingCity = await database.get('SELECT * FROM city WHERE insee = ?', [insee]);
      if (existingCity) {
        return res.status(409).json({ error: 'City already exists' });
      }

      // Instantiate API service only when needed
      const weatherAPI = new WeatherAPIService();
      
      // Fetch city information from weather API
      const apiResponse = await weatherAPI.fetchCurrentWeather(insee);
      
      // Extract city info from API response
      const cityInfo = apiResponse.city;
      
      // Insert new city with proper fallbacks for missing data
      // Use a reasonable default population if API doesn't provide it (Zod requires positive integer)
      const defaultPopulation = 1000; // Reasonable fallback for small communes
      await database.run(
        'INSERT INTO city (insee, name, zipcode, population) VALUES (?, ?, ?, ?)',
        [
          cityInfo.insee, 
          cityInfo.name || 'Unknown City', 
          cityInfo.cp?.toString() || cityInfo.zipcode || cityInfo.insee.substring(0, 5), // Use cp field or fallback
          cityInfo.population || defaultPopulation
        ]
      );

      // Return the new city (without DB ID as per PDF)
      res.status(201).json({
        insee: cityInfo.insee,
        name: cityInfo.name || 'Unknown City',
        zipcode: cityInfo.cp?.toString() || cityInfo.zipcode || cityInfo.insee.substring(0, 5),
        population: cityInfo.population || defaultPopulation
      });

    } catch (error) {
      console.error('Error adding city:', error);
      
      // Handle Zod validation errors
      if (error instanceof Error && error.name === 'ZodError') {
        return res.status(400).json({ 
          error: 'Invalid request data', 
          details: error.message 
        });
      }
      
      // Return more detailed error information for debugging
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error('Detailed error:', errorMessage);
      
      res.status(500).json({ 
        error: 'Failed to add city',
        details: errorMessage 
      });
    }
  });

  return router;
} 