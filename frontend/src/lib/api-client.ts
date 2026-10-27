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

let refreshPromise: Promise<string | null> | null = null;

async function refreshCustomerAccessToken(): Promise<string | null> {
  if (typeof window === 'undefined') return null;
  const refreshToken = localStorage.getItem('seyven_refresh_token');
  if (!refreshToken) return null;

  try {
    const res = await fetch(`${API_BASE_URL}/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken }),
    });
    if (res.ok) {
      const tokens = await res.json();
      if (tokens?.accessToken) {
        localStorage.setItem('seyven_access_token', tokens.accessToken);
        if (tokens.refreshToken) {
          localStorage.setItem('seyven_refresh_token', tokens.refreshToken);
        }
        return tokens.accessToken;
      }
    }
  } catch {
    // Refresh failed or network offline
  }
  return null;
}

export async function apiFetch<T = any>(
  path: string,
  options: RequestInit & { _isRetry?: boolean } = {}
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

  // Seamless 401 Token Refresh Interceptor
  if (
    response.status === 401 &&
    !options._isRetry &&
    !cleanPath.startsWith('/auth/login') &&
    !cleanPath.startsWith('/auth/refresh')
  ) {
    if (!refreshPromise) {
      refreshPromise = refreshCustomerAccessToken().finally(() => {
        refreshPromise = null;
      });
    }
    const refreshedToken = await refreshPromise;
    if (refreshedToken) {
      return apiFetch<T>(path, {
        ...options,
        _isRetry: true,
        headers: {
          ...headers,
          Authorization: `Bearer ${refreshedToken}`,
        },
      });
    }
  }

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
