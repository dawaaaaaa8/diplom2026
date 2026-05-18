const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

// Helper function for API calls
async function apiCall(endpoint, options = {}) {
  const token = localStorage.getItem('token');
  
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
  };
  
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  
  // Add timeout for better error handling
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 15000);
  
  try {
    const response = await fetch(`${API_URL}${endpoint}`, {
      ...options,
      headers,
      signal: controller.signal,
    });
    
    clearTimeout(timeoutId);
    
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.message || 'Алдаа гарлаа');
    }
    
    return data;
  } catch (error) {
    clearTimeout(timeoutId);
    if (error.name === 'AbortError') {
      throw new Error('Сервер хариу өгөхгүй байна. Дараа дахин оролдоно уу.');
    }
    if (error.message === 'Failed to fetch') {
      throw new Error('Серверт холбогдож чадахгүй байна. Сервер ажиллаж байгаа эсэхийг шалгана уу.');
    }
    throw error;
  }
}

// ==================== AUTH APIs ====================
export const authAPI = {
  register: (userData) => apiCall('/auth/register', {
    method: 'POST',
    body: JSON.stringify(userData),
  }),
  
  login: (credentials) => apiCall('/auth/login', {
    method: 'POST',
    body: JSON.stringify(credentials),
  }),
  
  getProfile: () => apiCall('/auth/profile'),
  
  updateProfile: (data) => apiCall('/auth/profile', {
    method: 'PUT',
    body: JSON.stringify(data),
  }),
};

