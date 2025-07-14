import axios from 'axios';

export class WeatherAPIService {
  private readonly baseURL: string = 'https://api.meteo-concept.com/api';
  private readonly apiKey: string;

  constructor() {
    this.apiKey = process.env.API_KEY || process.env.API_TOKEN || '';
    if (!this.apiKey) {
      throw new Error('API key is required');
    }
  }

  /**
   * Fetch weather forecast for a city by INSEE code
   */
  async fetchForecast(insee: string, days: number = 4): Promise<any> {
    try {
      const response = await axios.get(`${this.baseURL}/forecast/daily`, {
        params: {
          token: this.apiKey,
          insee,
          days
        },
        timeout: 10000
      });

      return response.data;
    } catch (error) {
      throw new Error(`Failed to fetch forecast: ${error}`);
    }
  }

  /**
   * Fetch current weather data for a city by INSEE code
   */
  async fetchCurrentWeather(insee: string): Promise<any> {
    try {
      const response = await axios.get(`${this.baseURL}/forecast/nextHours`, {
        params: {
          token: this.apiKey,
          insee,
          hourly: true
        },
        timeout: 10000
      });

      return response.data;
    } catch (error) {
      throw new Error(`Failed to fetch current weather: ${error}`);
    }
  }
} 