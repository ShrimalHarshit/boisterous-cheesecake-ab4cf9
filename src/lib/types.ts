export type Lot = {
  id: number;
  lot: string;
  ownerId: number;
  status: string;
  type: string;
  name: string;
  number: string;
  address: string;
  city: string | null;
  locality: string | null;
  description: string;
  sqft: number;
  areaValue: number | null;
  areaUnit: string;
  price: number | null;
  pricePerSqft: number | null;
  negotiable: boolean;
  possessionFrom: string | null;
  aboutProperty: string | null;
  ownership: string | null;
  photos: string[];
  createdAt: string;
};

export type Seller = {
  id: number;
  name: string;
  role: string;
  city: string | null;
  mobile: string;
  liveCount: number;
  lots: string[];
};

export type Viewer = {
  id: number;
  name: string;
  role: string;
  mobile: string;
} | null;

export const FALLBACK_IMG = "/images/lot-plot.jpg";
