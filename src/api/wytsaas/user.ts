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

export interface UserCreateInput {
  username: string;
  email: string;
  full_name: string | null;
  password?: string;
  role?: string;
  is_active?: boolean;
}

export interface UserUpdateInput {
  username?: string;
  email?: string;
  full_name?: string | null;
  password?: string;
  role?: string;
  is_active?: boolean;
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

/**
 * List all users (admin operation).
 */
export async function listAllUsers(token: string): Promise<UserProfile[]> {
  const data = await api.get<ApiResponse<UserProfile>>('/users/', token);
  return data.items || [];
}

/**
 * Create a new user (admin operation).
 */
export async function createNewUser(userData: UserCreateInput, token: string): Promise<UserProfile> {
  const data = await api.post<ApiResponse<UserProfile>>('/users/', userData, token);
  if (!data.item) {
    throw new Error('Created user item not found in response');
  }
  return data.item;
}

/**
 * Update an existing user's details (admin operation).
 */
export async function modifyUser(
  userId: string,
  userData: UserUpdateInput,
  token: string
): Promise<UserProfile> {
  const data = await api.patch<ApiResponse<UserProfile>>(`/users/${userId}`, userData, token);
  if (!data.item) {
    throw new Error('Updated user item not found in response');
  }
  return data.item;
}

/**
 * Delete a user account (admin operation).
 */
export async function removeUser(userId: string, token: string): Promise<void> {
  await api.delete<void>(`/users/${userId}`, token);
}

