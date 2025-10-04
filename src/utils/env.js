/**
 * Environment detection utilities
 */

// Parcel sets process.env.NODE_ENV during build
export const isDevelopment = process.env.NODE_ENV === 'development';
export const isProduction = process.env.NODE_ENV === 'production';

// Helper for secure logging
export const shouldLog = isDevelopment;
