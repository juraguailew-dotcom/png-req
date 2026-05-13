/**
 * API Route Template with Best Practices
 * 
 * Usage:
 * 1. Copy this file to your route location
 * 2. Replace ENTITY and fields as needed
 * 3. Add role-based access control in checkAccess()
 * 4. Implement specific business logic
 */

import { NextResponse } from 'next/server';
import { 
  getCallerUser, 
  logAudit, 
  checkPermission,
  supabaseAdmin 
} from '../../../lib/supabase-server';
import { 
  handleAPIError, 
  APIError, 
  validateRequired,
  checkRateLimit,
  handleCORS,
  addCORSHeaders 
} from '../../../lib/api-utils';

/**
 * Check if user has access to this endpoint
 */
async function checkAccess(user, method) {
  if (!user) {
    throw new APIError('Authentication required', 401, 'UNAUTHORIZED');
  }

  // Add role-based checks here
  const role = user.app_metadata?.role;
  
  // Customize based on your endpoint
  if (method !== 'GET' && role === 'contractor') {
    throw new APIError('This action is not allowed', 403, 'FORBIDDEN');
  }

  return true;
}

/**
 * Handle GET requests - Retrieve resources
 */
export async function GET(request) {
  try {
    const user = await getCallerUser();
    await checkAccess(user, 'GET');

    // Rate limiting
    checkRateLimit(user.id, 100, 60000);

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = Math.min(parseInt(searchParams.get('limit') || '20', 10), 100);
    const offset = (page - 1) * limit;

    // Build query based on user role
    let query = supabaseAdmin
      .from('entity_name') // Replace with actual table
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    // Apply role-based filters
    if (user.app_metadata?.role === 'contractor') {
      query = query.eq('contractor_id', user.id);
    }

    const { data, error, count } = await query;
    if (error) throw error;

    return NextResponse.json({
      data,
      pagination: {
        page,
        limit,
        total: count,
        totalPages: Math.ceil((count || 0) / limit),
      },
    });
  } catch (error) {
    return handleAPIError(error, request);
  }
}

/**
 * Handle POST requests - Create resources
 */
export async function POST(request) {
  try {
    const user = await getCallerUser();
    await checkAccess(user, 'POST');

    // Rate limiting
    checkRateLimit(user.id, 50, 60000);

    const body = await request.json();
    
    // Validate required fields
    validateRequired(body, ['field1', 'field2']); // Replace with actual fields

    // Create resource
    const { data, error } = await supabaseAdmin
      .from('entity_name') // Replace with actual table
      .insert({
        ...body,
        created_by: user.id,
        created_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) throw error;

    // Log audit trail
    await logAudit(user, 'CREATE', 'entity_name', data.id, body);

    return NextResponse.json(data, { status: 201 });
  } catch (error) {
    return handleAPIError(error, request);
  }
}

/**
 * Handle PUT requests - Update resources
 */
export async function PUT(request) {
  try {
    const user = await getCallerUser();
    await checkAccess(user, 'PUT');

    const body = await request.json();
    const { id } = body;

    validateRequired({ id }, ['id']);

    // Verify ownership
    const { data: existingData, error: fetchError } = await supabaseAdmin
      .from('entity_name') // Replace with actual table
      .select('created_by')
      .eq('id', id)
      .single();

    if (fetchError || !existingData) {
      throw new APIError('Resource not found', 404, 'NOT_FOUND');
    }

    if (existingData.created_by !== user.id && user.app_metadata?.role !== 'admin') {
      throw new APIError('You do not have permission to update this resource', 403, 'FORBIDDEN');
    }

    // Update resource
    const { data, error } = await supabaseAdmin
      .from('entity_name') // Replace with actual table
      .update({
        ...body,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    // Log audit trail
    await logAudit(user, 'UPDATE', 'entity_name', id, body);

    return NextResponse.json(data);
  } catch (error) {
    return handleAPIError(error, request);
  }
}

/**
 * Handle DELETE requests - Delete resources
 */
export async function DELETE(request) {
  try {
    const user = await getCallerUser();
    await checkAccess(user, 'DELETE');

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      throw new APIError('Resource ID is required', 400, 'MISSING_ID');
    }

    // Verify ownership or admin role
    const { data: existingData, error: fetchError } = await supabaseAdmin
      .from('entity_name') // Replace with actual table
      .select('created_by')
      .eq('id', id)
      .single();

    if (fetchError || !existingData) {
      throw new APIError('Resource not found', 404, 'NOT_FOUND');
    }

    if (existingData.created_by !== user.id && user.app_metadata?.role !== 'admin') {
      throw new APIError('You do not have permission to delete this resource', 403, 'FORBIDDEN');
    }

    // Delete resource
    const { error } = await supabaseAdmin
      .from('entity_name') // Replace with actual table
      .delete()
      .eq('id', id);

    if (error) throw error;

    // Log audit trail
    await logAudit(user, 'DELETE', 'entity_name', id);

    return NextResponse.json({ success: true });
  } catch (error) {
    return handleAPIError(error, request);
  }
}

/**
 * Handle OPTIONS requests - CORS preflight
 */
export async function OPTIONS(request) {
  return handleCORS();
}
