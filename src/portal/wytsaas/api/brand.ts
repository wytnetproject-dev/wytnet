export interface BrandLink {
  id?: number;
  brand_id?: number;
  link_type: string; // 'play_store' | 'app_store' | 'website' | 'github'
  title: string;
  url: string;
  is_primary?: boolean;
}

export interface BrandTag {
  id: number;
  name: string;
}

export interface BrandMedia {
  id?: number;
  brand_id?: number;
  media_type: string; // 'image' | 'video'
  media_url: string;
  sort_order?: number;
}

export interface BrandWhitePassReview {
  id: number;
  brand_id: number;
  integration_status: 'pending' | 'approved' | 'rejected';
  sdk_installed: boolean;
  callback_verified: boolean;
  domain_verified: boolean;
  review_notes?: string | null;
  reviewed_at?: string | null;
}

export interface BrandReview {
  id?: number;
  brand_id?: number;
  user_id?: string;
  rating: number;
  review?: string | null;
  created_at?: string;
  user_email?: string;
  user_name?: string;
}

export interface Brand {
  id: number;
  name: string;
  slug: string;
  short_description: string | null;
  full_description: string | null;
  logo_url: string | null;
  banner_url: string | null;
  brand_type: string[] | string | null;
  company_name: string | null;
  is_wytpass_integration_accepted: boolean;
  is_payment_integration_accepted: boolean;
  is_featured: boolean;
  status: string;
  current_stage: string;
  created_by?: string | null;
  created_at?: string;
  updated_at?: string;
  approved_at?: string | null;
  links?: BrandLink[];
  tags?: BrandTag[];
  media?: BrandMedia[];
  whitepass_review?: BrandWhitePassReview | null;
  reviews?: BrandReview[];
}

export interface BrandCreateInput {
  name: string;
  slug: string;
  short_description?: string | null;
  full_description?: string | null;
  logo_url?: string | null;
  banner_url?: string | null;
  brand_type?: string[] | string | null;
  company_name?: string | null;
  is_wytpass_integration_accepted?: boolean;
  is_payment_integration_accepted?: boolean;
  is_featured?: boolean;
  status?: string;
  current_stage?: string;
  links?: BrandLink[];
  tags?: string[];
  media?: BrandMedia[];
}

export interface BrandUpdateInput {
  name?: string;
  slug?: string;
  short_description?: string | null;
  full_description?: string | null;
  logo_url?: string | null;
  banner_url?: string | null;
  brand_type?: string[] | string | null;
  company_name?: string | null;
  is_wytpass_integration_accepted?: boolean;
  is_payment_integration_accepted?: boolean;
  is_featured?: boolean;
  status?: string;
  current_stage?: string;
  links?: BrandLink[];
  tags?: string[];
  media?: BrandMedia[];
}


export interface ApiResponse<T> {
  item?: T;
  items?: T[];
  detail?: string;
  itemCount?: number;
}

const BASE_URL = 'http://localhost:8000/brands';

/**
 * Fetch all brands from the backend API.
 */
export async function fetchBrands(): Promise<Brand[]> {
  const response = await fetch(`${BASE_URL}/`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch brands: ${response.statusText}`);
  }

  const data: ApiResponse<Brand> = await response.json();
  return data.items || [];
}

/**
 * Retrieve a specific brand by ID.
 */
export async function fetchBrandById(brandId: number): Promise<Brand> {
  const response = await fetch(`${BASE_URL}/${brandId}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch brand ${brandId}: ${response.statusText}`);
  }

  const data: ApiResponse<Brand> = await response.json();
  if (!data.item) {
    throw new Error('Brand item not found in response');
  }
  return data.item;
}

/**
 * Create a new brand.
 */
export async function createBrand(brandData: BrandCreateInput, token: string): Promise<Brand> {
  const response = await fetch(`${BASE_URL}/`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify(brandData),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.detail || `Failed to create brand: ${response.statusText}`);
  }

  const data: ApiResponse<Brand> = await response.json();
  if (!data.item) {
    throw new Error('Brand item not found in response');
  }
  return data.item;
}

/**
 * Update a brand by ID.
 */
export async function updateBrand(
  brandId: number,
  brandData: BrandUpdateInput,
  token: string
): Promise<Brand> {
  const response = await fetch(`${BASE_URL}/${brandId}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify(brandData),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.detail || `Failed to update brand: ${response.statusText}`);
  }

  const data: ApiResponse<Brand> = await response.json();
  if (!data.item) {
    throw new Error('Brand item not found in response');
  }
  return data.item;
}

/**
 * Delete a brand by ID.
 */
export async function deleteBrand(brandId: number, token: string): Promise<void> {
  const response = await fetch(`${BASE_URL}/${brandId}`, {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.detail || `Failed to delete brand: ${response.statusText}`);
  }
}

/**
 * Submit brand for WhitePass SSO review.
 */
export async function submitWhitePassReview(
  brandId: number,
  data: { sdk_installed: boolean; callback_verified: boolean; domain_verified: boolean },
  token: string
): Promise<BrandWhitePassReview> {
  const response = await fetch(`${BASE_URL}/${brandId}/whitepass-review`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.detail || `Failed to submit WhitePass review: ${response.statusText}`);
  }

  const resData: ApiResponse<BrandWhitePassReview> = await response.json();
  if (!resData.item) {
    throw new Error('Review status not found in response');
  }
  return resData.item;
}

/**
 * Fetch WhitePass SSO review status for a brand.
 */
export async function fetchWhitePassReview(brandId: number, token: string): Promise<BrandWhitePassReview | null> {
  const response = await fetch(`${BASE_URL}/${brandId}/whitepass-review`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });

  if (response.status === 404) {
    return null;
  }

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.detail || `Failed to fetch WhitePass review status: ${response.statusText}`);
  }

  const resData: ApiResponse<BrandWhitePassReview> = await response.json();
  return resData.item || null;
}

/**
 * Submit action (Approve/Reject) on brand WhitePass review.
 */
export async function actionWhitePassReview(
  brandId: number,
  status: 'approved' | 'rejected',
  notes: string,
  token: string
): Promise<BrandWhitePassReview> {
  const response = await fetch(`${BASE_URL}/${brandId}/whitepass-review/action`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify({
      integration_status: status,
      review_notes: notes,
    }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.detail || `Failed to submit WhitePass review action: ${response.statusText}`);
  }

  const resData: ApiResponse<BrandWhitePassReview> = await response.json();
  if (!resData.item) {
    throw new Error('Review status not found in response');
  }
  return resData.item;
}

