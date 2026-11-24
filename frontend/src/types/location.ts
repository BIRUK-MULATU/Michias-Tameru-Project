export type LocationType = "WAREHOUSE" | "SHOP";

export interface LocationResponse {
  id: string;
  name: string;
  type: LocationType;
  address: string | null;
  active: boolean;
}
