export const getApiBaseUrl = () => {
  // Use environment variable if it's explicitly set to something OTHER than localhost
  const envUrl = process.env.NEXT_PUBLIC_API_URL || process.env.NEXT_PUBLIC_API_BASE_URL;
  if (envUrl && !envUrl.includes('localhost')) {
    return envUrl;
  }

  // If we are in the browser, dynamically resolve the host so mobile devices/LAN work
  if (typeof window !== 'undefined') {
    const { protocol, hostname } = window.location;
    // Always map the backend to port 5000 of the current device's IP/hostname
    return `${protocol}//${hostname}:5000`;
  }

  // Fallback for Server-Side Rendering
  return envUrl || "http://localhost:5000";
};

export const API_BASE_URL = getApiBaseUrl();

const STORAGE_KEY = 'authToken';

export async function parseJsonResponse<T>(response: Response): Promise<T> {
  const text = await response.text();
  
  if (!response.ok) {
    let errorMessage = `API Error ${response.status} ${response.statusText}`;
    try {
      // Try to extract the backend's provided error message from JSON string
      const errObj = JSON.parse(text);
      if (errObj.message) {
         errorMessage = errObj.message;
      }
    } catch {
      // Not JSON, just use text
      if (text) {
        // Truncate text if it's too long (like an HTML error page)
        errorMessage = text.length > 200 ? text.substring(0, 200) + '...' : text;
      }
    }
    throw new Error(errorMessage);
  }

  try {
    return JSON.parse(text) as T;
  } catch (err) {
    console.error('JSON Parse Error for response:', text);
    throw new Error(
      `Failed to parse JSON from ${response.url}: ${err instanceof Error ? err.message : err}`
    );
  }
}

export function getAuthToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(STORAGE_KEY);
}

export function setAuthToken(token: string): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEY, token);
}

export function clearAuthToken(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(STORAGE_KEY);
}

export async function apiCall<T>(
  endpoint: string,
  options?: RequestInit
): Promise<T> {
  const token = getAuthToken();
  const headers = new Headers(options?.headers || {});
  
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  const apiUrl = getApiBaseUrl();
  const response = await fetch(`${apiUrl}${endpoint}`, {
    ...options,
    headers,
  });

  return parseJsonResponse<T>(response);
}
