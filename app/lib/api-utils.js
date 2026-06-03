import { NextResponse } from 'next/server';

/**
 * Standard API error response handler
 * Ensures consistent error formatting across all API routes
 */
export class APIError extends Error {
  constructor(message, status = 500, code = 'INTERNAL_ERROR') {
    super(message);
    this.status = status;
    this.code = code;
  }
}

/**
 * Handle API errors with consistent response format
 */
export function handleAPIError(error, request) {
  console.error(`[API Error] ${request.method} ${request.nextUrl.pathname}:`, error);

  if (error instanceof APIError) {
    return NextResponse.json(
      {
        error: error.message,
        code: error.code,
      },
      { status: error.status }
    );
  }

  // Handle Supabase errors
  if (error.message?.includes('JWT')) {
    return NextResponse.json(
      { error: 'Authentication failed', code: 'AUTH_ERROR' },
      { status: 401 }
    );
  }

  if (error.message?.includes('UNIQUE')) {
    return NextResponse.json(
      { error: 'Resource already exists', code: 'DUPLICATE_ERROR' },
      { status: 409 }
    );
  }

  // Default server error
  return NextResponse.json(
    {
      error: 'Internal server error',
      code: 'INTERNAL_ERROR',
      ...(process.env.NODE_ENV === 'development' && { details: error.message }),
    },
    { status: 500 }
  );
}

/**
 * Validate required fields in request body
 */
export function validateRequired(data, fields) {
  const missing = fields.filter(field => !data[field]);
  if (missing.length > 0) {
    throw new APIError(`Missing required fields: ${missing.join(', ')}`, 400, 'MISSING_FIELDS');
  }
}

/**
 * Rate limiting helper
 */
const requestCounts = new Map();
export function checkRateLimit(identifier, limit = 100, windowMs = 60000) {
  const now = Date.now();
  const windowStart = now - windowMs;

  if (!requestCounts.has(identifier)) {
    requestCounts.set(identifier, []);
  }

  const requests = requestCounts.get(identifier).filter(t => t > windowStart);
  
  if (requests.length >= limit) {
    throw new APIError('Too many requests', 429, 'RATE_LIMIT');
  }

  requests.push(now);
  requestCounts.set(identifier, requests);
}

/**
 * CORS headers for API routes
 */
export const corsHeaders = {
  'Access-Control-Allow-Credentials': 'true',
  'Access-Control-Allow-Methods': 'GET,OPTIONS,PATCH,DELETE,POST,PUT',
  'Access-Control-Allow-Headers': 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization',
};

/**
 * Handle CORS preflight requests
 */
export function handleCORS() {
  return new NextResponse(null, {
    status: 200,
    headers: corsHeaders,
  });
}

/**
 * Add CORS headers to response
 */
export function addCORSHeaders(response) {
  Object.entries(corsHeaders).forEach(([key, value]) => {
    response.headers.set(key, value);
  });
  return response;
}