// ==================== RESORT APIs ====================
export const resortAPI = {
  getAll: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return apiCall(`/resorts${query ? `?${query}` : ''}`);
  },
  
  getById: (id) => apiCall(`/resorts/${id}`),
  
  create: (data) => apiCall('/resorts', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  
  update: (id, data) => apiCall(`/resorts/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  }),
  
  delete: (id) => apiCall(`/resorts/${id}`, {
    method: 'DELETE',
  }),
  
  getOwnerResorts: () => apiCall('/resorts/owner/my-resorts'),
  
  getResortTypes: () => apiCall('/resort-types'),
  
  getFeatured: (limit = 6) => apiCall(`/resorts/featured?limit=${limit}`),
  
  search: (query, limit = 20) => apiCall(`/resorts/search?q=${encodeURIComponent(query)}&limit=${limit}`),
  
  getByLocation: (province, city) => {
    let url = '/resorts/location?';
    if (province) url += `province=${encodeURIComponent(province)}`;
    if (city) url += `${province ? '&' : ''}city=${encodeURIComponent(city)}`;
    return apiCall(url);
  },
};

// ==================== BOOKING APIs ====================
export const bookingAPI = {
  create: (data) => apiCall('/bookings', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  
  getUserBookings: () => apiCall('/bookings/my-bookings'),
  
  getOwnerBookings: () => apiCall('/bookings/owner-bookings'),
  
  getBookingById: (id) => apiCall(`/bookings/${id}`),
  
  cancel: (id) => apiCall(`/bookings/${id}/cancel`, {
    method: 'PUT',
  }),
  
  updateStatus: (id, status) => apiCall(`/bookings/${id}/status`, {
    method: 'PUT',
    body: JSON.stringify({ status }),
  }),
};

// ==================== FAVORITES APIs (LocalStorage) ====================
export const favoritesAPI = {
  getFavorites: () => {
    if (typeof window === 'undefined') return [];
    const saved = localStorage.getItem('favorites');
    return saved ? JSON.parse(saved) : [];
  },
  
  addFavorite: (resort) => {
    const favorites = favoritesAPI.getFavorites();
    if (!favorites.some(f => f.id === resort.id)) {
      favorites.push(resort);
      localStorage.setItem('favorites', JSON.stringify(favorites));
    }
    return favorites;
  },
  
  removeFavorite: (resortId) => {
    const favorites = favoritesAPI.getFavorites();
    const updated = favorites.filter(f => f.id !== resortId);
    localStorage.setItem('favorites', JSON.stringify(updated));
    return updated;
  },
  
  isFavorite: (resortId) => {
    const favorites = favoritesAPI.getFavorites();
    return favorites.some(f => f.id === resortId);
  },
};

// ==================== ADMIN APIs ====================
export const adminAPI = {
  getPendingOwners: () => apiCall('/admin/pending-owners'),
  
  approveOwner: (id) => apiCall(`/admin/approve-owner/${id}`, {
    method: 'PUT',
  }),
  
  rejectOwner: (id) => apiCall(`/admin/reject-owner/${id}`, {
    method: 'PUT',
  }),
  
  getAllResorts: () => apiCall('/admin/resorts'),
  
  getDashboardStats: () => apiCall('/admin/stats'),
  
  getAllUsers: () => apiCall('/admin/users'),
  
  getAllBookings: () => apiCall('/admin/bookings'),

  getPendingResorts: () => apiCall('/admin/pending-resorts'),
  
  approveResort: (id) => apiCall(`/admin/approve-resort/${id}`, {
    method: 'PUT',
  }),
  
  rejectResort: (id) => apiCall(`/admin/reject-resort/${id}`, {
    method: 'DELETE',
  }),
  
  getResortDetails: (id) => apiCall(`/admin/resorts/${id}`),
};

// ==================== CATEGORY APIs ====================
export const categoryAPI = {
  getAll: () => apiCall('/categories'),
  
  getById: (id) => apiCall(`/categories/${id}`),
  
  getResortsByCategory: (id) => apiCall(`/categories/${id}/resorts`),
};

// ==================== LOCATION APIs ====================
export const locationAPI = {
  getAll: () => apiCall('/locations'),
  
  getProvinces: () => apiCall('/locations/provinces'),
  
  getCitiesByProvince: (province) => apiCall(`/locations/provinces/${encodeURIComponent(province)}/cities`),
};

// ==================== RESORT TYPE APIs ====================
export const resortTypeAPI = {
  getAll: () => apiCall('/resort-types'),
  
  getById: (id) => apiCall(`/resort-types/${id}`),
};

// ==================== UPLOAD API ====================
export const uploadAPI = {
  uploadImage: async (file, type = 'resort') => {
    const token = localStorage.getItem('token');
    const formData = new FormData();
    formData.append('image', file);
    formData.append('type', type);
    
    const response = await fetch(`${API_URL}/upload`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
      body: formData,
    });
    
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.message || 'Зураг хуулахад алдаа гарлаа');
    }
    return data;
  },
  
  uploadMultipleImages: async (files, type = 'resort') => {
    const token = localStorage.getItem('token');
    const formData = new FormData();
    formData.append('type', type);
    
    for (let i = 0; i < files.length; i++) {
      formData.append('images', files[i]);
    }
    
    const response = await fetch(`${API_URL}/upload/multiple`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
      body: formData,
    });
    
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.message || 'Зураг хуулахад алдаа гарлаа');
    }
    return data;
  },
};

// ==================== UNIT APIs ====================
export const unitAPI = {
  getByResort: (resortId) => apiCall(`/units/resort/${resortId}`),
  
  getById: (id) => apiCall(`/units/${id}`),
  
  create: (data) => apiCall('/units', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  
  update: (id, data) => apiCall(`/units/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  }),
  
  delete: (id) => apiCall(`/units/${id}`, {
    method: 'DELETE',
  }),
  
  checkAvailability: (unitId, startDate, endDate) => 
    apiCall(`/units/check-availability?unitId=${unitId}&startDate=${startDate}&endDate=${endDate}`),
  
  setAvailability: (unitId, data) => apiCall(`/units/${unitId}/availability`, {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  
  addPricingHistory: (unitId, data) => apiCall(`/units/${unitId}/pricing-history`, {
    method: 'POST',
    body: JSON.stringify(data),
  }),
};


// ==================== REVIEW APIs ====================
export const reviewAPI = {
  getByResort: (resortId) => apiCall(`/reviews/resort/${resortId}`),
  
  getUserReview: (resortId) => apiCall(`/reviews/user/${resortId}`),
  
  create: (data) => apiCall('/reviews', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  
  update: (id, data) => apiCall(`/reviews/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  }),
  
  delete: (id) => apiCall(`/reviews/${id}`, {
    method: 'DELETE',
  }),
};