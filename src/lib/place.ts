import { Place } from './types';

const PLACE_CACHE_KEY = 'kilroy_place';

/**
 * Get cached place from session storage
 */
export function getCachedPlace(): Place | null {
  if (typeof window === 'undefined') return null;

  const cached = sessionStorage.getItem(PLACE_CACHE_KEY);
  if (!cached) return null;

  try {
    return JSON.parse(cached) as Place;
  } catch {
    return null;
  }
}

/**
 * Cache place in session storage
 */
export function setCachedPlace(place: Place): void {
  if (typeof window === 'undefined') return;
  sessionStorage.setItem(PLACE_CACHE_KEY, JSON.stringify(place));
}

/**
 * Generate a stable place_id from coordinates when no Google Place is available
 */
function generatePlaceIdFromAddress(address: string): string {
  // Simple hash for address-based place_id
  let hash = 0;
  for (let i = 0; i < address.length; i++) {
    const char = address.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return `addr_${Math.abs(hash).toString(36)}`;
}

/**
 * Resolve current location to a Place using Google Places API
 */
export async function resolvePlace(lat: number, lng: number): Promise<Place> {
  // Check cache first
  const cached = getCachedPlace();
  if (cached) return cached;

  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_PLACES_API_KEY;

  if (!apiKey) {
    // Fallback: use reverse geocoding without Places API
    return resolveWithGeocoding(lat, lng);
  }

  try {
    // Try Google Places Nearby Search first for named places
    const nearbyUrl = `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${lat},${lng}&radius=50&key=${apiKey}`;
    const nearbyResponse = await fetch(nearbyUrl);
    const nearbyData = await nearbyResponse.json();

    if (nearbyData.results && nearbyData.results.length > 0) {
      const topResult = nearbyData.results[0];
      const place: Place = {
        place_id: topResult.place_id,
        place_name: topResult.name,
        address: topResult.vicinity,
      };
      setCachedPlace(place);
      return place;
    }

    // Fallback to geocoding for address
    return resolveWithGeocoding(lat, lng);
  } catch (error) {
    console.error('Place resolution error:', error);
    return resolveWithGeocoding(lat, lng);
  }
}

/**
 * Fallback: resolve using reverse geocoding
 */
async function resolveWithGeocoding(lat: number, lng: number): Promise<Place> {
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_PLACES_API_KEY;

  if (!apiKey) {
    // Ultimate fallback: coordinate-based place
    const place: Place = {
      place_id: `geo_${lat.toFixed(4)}_${lng.toFixed(4)}`,
      place_name: `${lat.toFixed(4)}, ${lng.toFixed(4)}`,
    };
    setCachedPlace(place);
    return place;
  }

  try {
    const geocodeUrl = `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&key=${apiKey}`;
    const response = await fetch(geocodeUrl);
    const data = await response.json();

    if (data.results && data.results.length > 0) {
      const result = data.results[0];
      const place: Place = {
        place_id: result.place_id || generatePlaceIdFromAddress(result.formatted_address),
        place_name: result.formatted_address,
        address: result.formatted_address,
      };
      setCachedPlace(place);
      return place;
    }

    // Fallback
    const place: Place = {
      place_id: `geo_${lat.toFixed(4)}_${lng.toFixed(4)}`,
      place_name: `${lat.toFixed(4)}, ${lng.toFixed(4)}`,
    };
    setCachedPlace(place);
    return place;
  } catch (error) {
    console.error('Geocoding error:', error);
    const place: Place = {
      place_id: `geo_${lat.toFixed(4)}_${lng.toFixed(4)}`,
      place_name: `${lat.toFixed(4)}, ${lng.toFixed(4)}`,
    };
    setCachedPlace(place);
    return place;
  }
}
