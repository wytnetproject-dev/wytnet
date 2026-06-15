import type { Brand } from "./brand";


export interface WatchlistItem {
  id: number;
  user_id: string;
  brand_id: number;
  created_at: string;
  brand?: Brand;
}

const BASE_URL = 'http://localhost:8000/brands';

// Helper to get local mock user ID
function getMockUserId(): string {
  const stored = localStorage.getItem('wytsaas_user');
  if (stored) {
    const user = JSON.parse(stored);
    return user.id || 'mock-user-uuid';
  }
  return 'mock-user-uuid';
}

export async function fetchWatchlist(token: string): Promise<WatchlistItem[]> {
  if (token === 'mock-jwt-token-wytsaas' || !token) {
    // Return from localStorage mock
    const stored = localStorage.getItem('mock_watchlist');
    const items: WatchlistItem[] = stored ? JSON.parse(stored) : [];

    // Enrich with brand details
    const storedBrands = localStorage.getItem('mock_brands');
    const brands: Brand[] = storedBrands ? JSON.parse(storedBrands) : [];

    return items.map(item => {
      const brand = brands.find(b => b.id === item.brand_id);
      return { ...item, brand };
    });
  }

  try {
    const response = await fetch(`${BASE_URL}/watchlist`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch watchlist: ${response.statusText}`);
    }

    const resJson = await response.json();
    return resJson.items || [];
  } catch (err) {
    console.warn('Backend connection failed. Using local storage watchlist.', err);
    const stored = localStorage.getItem('mock_watchlist');
    const items: WatchlistItem[] = stored ? JSON.parse(stored) : [];
    const storedBrands = localStorage.getItem('mock_brands');
    const brands: Brand[] = storedBrands ? JSON.parse(storedBrands) : [];
    return items.map(item => {
      const brand = brands.find(b => b.id === item.brand_id);
      return { ...item, brand };
    });
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

  const response = await fetch(`${BASE_URL}/${brandId}/watchlist`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to add brand ${brandId} to watchlist: ${response.statusText}`);
  }

  const resJson = await response.json();
  return resJson.item;
}

export async function removeFromWatchlist(brandId: number, token: string): Promise<void> {
  if (token === 'mock-jwt-token-wytsaas' || !token) {
    const stored = localStorage.getItem('mock_watchlist');
    const items: WatchlistItem[] = stored ? JSON.parse(stored) : [];
    const filtered = items.filter(item => item.brand_id !== brandId);
    localStorage.setItem('mock_watchlist', JSON.stringify(filtered));
    return;
  }

  const response = await fetch(`${BASE_URL}/${brandId}/watchlist`, {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to remove brand ${brandId} from watchlist: ${response.statusText}`);
  }
}
