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

import { api } from './api_base';

/**
 * Fetch all subscription plans (optionally filtered by brand ID).
 */
export async function fetchSubscriptionPlans(token: string, brandId?: number): Promise<BrandSubscriptionPlan[]> {
  const endpoint = brandId 
    ? `/brands/subscription-plans/?brand_id=${brandId}`
    : '/brands/subscription-plans/';

  const data = await api.get<ApiResponse<BrandSubscriptionPlan>>(endpoint, token);
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
  const data = await api.post<ApiResponse<BrandSubscriptionPlan>>(`/brands/${brandId}/subscription-plans`, planData, token);
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
  const data = await api.patch<ApiResponse<BrandSubscriptionPlan>>(`/brands/subscription-plans/${planId}`, planData, token);
  if (!data.item) {
    throw new Error('Subscription plan item not found in response');
  }
  return data.item;
}

/**
 * Delete a subscription plan by ID.
 */
export async function deleteSubscriptionPlan(planId: number, token: string): Promise<void> {
  await api.delete(`/brands/subscription-plans/${planId}`, token);
}
