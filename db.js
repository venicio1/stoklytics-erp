/* ============================================
   Stoklytics — API Client (-> SQLite backend)
   ============================================ */

const API = 'http://localhost:3001/api';

async function apiFetch(path, options = {}) {
  const url = API + path;
  const headers = { 'Content-Type': 'application/json' };
  const token = localStorage.getItem('stoklytics_token');
  if (token) {
    headers['Authorization'] = 'Bearer ' + token;
  }
  const config = {
    headers,
    ...options
  };
  const res = await fetch(url, config);
  if (!res.ok) {
    // If unauthorized, clear session and redirect to login
    if (res.status === 401 && token) {
      // Only reload on 401 when authenticated — not during login
      localStorage.removeItem('stoklytics_token');
      localStorage.removeItem('stoklytics_user');
      window.location.reload();
    }
    const text = await res.text();
    throw new Error(`API ${res.status}: ${text}`);
  }
  return res.json();
}

// ============================================
// Auth
// ============================================

async function signIn(email, password) {
  const result = await apiFetch('/auth/signin', { method: 'POST', body: JSON.stringify({ email, password }) });
  localStorage.setItem('stoklytics_token', result.token);
  localStorage.setItem('stoklytics_user', JSON.stringify(result.user));
  return result;
}

async function signUp(email, password, userData) {
  const result = await apiFetch('/auth/signup', { method: 'POST', body: JSON.stringify({ email, password, userData }) });
  localStorage.setItem('stoklytics_token', result.token);
  localStorage.setItem('stoklytics_user', JSON.stringify(result.user));
  return result;
}

async function signOut() {
  const token = localStorage.getItem('stoklytics_token');
  localStorage.removeItem('stoklytics_token');
  localStorage.removeItem('stoklytics_user');
  if (token) {
    return apiFetch('/auth/signout', { method: 'POST' }).catch(() => {});
  }
}

async function getCurrentSession() {
  const userData = localStorage.getItem('stoklytics_user');
  if (userData) return { user: JSON.parse(userData) };
  return null;
}

async function getCurrentUser() {
  const session = await getCurrentSession();
  if (!session) return null;
  const users = await apiFetch('/app_users');
  return users.find(u => u.email === session.user.email) || null;
}

// ============================================
// App Users
// ============================================

async function fetchAppUsers() {
  return apiFetch('/app_users');
}

async function updateAppUser(id, values) {
  return apiFetch(`/app_users/${id}`, { method: 'PUT', body: JSON.stringify(values) });
}

async function createAppUser(values) {
  return apiFetch('/app_users', { method: 'POST', body: JSON.stringify(values) });
}

async function deleteAppUser(id) {
  return apiFetch(`/app_users/${id}`, { method: 'DELETE' });
}

async function changePassword(userId, currentPassword, newPassword) {
  return apiFetch('/auth/change-password', { method: 'POST', body: JSON.stringify({ userId, currentPassword, newPassword }) });
}

// ============================================
// Products
// ============================================

async function fetchProducts() {
  return apiFetch('/products');
}

async function createProduct(product) {
  return [await apiFetch('/products', { method: 'POST', body: JSON.stringify(product) })];
}

async function updateProduct(id, values) {
  return apiFetch(`/products/${id}`, { method: 'PUT', body: JSON.stringify(values) });
}

async function deleteProductById(id) {
  return apiFetch(`/products/${id}`, { method: 'DELETE' });
}

async function updateProductStock(id, quantity) {
  const prod = await apiFetch(`/products/${id}`);
  return updateProduct(id, { ...prod, quantity });
}

// ============================================
// Categories
// ============================================

async function fetchCategories() {
  return apiFetch('/categories');
}

async function createCategory(category) {
  return [await apiFetch('/categories', { method: 'POST', body: JSON.stringify(category) })];
}

async function updateCategory(id, values) {
  return apiFetch(`/categories/${id}`, { method: 'PUT', body: JSON.stringify(values) });
}

async function deleteCategoryById(id) {
  return apiFetch(`/categories/${id}`, { method: 'DELETE' });
}

// ============================================
// Customers
// ============================================

async function fetchCustomers() {
  return apiFetch('/customers');
}

async function createCustomer(customer) {
  return [await apiFetch('/customers', { method: 'POST', body: JSON.stringify(customer) })];
}

async function updateCustomer(id, values) {
  return apiFetch(`/customers/${id}`, { method: 'PUT', body: JSON.stringify(values) });
}

async function deleteCustomerById(id) {
  return apiFetch(`/customers/${id}`, { method: 'DELETE' });
}

// ============================================
// Sales
// ============================================

async function fetchSales(options = {}) {
  return apiFetch('/sales');
}

async function createSale(sale, items) {
  return apiFetch('/sales', { method: 'POST', body: JSON.stringify({ ...sale, items }) });
}

// ============================================
// Cash Flow
// ============================================

async function fetchCashFlow(options = {}) {
  return apiFetch('/cash_flow_transactions');
}

async function createCashFlowTransaction(tx) {
  return [await apiFetch('/cash_flow_transactions', { method: 'POST', body: JSON.stringify(tx) })];
}

async function deleteCashFlowTransaction(id) {
  return apiFetch(`/cash_flow_transactions/${id}`, { method: 'DELETE' });
}

// ============================================
// Seller Goals
// ============================================

async function fetchSellerGoals(year, month) {
  const params = new URLSearchParams();
  if (year) params.set('year', year);
  if (month) params.set('month', month);
  return apiFetch('/seller_goals?' + params.toString());
}

async function upsertSellerGoal(goal) {
  return apiFetch('/seller_goals', { method: 'POST', body: JSON.stringify(goal) });
}

// ============================================
// Store Settings
// ============================================

async function fetchStoreSettings() {
  return apiFetch('/store_settings');
}

async function saveStoreSettingsDB(settings) {
  return apiFetch('/store_settings', { method: 'PUT', body: JSON.stringify(settings) });
}

// ============================================
// Recent Activity
// ============================================

async function fetchRecentActivity(limit = 10) {
  return apiFetch('/recent_activity?limit=' + limit);
}

async function addActivityDB(activity) {
  return apiFetch('/recent_activity', { method: 'POST', body: JSON.stringify(activity) });
}

// ============================================
// Coupons
// ============================================

async function fetchCoupons() {
  return apiFetch('/coupons');
}

async function createCoupon(coupon) {
  return await apiFetch('/coupons', { method: 'POST', body: JSON.stringify(coupon) });
}

async function updateCoupon(id, values) {
  return apiFetch(`/coupons/${id}`, { method: 'PUT', body: JSON.stringify(values) });
}

async function useCoupon(id) {
  return apiFetch(`/coupons/${id}/use`, { method: 'POST' });
}

async function deleteCoupon(id) {
  return apiFetch(`/coupons/${id}`, { method: 'DELETE' });
}