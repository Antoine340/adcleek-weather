import { z } from 'zod';

// City schema - matches the database structure
export const CitySchema = z.object({
  insee: z.string().min(5, 'INSEE code must be at least 5 characters'),
  name: z.string().min(1, 'City name is required'),
  zipcode: z.string().min(5, 'Zipcode must be at least 5 characters'),
  population: z.number().int().positive('Population must be a positive integer'),
});

// Type inference from schema
export type City = z.infer<typeof CitySchema>;

// Schema for creating a new city (only INSEE required, others fetched from API)
export const CreateCitySchema = z.object({
  insee: z.string().min(5, 'INSEE code must be at least 5 characters'),
});

export type CreateCity = z.infer<typeof CreateCitySchema>;

// Array of cities
export const CitiesSchema = z.array(CitySchema);
export type Cities = z.infer<typeof CitiesSchema>; 