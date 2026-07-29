import { GOOGLE_MAPS_API_KEY } from '../config/constants';
import { IGeoCoordinates } from '../types';

export interface ParsedAddress {
  addressLine1?: string;
  addressLine2?: string;
  city?: string;
  state?: string;
  pincode?: string;
  coordinates?: IGeoCoordinates;
  formattedAddress?: string;
}

interface GoogleAddressComponent {
  long_name: string;
  short_name: string;
  types: string[];
}

function parseGoogleComponents(
  components: GoogleAddressComponent[],
): Omit<ParsedAddress, 'coordinates' | 'formattedAddress'> {
  const get = (...types: string[]) =>
    components.find((c) => c.types.some((t) => types.includes(t)))?.long_name;

  const streetNumber = get('street_number');
  const route = get('route');
  const subpremise = get('subpremise');
  const premise = get('premise');
  const poi = get('point_of_interest') || get('establishment');
  const sublocality =
    get('sublocality_level_2') || get('sublocality_level_1') || get('sublocality');
  const neighborhood = get('neighborhood');
  const city =
    get('locality') || get('administrative_area_level_3') || get('administrative_area_level_2');
  const state = get('administrative_area_level_1');
  const pincode = get('postal_code');

  const streetParts = [subpremise, premise, streetNumber, route].filter(Boolean) as string[];
  const street = streetParts.join(' ') || undefined;
  // Prefer street info on line 1, else fall back to a POI/landmark name.
  const line1 = street || poi;
  const line2Parts = [street ? poi : undefined, neighborhood, sublocality].filter(
    Boolean,
  ) as string[];
  const line2 = line2Parts.filter((p, i, arr) => arr.indexOf(p) === i).join(', ') || undefined;

  return {
    addressLine1: line1,
    addressLine2: line2,
    city,
    state,
    pincode,
  };
}

type GeocodeResult = {
  formatted_address: string;
  address_components: GoogleAddressComponent[];
  types?: string[];
};

const PRECISION_RANK = [
  'subpremise',
  'premise',
  'street_address',
  'point_of_interest',
  'establishment',
  'route',
];

function pickBestResult(results: GeocodeResult[]): GeocodeResult {
  for (const t of PRECISION_RANK) {
    const match = results.find((r) => r.types?.includes(t));
    if (match) return match;
  }
  return results[0];
}

async function fetchNearbyLandmark(lat: number, lng: number): Promise<string | undefined> {
  if (!GOOGLE_MAPS_API_KEY) return undefined;
  try {
    const url =
      `https://maps.googleapis.com/maps/api/place/nearbysearch/json?` +
      `location=${lat},${lng}&rankby=distance&key=${encodeURIComponent(GOOGLE_MAPS_API_KEY)}`;
    const res = await fetch(url);
    if (!res.ok) return undefined;
    const data = (await res.json()) as {
      status: string;
      results?: Array<{ name: string; types: string[] }>;
    };
    if (data.status !== 'OK' || !data.results?.length) return undefined;
    const skip = new Set(['route', 'street_address', 'plus_code', 'geocode']);
    const named = data.results.find((r) => r.name && !r.types.every((t) => skip.has(t)));
    return named?.name;
  } catch {
    return undefined;
  }
}

export async function reverseGeocodeGoogle(lat: number, lng: number): Promise<ParsedAddress> {
  if (!GOOGLE_MAPS_API_KEY) throw new Error('Missing Google Maps API key');

  // Unfiltered request to get the absolute most precise location first
  const url = `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&key=${encodeURIComponent(GOOGLE_MAPS_API_KEY)}`;
  const res = await fetch(url);
  const data = (await res.json()) as {
    status: string;
    results: GeocodeResult[];
  };

  if (!res.ok) throw new Error('Google geocode failed');
  if (data.status !== 'OK' || !data.results?.length) {
    throw new Error(`Google geocode: ${data.status}`);
  }

  // Pick the most specific result that isn't just a plus code
  const best = data.results.find((r) => !r.types?.includes('plus_code')) || data.results[0];
  const parsed = parseGoogleComponents(best.address_components);

  let addressLine1 = parsed.addressLine1;
  let addressLine2 = parsed.addressLine2;

  // Use the formatted address chunks if our component parsing was too sparse
  const parts = best.formatted_address.split(',').map((s) => s.trim());
  const cityIndex = parts.findIndex((p) => parsed.city && p.includes(parsed.city));

  if (!addressLine1 || addressLine1.length < 4) {
    if (cityIndex > 0) {
      addressLine1 = parts[0];
      if (cityIndex > 1) {
        addressLine2 = parts.slice(1, cityIndex).join(', ');
      }
    } else {
      addressLine1 = parts[0] || undefined;
      addressLine2 = parts[1] || undefined;
    }
  }

  // Enrich with landmark if still very sparse
  if (!addressLine2) {
    const landmark = await fetchNearbyLandmark(lat, lng);
    if (landmark && landmark !== addressLine1 && !addressLine1?.includes(landmark)) {
      addressLine2 = `Near ${landmark}`;
    }
  }

  return {
    ...parsed,
    addressLine1,
    addressLine2,
    coordinates: { lat, lng },
    formattedAddress: best.formatted_address,
  };
}

