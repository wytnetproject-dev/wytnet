const API_BASE_URL = 'http://localhost:8000';

function getAuthToken(): string {
  return localStorage.getItem('wytsaas_token') || localStorage.getItem('wytpass_token') || '';
}

export class ApiError extends Error {
  status: number;
  detail: string;

  constructor(status: number, detail: string) {
    super(detail || `Request failed with status ${status}`);
    this.name = 'ApiError';
    this.status = status;
    this.detail = detail;
  }
}

async function request<T>(
  method: string,
  endpoint: string,
  body?: any,
  customToken?: string
): Promise<T> {
  // Support both relative endpoints and absolute URLs
  const url = endpoint.startsWith('http')
    ? endpoint
    : `${API_BASE_URL}${endpoint}`;
  
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  const token = customToken || getAuthToken();
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(url, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new ApiError(response.status, errorData.detail);
  }

  // Handle 204 No Content or empty responses
  if (response.status === 204) {
    return {} as T;
  }

  return response.json();
}

export const api = {
  get: <T>(endpoint: string, token?: string) => request<T>('GET', endpoint, undefined, token),
  post: <T>(endpoint: string, body?: any, token?: string) => request<T>('POST', endpoint, body, token),
  patch: <T>(endpoint: string, body?: any, token?: string) => request<T>('PATCH', endpoint, body, token),
  put: <T>(endpoint: string, body?: any, token?: string) => request<T>('PUT', endpoint, body, token),
  delete: <T>(endpoint: string, token?: string) => request<T>('DELETE', endpoint, undefined, token),
};

export default api;
