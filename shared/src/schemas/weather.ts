import { z } from 'zod';

// Weather forecast for a single day
export const WeatherDaySchema = z.object({
  date: z.string(), // ISO date string
  temperature: z.number(),
  humidity: z.number(),
  pressure: z.number(),
  wind_speed: z.number(),
  wind_gust: z.number(),
  wind_direction: z.number(),
  weather_code: z.number(),
  rain_probability: z.number(),
  tmin: z.number(),
  tmax: z.number(),
});

export type WeatherDay = z.infer<typeof WeatherDaySchema>;

// Weather statistics (calculated aggregations)
export const WeatherStatsSchema = z.object({
  rain_sum: z.number(),
  avg_temperature: z.number(),
  day_count: z.number(),
});

export type WeatherStats = z.infer<typeof WeatherStatsSchema>;

// Complete weather response
export const WeatherResponseSchema = z.object({
  city: z.object({
    insee: z.string(),
    name: z.string(),
    zipcode: z.string(),
    population: z.number(),
  }),
  forecast: z.array(WeatherDaySchema),
  statistics: WeatherStatsSchema,
});

export type WeatherResponse = z.infer<typeof WeatherResponseSchema>; 