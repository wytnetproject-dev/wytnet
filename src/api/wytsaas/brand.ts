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

export interface BrandWytPaymentReview {
  id: number;
  brand_id: number;
  integration_status: 'pending' | 'approved' | 'rejected';
  api_keys_configured: boolean;
  webhook_verified: boolean;
  test_payment_completed: boolean;
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
  wytpayment_review?: BrandWytPaymentReview | null;
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

import { api, ApiError } from './api_base';

/**
 * Fetch all brands from the backend API.
 */
export async function fetchBrands(): Promise<Brand[]> {
  const data = await api.get<ApiResponse<Brand>>('/brands/');
  return data.items || [];
}

/**
 * Retrieve a specific brand by ID.
 */
export async function fetchBrandById(brandId: number): Promise<Brand> {
  const data = await api.get<ApiResponse<Brand>>(`/brands/${brandId}`);
  if (!data.item) {
    throw new Error('Brand item not found in response');
  }
  return data.item;
}

/**
 * Create a new brand.
 */
export async function createBrand(brandData: BrandCreateInput, token: string): Promise<Brand> {
  const data = await api.post<ApiResponse<Brand>>('/brands/', brandData, token);
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
  const data = await api.patch<ApiResponse<Brand>>(`/brands/${brandId}`, brandData, token);
  if (!data.item) {
    throw new Error('Brand item not found in response');
  }
  return data.item;
}

/**
 * Delete a brand by ID.
 */
export async function deleteBrand(brandId: number, token: string): Promise<void> {
  await api.delete(`/brands/${brandId}`, token);
}

/**
 * Submit brand for WhitePass SSO review.
 */
export async function submitWhitePassReview(
  brandId: number,
  data: { sdk_installed: boolean; callback_verified: boolean; domain_verified: boolean },
  token: string
): Promise<BrandWhitePassReview> {
  const resData = await api.post<ApiResponse<BrandWhitePassReview>>(`/brands/${brandId}/whitepass-review`, data, token);
  if (!resData.item) {
    throw new Error('Review status not found in response');
  }
  return resData.item;
}

/**
 * Fetch WhitePass SSO review status for a brand.
 */
export async function fetchWhitePassReview(brandId: number, token: string): Promise<BrandWhitePassReview | null> {
  try {
    const resData = await api.get<ApiResponse<BrandWhitePassReview>>(`/brands/${brandId}/whitepass-review`, token);
    return resData.item || null;
  } catch (err: any) {
    if (err instanceof ApiError && err.status === 404) {
      return null;
    }
    throw err;
  }
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
  const resData = await api.post<ApiResponse<BrandWhitePassReview>>(`/brands/${brandId}/whitepass-review/action`, {
    integration_status: status,
    review_notes: notes,
  }, token);
  if (!resData.item) {
    throw new Error('Review status not found in response');
  }
  return resData.item;
}

/**
 * Submit brand for WytPayment review.
 */
export async function submitWytPaymentReview(
  brandId: number,
  data: { api_keys_configured: boolean; webhook_verified: boolean; test_payment_completed: boolean },
  token: string
): Promise<BrandWytPaymentReview> {
  const resData = await api.post<ApiResponse<BrandWytPaymentReview>>(`/brands/${brandId}/wytpayment-review`, data, token);
  if (!resData.item) {
    throw new Error('Review status not found in response');
  }
  return resData.item;
}

/**
 * Fetch WytPayment review status for a brand.
 */
export async function fetchWytPaymentReview(brandId: number, token: string): Promise<BrandWytPaymentReview | null> {
  try {
    const resData = await api.get<ApiResponse<BrandWytPaymentReview>>(`/brands/${brandId}/wytpayment-review`, token);
    return resData.item || null;
  } catch (err: any) {
    if (err instanceof ApiError && err.status === 404) {
      return null;
    }
    throw err;
  }
}

/**
 * Submit action (Approve/Reject) on brand WytPayment review.
 */
export async function actionWytPaymentReview(
  brandId: number,
  status: 'approved' | 'rejected',
  notes: string,
  token: string
): Promise<BrandWytPaymentReview> {
  const resData = await api.post<ApiResponse<BrandWytPaymentReview>>(`/brands/${brandId}/wytpayment-review/action`, {
    integration_status: status,
    review_notes: notes,
  }, token);
  if (!resData.item) {
    throw new Error('Review status not found in response');
  }
  return resData.item;
}

/**
 * Submit action (Approve/Reject) on brand Final Review.
 */
export async function actionFinalReview(
  brandId: number,
  status: 'approved' | 'rejected',
  notes: string,
  token: string
): Promise<Brand> {
  const resData = await api.post<ApiResponse<Brand>>(`/brands/${brandId}/final-review/action`, {
    integration_status: status,
    review_notes: notes,
  }, token);
  if (!resData.item) {
    throw new Error('Brand details not found in response');
  }
  return resData.item;
}

