import { apiRequest } from "./client";

export interface GeoLookupResult {
  latitude: number;
  longitude: number;
  formattedAddress: string;
  state: string;
  district: string;
  sublocality: string;
  pincode: string;
  locationType: string;
}

export const geoApi = {
  async lookup(address: string): Promise<GeoLookupResult> {
    return apiRequest<GeoLookupResult>("/geo/lookup", {
      params: { address },
    });
  },

  async reverse(latitude: number, longitude: number): Promise<GeoLookupResult> {
    return apiRequest<GeoLookupResult>("/geo/reverse", {
      params: { latitude, longitude },
    });
  },
};
