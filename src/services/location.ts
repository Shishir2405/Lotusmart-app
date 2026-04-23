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
  const premise = get('premise') || get('subpremise');
  const sublocality =
    get('sublocality_level_2') || get('sublocality_level_1') || get('sublocality');
  const neighborhood = get('neighborhood');
  const city =
    get('locality') || get('administrative_area_level_3') || get('administrative_area_level_2');
  const state = get('administrative_area_level_1');
  const pincode = get('postal_code');

  const line1 = [premise, streetNumber, route].filter(Boolean).join(' ') || undefined;
  const line2Parts = [neighborhood, sublocality].filter(Boolean) as string[];
  const line2 = line2Parts.filter((p, i, arr) => arr.indexOf(p) === i).join(', ') || undefined;

  return {
    addressLine1: line1,
    addressLine2: line2,
    city,
    state,
    pincode,
  };
}

export async function reverseGeocodeGoogle(lat: number, lng: number): Promise<ParsedAddress> {
  if (!GOOGLE_MAPS_API_KEY) throw new Error('Missing Google Maps API key');
  const url = `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&key=${encodeURIComponent(
    GOOGLE_MAPS_API_KEY,
  )}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error('Google geocode failed');
  const data = (await res.json()) as {
    status: string;
    results: Array<{
      formatted_address: string;
      address_components: GoogleAddressComponent[];
    }>;
  };
  if (data.status !== 'OK' || !data.results.length) {
    throw new Error(`Google geocode: ${data.status}`);
  }
  const first = data.results[0];
  return {
    ...parseGoogleComponents(first.address_components),
    coordinates: { lat, lng },
    formattedAddress: first.formatted_address,
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
  if (!res.ok) return [];
  const data = (await res.json()) as {
    status: string;
    predictions?: Array<{
      place_id: string;
      description: string;
      structured_formatting?: { main_text: string; secondary_text: string };
    }>;
  };
  if (data.status !== 'OK' || !data.predictions) return [];
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
