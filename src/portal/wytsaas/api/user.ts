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

const BASE_URL = 'http://localhost:8000/users';

/**
 * Fetch the authenticated user's profile.
 */
export async function fetchUserProfile(token: string): Promise<UserProfile> {
  const response = await fetch(`${BASE_URL}/me`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.detail || `Failed to fetch profile: ${response.statusText}`);
  }

  const data: ApiResponse<UserProfile> = await response.json();
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
  const response = await fetch(`${BASE_URL}/me`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify(profileData),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.detail || `Failed to update profile: ${response.statusText}`);
  }

  const data: ApiResponse<UserProfile> = await response.json();
  if (!data.item) {
    throw new Error('User profile item not found in response');
  }
  return data.item;
}
