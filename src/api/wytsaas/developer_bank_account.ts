import { api } from './api_base';
import type { ApiResponse } from './user';

export interface DeveloperBankAccount {
  id: number;
  user_id: string;
  bank_name: string;
  account_holder_name: string;
  account_number: string;
  routing_number: string | null;
  swift_code: string | null;
  ifsc_code: string | null;
  account_type: string | null;
  bank_address: string | null;
  created_at: string;
  updated_at: string;
}

export interface DeveloperBankAccountCreate {
  bank_name: string;
  account_holder_name: string;
  account_number: string;
  routing_number?: string | null;
  swift_code?: string | null;
  ifsc_code?: string | null;
  account_type?: string | null;
  bank_address?: string | null;
}

export interface DeveloperBankAccountUpdate {
  bank_name?: string | null;
  account_holder_name?: string | null;
  account_number?: string | null;
  routing_number?: string | null;
  swift_code?: string | null;
  ifsc_code?: string | null;
  account_type?: string | null;
  bank_address?: string | null;
}

/**
 * Fetch the authenticated developer's bank account details.
 */
export async function fetchDeveloperBankAccount(token: string): Promise<DeveloperBankAccount | null> {
  try {
    const data = await api.get<ApiResponse<DeveloperBankAccount>>('/developer/bank-account/', token);
    return data.item || null;
  } catch (err: any) {
    if (err.status === 404) {
      return null;
    }
    throw err;
  }
}

/**
 * Create developer bank account details.
 */
export async function createDeveloperBankAccount(
  accountData: DeveloperBankAccountCreate,
  token: string
): Promise<DeveloperBankAccount> {
  const data = await api.post<ApiResponse<DeveloperBankAccount>>('/developer/bank-account/', accountData, token);
  if (!data.item) {
    throw new Error('Bank account item not found in response');
  }
  return data.item;
}

/**
 * Update developer bank account details.
 */
export async function updateDeveloperBankAccount(
  accountData: DeveloperBankAccountUpdate,
  token: string
): Promise<DeveloperBankAccount> {
  const data = await api.patch<ApiResponse<DeveloperBankAccount>>('/developer/bank-account/', accountData, token);
  if (!data.item) {
    throw new Error('Bank account item not found in response');
  }
  return data.item;
}

/**
 * Delete developer bank account details.
 */
export async function deleteDeveloperBankAccount(token: string): Promise<void> {
  await api.delete<void>('/developer/bank-account/', token);
}
