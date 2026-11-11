
const API_URL =
  process.env.NEXT_PUBLIC_API_URL ||
  'http://localhost:3001/api';

interface ApiErrorResponse {
  message?: string | string[];
}

export async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {},
): Promise<T> {
  const isFormData = options.body instanceof FormData;

  const response = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    credentials: 'include',
    headers: {
      ...(isFormData
        ? {}
        : { 'Content-Type': 'application/json' }),
      ...options.headers,
    },
  });

  const data = await response.json();

  if (!response.ok) {
    const errorData = data as ApiErrorResponse;

    const message = Array.isArray(errorData.message)
      ? errorData.message.join(', ')
      : errorData.message || 'Something went wrong';

    throw new Error(message);
  }

  return data as T;
}
