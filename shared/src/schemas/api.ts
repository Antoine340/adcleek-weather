import { z } from 'zod';

// Standard API error response
export const ApiErrorSchema = z.object({
  error: z.string(),
  message: z.string().optional(),
  details: z.any().optional(),
});

export type ApiError = z.infer<typeof ApiErrorSchema>;

// API response wrapper for successful responses
export const ApiSuccessSchema = <T extends z.ZodType>(dataSchema: T) =>
  z.object({
    success: z.literal(true),
    data: dataSchema,
  });

// API response wrapper for error responses
export const ApiErrorResponseSchema = z.object({
  success: z.literal(false),
  error: ApiErrorSchema,
});

// Union type for all API responses
export const ApiResponseSchema = <T extends z.ZodType>(dataSchema: T) =>
  z.union([ApiSuccessSchema(dataSchema), ApiErrorResponseSchema]);

export type ApiResponse<T> = 
  | { success: true; data: T }
  | { success: false; error: ApiError }; 