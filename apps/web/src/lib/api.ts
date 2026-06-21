let API_URL = 'http://localhost:3001';

if (typeof window !== 'undefined') {
  const protocol = window.location.protocol;
  const hostname = window.location.hostname;

  if (hostname && hostname !== 'localhost' && hostname !== '127.0.0.1') {
    // Accessing via IP or custom domain - use port 3001 of current host
    API_URL = `${protocol}//${hostname}:3001`;
  } else if (process.env.NEXT_PUBLIC_API_URL) {
    API_URL = process.env.NEXT_PUBLIC_API_URL;
  }
} else {
  API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
}

export async function fetchApi(endpoint: string, options: RequestInit = {}) {
  const headers = new Headers(options.headers);

  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('aura_token');
    if (token) {
      headers.set('Authorization', `Bearer ${token}`);
    }
  }

  if (!(options.body instanceof FormData) && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }

  const response = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers,
  });

  let data;
  try {
    data = await response.json();
  } catch (e) {
    data = null;
  }

  if (!response.ok) {
    throw new Error((data && data.message) || 'Something went wrong');
  }

  return data;
}
