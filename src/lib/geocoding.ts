/**
 * Geocoding Utilities
 *
 * Primary: uses the backend /api/v1/geo/reverse endpoint (authenticated, server-side Google Maps).
 * Fallback: direct Google Maps Geocoding API via NEXT_PUBLIC_GOOGLE_MAPS_API_KEY.
 */

import { geoApi } from "@/lib/api/geo";

export interface ReverseGeocodeResult {
  formattedAddress: string;
  state: string;
  district: string;
  village: string;
  pincode: string;
  streetName: string;
  shopNumber: string;
  country: string;
}

export async function reverseGeocode(
  latitude: number,
  longitude: number
): Promise<ReverseGeocodeResult | null> {
  // Try backend endpoint first (uses server-side API key)
  try {
    const result = await geoApi.reverse(latitude, longitude);
    return {
      formattedAddress: result.formattedAddress || "",
      state: result.state || "",
      district: result.district || "",
      village: result.sublocality || "",
      pincode: result.pincode || "",
      streetName: "",
      shopNumber: "",
      country: "India",
    };
  } catch {
    // Fall through to client-side fallback
  }

  // Fallback: direct Google Maps API call from client
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
  if (!apiKey) {
    console.warn("[Geocoding] No API key available and backend geo endpoint failed.");
    return null;
  }

  const url = `https://maps.googleapis.com/maps/api/geocode/json?latlng=${latitude},${longitude}&key=${apiKey}&language=en&result_type=street_address|sublocality|locality|administrative_area_level_3|postal_code`;

  try {
    const response = await fetch(url);
    if (!response.ok) return null;

    const data = await response.json();
    if (data.status !== "OK" || !data.results?.length) return null;

    return parseGoogleGeocodeResults(data.results);
  } catch {
    return null;
  }
}

function parseGoogleGeocodeResults(
  results: Array<{
    formatted_address: string;
    address_components: Array<{
      long_name: string;
      short_name: string;
      types: string[];
    }>;
  }>
): ReverseGeocodeResult {
  const componentMap = new Map<string, string>();
  for (const result of results) {
    for (const component of result.address_components) {
      for (const type of component.types) {
        if (!componentMap.has(type)) {
          componentMap.set(type, component.long_name);
        }
      }
    }
  }

  return {
    formattedAddress: results[0]?.formatted_address || "",
    state: componentMap.get("administrative_area_level_1") || "",
    district: componentMap.get("administrative_area_level_2") || "",
    village:
      componentMap.get("administrative_area_level_3") ||
      componentMap.get("sublocality_level_1") ||
      componentMap.get("sublocality") ||
      componentMap.get("locality") ||
      "",
    pincode: componentMap.get("postal_code") || "",
    streetName: componentMap.get("route") || componentMap.get("neighborhood") || "",
    shopNumber:
      componentMap.get("street_number") ||
      componentMap.get("premise") ||
      componentMap.get("subpremise") ||
      "",
    country: componentMap.get("country") || "India",
  };
}
