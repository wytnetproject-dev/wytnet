import type { Brand } from "./brand";


export interface WatchlistItem {
  id: number;
  user_id: string;
  brand_id: number;
  created_at: string;
  brand?: Brand;
}

import { api } from './api_base';
import type { ApiResponse } from './brand';

// Helper to get local mock user ID
function getMockUserId(): string {
  const stored = localStorage.getItem('wytsaas_user');
  if (stored) {
    const user = JSON.parse(stored);
    return user.id || 'mock-user-uuid';
  }
  return 'mock-user-uuid';
}

// Helper to retrieve local mock watchlist
function getLocalWatchlist(): WatchlistItem[] {
  const stored = localStorage.getItem('mock_watchlist');
  const items: WatchlistItem[] = stored ? JSON.parse(stored) : [];
  const storedBrands = localStorage.getItem('mock_brands');
  const brands: Brand[] = storedBrands ? JSON.parse(storedBrands) : [];
  return items.map(item => {
    const brand = brands.find(b => b.id === item.brand_id);
    return { ...item, brand };
  });
}

export async function fetchWatchlist(token: string): Promise<WatchlistItem[]> {
  if (token === 'mock-jwt-token-wytsaas' || !token) {
    return getLocalWatchlist();
  }

  try {
    const data = await api.get<ApiResponse<WatchlistItem>>('/brands/watchlist', token);
    return data.items || [];
  } catch (err) {
    console.warn('Backend connection failed. Using local storage watchlist.', err);
    return getLocalWatchlist();
  }
}

export async function addToWatchlist(brandId: number, token: string): Promise<WatchlistItem> {
  if (token === 'mock-jwt-token-wytsaas' || !token) {
    const stored = localStorage.getItem('mock_watchlist');
    const items: WatchlistItem[] = stored ? JSON.parse(stored) : [];

    const existing = items.find(item => item.brand_id === brandId);
    if (existing) return existing;

    const newItem: WatchlistItem = {
      id: items.length > 0 ? Math.max(...items.map(i => i.id)) + 1 : 1,
      user_id: getMockUserId(),
      brand_id: brandId,
      created_at: new Date().toISOString(),
    };

    items.push(newItem);
    localStorage.setItem('mock_watchlist', JSON.stringify(items));
    return newItem;
  }

  const data = await api.post<ApiResponse<WatchlistItem>>(`/brands/${brandId}/watchlist`, undefined, token);
  if (!data.item) {
    throw new Error('Watchlist item not found in response');
  }
  return data.item;
}

export async function removeFromWatchlist(brandId: number, token: string): Promise<void> {
  if (token === 'mock-jwt-token-wytsaas' || !token) {
    const stored = localStorage.getItem('mock_watchlist');
    const items: WatchlistItem[] = stored ? JSON.parse(stored) : [];
    const filtered = items.filter(item => item.brand_id !== brandId);
    localStorage.setItem('mock_watchlist', JSON.stringify(filtered));
    return;
  }

  await api.delete(`/brands/${brandId}/watchlist`, token);
}
