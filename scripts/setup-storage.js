// Load environment variables from .env.local file
require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

// Use environment variables instead of hardcoded strings
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("❌ Error: Missing Supabase environment variables in .env.local");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function setupStorage() {
  const buckets = [
    { name: 'products', public: true },
    { name: 'avatars', public: true },
    { name: 'attachments', public: false },
  ];

  for (const { name, public: isPublic } of buckets) {
    const { data: existing } = await supabase.storage.getBucket(name);
    if (existing) {
      console.log(`Bucket "${name}" already exists.`);
      continue;
    }

    const { error } = await supabase.storage.createBucket(name, {
      public: isPublic,
      fileSizeLimit: 5242880,
      allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp', 'image/gif'],
    });

    if (error) {
      console.error(`Failed to create bucket "${name}":`, error.message);
    } else {
      console.log(`Bucket "${name}" created.`);
    }
  }
}

setupStorage();
