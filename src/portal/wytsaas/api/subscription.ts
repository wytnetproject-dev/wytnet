import type { ApiResponse } from './brand';

export interface BrandSubscriptionPlan {
  id: number;
  brand_id: number;
  name: string;
  description: string | null;
  price: number;
  features: string[] | null;
  billing_cycle: string;
  external_plan_id: string | null;
  status: string;
  created_at?: string;
}

export interface BrandSubscriptionPlanCreateInput {
  name: string;
  description?: string | null;
  price: number;
  features?: string[] | null;
  billing_cycle: string;
  external_plan_id?: string | null;
  status?: string;
}

export interface BrandSubscriptionPlanUpdateInput {
  name?: string;
  description?: string | null;
  price?: number;
  features?: string[] | null;
  billing_cycle?: string;
  external_plan_id?: string | null;
  status?: string;
}

const BASE_URL = 'http://localhost:8000/brands';

/**
 * Fetch all subscription plans (optionally filtered by brand ID).
 */
export async function fetchSubscriptionPlans(token: string, brandId?: number): Promise<BrandSubscriptionPlan[]> {
  const url = brandId 
    ? `${BASE_URL}/subscription-plans/?brand_id=${brandId}`
    : `${BASE_URL}/subscription-plans/`;

  const response = await fetch(url, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch subscription plans: ${response.statusText}`);
  }

  const data: ApiResponse<BrandSubscriptionPlan> = await response.json();
  return data.items || [];
}

/**
 * Create a new subscription plan for a brand.
 */
export async function createSubscriptionPlan(
  brandId: number,
  planData: BrandSubscriptionPlanCreateInput,
  token: string
): Promise<BrandSubscriptionPlan> {
  const response = await fetch(`${BASE_URL}/${brandId}/subscription-plans`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify(planData),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.detail || `Failed to create subscription plan: ${response.statusText}`);
  }

  const data: ApiResponse<BrandSubscriptionPlan> = await response.json();
  if (!data.item) {
    throw new Error('Subscription plan item not found in response');
  }
  return data.item;
}

/**
 * Update an existing subscription plan.
 */
export async function updateSubscriptionPlan(
  planId: number,
  planData: BrandSubscriptionPlanUpdateInput,
  token: string
): Promise<BrandSubscriptionPlan> {
  const response = await fetch(`${BASE_URL}/subscription-plans/${planId}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify(planData),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.detail || `Failed to update subscription plan: ${response.statusText}`);
  }

  const data: ApiResponse<BrandSubscriptionPlan> = await response.json();
  if (!data.item) {
    throw new Error('Subscription plan item not found in response');
  }
  return data.item;
}

/**
 * Delete a subscription plan by ID.
 */
export async function deleteSubscriptionPlan(planId: number, token: string): Promise<void> {
  const response = await fetch(`${BASE_URL}/subscription-plans/${planId}`, {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.detail || `Failed to delete subscription plan: ${response.statusText}`);
  }
}
