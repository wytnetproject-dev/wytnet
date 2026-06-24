import { api } from './api_base';
import type { ApiResponse } from './brand';

export interface EnquiryInput {
  first_name: string;
  last_name: string;
  email: string;
  phone?: string;
  message: string;
  terms_accepted: boolean;
}

export interface Enquiry extends EnquiryInput {
  id: number;
  created_at: string;
}

/**
 * Submit a public enquiry.
 */
export async function submitEnquiry(input: EnquiryInput): Promise<Enquiry> {
  const data = await api.post<ApiResponse<Enquiry>>('/enquiries/', input);
  if (!data.item) {
    throw new Error('Enquiry item not found in response');
  }
  return data.item;
}

/**
 * Fetch all enquiries (admin-only).
 */
export async function fetchAllEnquiries(token: string): Promise<Enquiry[]> {
  const data = await api.get<ApiResponse<Enquiry>>('/enquiries/', token);
  return data.items || [];
}

/**
 * Delete an enquiry by ID (admin-only).
 */
export async function deleteEnquiry(enquiryId: number, token: string): Promise<void> {
  await api.delete(`/enquiries/${enquiryId}`, token);
}
