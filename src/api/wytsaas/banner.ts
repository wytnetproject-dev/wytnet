import { api } from './api_base';
import type { ApiResponse } from './brand';

export interface MarketplaceBanner {
  id: number;
  title: string;
  subtitle?: string;
  description?: string;
  badge?: string;
  bg_image?: string;
  icon?: string;
  is_active: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface MarketplaceBannerCreateInput {
  title: string;
  subtitle?: string;
  description?: string;
  badge?: string;
  bg_image?: string;
  icon?: string;
  is_active?: boolean;
  sort_order?: number;
}

export interface MarketplaceBannerUpdateInput {
  title?: string;
  subtitle?: string;
  description?: string;
  badge?: string;
  bg_image?: string;
  icon?: string;
  is_active?: boolean;
  sort_order?: number;
}

/**
 * Fetch all banners (admin-only) from the backend API.
 */
export async function fetchAllBannersAdmin(token?: string): Promise<MarketplaceBanner[]> {
  const data = await api.get<ApiResponse<MarketplaceBanner>>('/brands/banners/all', token);
  return data.items || [];
}

/**
 * Fetch active banners (public) from the backend API.
 */
export async function fetchActiveBanners(): Promise<MarketplaceBanner[]> {
  const data = await api.get<ApiResponse<MarketplaceBanner>>('/brands/banners');
  return data.items || [];
}

/**
 * Create a new marketplace banner (admin-only).
 */
export async function createMarketplaceBanner(
  bannerData: MarketplaceBannerCreateInput,
  token: string
): Promise<MarketplaceBanner> {
  const data = await api.post<ApiResponse<MarketplaceBanner>>('/brands/banners', bannerData, token);
  if (!data.item) {
    throw new Error('Banner item not found in response');
  }
  return data.item;
}

/**
 * Update a marketplace banner by ID (admin-only).
 */
export async function updateMarketplaceBanner(
  bannerId: number,
  bannerData: MarketplaceBannerUpdateInput,
  token: string
): Promise<MarketplaceBanner> {
  const data = await api.patch<ApiResponse<MarketplaceBanner>>(`/brands/banners/${bannerId}`, bannerData, token);
  if (!data.item) {
    throw new Error('Banner item not found in response');
  }
  return data.item;
}

/**
 * Delete a marketplace banner by ID (admin-only).
 */
export async function deleteMarketplaceBanner(bannerId: number, token: string): Promise<void> {
  await api.delete(`/brands/banners/${bannerId}`, token);
}
