const API_BASE = '/api';

const getToken = () => localStorage.getItem('token');
const setToken = (token) => {
  if (token) {
    localStorage.setItem('token', token);
  } else {
    localStorage.removeItem('token');
  }
};

export const auth = {
  get token() {
    return getToken();
  },
  set token(value) {
    setToken(value);
  },
  isAdmin() {
    return localStorage.getItem('role') === 'admin';
  },
  setProfile(profile) {
    if (!profile) {
      localStorage.removeItem('profile');
      localStorage.removeItem('role');
      return;
    }
    localStorage.setItem('profile', JSON.stringify(profile));
    localStorage.setItem('role', profile.role);
  },
  getProfile() {
    const profile = localStorage.getItem('profile');
    return profile ? JSON.parse(profile) : null;
  },
  logout() {
    setToken(null);
    this.setProfile(null);
  },
};

const buildHeaders = (headers = {}, isFormData = false) => {
  const config = new Headers(headers);
  if (!isFormData && !config.has('Content-Type')) {
    config.set('Content-Type', 'application/json');
  }
  const token = getToken();
  if (token) {
    config.set('Authorization', `Bearer ${token}`);
  }
  return config;
};

export async function apiFetch(path, options = {}) {
  const { body, headers, ...rest } = options;
  const isFormData = body instanceof FormData;
  const requestInit = {
    credentials: 'include',
    headers: buildHeaders(headers, isFormData),
    ...rest,
  };

  if (body && !isFormData) {
    requestInit.body = JSON.stringify(body);
  } else if (body) {
    requestInit.body = body;
  }

  const response = await fetch(`${API_BASE}${path}`, requestInit);

  if (response.status === 401) {
    auth.logout();
    throw new Error('Please login to continue');
  }

  if (!response.ok) {
    const errorBody = await response.json().catch(() => ({}));
    throw new Error(errorBody.message || 'Something went wrong');
  }

  if (response.status === 204) {
    return null;
  }

  return response.json();
}

export const productApi = {
  list(params = {}) {
    const query = new URLSearchParams(params).toString();
    return apiFetch(`/products${query ? `?${query}` : ''}`);
  },
  bySlug(slug) {
    return apiFetch(`/products/slug/${slug}`);
  },
  create(payload) {
    return apiFetch('/products', { method: 'POST', body: payload });
  },
  update(id, payload) {
    return apiFetch(`/products/${id}`, { method: 'PUT', body: payload });
  },
  remove(id) {
    return apiFetch(`/products/${id}`, { method: 'DELETE' });
  },
  review(id, payload) {
    return apiFetch(`/products/${id}/reviews`, { method: 'POST', body: payload });
  },
};

export const categoryApi = {
  list() {
    return apiFetch('/categories');
  },
};

export const bannerApi = {
  list(params = {}) {
    const query = new URLSearchParams(params).toString();
    return apiFetch(`/banners${query ? `?${query}` : ''}`);
  },
};

export const authApi = {
  async login(credentials) {
    const data = await apiFetch('/auth/login', { method: 'POST', body: credentials });
    auth.token = data.token;
    auth.setProfile(data);
    return data;
  },
  async register(payload) {
    const data = await apiFetch('/auth/register', { method: 'POST', body: payload });
    auth.token = data.token;
    auth.setProfile(data);
    return data;
  },
  profile() {
    return apiFetch('/auth/profile');
  },
  updateProfile(payload) {
    return apiFetch('/auth/profile', { method: 'PUT', body: payload });
  },
};

export const cartApi = {
  get() {
    return apiFetch('/cart');
  },
  add(payload) {
    return apiFetch('/cart', { method: 'POST', body: payload });
  },
  update(payload) {
    return apiFetch('/cart', { method: 'PUT', body: payload });
  },
  remove(productId) {
    return apiFetch(`/cart/${productId}`, { method: 'DELETE' });
  },
  clear() {
    return apiFetch('/cart', { method: 'DELETE' });
  },
};

export const orderApi = {
  create(payload) {
    return apiFetch('/orders', { method: 'POST', body: payload });
  },
  list() {
    return apiFetch('/orders');
  },
  detail(id) {
    return apiFetch(`/orders/${id}`);
  },
  update(id, payload) {
    return apiFetch(`/orders/${id}`, { method: 'PUT', body: payload });
  },
};

export const adminApi = {
  stats() {
    return apiFetch('/admin/stats');
  },
  users() {
    return apiFetch('/admin/users');
  },
  updateUser(id, payload) {
    return apiFetch(`/admin/users/${id}`, { method: 'PUT', body: payload });
  },
  orders() {
    return apiFetch('/admin/orders');
  },
  categories() {
    return apiFetch('/admin/categories');
  },
  createCategory(payload) {
    return apiFetch('/admin/categories', { method: 'POST', body: payload });
  },
  updateCategory(id, payload) {
    return apiFetch(`/admin/categories/${id}`, { method: 'PUT', body: payload });
  },
  deleteCategory(id) {
    return apiFetch(`/admin/categories/${id}`, { method: 'DELETE' });
  },
  banners() {
    return apiFetch('/admin/banners');
  },
  createBanner(payload) {
    return apiFetch('/admin/banners', { method: 'POST', body: payload });
  },
  updateBanner(id, payload) {
    return apiFetch(`/admin/banners/${id}`, { method: 'PUT', body: payload });
  },
  deleteBanner(id) {
    return apiFetch(`/admin/banners/${id}`, { method: 'DELETE' });
  },
};

export function formatCurrency(value) {
  return new Intl.NumberFormat('en-PK', {
    style: 'currency',
    currency: 'PKR',
    maximumFractionDigits: 0,
  }).format(Number(value || 0));
}

export function initGlobalUI() {
  const yearEl = document.getElementById('year');
  if (yearEl) {
    yearEl.textContent = new Date().getFullYear();
  }
}

initGlobalUI();
