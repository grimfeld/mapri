export type PlaceType =
  | "restaurant"
  | "bar"
  | "cafe"
  | "park"
  | "attraction"
  | "other";

export type PriceRange = "€" | "€€" | "€€€";

// Translation map for place types
export const placeTypeLabels: Record<PlaceType, string> = {
  restaurant: "Restaurant",
  bar: "Bar",
  cafe: "Café",
  park: "Parc",
  attraction: "Attraction",
  other: "Autre",
};

// Colors for place types
export const placeTypeColors: Record<PlaceType, string> = {
  restaurant: "#ffcccb",
  bar: "#e6e6fa",
  cafe: "#ffe4b5",
  park: "#c1ffc1",
  attraction: "#fffacd",
  other: "#add8e6",
};

export interface Tag {
  id: string;
  name: string;
}

export interface Comment {
  id: string;
  locationId: string;
  username: string;
  avatarUrl?: string;
  content: string;
  createdAt: string;
}

export interface Place {
  id: string;
  name: string;
  type: PlaceType;
  lat: number;
  lng: number;
  address: string;
  tags?: Tag[];
  openingTime?: string;
  closingTime?: string;
  priceRange?: PriceRange;
  username?: string;
  avatarUrl?: string;
}

export interface MapState {
  center: [number, number];
  zoom: number;
}
