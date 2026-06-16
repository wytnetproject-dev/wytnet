export interface UserProfile {
  id: string;
  username: string;
  email: string;
  full_name: string | null;
  role: string;
  is_active: boolean;
  created_at: string;
  updated_at: string | null;
}

export interface UserProfileUpdateInput {
  username?: string;
  email?: string;
  full_name?: string | null;
  password?: string;
}

export interface ApiResponse<T> {
  item?: T;
  items?: T[];
  detail?: string;
  itemCount?: number;
}

import { api } from './api_base';

/**
 * Fetch the authenticated user's profile.
 */
export async function fetchUserProfile(token: string): Promise<UserProfile> {
  const data = await api.get<ApiResponse<UserProfile>>('/users/me', token);
  if (!data.item) {
    throw new Error('User profile item not found in response');
  }
  return data.item;
}

/**
 * Update the authenticated user's profile details.
 */
export async function updateUserProfile(
  profileData: UserProfileUpdateInput,
  token: string
): Promise<UserProfile> {
  const data = await api.patch<ApiResponse<UserProfile>>('/users/me', profileData, token);
  if (!data.item) {
    throw new Error('User profile item not found in response');
  }
  return data.item;
}