export async function reverseGeocodeOSM(lat: number, lng: number): Promise<ParsedAddress> {
  const url = `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lng}&addressdetails=1`;
  const res = await fetch(url, {
    headers: { Accept: 'application/json', 'User-Agent': 'LotusMart-App/1.0' },
  });
  if (!res.ok) throw new Error('OSM geocode failed');
  const data = (await res.json()) as {
    display_name?: string;
    address?: Record<string, string | undefined>;
  };
  const a = data.address ?? {};
  const line1 = [a.house_number, a.road].filter(Boolean).join(' ');
  const line2 = [a.neighbourhood, a.suburb].filter(Boolean).join(', ');
  return {
    addressLine1: line1 || data.display_name?.split(',')[0],
    addressLine2: line2 || undefined,
    city: a.city || a.town || a.village || a.county,
    state: a.state,
    pincode: a.postcode,
    coordinates: { lat, lng },
    formattedAddress: data.display_name,
  };
}

export async function reverseGeocode(lat: number, lng: number): Promise<ParsedAddress> {
  if (GOOGLE_MAPS_API_KEY) {
    try {
      return await reverseGeocodeGoogle(lat, lng);
    } catch {
      // fall through to OSM
    }
  }
  return reverseGeocodeOSM(lat, lng);
}

export interface PlacePrediction {
  placeId: string;
  description: string;
  mainText: string;
  secondaryText: string;
}

/**
 * ZERO_RESULTS is a normal "nothing matches" outcome — resolves to [].
 * Anything else (REQUEST_DENIED, INVALID_REQUEST, a network failure) means the
 * search is actually broken, so it throws instead of returning [] silently.
 * Otherwise a misconfigured API key looks identical to "no results" in the UI,
 * which is exactly what was masking the referrer-restriction issue on this key.
 */
export async function placesAutocomplete(
  input: string,
  sessionToken: string,
): Promise<PlacePrediction[]> {
  if (!GOOGLE_MAPS_API_KEY || input.trim().length < 2) return [];
  const url =
    `https://maps.googleapis.com/maps/api/place/autocomplete/json?` +
    `input=${encodeURIComponent(input)}&components=country:in&sessiontoken=${encodeURIComponent(
      sessionToken,
    )}&key=${encodeURIComponent(GOOGLE_MAPS_API_KEY)}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Places autocomplete request failed (${res.status})`);
  const data = (await res.json()) as {
    status: string;
    error_message?: string;
    predictions?: Array<{
      place_id: string;
      description: string;
      structured_formatting?: { main_text: string; secondary_text: string };
    }>;
  };
  if (data.status === 'ZERO_RESULTS') return [];
  if (data.status !== 'OK' || !data.predictions) {
    throw new Error(data.error_message ?? `Places autocomplete: ${data.status}`);
  }
  return data.predictions.map((p) => ({
    placeId: p.place_id,
    description: p.description,
    mainText: p.structured_formatting?.main_text ?? p.description,
    secondaryText: p.structured_formatting?.secondary_text ?? '',
  }));
}

export async function placeDetails(
  placeId: string,
  sessionToken: string,
): Promise<ParsedAddress | null> {
  if (!GOOGLE_MAPS_API_KEY) return null;
  const url =
    `https://maps.googleapis.com/maps/api/place/details/json?` +
    `place_id=${encodeURIComponent(placeId)}&fields=geometry,formatted_address,address_components&sessiontoken=${encodeURIComponent(
      sessionToken,
    )}&key=${encodeURIComponent(GOOGLE_MAPS_API_KEY)}`;
  const res = await fetch(url);
  if (!res.ok) return null;
  const data = (await res.json()) as {
    status: string;
    result?: {
      formatted_address: string;
      address_components: GoogleAddressComponent[];
      geometry: { location: { lat: number; lng: number } };
    };
  };
  if (data.status !== 'OK' || !data.result) return null;
  const r = data.result;
  return {
    ...parseGoogleComponents(r.address_components),
    coordinates: { lat: r.geometry.location.lat, lng: r.geometry.location.lng },
    formattedAddress: r.formatted_address,
  };
}
