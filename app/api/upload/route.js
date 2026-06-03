import { NextResponse } from 'next/server';
import { supabaseAdmin, getCallerUser } from '../../lib/supabase-server';

export async function GET() {
  return NextResponse.json({ error: 'Method Not Allowed' }, { status: 405 });
}

export async function POST(request) {
  try {
    const user = await getCallerUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get('file');
    const bucketValue = formData.get('bucket') || 'avatars';
    const bucket = String(bucketValue).trim();

    if (!file || typeof file === 'string') {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    const allowedBuckets = ['avatars', 'products', 'attachments'];
    if (!allowedBuckets.includes(bucket)) {
      return NextResponse.json({ error: 'Invalid bucket' }, { status: 400 });
    }

    const fileNameBase = typeof file.name === 'string' ? file.name : 'upload.dat';
    const fileExt = fileNameBase.includes('.') ? fileNameBase.split('.').pop() : 'dat';
    const fileName = `${user.id}/${Date.now()}.${fileExt}`;

    if (typeof file.arrayBuffer !== 'function') {
      return NextResponse.json({ error: 'Invalid file upload data' }, { status: 400 });
    }

    const arrayBuffer = await file.arrayBuffer();

    const { data, error } = await supabaseAdmin.storage
      .from(bucket)
      .upload(fileName, arrayBuffer, {
        contentType: file.type || 'application/octet-stream',
        upsert: false,
      });

    if (error) {
      console.error('Supabase upload error:', error);
      return NextResponse.json({ error: error.message || 'Upload failed' }, { status: 500 });
    }

    const { data: urlData, error: urlError } = supabaseAdmin.storage
      .from(bucket)
      .getPublicUrl(fileName);

    if (urlError) {
      console.error('Supabase public URL error:', urlError);
      return NextResponse.json({ error: urlError.message || 'Failed to get public URL' }, { status: 500 });
    }

    return NextResponse.json({
      url: urlData.publicUrl,
      path: fileName,
    });
  } catch (error) {
    console.error('Upload route error:', error);
    return NextResponse.json({ error: error?.message || 'Server error' }, { status: 500 });
  }
}

export async function DELETE(request) {
  try {
    const user = await getCallerUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { bucket, path } = await request.json();

    if (!bucket || !path) {
      return NextResponse.json({ error: 'Bucket and path required' }, { status: 400 });
    }

    // Verify user owns the file (path starts with user.id)
    if (!path.startsWith(user.id + '/')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { error } = await supabaseAdmin.storage
      .from(bucket)
      .remove([path]);

    if (error) throw error;

    return NextResponse.json({ message: 'File deleted successfully' });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
