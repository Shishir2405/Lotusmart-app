/**
 * "Watch & Buy" shoppable reels — short vertical videos attached to products.
 *
 * Mirrors the API contract served by GET /reels. Every optional field here is
 * genuinely optional on the wire, so consumers must guard before reading.
 */

/**
 * The trimmed-down product shape embedded in a reel. This is NOT the full
 * `IProduct` from src/types — the reels endpoint only populates the handful of
 * fields needed to render a compact shoppable card, so keep it separate rather
 * than pretending it satisfies IProduct.
 */
export interface IReelProduct {
  _id: string;
  name: string;
  slug: string;
  /** Live selling price — always what the customer pays. */
  price: number;
  /** Higher "was" price, rendered struck through. Absent when not discounted. */
  compareAtPrice?: number;
  images: string[];
  stock: number;
}

export interface IReel {
  _id: string;
  title: string;
  videoUrl: string;
  thumbnailUrl: string;
  caption?: string;
  order: number;
  isActive: boolean;
  views: number;
  /**
   * Total like count. May be `undefined` on legacy rows that predate the
   * feature, so always read it as `reel.likes ?? 0`.
   */
  likes?: number;
  products: IReelProduct[];
  createdAt: string;
  updatedAt: string;
}

export interface IReelFilters {
  page?: number;
  limit?: number;
}
