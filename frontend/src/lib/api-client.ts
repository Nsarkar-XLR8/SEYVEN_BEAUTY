const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'https://seyven-beauty-backend.onrender.com/api/v1';

export interface ApiResponse<T = any> {
  data?: T;
  error?: string;
  statusCode?: number;
}

function getStoredAccessToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('seyven_access_token');
}

export async function apiFetch<T = any>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const token = getStoredAccessToken();
  const correlationId = 'web-' + Math.random().toString(36).substring(2, 10);

  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  // If the path starts with health/ or docs or sitemap, use root domain without api/v1
  const fullUrl = cleanPath.startsWith('/health') || cleanPath.startsWith('/sitemap')
    ? (process.env.NEXT_PUBLIC_BACKEND_URL || 'https://seyven-beauty-backend.onrender.com') + cleanPath
    : `${API_BASE_URL}${cleanPath}`;

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'x-correlation-id': correlationId,
    ...(options.headers as Record<string, string> || {}),
  };

  if (token && !headers['Authorization']) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(fullUrl, {
    ...options,
    headers,
  });

  const contentType = response.headers.get('content-type') || '';
  if (!response.ok) {
    let errorMessage = `HTTP ${response.status}`;
    try {
      if (contentType.includes('application/json')) {
        const errJson = await response.json();
        errorMessage = errJson.message || errJson.error || errorMessage;
      } else {
        errorMessage = await response.text();
      }
    } catch {
      // ignore
    }
    throw new Error(errorMessage);
  }

  if (contentType.includes('application/json')) {
    return response.json();
  }

  return response.text() as unknown as T;
}
