export const isAuthenticated = () => {
  if (typeof window === 'undefined') return false;
  const token = localStorage.getItem('token');
  return !!token;
};

export const getUser = () => {
  if (typeof window === 'undefined') return null;
  const userStr = localStorage.getItem('user');
  if (!userStr) return null;
  try {
    return JSON.parse(userStr);
  } catch {
    return null;
  }
};

export const getUserRole = () => {
  const user = getUser();
  return user?.role_name || null;
};

export const logout = () => {
  if (typeof window === 'undefined') return;
  localStorage.removeItem('token');
  localStorage.removeItem('user');
  window.location.href = '/login';
};

export const requireAuth = (router, requiredRole = null) => {
  if (typeof window === 'undefined') return false;
  
  const token = localStorage.getItem('token');
  if (!token) {
    router.push('/login');
    return false;
  }
  
  if (requiredRole) {
    const user = getUser();
    if (user?.role_name !== requiredRole) {
      router.push('/dashboard');
      return false;
    }
  }
  
  return true;
};