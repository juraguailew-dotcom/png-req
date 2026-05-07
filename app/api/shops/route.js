import { NextResponse } from 'next/server';
import { supabaseAdmin } from '../../lib/supabase-server';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const city = searchParams.get('city');
    const lat = parseFloat(searchParams.get('lat'));
    const lng = parseFloat(searchParams.get('lng'));
    const radius = parseFloat(searchParams.get('radius') || '50'); // km

    let query = supabaseAdmin
      .from('users')
      .select('id, email, full_name, business_name, address, city, latitude, longitude, verified, avatar_url')
      .eq('role', 'hardware_shop')
      .eq('verified', true);

    if (city) {
      query = query.ilike('city', `%${city}%`);
    }

    const { data, error } = await query;
    if (error) throw error;

    let shops = data || [];

    // Calculate distance if lat/lng provided
    if (!isNaN(lat) && !isNaN(lng)) {
      shops = shops
        .map(shop => {
          if (shop.latitude && shop.longitude) {
            const distance = calculateDistance(
              lat,
              lng,
              parseFloat(shop.latitude),
              parseFloat(shop.longitude)
            );
            return { ...shop, distance };
          }
          return { ...shop, distance: null };
        })
        .filter(shop => shop.distance === null || shop.distance <= radius)
        .sort((a, b) => (a.distance || Infinity) - (b.distance || Infinity));
    }

    // Get ratings for each shop
    const shopIds = shops.map(s => s.id);
    const { data: reviews } = await supabaseAdmin
      .from('reviews')
      .select('reviewee_id, rating')
      .in('reviewee_id', shopIds);

    const ratings = {};
    reviews?.forEach(r => {
      if (!ratings[r.reviewee_id]) {
        ratings[r.reviewee_id] = { total: 0, count: 0 };
      }
      ratings[r.reviewee_id].total += r.rating;
      ratings[r.reviewee_id].count += 1;
    });

    shops = shops.map(shop => ({
      ...shop,
      average_rating: ratings[shop.id]
        ? (ratings[shop.id].total / ratings[shop.id].count).toFixed(2)
        : null,
      review_count: ratings[shop.id]?.count || 0,
    }));

    return NextResponse.json({ shops });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// Haversine formula to calculate distance between two coordinates
function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371; // Earth's radius in km
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function toRad(degrees) {
  return degrees * (Math.PI / 180);
}
