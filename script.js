/* ============================================
   Stoklytics — Modern Fashion ERP SaaS
   Core Application Logic
   ============================================ */

// ============================================
// DATA: Auth
// ============================================

const AUTH_USERS = [
  { email: 'admin@stoklytics.com.br', password: 'admin123', name: 'Vitor Marques', role: 'Administrador', initials: 'VM' }
];

let currentUser = null;

// ============================================
// PERMISSIONS
// ============================================

const PERMISSIONS = {
  admin: {
    sections: ['overview', 'inventory', 'sales', 'pos', 'cashflow', 'customers', 'categories', 'sellers', 'reports', 'settings'],
    settingsTabs: ['store', 'account', 'users', 'coupons', 'integrations'],
    inventory: { view: true, create: true, edit: true, delete: true },
    customers: { view: true, create: true, edit: true, delete: true },
    sales: { view: 'all' },
    users: { create: true, createRoles: ['Administrador', 'Gestor', 'Vendedor', 'Estoquista'], edit: true, delete: true }
  },
  manager: {
    sections: ['overview', 'inventory', 'sales', 'pos', 'cashflow', 'customers', 'categories', 'sellers', 'reports', 'settings'],
    settingsTabs: ['account', 'users', 'coupons'],
    inventory: { view: true, create: true, edit: true, delete: true },
    customers: { view: true, create: true, edit: true, delete: true },
    sales: { view: 'all' },
    users: { create: true, createRoles: ['Gestor', 'Vendedor', 'Estoquista'], edit: true, delete: true }
  },
  editor: {
    sections: ['overview', 'inventory', 'pos', 'customers', 'sellers', 'settings'],
    settingsTabs: ['account'],
    inventory: { view: true, create: true, edit: false, delete: false },
    customers: { view: true, create: true, edit: true, delete: false },
    sales: { view: 'own' },
    users: { create: false, edit: false, delete: false }
  },
  viewer: {
    sections: ['overview', 'inventory', 'settings'],
    settingsTabs: ['account'],
    inventory: { view: true, create: true, edit: false, delete: false },
    customers: { view: false, create: false, edit: false, delete: false },
    sales: { view: false },
    users: { create: false, edit: false, delete: false }
  }
};

// ============================================
// DATA: Products
// ============================================

const SIZE_ORDER = ['PP', 'P', 'M', 'G', 'GG', 'XG', 'XXG', 'Único'];

function parseSizes(str) {
  return str.split(',').map(s => s.trim()).filter(Boolean)
    .sort((a, b) => SIZE_ORDER.indexOf(a) - SIZE_ORDER.indexOf(b));
}

function syncSizesChips() {
  const selected = fSizes.value.split(',').map(s => s.trim()).filter(Boolean);
  document.querySelectorAll('.size-chip').forEach(chip => {
    chip.classList.toggle('selected', selected.includes(chip.dataset.size));
  });
}

function parseBrPrice(val) {
  return parseFloat((val || '').replace(',', '.')) || 0;
}

function formatBrCurrency(val) {
  const digits = val.replace(/\D/g, '');
  if (!digits) return '';
  const padded = digits.padStart(3, '0');
  const int = padded.slice(0, -2);
  const dec = padded.slice(-2);
  return int.replace(/\B(?=(\d{3})+(?!\d))/g, '.') + ',' + dec;
}

function getStockStatus(quantity) {
  if (quantity <= 0) return 'out-of-stock';
  if (quantity <= 10) return 'low-stock';
  return 'in-stock';
}

function getStatusLabel(status) {
  const map = { 'in-stock': 'Em Estoque', 'low-stock': 'Estoque Baixo', 'out-of-stock': 'Esgotado' };
  return map[status] || status;
}

function formatCurrency(value) {
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

let products = [
  { name: 'Camiseta Oversized Cotton', sku: 'SKU-001', category: 'Camisetas', sizes: ['P', 'M', 'G', 'GG'], quantity: 48, costPrice: 32.90, salePrice: 89.90, icon: 'fa-solid fa-shirt' },
  { name: 'Calça Jeans Wide Leg', sku: 'SKU-002', category: 'Calças', sizes: ['36', '38', '40', '42', '44'], quantity: 32, costPrice: 67.50, salePrice: 189.90, icon: 'fa-solid fa-shirt' },
  { name: 'Jaqueta Puffer Noir', sku: 'SKU-003', category: 'Jaquetas', sizes: ['P', 'M', 'G', 'GG'], quantity: 8, costPrice: 145.00, salePrice: 349.90, icon: 'fa-solid fa-shirt' },
  { name: 'Vestido Midi Floral', sku: 'SKU-004', category: 'Vestidos', sizes: ['P', 'M', 'G'], quantity: 22, costPrice: 54.30, salePrice: 159.90, icon: 'fa-solid fa-shirt' },
  { name: 'Tênis Urban Runner', sku: 'SKU-005', category: 'Calçados', sizes: ['35', '36', '37', '38', '39', '40', '41', '42'], quantity: 4, costPrice: 98.00, salePrice: 259.90, icon: 'fa-solid fa-shoe-prints' },
  { name: 'Regata Cropped Slim', sku: 'SKU-006', category: 'Camisetas', sizes: ['PP', 'P', 'M', 'G'], quantity: 0, costPrice: 22.40, salePrice: 59.90, icon: 'fa-solid fa-shirt' },
  { name: 'Calça Cargo Street', sku: 'SKU-007', category: 'Calças', sizes: ['P', 'M', 'G', 'GG'], quantity: 18, costPrice: 73.00, salePrice: 199.90, icon: 'fa-solid fa-shirt' },
  { name: 'Blazer Estruturado', sku: 'SKU-008', category: 'Jaquetas', sizes: ['P', 'M', 'G', 'GG'], quantity: 6, costPrice: 132.00, salePrice: 329.90, icon: 'fa-solid fa-shirt' },
  { name: 'Bolsa Tote Couro Vegano', sku: 'SKU-009', category: 'Acessórios', sizes: ['Único'], quantity: 14, costPrice: 89.00, salePrice: 219.90, icon: 'fa-solid fa-bag-shopping' },
  { name: 'Sandália Anabela', sku: 'SKU-010', category: 'Calçados', sizes: ['34', '35', '36', '37', '38', '39'], quantity: 0, costPrice: 47.80, salePrice: 139.90, icon: 'fa-solid fa-shoe-prints' }
];

// ============================================
// DATA: Sales
// ============================================

let sales = [
  { order: 'PDV-4821', date: '27/07/2026 14:32', seller: 'Ana Oliveira', items: [{ name: 'Camiseta Oversized Cotton', qty: 2 }, { name: 'Calça Cargo Street', qty: 1 }], total: 379.70, payment: 'Pix', status: 'Concluído' },
  { order: 'PDV-4820', date: '27/07/2026 11:15', seller: 'Carlos Mendes', items: [{ name: 'Calça Jeans Wide Leg', qty: 3 }], total: 569.70, payment: 'Cartão de Crédito', status: 'Concluído' },
  { order: 'PDV-4819', date: '26/07/2026 18:40', seller: 'Ana Oliveira', items: [{ name: 'Vestido Midi Floral', qty: 1 }], total: 159.90, payment: 'Pix', status: 'Concluído' },
  { order: 'PDV-4818', date: '26/07/2026 16:20', seller: 'Vitor Marques', items: [{ name: 'Jaqueta Puffer Noir', qty: 1 }, { name: 'Bolsa Tote Couro Vegano', qty: 1 }], total: 569.80, payment: 'Cartão de Crédito', status: 'Concluído' },
  { order: 'PDV-4817', date: '26/07/2026 10:05', seller: 'Carlos Mendes', items: [{ name: 'Tênis Urban Runner', qty: 1 }], total: 259.90, payment: 'Pix', status: 'Concluído' },
  { order: 'PDV-4816', date: '25/07/2026 15:50', seller: 'Ana Oliveira', items: [{ name: 'Blazer Estruturado', qty: 2 }], total: 659.80, payment: 'Cartão de Débito', status: 'Cancelado' },
  { order: 'PDV-4815', date: '25/07/2026 09:30', seller: 'Vitor Marques', items: [{ name: 'Regata Cropped Slim', qty: 4 }, { name: 'Camiseta Oversized Cotton', qty: 1 }], total: 329.50, payment: 'Pix', status: 'Concluído' },
  { order: 'PDV-4814', date: '24/07/2026 20:10', seller: 'Carlos Mendes', items: [{ name: 'Calça Jeans Wide Leg', qty: 1 }, { name: 'Vestido Midi Floral', qty: 2 }], total: 509.70, payment: 'Cartão de Crédito', status: 'Concluído' },
  { order: 'PDV-4813', date: '24/07/2026 14:00', seller: 'Ana Oliveira', items: [{ name: 'Sandália Anabela', qty: 1 }], total: 139.90, payment: 'Pix', status: 'Concluído' },
  { order: 'PDV-4812', date: '23/07/2026 17:25', seller: 'Vitor Marques', items: [{ name: 'Bolsa Tote Couro Vegano', qty: 2 }], total: 439.80, payment: 'Boleto', status: 'Pendente' },
  { order: 'PDV-4811', date: '23/07/2026 11:40', seller: 'Carlos Mendes', items: [{ name: 'Camiseta Oversized Cotton', qty: 3 }, { name: 'Calça Cargo Street', qty: 1 }], total: 469.60, payment: 'Cartão de Crédito', status: 'Concluído' },
  { order: 'PDV-4810', date: '22/07/2026 09:15', seller: 'Ana Oliveira', items: [{ name: 'Jaqueta Puffer Noir', qty: 1 }], total: 349.90, payment: 'Pix', status: 'Concluído' }
];

// ============================================
// DATA: Categories
// ============================================

let categories = [
  { name: 'Camisetas', icon: 'fa-solid fa-shirt', color: '#6366F1' },
  { name: 'Calças', icon: 'fa-solid fa-shirt', color: '#22C55E' },
  { name: 'Vestidos', icon: 'fa-solid fa-shirt', color: '#EAB308' },
  { name: 'Calçados', icon: 'fa-solid fa-shoe-prints', color: '#EF4444' },
  { name: 'Jaquetas', icon: 'fa-solid fa-shirt', color: '#8B5CF6' },
  { name: 'Acessórios', icon: 'fa-solid fa-bag-shopping', color: '#06B6D4' }
];

// ============================================
// DATA: Users
// ============================================

let users = []; // loaded from DB via fetchAppUsers()

// ============================================
// DATA: Recent Activity
// ============================================

let recentActivity = [
  { type: 'entry', title: 'Entrada de Estoque', desc: '+12 unidades de Camiseta Oversized Cotton', time: 'Hoje, 14:32' },
  { type: 'exit', title: 'Venda Realizada', desc: 'PDV-4821 — 2x Camiseta, 1x Cargo', time: 'Hoje, 14:32' },
  { type: 'exit', title: 'Venda Realizada', desc: 'PDV-4820 — 3x Calça Jeans Wide Leg', time: 'Hoje, 11:15' },
  { type: 'edit', title: 'Preço Atualizado', desc: 'Jaqueta Puffer Noir: R$ 379,90 → R$ 349,90', time: 'Ontem, 18:40' },
  { type: 'exit', title: 'Venda Realizada', desc: 'PDV-4819 — 1x Vestido Midi Floral', time: 'Ontem, 16:20' },
  { type: 'entry', title: 'Reposição', desc: '+20 unidades de Tênis Urban Runner', time: 'Ontem, 09:05' }
];

// ============================================
// DOM REFS
// ============================================

const $ = (sel, ctx = document) => ctx.querySelector(sel);
const $$ = (sel, ctx = document) => [...ctx.querySelectorAll(sel)];

const sidebar = $('#sidebar');
const sidebarToggle = $('#sidebarToggle');
const sidebarOverlay = $('#sidebarOverlay');
const mobileMenuBtn = $('#mobileMenuBtn');
const navLinks = $$('.nav-link');
const sections = $$('.dashboard-section');
const globalSearch = $('#globalSearch');

// Inventory
const inventoryBody = $('#inventoryBody');
const inventorySearch = $('#inventorySearch');
const categoryFilter = $('#categoryFilter');
const statusFilter = $('#statusFilter');
const tableCount = $('#tableCount');

// Sales
const salesBody = $('#salesBody');
const salesSearch = $('#salesSearch');
const paymentFilter = $('#paymentFilter');
const salesStatusFilter = $('#salesStatusFilter');
const salesCount = $('#salesCount');

// Categories
const categoriesGrid = $('#categoriesGrid');

// Reports
const topSellersList = $('#topSellersList');
const slowMoversList = $('#slowMoversList');

// Settings
const usersList = $('#usersList');
const settingsTabs = $$('.settings-tab');
const settingsPanels = $$('.settings-panel');

// User modal
const userModalOverlay = $('#userModalOverlay');
const userModalClose = $('#userModalClose');
const userModalCancel = $('#userModalCancel');
const userModalSave = $('#userModalSave');
const userModalTitle = $('#userModalTitle');
const userModalSaveText = $('#userModalSaveText');
const editUserIndex = $('#editUserIndex');
const addUserBtn = $('#addUserBtn');
const userForm = $('#userForm');
const uName = $('#userName');
const uEmail = $('#userEmail');
const uPassword = $('#userPassword');
const uRole = $('#userRole');

// Modals
const modalOverlay = $('#modalOverlay');
const modalClose = $('#modalClose');
const modalCancel = $('#modalCancel');
const modalSave = $('#modalSave');
const modalTitle = $('#modalTitle');
const modalSaveText = $('#modalSaveText');
const editIndex = $('#editIndex');
const productForm = $('#productForm');
const openModalBtn = $('#openModalBtn');

const fName = $('#prodName');
const fSku = $('#prodSku');
const fCategory = $('#prodCategory');
const fSizes = $('#prodSizes');
const fQuantity = $('#prodQuantity');
const fCostPrice = $('#prodCostPrice');
const fSalePrice = $('#prodSalePrice');
const fIcon = $('#prodIcon');
const fPhoto = $('#prodPhoto');
const fPhotoPreview = $('#prodPhotoPreview');
const fPhotoImg = $('#prodPhotoImg');
const fPhotoRemove = $('#prodPhotoRemove');

// Category modal
const catModalOverlay = $('#categoryModalOverlay');
const catModalClose = $('#categoryModalClose');
const catModalCancel = $('#categoryModalCancel');
const catModalSave = $('#categoryModalSave');
const catModalTitle = $('#categoryModalTitle');
const catModalSaveText = $('#categoryModalSaveText');
const editCategoryIndex = $('#editCategoryIndex');
const catName = $('#catName');
const catIcon = $('#catIcon');
const catIconPicker = $('#catIconPicker');
const prodIconPicker = $('#prodIconPicker');
const categoryForm = $('#categoryForm');
const addCategoryBtn = $('#addCategoryBtn');

// Sale detail modal
const saleDetailOverlay = $('#saleDetailOverlay');
const saleDetailClose = $('#saleDetailClose');
const saleDetailCancel = $('#saleDetailCancel');
const saleDetailContent = $('#saleDetailContent');

// Coupon modal
const couponModalOverlay = $('#couponModalOverlay');
const couponModalClose = $('#couponModalClose');
const couponModalCancel = $('#couponModalCancel');
const couponModalSave = $('#couponModalSave');
const couponModalTitle = $('#couponModalTitle');
const couponModalSaveText = $('#couponModalSaveText');
const editCouponIndex = $('#editCouponIndex');
const couponForm = $('#couponForm');
const couponCode = $('#couponCode');
const couponDescription = $('#couponDescription');
const couponDiscountType = $('#couponDiscountType');
const couponDiscountValue = $('#couponDiscountValue');
const couponMinQuantity = $('#couponMinQuantity');
const couponCategoryRestriction = $('#couponCategoryRestriction');
const couponUsageLimit = $('#couponUsageLimit');
const couponExpiresAt = $('#couponExpiresAt');
const addCouponBtn = $('#addCouponBtn');
const couponSelectContainer = $('#couponSelectContainer');
const appliedCouponsContainer = $('#appliedCouponsContainer');

// Period buttons
const periodBtns = $$('.period-btn');

// Notification bell
const bellBtn = $('.status-item .fa-bell')?.closest('.status-item');

// Sales period state
let salesPeriod = 6; // months

let coupons = [];
let appliedCoupons = [];

// Recent
const recentList = $('#recentList');

// Auth
const loginScreen = $('#loginScreen');
const loginForm = $('#loginForm');
const loginEmail = $('#loginEmail');
const loginPassword = $('#loginPassword');
const loginBtn = $('#loginBtn');
const loginError = $('#loginError');
const loginErrorText = $('#loginErrorText');
const pwToggle = $('#pwToggle');
const appWrapper = $('#appWrapper');
const userDropdown = $('#userDropdown');
const userProfile = $('#userProfile');
const logoutBtn = $('#logoutBtn');

// ============================================
// AUTH
// ============================================

function showLogin() {
  loginScreen.classList.remove('hidden');
  appWrapper.style.display = 'none';
  userDropdown.classList.remove('open');
  currentUser = null;
  spawnParticles();

  // Restore last email but never password
  const savedEmail = localStorage.getItem('stoklytics_last_email');
  loginEmail.value = savedEmail || '';
  loginPassword.value = '';
  loginError.classList.remove('visible');
}

async function showApp() {
  loginScreen.classList.add('hidden');
  appWrapper.style.display = 'flex';
  if (logoutBtn) logoutBtn.style.display = 'none';
  updateUserUI();
  applyPermissions();

  let catData, prodData, custData, salesData, goalsData, storeData, activityData, cfData, usersData;

  try {
    // Load all data from Dexie in parallel
    [catData, prodData, custData, salesData, goalsData, storeData, activityData, cfData, usersData] = await Promise.all([
      fetchCategories().catch(() => null),
      fetchProducts().catch(() => null),
      fetchCustomers().catch(() => null),
      fetchSales().catch(() => null),
      fetchSellerGoals().catch(() => null),
      fetchStoreSettings().catch(() => null),
      fetchRecentActivity().catch(() => null),
      fetchCashFlow().catch(() => null),
      fetchAppUsers().catch(() => null)
    ]);

    // Populate in-memory arrays (keep as cache for render functions)
    if (catData && catData.length > 0) {
      categories = catData.map(c => ({ _id: c.id, name: c.name, icon: c.icone, color: c.cor }));
    }
    if (prodData && prodData.length > 0) {
      products = prodData.map(p => ({
        _id: p.id, name: p.nome, sku: p.codigo, category: p.categoria,
        sizes: p.tamanhos || [], quantity: p.quantidade,
        costPrice: parseFloat(p.preco_custo), salePrice: parseFloat(p.preco_venda),
        icon: p.icone || 'fa-solid fa-shirt', photo: p.foto || ''
      }));
    }
    if (custData && custData.length > 0) {
      customers = custData.map(c => ({
        _id: c.id, name: c.nome, phone: c.phone, email: c.email,
        totalSpent: parseFloat(c.total_gasto), visits: c.visitas,
        notes: c.observacoes, active: c.active
      }));
    }
    if (salesData && salesData.length > 0) {
      sales = salesData.map(s => ({
        _id: s.id, order: s.numero_pedido,
        date: new Date(s.date).toLocaleString('pt-BR'),
        seller: s.vendedor, total: parseFloat(s.total),
        payment: s.pagamento, status: s.status,
        customerId: s.cliente_id, items: []
      }));
    }
    if (activityData && activityData.length > 0) {
      recentActivity = activityData.map(a => ({
        type: a.tipo, title: a.titulo, desc: a.descricao,
        time: new Date(a.created_at).toLocaleString('pt-BR')
      }));
    }
    if (storeData) {
      localStorage.setItem('stoklytics_store', JSON.stringify({ name: storeData.nome_loja, color: storeData.cor, logo: storeData.logotipo }));
    }
    if (goalsData && goalsData.length > 0) {
      goalsData.forEach(g => { sellerGoals[g.nome_vendedor] = g.valor_meta; });
    }
    if (cfData && cfData.length > 0) {
      cashFlowTransactions = cfData.map(cf => ({
        _id: cf.id,
        date: new Date(cf.date + 'T12:00:00').toLocaleDateString('pt-BR'),
        description: cf.descricao, type: cf.tipo,
        value: parseFloat(cf.valor), category: cf.categoria
      }));
    }
    if (usersData && usersData.length > 0) {
      users.length = 0;
      usersData.forEach(u => {
        users.push({
          _id: u.id, name: u.nome, email: u.email, role: u.cargo,
          roleClass: u.classe_cargo, avatar: u.avatar || u.iniciais,
          color: u.cor, initials: u.iniciais, active: u.active
        });
      });
    }

    // Load coupons
    const couponData = await fetchCoupons().catch(() => null);
    if (couponData && couponData.length > 0) {
      coupons = couponData.map(c => ({
        _id: c.id, code: c.code, description: c.descricao,
        discount_type: c.tipo_desconto, discount_value: c.valor_desconto,
        min_quantity: c.quantidade_minima, category_restriction: c.restricao_categoria,
        usage_limit: c.limite_uso, used_count: c.usos_realizados,
        active: c.active === 1 || c.active === true,
        expires_at: c.expira_em
      }));
    }
    renderCouponSelect();
  } catch (e) {
    console.warn('Dexie load failed, using local data:', e);
  }

  // Re-init charts after layout is settled
  requestAnimationFrame(() => requestAnimationFrame(initCharts));
  fullRefresh();
  renderSales();
  renderSellerRanking();
  renderCategories();
  renderReports();
  renderUsers();
  renderPOSProducts();
  updateSalesKPIs();
  // New feature inits
  loadTheme();
  if (!cfData || cfData.length === 0) cashFlowTransactions = generateCashFlowData();
  updateCashFlowKPIs();
  if (customers.length === 0) generateCustomers();
  renderCustomers();
  populatePOSCustomerSelect();
  renderSellerGoals();
  renderRestockForecast();
  loadStoreSettings();
  // Show onboarding after app is ready
  setTimeout(showOnboarding, 600);
}

function applyPermissions() {
  if (!currentUser) return;
  const roleClass = currentUser.roleClass;
  const perm = PERMISSIONS[roleClass] || PERMISSIONS.editor;

  // 1. Sidebar navigation
  navLinks.forEach(link => {
    const section = link.dataset.section;
    const li = link.closest('li');
    if (!li) return;
    li.style.display = perm.sections.includes(section) ? '' : 'none';
  });

  // 2. Bottom nav (mobile)
  document.querySelectorAll('.bottom-nav-item').forEach(item => {
    const section = item.dataset.section;
    item.style.display = perm.sections.includes(section) ? '' : 'none';
  });

  // 3. Settings tabs — hide restricted tabs
  document.querySelectorAll('.settings-tab').forEach(tab => {
    tab.style.display = perm.settingsTabs.includes(tab.dataset.tab) ? '' : 'none';
  });

  // 4. Activate first visible settings tab if current one is hidden
  const activeTab = document.querySelector('.settings-tab.active');
  if (!activeTab || activeTab.style.display === 'none') {
    const firstVisible = document.querySelector('.settings-tab:not([style*=\"none\"])');
    if (firstVisible) {
      document.querySelectorAll('.settings-tab').forEach(t => t.classList.remove('active'));
      firstVisible.classList.add('active');
      document.querySelectorAll('.settings-panel').forEach(p => p.classList.remove('active'));
      const panel = document.getElementById('settings-' + firstVisible.dataset.tab);
      if (panel) panel.classList.add('active');
    }
  }

  // 5. Create/add buttons visibility
  const openModalBtn = document.getElementById('openModalBtn');
  if (openModalBtn) openModalBtn.style.display = perm.inventory.create ? '' : 'none';

  const addCategoryBtn = document.getElementById('addCategoryBtn');
  if (addCategoryBtn) addCategoryBtn.style.display = perm.sections.includes('categories') ? '' : 'none';

  const addCustomerBtn = document.getElementById('addCustomerBtn');
  if (addCustomerBtn) addCustomerBtn.style.display = perm.sections.includes('customers') ? '' : 'none';

  const addTransactionBtn = document.getElementById('addTransactionBtn');
  if (addTransactionBtn) addTransactionBtn.style.display = perm.sections.includes('cashflow') ? '' : 'none';

  const addUserBtn = document.getElementById('addUserBtn');
  if (addUserBtn) addUserBtn.style.display = perm.users.create ? '' : 'none';

  const addCouponBtn = document.getElementById('addCouponBtn');
  if (addCouponBtn) addCouponBtn.style.display = perm.sections.includes('settings') && perm.settingsTabs.includes('coupons') ? '' : 'none';
}

function updateUserUI() {
  if (!currentUser) return;
  const initials = currentUser.initials;
  const name = currentUser.name;
  const role = currentUser.role;
  const email = currentUser.email;

  $$('.user-avatar').forEach(el => { el.textContent = initials; });
  $$('.user-name-top').forEach(el => { el.textContent = name; });
  $$('.user-role-top').forEach(el => { el.textContent = role; });
  $$('.dropdown-avatar').forEach(el => { el.textContent = initials; });
  $$('.dropdown-name').forEach(el => { el.textContent = name; });
  $$('.dropdown-email').forEach(el => { el.textContent = email; });
  $$('.user-avatar-mini').forEach(el => { el.textContent = initials; });
  $$('.user-name').forEach(el => { el.textContent = name; });
  $$('.user-role').forEach(el => { el.textContent = role; });
}

async function handleLogin(e) {
  e.preventDefault();
  const email = loginEmail.value.trim();
  const password = loginPassword.value.trim();
  console.log('handleLogin', email);

  loginError.classList.remove('visible');
  loginBtn.classList.add('loading');

  try {
    const result = await signIn(email, password);
    const userData = result.user;
    currentUser = {
      name: userData.name,
      email: userData.email,
      role: userData.role,
      initials: userData.initials,
      roleClass: userData.roleClass
    };
    localStorage.setItem('stoklytics_user', JSON.stringify(currentUser));
    localStorage.setItem('stoklytics_last_email', email);
    await showApp();
  } catch (err) {
    console.error('Login error:', err);
    loginErrorText.textContent = 'E-mail ou senha inválidos. Tente novamente.';
    loginError.classList.add('visible');
    loginPassword.value = '';
    loginPassword.focus();
  }
  loginBtn.classList.remove('loading');
}

function handleLogout(e) {
  if (e) e.preventDefault();
  localStorage.removeItem('stoklytics_user');
  localStorage.removeItem('stoklytics_token');
  signOut().catch(() => {});
  showLogin();
}

function spawnParticles() {
  const container = document.getElementById('loginParticles');
  if (!container) return;
  container.innerHTML = '';
  for (let i = 0; i < 30; i++) {
    const p = document.createElement('div');
    p.className = 'login-particle';
    p.style.left = `${Math.random() * 100}%`;
    p.style.top = `${Math.random() * 100}%`;
    p.style.animationDelay = `${Math.random() * 8}s`;
    p.style.animationDuration = `${6 + Math.random() * 6}s`;
    p.style.width = p.style.height = `${2 + Math.random() * 4}px`;
    container.appendChild(p);
  }
}

// ============================================
// CHARTS
// ============================================

let salesChartInstance = null;
let categoryChartInstance = null;

function getCssVar(name, fallback) {
  return getComputedStyle(document.documentElement).getPropertyValue(name).trim() || fallback;
}

function getChartThemeColors() {
  return {
    bgCard: getCssVar('--bg-card', '#1E293B'),
    grid: getCssVar('--border-color', '#334155'),
    text: getCssVar('--text-muted', '#64748B'),
    tooltipBg: getCssVar('--bg-card', '#1E293B'),
    tooltipBorder: getCssVar('--border-color', '#334155'),
  };
}

function initCharts() {
  const salesCtx = document.getElementById('salesChart');
  const categoryCtx = document.getElementById('categoryChart');
  if (!salesCtx || !categoryCtx) return;
  const t = getChartThemeColors();

  const allMonths = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
  const allSalesData = [12800, 15200, 14100, 16900, 18300, 22100, 20500, 19800, 23400, 21200, 25600, 24300];
  const count = salesPeriod || 6;
  const months = allMonths.slice(0, count);
  const salesData = allSalesData.slice(0, count);

  if (salesChartInstance) salesChartInstance.destroy();
  salesChartInstance = new Chart(salesCtx, {
    type: 'line',
    data: {
      labels: months,
      datasets: [{
        label: 'Faturamento (R$)',
        data: salesData,
        borderColor: '#6366F1',
        backgroundColor: ctx => {
          const g = ctx.chart.ctx.createLinearGradient(0, 0, 0, 260);
          g.addColorStop(0, 'rgba(99, 102, 241, 0.25)');
          g.addColorStop(1, 'rgba(99, 102, 241, 0)');
          return g;
        },
        fill: true, tension: 0.4, pointRadius: 4,
        pointBackgroundColor: '#6366F1', pointBorderColor: t.bgCard,
        pointBorderWidth: 2, borderWidth: 3
      }]
    },
    options: {
      responsive: true, maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: { backgroundColor: t.tooltipBg, titleColor: '#F1F5F9', bodyColor: '#94A3B8', borderColor: t.tooltipBorder, borderWidth: 1, padding: 12, callbacks: { label: ctx => `R$ ${ctx.parsed.y.toLocaleString('pt-BR')}` } }
      },
      scales: {
        x: { grid: { color: t.grid, drawBorder: false }, ticks: { color: t.text, font: { size: 11 } } },
        y: { grid: { color: t.grid, drawBorder: false }, ticks: { color: t.text, font: { size: 11 }, callback: v => `R$${v.toLocaleString('pt-BR').slice(0, -3)}` } }
      },
      interaction: { intersect: false, mode: 'index' }
    }
  });

  refreshCategoryChart();
}

function refreshCategoryChart() {
  const categoryCtx = document.getElementById('categoryChart');
  if (!categoryCtx) return;
  const chartBg = getComputedStyle(document.documentElement).getPropertyValue('--bg-card').trim() || '#1E293B';
  if (!categoryChartInstance) {
    const catMap = {};
    products.forEach(p => { catMap[p.category] = (catMap[p.category] || 0) + p.quantity; });
    const labels = Object.keys(catMap);
    const values = Object.values(catMap);
    const colors = ['#6366F1', '#22C55E', '#EAB308', '#EF4444', '#8B5CF6', '#06B6D4'];
    categoryChartInstance = new Chart(categoryCtx, {
      type: 'doughnut',
      data: { labels, datasets: [{ data: values, backgroundColor: colors.slice(0, labels.length), borderColor: chartBg, borderWidth: 3, hoverOffset: 8 }] },
      options: {
        responsive: true, maintainAspectRatio: false, cutout: '68%',
        plugins: {
          legend: { position: 'bottom', labels: { color: '#94A3B8', font: { size: 11 }, padding: 12, usePointStyle: true, pointStyle: 'circle' } },
          tooltip: { backgroundColor: '#1E293B', titleColor: '#F1F5F9', bodyColor: '#94A3B8', borderColor: '#334155', borderWidth: 1, padding: 12, callbacks: { label: ctx => `${ctx.label}: ${ctx.pars} unidades` } }
        }
      }
    });
    return;
  }
  const catMap = {};
  products.forEach(p => { catMap[p.category] = (catMap[p.category] || 0) + p.quantity; });
  categoryChartInstance.data.labels = Object.keys(catMap);
  categoryChartInstance.data.datasets[0].data = Object.values(catMap);
  categoryChartInstance.data.datasets[0].borderColor = chartBg;
  categoryChartInstance.update();
}

// ============================================
// RENDER: Inventory Table
// ============================================

function renderTable(data) {
  const list = data || products;
  if (!inventoryBody) return;

  if (list.length === 0) {
    inventoryBody.innerHTML = `<tr><td colspan="9" style="text-align:center;padding:40px;color:var(--text-muted);">
      <i class="fa-solid fa-box-open" style="font-size:2rem;display:block;margin-bottom:8px;"></i>
      Nenhum produto encontrado</td></tr>`;
    tableCount.textContent = '0 produtos';
    return;
  }

  inventoryBody.innerHTML = list.map((p, idx) => {
    const idxRef = products.indexOf(p);
    const status = getStockStatus(p.quantity);
    const statusLabel = getStatusLabel(status);
    const perm = currentUser ? PERMISSIONS[currentUser.roleClass] || PERMISSIONS.editor : PERMISSIONS.editor;
    const canEdit = perm.inventory.edit;
    const canDelete = perm.inventory.delete;
    const actionBtns = [];
    if (canEdit) actionBtns.push(`<button class="action-btn edit-btn" data-index="${idxRef}" title="Editar"><i class="fa-solid fa-pen-to-square"></i></button>`);
    if (canEdit) actionBtns.push(`<button class="action-btn down-btn" data-index="${idxRef}" title="Dar Baixa"><i class="fa-solid fa-arrow-down"></i></button>`);
    if (canDelete) actionBtns.push(`<button class="action-btn delete-btn" data-index="${idxRef}" title="Excluir"><i class="fa-solid fa-trash-can"></i></button>`);
    return `<tr>
      <td><span style="font-family:monospace;font-size:0.8rem;color:var(--text-muted);">${p.sku}</span></td>
      <td><div class="product-cell">${p.photo ? `<img src="${p.photo}" class="product-thumb" />` : `<div class="product-icon"><i class="${p.icon}"></i></div>`}<div><div class="product-name">${p.name}</div><div class="product-sku-sub">${p.sku}</div></div></div></td>
      <td><span style="color:var(--text-secondary);font-size:0.85rem;">${p.category}</span></td>
      <td>${p.sizes.map(s => `<span class="size-badge">${s}</span>`).join('')}</td>
      <td class="text-right" style="font-weight:600;">${p.quantity}</td>
      <td class="text-right" style="color:var(--text-muted);">${formatCurrency(p.costPrice)}</td>
      <td class="text-right" style="font-weight:600;color:var(--green);">${formatCurrency(p.salePrice)}</td>
      <td><span class="status-badge ${status}"><span class="dot"></span> ${statusLabel}</span></td>
      <td><div class="action-btns">
        ${actionBtns.join('')}
      </div></td>
    </tr>`;
  }).join('');

  tableCount.textContent = `${list.length} ${list.length === 1 ? 'produto' : 'produtos'}`;

  $$('.edit-btn', inventoryBody).forEach(btn => btn.addEventListener('click', () => openEditModal(parseInt(btn.dataset.index))));
  $$('.down-btn', inventoryBody).forEach(btn => btn.addEventListener('click', () => decrementStock(parseInt(btn.dataset.index))));
  $$('.delete-btn', inventoryBody).forEach(btn => btn.addEventListener('click', () => deleteProduct(parseInt(btn.dataset.index))));
}

// ============================================
// RENDER: Sales Table
// ============================================

function getSalesStatusClass(status) {
  if (status === 'Concluído') return 'concluded';
  if (status === 'Cancelado') return 'cancelled';
  return 'pending';
}

function renderSales(filtered) {
  const list = filtered || sales;
  if (!salesBody) return;

  if (list.length === 0) {
    salesBody.innerHTML = `<tr><td colspan="8" style="text-align:center;padding:40px;color:var(--text-muted);">
      <i class="fa-solid fa-receipt" style="font-size:2rem;display:block;margin-bottom:8px;"></i>
      Nenhuma venda encontrada</td></tr>`;
    if (salesCount) salesCount.textContent = '0 pedidos';
    return;
  }

  salesBody.innerHTML = list.map((s, i) => {
    const itemsStr = s.items.map(i => `${i.qty}x ${i.name}`).join(', ');
    const statusClass = getSalesStatusClass(s.status);
    return `<tr>
      <td><span style="font-family:monospace;font-weight:600;">${s.order}</span></td>
      <td style="color:var(--text-secondary);font-size:0.85rem;">${s.date}</td>
      <td>${s.seller}</td>
      <td style="font-size:0.8rem;color:var(--text-secondary);max-width:220px;">${itemsStr}</td>
      <td class="text-right" style="font-weight:700;">${formatCurrency(s.total)}</td>
      <td><span style="display:flex;align-items:center;gap:6px;font-size:0.85rem;">
        <i class="fa-solid ${s.payment === 'Pix' ? 'fa-qrcode' : s.payment === 'Cartão de Crédito' ? 'fa-credit-card' : s.payment === 'Cartão de Débito' ? 'fa-credit-card' : 'fa-barcode'}" style="color:var(--text-muted);"></i>
        ${s.payment}
      </span></td>
      <td><span class="status-badge ${statusClass}"><span class="dot"></span> ${s.status}</span></td>
      <td><div class="action-btns">
        <button class="action-btn view-btn" data-index="${i}" title="Detalhes"><i class="fa-solid fa-eye"></i></button>
      </div></td>
    </tr>`;
  }).join('');

  if (salesCount) salesCount.textContent = `${list.length} ${list.length === 1 ? 'pedido' : 'pedidos'}`;
}

// ============================================
// RENDER: Sales KPIs
// ============================================

function updateSalesKPIs() {
  const concluded = sales.filter(s => s.status === 'Concluído');
  const totalOrders = concluded.length;
  const totalRevenue = concluded.reduce((sum, s) => sum + s.total, 0);
  const avgTicket = totalOrders > 0 ? totalRevenue / totalOrders : 0;
  const pixSales = concluded.filter(s => s.payment === 'Pix').reduce((sum, s) => sum + s.total, 0);
  const cancellations = sales.filter(s => s.status === 'Cancelado').length;

  document.getElementById('kpiTotalOrders').textContent = totalOrders;
  document.getElementById('kpiAvgTicket').textContent = formatCurrency(avgTicket);
  document.getElementById('kpiPixSales').textContent = formatCurrency(pixSales);
  document.getElementById('kpiCancellations').textContent = cancellations;
}

// ============================================
// RENDER: Seller Ranking
// ============================================

function getSellerStats() {
  const sellerMap = {};
  const concluded = sales.filter(s => s.status === 'Concluído');

  concluded.forEach(s => {
    if (!sellerMap[s.seller]) {
      sellerMap[s.seller] = { name: s.seller, orders: 0, total: 0, items: 0, paymentCounts: {} };
    }
    sellerMap[s.seller].orders += 1;
    sellerMap[s.seller].total += s.total;
    sellerMap[s.seller].items += s.items.reduce((sum, i) => sum + i.qty, 0);
    sellerMap[s.seller].paymentCounts[s.payment] = (sellerMap[s.seller].paymentCounts[s.payment] || 0) + 1;
  });

  return Object.values(sellerMap)
    .map(s => {
      s.avgTicket = s.orders > 0 ? s.total / s.orders : 0;
      // Preferred payment method
      const entries = Object.entries(s.paymentCounts);
      s.preferredPayment = entries.length > 0 ? entries.sort((a, b) => b[1] - a[1])[0][0] : '—';
      // Performance score (0-100) based on orders, total, items
      return s;
    })
    .sort((a, b) => b.total - a.total);
}

function renderSellerRanking() {
  const stats = getSellerStats();
  const sellerBody = $('#sellerBody');
  const sellerPodium = $('#sellerPodium');

  // KPIs
  document.getElementById('kpiActiveSellers').textContent = stats.length;
  const teamTotal = stats.reduce((s, v) => s + v.total, 0);
  const teamOrders = stats.reduce((s, v) => s + v.orders, 0);
  document.getElementById('kpiTeamGoal').textContent = formatCurrency(teamTotal * 1.4);
  document.getElementById('kpiTeamSales').textContent = teamOrders;
  document.getElementById('kpiBestSeller').textContent = stats.length > 0 ? stats[0].name : '—';

  // Podium
  const podioColors = ['#EAB308', '#94A3B8', '#CD7F32'];
  const podioLabels = ['OURO', 'PRATA', 'BRONZE'];
  if (sellerPodium) {
    if (stats.length === 0) {
      sellerPodium.innerHTML = `<div class="empty-state" style="border:none;padding:20px;">
        <i class="fa-solid fa-user-tie"></i><p>Nenhum dado de venda disponível</p>
      </div>`;
    } else {
      sellerPodium.innerHTML = stats.slice(0, 3).map((s, i) => {
        const rank = i === 0 ? 'gold' : i === 1 ? 'silver' : 'bronze';
        const initials = s.name.split(' ').map(w => w[0]).join('').slice(0, 2);
        const avatarBg = podioColors[i];
        return `<div class="podium-item ${rank}">
          <div class="podium-crown"><i class="fa-solid fa-crown"></i></div>
          <div class="podium-avatar" style="background:${avatarBg};">${initials}</div>
          <div class="podium-name">${s.name}</div>
          <div class="podium-value">${formatCurrency(s.total)}</div>
          <span class="podium-label">${podioLabels[i]}</span>
          <div class="podium-bar"></div>
        </div>`;
      }).join('');
    }
  }

  // Table
  if (sellerBody) {
    if (stats.length === 0) {
      sellerBody.innerHTML = `<tr><td colspan="8" style="text-align:center;padding:40px;color:var(--text-muted);">
        <i class="fa-solid fa-user-tie" style="font-size:2rem;display:block;margin-bottom:8px;"></i>
        Nenhum vendedor encontrado</td></tr>`;
      return;
    }

    // Normalize performance: map best to 100, worst proportionally
    const maxTotal = Math.max(...stats.map(s => s.total)) || 1;

    sellerBody.innerHTML = stats.map((s, i) => {
      const perfPct = Math.round((s.total / maxTotal) * 100);
      const perfClass = perfPct >= 70 ? 'high' : perfPct >= 40 ? 'medium' : 'low';
      const initials = s.name.split(' ').map(w => w[0]).join('').slice(0, 2);
      const avatarColors = ['#6366F1', '#22C55E', '#EAB308', '#8B5CF6', '#06B6D4'];
      const avatarColor = avatarColors[i % avatarColors.length];
      const paymentIcon = s.preferredPayment === 'Pix' ? 'fa-qrcode' : s.preferredPayment === 'Cartão de Crédito' ? 'fa-credit-card' : 'fa-credit-card';

      return `<tr>
        <td style="font-weight:700;font-size:1rem;color:${i === 0 ? '#EAB308' : i === 1 ? '#94A3B8' : i === 2 ? '#CD7F32' : 'var(--text-muted)'};">${i + 1}</td>
        <td><div style="display:flex;align-items:center;gap:10px;">
          <div style="width:34px;height:34px;border-radius:50%;background:${avatarColor};display:flex;align-items:center;justify-content:center;font-size:0.7rem;font-weight:700;color:white;flex-shrink:0;">${initials}</div>
          <span style="font-weight:600;">${s.name}</span>
        </div></td>
        <td style="font-weight:600;">${s.orders} ${s.orders === 1 ? 'venda' : 'vendas'}</td>
        <td class="text-right" style="font-weight:700;">${formatCurrency(s.total)}</td>
        <td class="text-right">${formatCurrency(s.avgTicket)}</td>
        <td class="text-right">${s.items}</td>
        <td><span style="display:flex;align-items:center;gap:6px;font-size:0.85rem;">
          <i class="fa-solid ${paymentIcon}" style="color:var(--text-muted);font-size:0.8rem;"></i>
          ${s.preferredPayment}
        </span></td>
        <td><div style="display:flex;align-items:center;gap:8px;">
          <div class="performance-bar"><div class="performance-bar-fill ${perfClass}" style="width:${perfPct}%;"></div></div>
          <span style="font-size:0.75rem;font-weight:600;color:${perfClass === 'high' ? 'var(--green)' : perfClass === 'medium' ? 'var(--yellow)' : 'var(--red)'};">${perfPct}%</span>
        </div></td>
      </tr>`;
    }).join('');
  }
}

// ============================================
// RENDER: Categories
// ============================================

function renderCategories() {
  if (!categoriesGrid) return;

  if (categories.length === 0) {
    categoriesGrid.innerHTML = `<div class="empty-state" style="grid-column:1/-1;">
      <i class="fa-solid fa-tags"></i>
      <p>Nenhuma categoria cadastrada</p>
      <button class="btn btn-primary" id="emptyCatBtn"><i class="fa-solid fa-plus"></i> Criar Nova Categoria</button>
    </div>`;
    const emptyBtn = $('#emptyCatBtn');
    if (emptyBtn) emptyBtn.addEventListener('click', () => openCategoryModal());
    return;
  }

  categoriesGrid.innerHTML = categories.map((cat, idx) => {
    const count = products.filter(p => p.category === cat.name).length;
    return `<div class="category-card">
      <div class="category-icon" style="background:${cat.color}1f;color:${cat.color};">
        <i class="${cat.icon}"></i>
      </div>
      <div class="category-info">
        <div class="category-name">${cat.name}</div>
        <div class="category-count">${count} ${count === 1 ? 'produto vinculado' : 'produtos vinculados'}</div>
      </div>
      <div class="action-btns">
        <button class="action-btn edit-btn" data-cat="${idx}" title="Editar"><i class="fa-solid fa-pen-to-square"></i></button>
        <button class="action-btn delete-btn" data-cat="${idx}" title="Excluir"><i class="fa-solid fa-trash-can"></i></button>
      </div>
    </div>`;
  }).join('');

  $$('.edit-btn', categoriesGrid).forEach(btn => btn.addEventListener('click', () => openEditCategory(parseInt(btn.dataset.cat))));
  $$('.delete-btn', categoriesGrid).forEach(btn => btn.addEventListener('click', () => deleteCategory(parseInt(btn.dataset.cat))));
}

// ============================================
// RENDER: Reports
// ============================================

function renderReports() {
  const concludedSales = sales.filter(s => s.status === 'Concluído');
  const totalRevenue = concludedSales.reduce((sum, s) => sum + s.total, 0);
  const totalSalesCount = concludedSales.length;

  // ── Top sellers — count actual item occurrences in concluded sales ──
  const productSoldCount = {};
  for (const s of concludedSales) {
    if (s.items) {
      for (const item of s.items) {
        productSoldCount[item.name] = (productSoldCount[item.name] || 0) + item.qty;
      }
    }
  }
  const topSellers = [...products]
    .map(p => ({ ...p, sold: productSoldCount[p.name] || 0 }))
    .sort((a, b) => b.sold - a.sold)
    .slice(0, 5);

  if (topSellersList) {
    topSellersList.innerHTML = topSellers.map((p, i) => `
      <li>
        <div class="ranking-item-info">
          <span class="ranking-item-name">${p.name}</span>
          <span class="ranking-item-detail">${p.sold} unidades vendidas • ${formatCurrency(p.salePrice)}</span>
        </div>
        <span class="ranking-item-value">${formatCurrency(p.sold * p.salePrice)}</span>
      </li>
    `).join('');
  }

  // ── Slow movers — products with stock > 0 that were never sold ──
  const soldNames = new Set();
  for (const s of concludedSales) {
    if (s.items) for (const item of s.items) soldNames.add(item.name);
  }
  const slowMovers = products
    .filter(p => p.quantity > 0 && !soldNames.has(p.name))
    .sort((a, b) => b.quantity - a.quantity)
    .slice(0, 5);

  if (slowMoversList) {
    if (slowMovers.length === 0) {
      slowMoversList.innerHTML = '<div style="text-align:center;padding:16px;color:var(--text-muted);font-size:0.85rem;"><i class="fa-solid fa-circle-check" style="color:var(--green);margin-right:6px;"></i>Nenhum produto parado no estoque</div>';
    } else {
      slowMoversList.innerHTML = slowMovers.map(p => `
        <li>
          <div class="ranking-item-info">
            <span class="ranking-item-name">${p.name}</span>
            <span class="ranking-item-detail">Estoque: ${p.quantity} unidades • ${formatCurrency(p.salePrice)}</span>
          </div>
          <span class="ranking-item-value" style="color:var(--yellow);">${p.quantity} un.</span>
        </li>
      `).join('');
    }
  }

  // ── Forecast ──
  const avgMonthly = totalRevenue / 2;
  const forecast = avgMonthly * 2;
  const forecastMin = forecast * 0.85;
  const forecastMax = forecast * 1.25;

  const forecastVal = document.getElementById('forecastValue');
  const forecastMinEl = document.getElementById('forecastMin');
  const forecastMaxEl = document.getElementById('forecastMax');
  const forecastBar = document.getElementById('forecastBarFill');

  if (forecastVal) forecastVal.textContent = formatCurrency(forecast);
  if (forecastMinEl) forecastMinEl.textContent = formatCurrency(forecastMin);
  if (forecastMaxEl) forecastMaxEl.textContent = formatCurrency(forecastMax);
  if (forecastBar) {
    const pct = Math.min(100, Math.max(10, (forecast / 50000) * 100));
    forecastBar.style.width = `${pct}%`;
  }

  // ── Summary Grid (real data) ──
  const summaryGrid = document.getElementById('summaryGrid');
  if (summaryGrid) {
    const totalCost = concludedSales.reduce((sum, s) => sum + s.total * 0.45, 0);
    const margin = totalRevenue > 0 ? ((totalRevenue - totalCost) / totalRevenue * 100) : 0;
    const avgTicket = totalSalesCount > 0 ? totalRevenue / totalSalesCount : 0;
    const totalPieces = concludedSales.reduce((sum, s) => sum + (s.items ? s.items.reduce((a, i) => a + i.qty, 0) : 0), 0);
    const uniqueDays = new Set(concludedSales.map(s => s.date.split(' ')[0])).size;

    summaryGrid.innerHTML = `
      <div class="summary-item">
        <span class="summary-label">Receita total</span>
        <span class="summary-value" style="color:var(--green);font-size:1.3rem;">${formatCurrency(totalRevenue)}</span>
      </div>
      <div class="summary-item">
        <span class="summary-label">Ticket médio</span>
        <span class="summary-value">${formatCurrency(avgTicket)}</span>
      </div>
      <div class="summary-item">
        <span class="summary-label">Peças vendidas</span>
        <span class="summary-value">${totalPieces}</span>
      </div>
      <div class="summary-item">
        <span class="summary-label">Margem estimada</span>
        <span class="summary-value" style="color:var(--green);">${margin.toFixed(1)}%</span>
      </div>
      <div class="summary-item">
        <span class="summary-label">Vendas realizadas</span>
        <span class="summary-value">${totalSalesCount}</span>
      </div>
      <div class="summary-item">
        <span class="summary-label">Dias com venda</span>
        <span class="summary-value">${uniqueDays}</span>
      </div>
    `;
  }

  // ── Category Performance ──
  renderCategoryPerformance(concludedSales);

  // ── Payment Methods ──
  renderPaymentMethods(concludedSales);

  // ── Inventory Overview ──
  renderInventoryOverview();

  renderAIPromotions();
}

function renderCategoryPerformance(concludedSales) {
  const container = document.getElementById('categoryPerformanceBody');
  if (!container) return;

  const catRevenue = {};
  for (const s of concludedSales) {
    if (s.items) {
      for (const item of s.items) {
        const prod = products.find(p => p.name === item.name);
        const cat = prod ? prod.category : 'Outros';
        catRevenue[cat] = (catRevenue[cat] || 0) + (item.qty * (prod ? prod.salePrice : 0));
      }
    }
  }

  const entries = Object.entries(catRevenue).sort((a, b) => b[1] - a[1]);
  const maxVal = entries.length > 0 ? entries[0][1] : 1;

  if (entries.length === 0) {
    container.innerHTML = '<div style="text-align:center;padding:16px;color:var(--text-muted);font-size:0.85rem;">Nenhum dado de venda disponível</div>';
    return;
  }

  container.innerHTML = entries.map(([cat, rev]) => {
    const pct = (rev / maxVal) * 100;
    const catColors = { 'Camisetas':'#6366F1', 'Calças':'#22C55E', 'Vestidos':'#EAB308', 'Calçados':'#EF4444', 'Jaquetas':'#8B5CF6', 'Acessórios':'#06B6D4' };
    const color = catColors[cat] || '#6366F1';
    return `
      <div class="category-bar-item">
        <span class="category-bar-name">${cat}</span>
        <div class="category-bar-track">
          <div class="category-bar-fill" style="width:${pct}%;background:${color};"></div>
        </div>
        <span class="category-bar-value">${formatCurrency(rev)}</span>
      </div>
    `;
  }).join('');
}

function renderPaymentMethods(concludedSales) {
  const container = document.getElementById('paymentMethodsBody');
  if (!container) return;

  const methodCount = {};
  const methodRevenue = {};
  for (const s of concludedSales) {
    const m = s.payment || 'Outro';
    methodCount[m] = (methodCount[m] || 0) + 1;
    methodRevenue[m] = (methodRevenue[m] || 0) + s.total;
  }

  const entries = Object.entries(methodRevenue).sort((a, b) => b[1] - a[1]);
  const icons = { 'Pix':'fa-pix', 'Cartão de Crédito':'fa-credit-card', 'Cartão de Débito':'fa-debit-card', 'Boleto':'fa-barcode', 'Dinheiro':'fa-money-bill' };
  const iconColors = { 'Pix':'#22C55E', 'Cartão de Crédito':'#6366F1', 'Cartão de Débito':'#EAB308', 'Boleto':'#EF4444', 'Dinheiro':'#06B6D4' };

  if (entries.length === 0) {
    container.innerHTML = '<div style="text-align:center;padding:16px;color:var(--text-muted);font-size:0.85rem;">Nenhuma venda concluída</div>';
    return;
  }

  container.innerHTML = entries.map(([method, rev]) => `
    <div class="payment-method-item">
      <div class="payment-method-icon" style="background:${(iconColors[method] || '#6366F1')}22;color:${iconColors[method] || '#6366F1'};">
        <i class="fa-solid ${icons[method] || 'fa-credit-card'}"></i>
      </div>
      <div class="payment-method-info">
        <span class="payment-method-name">${method}</span>
        <span class="payment-method-count">${methodCount[method]} transações</span>
      </div>
      <span class="payment-method-value">${formatCurrency(rev)}</span>
    </div>
  `).join('');
}

function renderInventoryOverview() {
  const grid = document.getElementById('inventorySummaryGrid');
  if (!grid) return;

  const totalItems = products.reduce((s, p) => s + p.quantity, 0);
  const totalValue = products.reduce((s, p) => s + p.salePrice * p.quantity, 0);
  const totalCost = products.reduce((s, p) => s + p.costPrice * p.quantity, 0);
  const potentialProfit = totalValue - totalCost;
  const avgMargin = totalCost > 0 ? ((totalValue - totalCost) / totalCost * 100) : 0;
  const lowStockCount = products.filter(p => p.quantity > 0 && p.quantity < 10).length;
  const outOfStock = products.filter(p => p.quantity === 0).length;
  const productCount = products.length;

  grid.innerHTML = `
    <div class="summary-item">
      <span class="summary-label">Total em estoque</span>
      <span class="summary-value">${totalItems} un.</span>
    </div>
    <div class="summary-item">
      <span class="summary-label">Valor em estoque</span>
      <span class="summary-value" style="color:var(--green);font-size:1.3rem;">${formatCurrency(totalValue)}</span>
    </div>
    <div class="summary-item">
      <span class="summary-label">Custo total</span>
      <span class="summary-value" style="font-size:1rem;">${formatCurrency(totalCost)}</span>
    </div>
    <div class="summary-item">
      <span class="summary-label">Lucro potencial</span>
      <span class="summary-value" style="color:var(--green);">${formatCurrency(potentialProfit)}</span>
    </div>
    <div class="summary-item">
      <span class="summary-label">Margem média</span>
      <span class="summary-value" style="color:var(--violet);">${avgMargin.toFixed(1)}%</span>
    </div>
    <div class="summary-item">
      <span class="summary-label">Estoque baixo (&lt;10)</span>
      <span class="summary-value" style="color:${lowStockCount > 0 ? 'var(--yellow)' : 'var(--green)'};">${lowStockCount}</span>
    </div>
    <div class="summary-item">
      <span class="summary-label">Fora de estoque</span>
      <span class="summary-value" style="color:${outOfStock > 0 ? 'var(--red)' : 'var(--green)'};">${outOfStock}</span>
    </div>
    <div class="summary-item">
      <span class="summary-label">Produtos cadastrados</span>
      <span class="summary-value">${productCount}</span>
    </div>
  `;
}

// ============================================
// AI PROMOTIONS — Sugestões Inteligentes (offline)
// ============================================

const PROMO_TYPES = [
  { type: 'Liquidação Relâmpago', discount: [25, 40], desc: (p, d) => d + '% OFF por tempo limitado — queima de estoque acelerada' },
  { type: 'Combo Leve 2 Pague 1', discount: [50, 50], desc: () => 'Leve 2 unidades e pague apenas 1 — estoque sairá em dobro' },
  { type: 'Desconto Progressivo', discount: [10, 30], desc: (p, d) => 'Compre 3+ peças e ganhe até ' + d + '% de desconto nesta peça' },
  { type: 'Kit Promocional', discount: [20, 35], desc: (p, d) => 'Monte um kit com ' + p.name + ' + outro item e ganhe ' + d + '% OFF no total' },
  { type: 'Leve 3 com 40% OFF', discount: [40, 40], desc: () => 'Na compra de 3 unidades, 40% de desconto — ideal para revendedores' },
  { type: 'Frete Grátis + Brinde', discount: [5, 15], desc: (p, d) => d + '% OFF + frete grátis nas compras acima de R$ 150' }
];

let lastPromoSeeds = [];

function analyzeSlowMovingProducts() {
  const candidates = products.filter(p => p.quantity > 15).map(p => ({
    ...p, daysWithoutSale: Math.round(10 + (p.quantity / 50) * 40 + Math.random() * 10),
    velocity: Math.max(1, Math.round((50 - p.quantity) / 5))
  })).sort((a, b) => b.quantity - a.quantity);
  return candidates;
}

function generatePromotions() {
  const candidates = analyzeSlowMovingProducts();
  if (candidates.length === 0) return [];

  const selected = candidates.slice(0, 4);
  const shuffledTypes = [...PROMO_TYPES].sort(() => Math.random() - 0.5);

  return selected.map((p, i) => {
    const promo = shuffledTypes[i % shuffledTypes.length];
    const discountRange = promo.discount;
    const discount = discountRange[0] + Math.floor(Math.random() * (discountRange[1] - discountRange[0] + 1));
    const discountedPrice = p.salePrice * (1 - discount / 100);
    const potentialRevenue = discountedPrice * Math.min(p.quantity, 20);
    const sellThrough = Math.min(100, Math.round((p.quantity / 60) * 100));

    return {
      productName: p.name,
      productIcon: p.icon,
      category: p.category,
      currentStock: p.quantity,
      salePrice: p.salePrice,
      daysWithoutSale: p.daysWithoutSale,
      promoType: promo.type,
      discount,
      description: promo.desc(p, discount),
      discountedPrice,
      potentialRevenue,
      sellThrough,
      id: Date.now() + i
    };
  });
}

function renderAIPromotions() {
  const grid = document.getElementById('aiPromoGrid');
  if (!grid) return;

  const promotions = generatePromotions();

  if (promotions.length === 0) {
    grid.innerHTML = "<div class='ai-promo-empty'>"
      + "<i class='fa-solid fa-wand-magic-sparkles'></i>"
      + "<p>Nenhum produto com excesso de estoque no momento</p>"
      + "<span style='font-size:0.8rem;'>Todos os produtos estão com níveis saudáveis de estoque</span>"
      + "</div>";
    return;
  }

  grid.innerHTML = promotions.map(p => `
    <div class="ai-promo-item">
      <div class="ai-promo-item-header">
        <div class="ai-promo-item-icon"><i class="${p.productIcon}"></i></div>
        <div class="ai-promo-item-name">${p.productName}</div>
      </div>
      <div class="ai-promo-item-stock">
        <i class="fa-solid fa-box"></i> ${p.currentStock} em estoque ·
        <i class="fa-regular fa-clock"></i> <strong>${p.daysWithoutSale}</strong>
      </div>
      <div class="ai-promo-item-suggestion">
        <span class="promo-type"><i class="fa-solid fa-lightbulb"></i> ${p.promoType}</span>
        <span class="promo-desc">${p.description}</span>
        <span style="font-size:0.85rem;font-weight:700;color:#EC4899;margin-top:4px;">
          ${p.discount}% OFF · De ${formatCurrency(p.salePrice)} por ${formatCurrency(p.discountedPrice)}
        </span>
      </div>
      <div class="ai-promo-item-impact">
        <span class="impact-label"><i class="fa-solid fa-chart-line"></i> Potencial de giro</span>
        <span class="impact-value">~${p.sellThrough}% do estoque · ${formatCurrency(p.potentialRevenue)}</span>
      </div>
    </div>
  `).join('');
}

// ============================================
// RENDER: Users (Settings)
// ============================================

function renderUsers() {
  if (!usersList) return;
  const perm = currentUser ? PERMISSIONS[currentUser.roleClass] || PERMISSIONS.editor : PERMISSIONS.editor;
  const canEdit = perm.users.edit;
  const canDelete = perm.users.delete;
  usersList.innerHTML = users.map((u, idx) => {
    const btns = [];
    if (canEdit) btns.push(`<button class="action-btn view-btn" title="Editar" data-user="${idx}" data-edit><i class="fa-solid fa-pen"></i></button>`);
    if (canEdit) btns.push(`<button class="action-btn ${u.active ? 'delete-btn' : 'edit-btn'}" title="${u.active ? 'Desativar' : 'Ativar'}" data-user="${idx}" data-toggle-active><i class="fa-solid ${u.active ? 'fa-ban' : 'fa-check'}"></i></button>`);
    if (canDelete) btns.push(`<button class="action-btn delete-btn" title="Excluir" data-user="${idx}" data-delete-user><i class="fa-solid fa-trash-can"></i></button>`);
    return `<div class="user-card" style="opacity:${u.active ? 1 : 0.5};">
      <div class="user-card-avatar" style="background:${u.color};color:white;">${u.avatar}</div>
      <div class="user-card-info">
        <div class="user-card-name">${u.name} ${!u.active ? '<span style="color:var(--red);font-size:0.75rem;font-weight:500;">(Inativo)</span>' : ''}</div>
        <div class="user-card-email">${u.email}</div>
      </div>
      <span class="user-card-role ${u.roleClass}">${u.role}</span>
      <div class="action-btns" style="gap:6px;">
        ${btns.join('')}
      </div>
    </div>`;
  }).join('');

  if (canEdit) {
    $$('[data-edit]', usersList).forEach(btn => btn.addEventListener('click', () => openUserModal(parseInt(btn.dataset.user))));
    $$('[data-toggle-active]', usersList).forEach(btn => btn.addEventListener('click', () => toggleUserActive(parseInt(btn.dataset.user))));
  }
  if (canDelete) {
    $$('[data-delete-user]', usersList).forEach(btn => btn.addEventListener('click', () => deleteUser(parseInt(btn.dataset.user))));
  }
}

function resetUserPassword(idx) {
  const u = users[idx];
  if (!u) return;
  const newPw = prompt(`Nova senha para "${u.name}":`);
  if (!newPw || newPw.length < 4) { showToast('A senha deve ter no mínimo 4 caracteres.', 'warning'); return; }
  if (!u._id) { showToast('Usuário não encontrado no banco.', 'error'); return; }
  updateAppUser(u._id, { password: newPw, name: u.name, email: u.email, role: u.role, role_class: u.roleClass, active: u.active })
    .then(() => showToast(`Senha de "${u.name}" redefinida com sucesso!`, 'success'))
    .catch(e => showToast('Erro: ' + e.message, 'error'));
}

function toggleUserActive(idx) {
  const u = users[idx];
  if (!u) return;
  if (u.name === 'Vitor Marques' && u.active) {
    alert('Não é possível desativar o administrador principal.');
    return;
  }
  u.active = !u.active;
  if (u._id) {
    updateAppUser(u._id, { name: u.name, email: u.email, role: u.role, role_class: u.roleClass, active: u.active })
      .catch(console.warn);
  }
  renderUsers();
}

function deleteUser(idx) {
  const u = users[idx];
  if (!u) return;
  if (u.name === 'Vitor Marques' && currentUser && currentUser.name === 'Vitor Marques') {
    alert('Não é possível excluir o administrador principal.');
    return;
  }
  if (!confirm(`Tem certeza que deseja excluir "${u.name}"? Esta ação não pode ser desfeita.`)) return;
  if (!u._id) { showToast('Usuário não encontrado no banco.', 'error'); return; }
  deleteAppUser(u._id)
    .then(() => {
      users.splice(idx, 1);
      renderUsers();
      showToast(`Usuário "${u.name}" excluído com sucesso!`, 'success');
    })
    .catch(e => showToast('Erro ao excluir: ' + e.message, 'error'));
}

function openUserModal(idx) {
  editUserIndex.value = idx !== undefined ? idx : '-1';
  userModalTitle.textContent = idx !== undefined ? 'Editar Usuário' : 'Criar Usuário';
  userModalSaveText.textContent = idx !== undefined ? 'Atualizar' : 'Salvar';

  // Filter role options based on current user's permissions
  const perm = PERMISSIONS[currentUser.roleClass] || PERMISSIONS.editor;
  const allowedRoles = perm.users.createRoles || [];
  const allOptions = uRole.querySelectorAll('option');
  allOptions.forEach(opt => {
    opt.style.display = allowedRoles.includes(opt.value) ? '' : 'none';
  });

  if (idx !== undefined && users[idx]) {
    uName.value = users[idx].name;
    uEmail.value = users[idx].email;
    uPassword.value = '';
    uPassword.placeholder = 'Deixe em branco para manter';
    uPassword.required = false;
    uRole.value = users[idx].role;
  } else {
    uName.value = '';
    uEmail.value = '';
    uPassword.value = '';
    uPassword.placeholder = '••••••••';
    uPassword.required = true;
    // Set first visible option as default
    const firstVisible = Array.from(uRole.options).find(o => o.style.display !== 'none');
    uRole.value = firstVisible ? firstVisible.value : 'Vendedor';
  }

  userModalOverlay.classList.add('open');
}

function closeUserModal() {
  userModalOverlay.classList.remove('open');
  editUserIndex.value = '-1';
  uName.value = '';
  uEmail.value = '';
  uPassword.value = '';
  uPassword.placeholder = '••••••••';
  uPassword.required = true;
  uRole.value = 'Vendedor';
}

function saveUser(e) {
  e.preventDefault();
  const name = uName.value.trim();
  const email = uEmail.value.trim();
  const password = uPassword.value;
  const role = uRole.value;

  if (!name || !email) { showToast('Preencha nome e e-mail.', 'warning'); return; }

  const idx = parseInt(editUserIndex.value);
  const roleClass = role === 'Administrador' ? 'admin' : role === 'Gestor' ? 'manager' : role === 'Vendedor' || role === 'Vendedora' ? 'editor' : 'viewer';
  const initials = name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
  const colors = ['#6366F1', '#22C55E', '#EAB308', '#EF4444', '#8B5CF6', '#06B6D4', '#EC4899', '#F97316'];

  if (idx >= 0 && users[idx]) {
    const u = users[idx];
    u.name = name;
    u.email = email;
    u.role = role;
    u.roleClass = roleClass;
    u.initials = initials;

    if (u._id) {
      updateAppUser(u._id, { name, email, password: password || undefined, role, role_class: roleClass, active: u.active })
        .then(() => showToast('Usuário atualizado!', 'success'))
        .catch(e => showToast('Erro ao atualizar: ' + e.message, 'error'));
    }
  } else {
    if (!password) { showToast('Defina uma senha para o novo usuário.', 'warning'); return; }
    if (users.find(u => u.email === email)) { showToast('Já existe um usuário com este e-mail.', 'error'); return; }
    const color = colors[users.length % colors.length];

    createAppUser({ name, email, password, role, role_class: roleClass, initials, color })
      .then(newUser => {
        users.push({
          _id: newUser.id, name, email, role, roleClass,
          initials, avatar: initials, color, active: true
        });
        renderUsers();
        showToast(`Usuário "${name}" criado com sucesso!`, 'success');
      })
      .catch(e => showToast('Erro ao criar: ' + e.message, 'error'));
  }

  closeUserModal();
  renderUsers();
}

// ============================================
// POS — Balcão de Vendas
// ============================================

let posCart = [];
let posOrderCounter = 4822;

const posSearch = $('#posSearch');
const posCategoryFilter = $('#posCategoryFilter');
const posProductGrid = $('#posProductGrid');
const cartBody = $('#cartBody');
const cartCount = $('#cartCount');
const cartItemsCount = $('#cartItemsCount');
const cartSubtotal = $('#cartSubtotal');
const cartTotal = $('#cartTotal');
const clearCartBtn = $('#clearCartBtn');
const checkoutBtn = $('#checkoutBtn');
const posPaymentMethod = $('#posPaymentMethod');

function renderPOSProducts() {
  const query = (posSearch ? posSearch.value : '').toLowerCase();
  const cat = posCategoryFilter ? posCategoryFilter.value : '';

  // Populate filter
  if (posCategoryFilter && !posCategoryFilter.dataset.populated) {
    posCategoryFilter.dataset.populated = 'true';
    const cats = [...new Set(products.map(p => p.category))];
    cats.forEach(c => {
      const opt = document.createElement('option');
      opt.value = c; opt.textContent = c;
      posCategoryFilter.appendChild(opt);
    });
  }

  let filtered = products.filter(p => {
    if (p.quantity <= 0) return false;
    const matchName = p.name.toLowerCase().includes(query) || p.sku.toLowerCase().includes(query);
    const matchCat = !cat || p.category === cat;
    return matchName && matchCat;
  });

  if (!posProductGrid) return;

  if (filtered.length === 0) {
    posProductGrid.innerHTML = `<div style="grid-column:1/-1;text-align:center;padding:40px;color:var(--text-muted);">
      <i class="fa-solid fa-box-open" style="font-size:2rem;display:block;margin-bottom:8px;"></i>
      Nenhum produto disponível</div>`;
    return;
  }

  posProductGrid.innerHTML = filtered.map((p, idx) => {
    const realIdx = products.indexOf(p);
    const stockClass = p.quantity <= 5 ? 'low' : 'ok';
    return `<div class="pos-product-item" data-index="${realIdx}">
      <div class="pos-product-icon"><i class="${p.icon}"></i></div>
      <div class="pos-product-name">${p.name}</div>
      <div class="pos-product-sku">${p.sku}</div>
      <div class="pos-product-price">${formatCurrency(p.salePrice)}</div>
      <div class="pos-product-stock ${stockClass}">${p.quantity} em estoque</div>
    </div>`;
  }).join('');

  $$('.pos-product-item', posProductGrid).forEach(el => {
    el.addEventListener('click', () => addToCart(parseInt(el.dataset.index)));
  });
}

function addToCart(idx) {
  const p = products[idx];
  if (!p || p.quantity <= 0) return;

  const existing = posCart.find(c => c.productIndex === idx);
  if (existing) {
    if (existing.qty >= p.quantity) {
      alert('Estoque insuficiente para este produto.');
      return;
    }
    existing.qty++;
  } else {
    posCart.push({ productIndex: idx, qty: 1 });
  }

  updateCartUI();
}

function removeFromCart(idx) {
  posCart.splice(idx, 1);
  updateCartUI();
}

function changeCartQty(idx, delta) {
  const item = posCart[idx];
  if (!item) return;
  const p = products[item.productIndex];
  const newQty = item.qty + delta;
  if (newQty <= 0) {
    removeFromCart(idx);
    return;
  }
  if (newQty > p.quantity) {
    alert('Estoque insuficiente.');
    return;
  }
  item.qty = newQty;
  updateCartUI();
}

// Compute per-item discounts from all applied coupons
function getItemDiscounts(cartItems) {
  const discounts = cartItems.map(() => []);
  const itemHasDiscount = cartItems.map(() => false);

  // Process category-restricted coupons first, then general ones
  const orderedCoupons = [
    ...appliedCoupons.filter(c => c.category_restriction),
    ...appliedCoupons.filter(c => !c.category_restriction)
  ];

  orderedCoupons.forEach(coupon => {
    // Calculate total qualifying units in cart for this coupon
    const totalQualifyingUnits = cartItems.reduce((sum, item) => {
      const p = products[item.productIndex];
      if (!p) return sum;
      if (!matchesCategory(coupon.category_restriction, p.category)) return sum;
      return sum + item.qty;
    }, 0);

    // Budget = full batches of min_quantity (e.g. min=2, 5 units → budget=4)
    let budget = coupon.min_quantity > 0
      ? Math.floor(totalQualifyingUnits / coupon.min_quantity) * coupon.min_quantity
      : Infinity;

    cartItems.forEach((item, idx) => {
      if (budget <= 0) return;
      const p = products[item.productIndex];
      if (!p) return;
      // Item já tem desconto de outro cupom? pula
      if (itemHasDiscount[idx]) return;
      // Verifica restrição de categoria
      if (coupon.category_restriction && p.category !== coupon.category_restriction) return;

      let itemDiscount = 0;

      if (coupon.discount_type === 'percentage') {
        // Desconta apenas até o budget em unidades
        const qtyToDiscount = Math.min(item.qty, budget);
        itemDiscount = p.salePrice * qtyToDiscount * (coupon.discount_value / 100);
        budget -= qtyToDiscount;
      } else {
        // Cupom de valor fixo: cada batch completo = 1 coupon.discount_value
        if (coupon.min_quantity > 0) {
          // Desconta proporcional dentro do budget de unidades
          const qtyToDiscount = Math.min(item.qty, budget);
          const batchRatio = budget > 0 ? qtyToDiscount / budget : 0;
          const batchCount = budget / coupon.min_quantity;
          itemDiscount = coupon.discount_value * batchCount * batchRatio;
          budget -= qtyToDiscount;
        } else {
          // Sem min_quantity: distribui proporcional entre todos qualificados
          const totalQualifying = cartItems.reduce((s, it, i) => {
            const pr = products[it.productIndex];
            if (!pr || itemHasDiscount[i]) return s;
            if (coupon.category_restriction && pr.category !== coupon.category_restriction) return s;
            return s + pr.salePrice * it.qty;
          }, 0);
          const ratio = totalQualifying > 0 ? (p.salePrice * item.qty) / totalQualifying : 0;
          itemDiscount = coupon.discount_value * ratio;
        }
      }

      if (itemDiscount > 0) {
        discounts[idx].push({ code: coupon.code, amount: itemDiscount, coupon });
        itemHasDiscount[idx] = true;
      }
    });
  });

  return discounts;
}

function updateCartUI() {
  if (!cartBody) return;

  if (posCart.length === 0) {
    cartBody.innerHTML = `<div class="pos-cart-empty">
      <i class="fa-solid fa-bag-shopping"></i>
      <p>Carrinho vazio</p>
      <span>Clique nos produtos ao lado para adicionar</span>
    </div>`;
    cartCount.textContent = '0';
    cartItemsCount.textContent = '0';
    cartSubtotal.textContent = 'R$ 0,00';
    cartTotal.textContent = 'R$ 0,00';
    if (clearCartBtn) clearCartBtn.disabled = true;
    if (checkoutBtn) checkoutBtn.disabled = true;
    return;
  }

  // Re-validate all applied coupons — remove invalid ones silently
  const stillValid = [];
  appliedCoupons.forEach(c => {
    const v = validateCoupon(c, posCart);
    if (!v.valid) {
      showToast('Cupom "' + c.code + '" removido: ' + v.reason, 'warning');
      return;
    }
    // Check category overlap with already-kept coupons
    const catOverlap = stillValid.some(k => categoryOverlap(c.category_restriction, k.category_restriction));
    if (catOverlap) {
      showToast('Cupom "' + c.code + '" removido: sobreposição de categorias.', 'warning');
      return;
    }
    stillValid.push(c);
  });

  // Second pass: global coupon não pode coexistir com cupons de categoria
  const hasGlobal = stillValid.some(c => !c.category_restriction);
  const hasCategory = stillValid.some(c => c.category_restriction);
  if (hasGlobal && hasCategory) {
    // Remove o global — os de categoria foram adicionados individualmente, são mais intencionais
    const globalIdx = stillValid.findIndex(c => !c.category_restriction);
    if (globalIdx >= 0) {
      const code = stillValid[globalIdx].code;
      stillValid.splice(globalIdx, 1);
      showToast('Cupom global "' + code + '" removido: conflito com cupons de categoria.', 'warning');
    }
  }
  appliedCoupons = stillValid;
  renderAppliedCoupons();

  let totalItems = 0;
  let totalValue = 0;

  const itemDiscounts = getItemDiscounts(posCart);

  cartBody.innerHTML = posCart.map((item, cartIdx) => {
    const p = products[item.productIndex];
    if (!p) return '';
    const lineTotal = p.salePrice * item.qty;
    totalItems += item.qty;
    totalValue += lineTotal;

    const dLabels = itemDiscounts[cartIdx].filter(d => d.amount > 0);
    const discountHtml = dLabels.length > 0
      ? `<div class="cart-item-discount">${dLabels.map(d => `${d.code}: -${formatCurrency(d.amount)}`).join(', ')}</div>`
      : '';

    return `<div class="pos-cart-item">
      <div class="cart-item-info">
        <div class="cart-item-name">${p.name}</div>
        <div class="cart-item-price">${formatCurrency(p.salePrice)} cada</div>
        ${discountHtml}
      </div>
      <div class="cart-item-qty">
        <button class="cart-qty-minus" data-cart="${cartIdx}"><i class="fa-solid fa-minus"></i></button>
        <span>${item.qty}</span>
        <button class="cart-qty-plus" data-cart="${cartIdx}"><i class="fa-solid fa-plus"></i></button>
      </div>
      <div class="cart-item-total">${formatCurrency(lineTotal)}</div>
      <div class="cart-item-remove" data-cart="${cartIdx}"><i class="fa-solid fa-xmark"></i></div>
    </div>`;
  }).join('');

  cartCount.textContent = posCart.length;
  cartItemsCount.textContent = totalItems;
  cartSubtotal.textContent = formatCurrency(totalValue);

  // Refresh coupon select options whenever cart changes
  renderCouponSelect();

  // Remove old discount rows
  const summaryEl = document.querySelector('.pos-cart-summary');
  if (summaryEl) {
    summaryEl.querySelectorAll('.pos-coupon-discount-row').forEach(el => el.remove());
  }

  // Apply all coupon discounts and show rows — aggregate from per-item discounts
  let totalDiscount = 0;
  const couponTotals = {};
  itemDiscounts.forEach(itemDiscs => {
    itemDiscs.forEach(d => {
      couponTotals[d.code] = (couponTotals[d.code] || 0) + d.amount;
    });
  });
  appliedCoupons.forEach(coupon => {
    const d = couponTotals[coupon.code] || 0;
    totalDiscount += d;
    if (d > 0 && summaryEl) {
      const row = document.createElement('div');
      row.className = 'pos-cart-row pos-coupon-discount-row';
      row.innerHTML = `<span>Desconto (${coupon.code})</span><span>-${formatCurrency(d)}</span>`;
      summaryEl.insertBefore(row, summaryEl.querySelector('.pos-cart-total'));
    }
  });

  const finalTotal = Math.max(0, totalValue - totalDiscount);
  cartTotal.textContent = formatCurrency(finalTotal);

  if (clearCartBtn) clearCartBtn.disabled = false;
  if (checkoutBtn) checkoutBtn.disabled = false;

  // Event listeners
  $$('.cart-qty-minus', cartBody).forEach(btn => btn.addEventListener('click', () => changeCartQty(parseInt(btn.dataset.cart), -1)));
  $$('.cart-qty-plus', cartBody).forEach(btn => btn.addEventListener('click', () => changeCartQty(parseInt(btn.dataset.cart), 1)));
  $$('.cart-item-remove', cartBody).forEach(btn => btn.addEventListener('click', () => removeFromCart(parseInt(btn.dataset.cart))));
}

function clearCart() {
  if (posCart.length === 0) return;
  if (!confirm('Limpar o carrinho?')) return;
  posCart = [];
  appliedCoupons = [];
  renderAppliedCoupons();
  updateCartUI();
}

function finalizeSale() {
  if (posCart.length === 0) return;
  const payment = posPaymentMethod ? posPaymentMethod.value : 'Pix';

  // Pick first available seller
  const activeUsers = users.filter(u => u.active && u.role !== 'Estoquista');
  const seller = activeUsers.length > 0 ? activeUsers[0].name : 'Vendedor';

  // Build items
  const items = posCart.map(item => {
    const p = products[item.productIndex];
    return { name: p.name, qty: item.qty };
  });

  // Calc total (with multiple coupon discounts)
  const subtotal = posCart.reduce((sum, item) => {
    const p = products[item.productIndex];
    return sum + (p ? p.salePrice * item.qty : 0);
  }, 0);
  let totalDiscount = 0;
  const finalDiscounts = getItemDiscounts(posCart);
  finalDiscounts.forEach(discs => {
    discs.forEach(d => { totalDiscount += d.amount; });
  });
  const total = Math.max(0, subtotal - totalDiscount);

  // Deduct stock
  posCart.forEach(item => {
    const p = products[item.productIndex];
    if (p) p.quantity = Math.max(0, p.quantity - item.qty);
  });

  // Create sale record
  const now = new Date();
  const dateStr = now.toLocaleDateString('pt-BR') + ' ' + now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  const orderNum = `PDV-${posOrderCounter++}`;

  const saleObj = {
    order: orderNum, date: dateStr, seller,
    items: items.map(i => ({ name: i.name, qty: i.qty })),
    total, payment, status: 'Concluído'
  };

  sales.unshift(saleObj);

  // Activity log
  const itemDesc = items.map(i => `${i.qty}x ${i.name}`).join(', ');
  recentActivity.unshift({
    type: 'exit', title: 'Venda Realizada',
    desc: `${orderNum} — ${itemDesc}`,
    time: `Hoje, ${now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`
  });

  // Save snapshot for Supabase persistence before clearing cart
  const cartSnapshot = posCart.map(item => {
    const p = products[item.productIndex];
    return { product_name: p.name, quantity: item.qty, unit_price: p.salePrice, product: p };
  });

  posCart = [];
  updateCartUI();
  renderPOSProducts();

  // Show success
  const totalFmt = formatCurrency(total);
  showToast(`Venda ${orderNum} finalizada — ${totalFmt} (${payment})`, 'success');

  // Track customer spending
  const posCustomerSelect = document.getElementById('posCustomerSelect');
  const customerIdx = posCustomerSelect ? parseInt(posCustomerSelect.value) : -1;
  if (customerIdx >= 0 && customers[customerIdx]) {
    customers[customerIdx].totalSpent += total;
    customers[customerIdx].visits += 1;
    const custId = customers[customerIdx]._id;
    if (custId) {
      updateCustomer(custId, {
        total_spent: customers[customerIdx].totalSpent,
        visits: customers[customerIdx].visits
      }).catch(console.warn);
    }
    renderCustomers();
  }

  // Add to cash flow
  const todayStr = new Date().toLocaleDateString('pt-BR');
  const cfEntry = {
    date: todayStr,
    description: `Venda ${orderNum} - ${payment}`,
    type: 'entrada',
    value: total,
    category: 'Vendas'
  };
  cashFlowTransactions.unshift(cfEntry);
  updateCashFlowKPIs();

  // Persist to backend
  createSale({
    order_number: orderNum,
    date: now.toISOString(),
    seller,
    total,
    payment,
    status: 'Concluído',
    customer_id: customerIdx >= 0 && customers[customerIdx]?._id ? customers[customerIdx]._id : null
  }, cartSnapshot.map(i => ({ product_name: i.product_name, quantity: i.quantity, unit_price: i.unit_price }))).then(data => {
    if (data && data.id) saleObj._id = data.id;
  }).catch(console.warn);

  // Update product stock in Supabase
  cartSnapshot.forEach(item => {
    if (item.product && item.product._id) updateProductStock(item.product._id, item.product.quantity).catch(console.warn);
  });

  // Persist cash flow entry
  createCashFlowTransaction({
    date: todayStr.split('/').reverse().join('-'),
    description: cfEntry.description,
    type: 'entrada',
    value: total,
    category: 'Vendas'
  }).then(data => {
    if (data && data[0]) cfEntry._id = data[0].id;
  }).catch(console.warn);

  // Persist activity
  addActivityDB({
    type: 'exit',
    title: 'Venda Realizada',
    description: `${orderNum} — ${itemDesc}`
  }).catch(console.warn);

  // Refresh related views
  if (document.getElementById('section-sales').classList.contains('active')) {
    applySalesFilters();
    updateSalesKPIs();
  }

  // Track coupon usage
  appliedCoupons.forEach(c => {
    const usedCoupon = coupons.find(cp => cp._id === c._id);
    if (usedCoupon) {
      usedCoupon.used_count = (usedCoupon.used_count || 0) + 1;
      useCoupon(usedCoupon._id).catch(console.warn);
    }
  });
  appliedCoupons = [];
  renderAppliedCoupons();
  renderCouponSelect();
}

// POS event listeners
if (posSearch) posSearch.addEventListener('input', renderPOSProducts);
if (posCategoryFilter) posCategoryFilter.addEventListener('change', renderPOSProducts);
if (clearCartBtn) clearCartBtn.addEventListener('click', clearCart);
if (checkoutBtn) checkoutBtn.addEventListener('click', finalizeSale);

// Clock update
function updatePosClock() {
  const el = document.getElementById('posTime');
  if (el) {
    const now = new Date();
    el.textContent = now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  }
}
setInterval(updatePosClock, 1000);
updatePosClock();

// ============================================
// RENDER: KPIs (Overview)
// ============================================

function updateKPIs() {
  const totalStock = products.reduce((sum, p) => sum + p.quantity, 0);
  const revenue = products.reduce((sum, p) => sum + p.salePrice * Math.max(0, p.quantity), 0);
  const totalSold = products.reduce((sum, p) => sum + Math.max(0, 50 - p.quantity), 0);
  const lowStockAlerts = products.filter(p => p.quantity > 0 && p.quantity <= 10).length;

  document.getElementById('kpiTotalStock').textContent = totalStock;
  document.getElementById('kpiRevenue').textContent = formatCurrency(revenue);
  document.getElementById('kpiSold').textContent = totalSold;
  document.getElementById('kpiAlerts').textContent = lowStockAlerts;
}

// ============================================
// RENDER: Recent Activity
// ============================================

function renderRecent() {
  if (!recentList) return;
  recentList.innerHTML = recentActivity.slice(0, 5).map(a => {
    const iconMap = { entry: 'fa-solid fa-box', exit: 'fa-solid fa-cart-arrow-down', edit: 'fa-solid fa-pen' };
    return `<div class="recent-item">
      <div class="recent-item-icon ${a.type}"><i class="${iconMap[a.type]}"></i></div>
      <div class="recent-item-info"><span class="recent-item-title">${a.title}</span><span class="recent-item-desc">${a.desc}</span></div>
      <span class="recent-item-time">${a.time}</span>
    </div>`;
  }).join('');
}

function addActivity(type, title, desc) {
  const now = new Date();
  const timeStr = now.toLocaleString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  const dayStr = now.toLocaleDateString('pt-BR') === new Date().toLocaleDateString('pt-BR') ? 'Hoje' : 'Ontem';
  recentActivity.unshift({ type, title, desc, time: `${dayStr}, ${timeStr}` });
  // Persist to backend
  addActivityDB({ type, title, description: desc }).catch(console.warn);
  renderRecent();
}

// ============================================
// CRUD: Products
// ============================================

function deleteProduct(index) {
  const p = products[index];
  if (!p || !confirm(`Excluir "${p.name}" permanentemente?`)) return;
  const prodId = p._id;
  products.splice(index, 1);
  if (prodId) deleteProductById(prodId).catch(console.warn);
  addActivity('exit', 'Produto Excluído', `${p.name} (${p.sku}) foi removido do catálogo`);
  fullRefresh();
}

function decrementStock(index) {
  const p = products[index];
  if (!p) return;
  if (p.quantity <= 0) { showToast('Produto já está esgotado.', 'warning'); return; }
  const qty = parseInt(prompt(`Quantas unidades dar baixa em "${p.name}"? (estoque atual: ${p.quantity})`, '1'));
  if (!qty || qty <= 0) return;
  const actual = Math.min(qty, p.quantity);
  p.quantity -= actual;
  if (p._id) updateProductStock(p._id, p.quantity).catch(console.warn);
  addActivity('exit', 'Baixa de Estoque', `${actual}x ${p.name} — saída manual`);
  fullRefresh();
}

function saveProduct(e) {
  e.preventDefault();
  const name = fName.value.trim();
  const sku = fSku.value.trim();
  const category = fCategory.value;
  const sizes = parseSizes(fSizes.value);
  const quantity = parseInt(fQuantity.value) || 0;
  const costPrice = parseBrPrice(fCostPrice.value);
  const salePrice = parseBrPrice(fSalePrice.value);
  const icon = fIcon.value.trim() || 'fa-solid fa-shirt';
  const photo = fPhotoImg.src || '';

  if (!name || !sku || !category) { alert('Preencha todos os campos obrigatórios.'); return; }

  const existingIdx = products.findIndex(p => p.sku === sku);
  const editIdx = parseInt(editIndex.value);

  if (editIdx >= 0) {
    if (existingIdx !== -1 && existingIdx !== editIdx) { alert('Já existe outro produto com este SKU.'); return; }
    products[editIdx] = { ...products[editIdx], name, sku, category, sizes, quantity, costPrice, salePrice, icon, photo };
    addActivity('edit', 'Produto Atualizado', `${name} — dados alterados`);
  } else {
    if (existingIdx !== -1) { alert('Já existe um produto com este SKU.'); return; }
    products.push({ name, sku, category, sizes, quantity, costPrice, salePrice, icon, photo });
    addActivity('entry', 'Produto Cadastrado', `${name} (${sku}) adicionado ao catálogo`);
  }

  closeModal();
  fullRefresh();
}

function openEditModal(index) {
  const p = products[index];
  if (!p) return;
  editIndex.value = index;
  modalTitle.textContent = 'Editar Produto';
  modalSaveText.textContent = 'Atualizar Produto';
  fName.value = p.name;
  fSku.value = p.sku;
  fCategory.value = p.category;
  fSizes.value = p.sizes.join(', ');
  fQuantity.value = p.quantity;
  fCostPrice.value = formatBrCurrency(String(Math.round(p.costPrice * 100)));
  fSalePrice.value = formatBrCurrency(String(Math.round(p.salePrice * 100)));
  fIcon.value = p.icon;
  syncSizesChips();
  if (prodIconPicker) renderIconPicker(prodIconPicker, fIcon, p.icon);
  if (p.photo) {
    fPhotoImg.src = p.photo;
    fPhotoPreview.style.display = 'block';
    setProductMedia('photo');
  } else {
    fPhotoPreview.style.display = 'none';
    setProductMedia('icon');
  }
  openModal();
}

function resetForm() {
  editIndex.value = '-1';
  modalTitle.textContent = 'Cadastrar Novo Produto';
  modalSaveText.textContent = 'Salvar Produto';
  productForm.reset();
  fSizes.value = '';
  syncSizesChips();
  fIcon.value = 'fa-solid fa-shirt';
  if (prodIconPicker) renderIconPicker(prodIconPicker, fIcon, fIcon.value);
  fCostPrice.value = '';
  fSalePrice.value = '';
  fPhotoPreview.style.display = 'none';
  fPhotoImg.src = '';
  fPhoto.value = '';
  setProductMedia('photo');
}

// ============================================
// Media toggle helper
// ============================================
function setProductMedia(mode) {
  const iconSection = document.getElementById('productMediaIcon');
  const photoSection = document.getElementById('productMediaPhoto');
  if (!iconSection || !photoSection) return;
  document.querySelectorAll('.media-toggle-btn').forEach(b => b.classList.toggle('active', b.dataset.media === mode));
  iconSection.style.display = mode === 'icon' ? 'block' : 'none';
  photoSection.style.display = mode === 'photo' ? 'block' : 'none';
}

// ============================================
// MODAL: Product
// ============================================

function openModal() { modalOverlay.classList.add('open'); }
function closeModal() { modalOverlay.classList.remove('open'); resetForm(); }

// ============================================
// MODAL: Category
// ============================================

function openCategoryModal(idx) {
  editCategoryIndex.value = idx !== undefined ? idx : '-1';
  catModalTitle.textContent = idx !== undefined ? 'Editar Categoria' : 'Nova Categoria';
  catModalSaveText.textContent = idx !== undefined ? 'Atualizar' : 'Salvar';

  if (idx !== undefined && categories[idx]) {
    catName.value = categories[idx].name;
    catIcon.value = categories[idx].icon;
  } else {
    catName.value = '';
    catIcon.value = 'fa-solid fa-tag';
  }

  renderIconPicker(catIconPicker, catIcon, catIcon.value);

  catModalOverlay.classList.add('open');
}

function closeCategoryModal() {
  catModalOverlay.classList.remove('open');
  editCategoryIndex.value = '-1';
  catName.value = '';
  catIcon.value = 'fa-solid fa-tag';
}

const CATEGORY_ICONS = [
  { icon: 'fa-solid fa-shirt', label: 'Camisas / Social' },
  { icon: 'fa-solid fa-vest', label: 'Moletons / Blusões' },
  { icon: 'fa-regular fa-sun', label: 'Regatas / Moda Praia' },
  { icon: 'fa-solid fa-vest-patches', label: 'Polos' },
  { icon: 'fa-solid fa-vest-patches', label: 'Croppeds / Tops' },
  { icon: 'fa-regular fa-hand-scissors', label: 'Bermudas / Shorts' },
  { icon: 'fa-solid fa-vest', label: 'Saias' },
  { icon: 'fa-solid fa-heart', label: 'Moda Íntima / Lingerie' },
  { icon: 'fa-regular fa-moon', label: 'Pijamas / Sleepwear' },
  { icon: 'fa-solid fa-shoe-prints', label: 'Tênis / Sneakers' },
  { icon: 'fa-solid fa-socks', label: 'Saltos / Sandálias' },
  { icon: 'fa-brands fa-redhat', label: 'Botas' },
  { icon: 'fa-solid fa-person-running', label: 'Moda Fitness / Esportiva' },
  { icon: 'fa-solid fa-bag-shopping', label: 'Bolsas & Mochilas' },
  { icon: 'fa-brands fa-redhat', label: 'Bonés & Chapéus' },
  { icon: 'fa-solid fa-glasses', label: 'Óculos / Relógios' },
  { icon: 'fa-solid fa-gem', label: 'Jóias / Bijuterias' },
  { icon: 'fa-solid fa-gift', label: 'Kits / Promoções' },
  { icon: 'fa-solid fa-child', label: 'Infantil / Kids' },
  // Extras
  { icon: 'fa-solid fa-fire', label: 'Streetwear' },
  { icon: 'fa-regular fa-snowflake', label: 'Inverno' },
  { icon: 'fa-solid fa-crown', label: 'Premium' },
  { icon: 'fa-solid fa-star', label: 'Destaques' },
  { icon: 'fa-solid fa-tag', label: 'Promocional' },
  { icon: 'fa-solid fa-store', label: 'Loja' },
  { icon: 'fa-solid fa-umbrella-beach', label: 'Verão' },
  { icon: 'fa-solid fa-bell', label: 'Lançamentos' },
  { icon: 'fa-solid fa-couch', label: 'Casa / Íntimo' },
  { icon: 'fa-solid fa-music', label: 'Festa' },
  { icon: 'fa-solid fa-spa', label: 'Bem-estar' }
];

function renderIconPicker(container, targetInput, selectedIcon) {
  if (!container) return;
  container.innerHTML = CATEGORY_ICONS.map(({ icon, label }) => {
    const active = icon === selectedIcon ? ' active' : '';
    return `<div class="icon-picker-item${active}" data-icon="${icon}" title="${label}">
      <i class="${icon}"></i>
    </div>`;
  }).join('');

  container.querySelectorAll('.icon-picker-item').forEach(el => {
    el.addEventListener('click', () => {
      container.querySelectorAll('.icon-picker-item').forEach(i => i.classList.remove('active'));
      el.classList.add('active');
      targetInput.value = el.dataset.icon;
    });
  });
}

function saveCategory(e) {
  e.preventDefault();
  const name = catName.value.trim();
  const icon = catIcon.value.trim() || 'fa-solid fa-tag';
  if (!name) { showToast('Digite o nome da categoria.', 'warning'); return; }

  const idx = parseInt(editCategoryIndex.value);
  if (idx >= 0 && categories[idx]) {
    categories[idx] = { ...categories[idx], name, icon };
    const catId = categories[idx]._id;
    if (catId) updateCategory(catId, { name, icon, color: categories[idx].color })
      .catch(e => showToast('Erro ao salvar no banco: ' + e.message, 'error'));
  } else {
    const colors = ['#6366F1', '#22C55E', '#EAB308', '#EF4444', '#8B5CF6', '#06B6D4', '#EC4899', '#F97316'];
    const newCat = { name, icon, color: colors[categories.length % colors.length] };
    categories.push(newCat);
    createCategory({ name, icon, color: newCat.color })
      .then(data => { if (data && data[0]) newCat._id = data[0].id; })
      .catch(console.warn);
  }

  closeCategoryModal();
  renderCategories();
}

function openEditCategory(idx) {
  openCategoryModal(idx);
}

function deleteCategory(idx) {
  const cat = categories[idx];
  if (!cat) return;
  const linked = products.filter(p => p.category === cat.name).length;
  if (linked > 0 && !confirm(`"${cat.name}" possui ${linked} produto(s) vinculado(s). Excluir mesmo assim?`)) return;
  const catId = cat._id;
  categories.splice(idx, 1);
  if (catId) deleteCategoryById(catId).catch(console.warn);
  renderCategories();
}

// ============================================
// FILTER + SEARCH
// ============================================

function filterProducts() {
  const query = inventorySearch.value.toLowerCase().trim();
  const cat = categoryFilter.value;
  const status = statusFilter.value;

  return products.filter(p => {
    if (query && !p.name.toLowerCase().includes(query) && !p.sku.toLowerCase().includes(query) && !p.category.toLowerCase().includes(query)) return false;
    if (cat !== 'all' && p.category !== cat) return false;
    if (status !== 'all' && getStockStatus(p.quantity) !== status) return false;
    return true;
  });
}

function applyFilters() { renderTable(filterProducts()); }

function filterSales() {
  const query = salesSearch.value.toLowerCase().trim();
  const pay = paymentFilter.value;
  const status = salesStatusFilter.value;

  return sales.filter(s => {
    if (query && !s.order.toLowerCase().includes(query) && !s.seller.toLowerCase().includes(query)) return false;
    if (pay !== 'all' && s.payment !== pay) return false;
    if (status !== 'all' && s.status !== status) return false;
    return true;
  });
}

function applySalesFilters() { renderSales(filterSales()); }

// ============================================
// SORTING
// ============================================

let sortField = null;
let sortAsc = true;

function sortProducts(field) {
  if (sortField === field) { sortAsc = !sortAsc; } else { sortField = field; sortAsc = true; }

  products.sort((a, b) => {
    let va = a[field], vb = b[field];
    if (typeof va === 'string') va = va.toLowerCase();
    if (typeof vb === 'string') vb = vb.toLowerCase();
    if (va < vb) return sortAsc ? -1 : 1;
    if (va > vb) return sortAsc ? 1 : -1;
    return 0;
  });

  $$('.sortable i').forEach(icon => {
    icon.className = icon.closest('th').dataset.sort === field
      ? (sortAsc ? 'fa-solid fa-sort-up' : 'fa-solid fa-sort-down')
      : 'fa-solid fa-sort';
  });

  applyFilters();
}

// ============================================
// FULL REFRESH
// ============================================

function fullRefresh() {
  applyFilters();
  updateKPIs();
  refreshCategoryChart();
  renderCategories();
  renderReports();
  renderPOSProducts();
}

// ============================================
// NAVIGATION
// ============================================

function navigateTo(sectionId) {
  navLinks.forEach(l => l.classList.remove('active'));
  const activeLink = $(`[data-section="${sectionId}"]`);
  if (activeLink) activeLink.classList.add('active');

  sections.forEach(s => s.classList.remove('active'));
  const target = $(`#section-${sectionId}`);
  if (target) target.classList.add('active');

  // Refresh charts/section-specific data
  if (sectionId === 'overview') {
    updateKPIs();
    renderRecent();
    setTimeout(initCharts, 50);
  }
  if (sectionId === 'inventory') applyFilters();
  if (sectionId === 'sales') { applySalesFilters(); updateSalesKPIs(); }
  if (sectionId === 'pos') { renderPOSProducts(); }
  if (sectionId === 'sellers') renderSellerRanking();
  if (sectionId === 'categories') renderCategories();
  if (sectionId === 'reports') renderReports();
  if (sectionId === 'settings') { renderUsers(); loadAccountInfo(); loadStoreSettings(); renderCoupons(); }

  applyPermissions();

  sidebar.classList.remove('mobile-open');
  sidebarOverlay.classList.remove('active');
}

// ============================================
// SIDEBAR TOGGLE
// ============================================

function toggleSidebar() { sidebar.classList.toggle('collapsed'); }

// ============================================
// FEATURE 1: THEME TOGGLE
// ============================================

function loadTheme() {
  const saved = localStorage.getItem('stoklytics_theme');
  if (saved === 'light') {
    document.documentElement.setAttribute('data-theme', 'light');
    const icon = document.getElementById('themeIcon');
    if (icon) icon.className = 'fa-solid fa-sun';
  }
}

function toggleTheme() {
  const html = document.documentElement;
  const icon = document.getElementById('themeIcon');
  if (html.getAttribute('data-theme') === 'light') {
    html.removeAttribute('data-theme');
    localStorage.setItem('stoklytics_theme', 'dark');
    if (icon) icon.className = 'fa-solid fa-moon';
  } else {
    html.setAttribute('data-theme', 'light');
    localStorage.setItem('stoklytics_theme', 'light');
    if (icon) icon.className = 'fa-solid fa-sun';
  }
  // Re-create charts to match new theme colors
  if (salesChartInstance || categoryChartInstance) {
    setTimeout(initCharts, 50);
  }
}

// ============================================
// FEATURE 2: TOAST NOTIFICATION SYSTEM
// ============================================

function showToast(message, type) {
  type = type || 'info';
  const container = document.getElementById('toastContainer');
  if (!container) return;
  const toast = document.createElement('div');
  const icons = { success: 'fa-circle-check', error: 'fa-circle-xmark', warning: 'fa-triangle-exclamation', info: 'fa-circle-info' };
  const icon = icons[type] || icons.info;
  toast.className = `toast toast-${type}`;
  toast.innerHTML = `<i class="fa-solid ${icon}"></i><span>${message}</span>`;
  container.appendChild(toast);
  setTimeout(() => {
    toast.classList.add('toast-out');
    setTimeout(() => { if (toast.parentNode) toast.remove(); }, 300);
  }, 3000);
}

// ============================================
// FEATURE 3: CASH FLOW DASHBOARD
// ============================================

let cashFlowTransactions = [];

function generateCashFlowData() {
  const today = new Date();
  const todayStr = today.toLocaleDateString('pt-BR');
  const transactions = [];

  // Pre-populate from sales data
  const concludedSales = sales.filter(s => s.status === 'Concluído');
  concludedSales.forEach(s => {
    transactions.push({
      date: s.date.split(' ')[0],
      description: `Venda ${s.order} - ${s.items.map(i => `${i.qty}x ${i.name}`).join(', ')}`,
      type: 'entrada',
      value: s.total,
      category: 'Vendas'
    });
  });

  // Add some expense transactions
  const expenses = [
    { desc: 'Pagamento Fornecedor - Tecidos SA', value: 3200, cat: 'Fornecedores' },
    { desc: 'Aluguel Loja - Julho/2026', value: 5800, cat: 'Aluguel' },
    { desc: 'Folha de Pagamento - Vendedores', value: 8400, cat: 'Folha' },
    { desc: 'Impostos - Simples Nacional', value: 2100, cat: 'Impostos' },
    { desc: 'Marketing Digital - Redes Sociais', value: 1200, cat: 'Marketing' },
    { desc: 'Material de Escritório', value: 340, cat: 'Outros' }
  ];
  expenses.forEach((e, i) => {
    const d = new Date(today);
    d.setDate(d.getDate() - i * 2);
    transactions.push({
      date: d.toLocaleDateString('pt-BR'),
      description: e.desc,
      type: 'saida',
      value: e.value,
      category: e.cat
    });
  });

  return transactions.sort((a, b) => {
    const [da, db] = [a.date.split('/').reverse().join(''), b.date.split('/').reverse().join('')];
    return db.localeCompare(da);
  });
}

function updateCashFlowKPIs() {
  const today = new Date().toLocaleDateString('pt-BR');
  const todayTx = cashFlowTransactions.filter(tx => tx.date === today);
  const dayInflows = todayTx.filter(tx => tx.type === 'entrada').reduce((s, tx) => s + tx.value, 0);
  const dayOutflows = todayTx.filter(tx => tx.type === 'saida').reduce((s, tx) => s + tx.value, 0);
  const dayBalance = dayInflows - dayOutflows;

  // Projected 7 days: average daily balance * 7
  const recentTx = cashFlowTransactions.slice(0, 30);
  const avgDailyInflow = recentTx.filter(tx => tx.type === 'entrada').reduce((s, tx) => s + tx.value, 0) / Math.max(1, recentTx.length);
  const avgDailyOutflow = recentTx.filter(tx => tx.type === 'saida').reduce((s, tx) => s + tx.value, 0) / Math.max(1, recentTx.length);
  const projected7 = (avgDailyInflow - avgDailyOutflow) * 7;

  document.getElementById('cfDayBalance').textContent = (dayBalance >= 0 ? '' : '-') + 'R$ ' + Math.abs(dayBalance).toFixed(2).replace('.', ',');
  document.getElementById('cfInflows').textContent = formatCurrency(dayInflows);
  document.getElementById('cfOutflows').textContent = formatCurrency(dayOutflows);
  document.getElementById('cfProjected').textContent = (projected7 >= 0 ? '' : '-') + 'R$ ' + Math.abs(projected7).toFixed(2).replace('.', ',');
}

function filterCashFlow() {
  const query = ($('#cfSearch') ? $('#cfSearch').value.toLowerCase() : '');
  const typeFilter = ($('#cfTypeFilter') ? $('#cfTypeFilter').value : 'all');
  const catFilter = ($('#cfCategoryFilter') ? $('#cfCategoryFilter').value : 'all');

  return cashFlowTransactions.filter(tx => {
    if (query && !tx.description.toLowerCase().includes(query)) return false;
    if (typeFilter !== 'all' && tx.type !== typeFilter) return false;
    if (catFilter !== 'all' && tx.category !== catFilter) return false;
    return true;
  });
}

function renderCashFlow() {
  const cfBody = $('#cfBody');
  if (!cfBody) return;
  const list = filterCashFlow();
  const cfCount = $('#cfCount');

  if (list.length === 0) {
    cfBody.innerHTML = `<tr><td colspan="6" style="text-align:center;padding:40px;color:var(--text-muted);">
      <i class="fa-solid fa-money-bills" style="font-size:2rem;display:block;margin-bottom:8px;"></i>
      Nenhuma transação encontrada</td></tr>`;
    if (cfCount) cfCount.textContent = '0 transações';
    return;
  }

  cfBody.innerHTML = list.map((tx, idx) => {
    const realIdx = cashFlowTransactions.indexOf(tx);
    const typeClass = tx.type === 'entrada' ? 'entrada' : 'saida';
    const typeLabel = tx.type === 'entrada' ? 'Entrada' : 'Saída';
    return `<tr>
      <td style="color:var(--text-secondary);font-size:0.85rem;">${tx.date}</td>
      <td style="font-weight:500;">${tx.description}</td>
      <td><span class="cf-type-badge ${typeClass}">${typeLabel}</span></td>
      <td class="text-right cf-value ${typeClass}">${tx.type === 'entrada' ? '' : '-'}${formatCurrency(tx.value)}</td>
      <td style="color:var(--text-secondary);font-size:0.85rem;">${tx.category}</td>
      <td><div class="action-btns">
        <button class="action-btn delete-btn" data-cf="${realIdx}" title="Excluir"><i class="fa-solid fa-trash-can"></i></button>
      </div></td>
    </tr>`;
  }).join('');

  if (cfCount) cfCount.textContent = `${list.length} ${list.length === 1 ? 'transação' : 'transações'}`;

  $$('.delete-btn', cfBody).forEach(btn => btn.addEventListener('click', () => {
    const idx = parseInt(btn.dataset.cf);
    if (idx >= 0 && confirm('Excluir esta transação?')) {
      const tx = cashFlowTransactions[idx];
      const txId = tx && tx._id;
      cashFlowTransactions.splice(idx, 1);
      if (txId) deleteCashFlowTransaction(txId).catch(console.warn);
      renderCashFlow();
      updateCashFlowKPIs();
      showToast('Transação excluída', 'info');
    }
  }));
}

function openCashFlowModal() {
  document.getElementById('editCfIndex').value = '-1';
  document.getElementById('cfModalTitle').textContent = 'Nova Transação';
  document.getElementById('cfModalSaveText').textContent = 'Salvar';
  document.getElementById('cfDesc').value = '';
  document.getElementById('cfType').value = 'entrada';
  document.getElementById('cfValue').value = '';
  document.getElementById('cfCategory').value = 'Vendas';
  document.getElementById('cfDate').value = new Date().toISOString().split('T')[0];
  document.getElementById('cfModalOverlay').classList.add('open');
}

function closeCashFlowModal() {
  document.getElementById('cfModalOverlay').classList.remove('open');
}

function saveCashFlow(e) {
  e.preventDefault();
  const desc = document.getElementById('cfDesc').value.trim();
  const type = document.getElementById('cfType').value;
  const value = parseFloat(document.getElementById('cfValue').value) || 0;
  const category = document.getElementById('cfCategory').value;
  const dateInput = document.getElementById('cfDate').value;

  if (!desc) { showToast('Descreva a transação', 'warning'); return; }
  if (value <= 0) { showToast('Informe um valor válido', 'warning'); return; }

  const dateObj = dateInput ? new Date(dateInput + 'T12:00:00') : new Date();
  const dateStr = dateObj.toLocaleDateString('pt-BR');

  const newTx = {
    date: dateStr,
    description: desc,
    type: type,
    value: value,
    category: category
  };

  cashFlowTransactions.unshift(newTx);

  // Persist to backend
  createCashFlowTransaction({
    date: dateInput || new Date().toISOString().split('T')[0],
    description: desc,
    type,
    value,
    category
  }).then(data => {
    if (data && data[0]) newTx._id = data[0].id;
  }).catch(console.warn);

  closeCashFlowModal();
  renderCashFlow();
  updateCashFlowKPIs();
  showToast('Transação registrada com sucesso!', 'success');
}

// ============================================
// FEATURE 4: CUSTOMER SYSTEM
// ============================================

let customers = [];

function generateCustomers() {
  customers = [
    { name: 'Maria Silva', phone: '(11) 98888-0001', email: 'maria.silva@email.com', totalSpent: 1259.70, visits: 4, notes: 'Cliente VIP, prefere roupas casuais', active: true },
    { name: 'João Santos', phone: '(11) 97777-0002', email: 'joao.santos@email.com', totalSpent: 839.50, visits: 3, notes: 'Compra para a esposa', active: true },
    { name: 'Ana Costa', phone: '(11) 96666-0003', email: 'ana.costa@email.com', totalSpent: 2109.90, visits: 6, notes: 'Influenciadora local, precisa de roupas para eventos', active: true },
    { name: 'Pedro Oliveira', phone: '(11) 95555-0004', email: 'pedro.oliveira@email.com', totalSpent: 449.80, visits: 2, notes: null, active: true },
    { name: 'Carla Souza', phone: '(11) 94444-0005', email: 'carla.souza@email.com', totalSpent: 679.60, visits: 3, notes: 'Prefere calçados e acessórios', active: true }
  ];
}

function updateCustomerKPIs() {
  const total = customers.length;
  const active = customers.filter(c => c.active).length;
  const avgTicket = active > 0 ? customers.reduce((s, c) => s + c.totalSpent, 0) / active : 0;

  document.getElementById('kpiTotalCustomers').textContent = total;
  document.getElementById('kpiActiveCustomers').textContent = active;
  document.getElementById('kpiCustomerAvgTicket').textContent = formatCurrency(avgTicket);
}

function renderCustomers() {
  const grid = document.getElementById('customersGrid');
  if (!grid) return;
  updateCustomerKPIs();

  if (customers.length === 0) {
    grid.innerHTML = `<div class="empty-state">
      <i class="fa-solid fa-users"></i>
      <p>Nenhum cliente cadastrado</p>
      <button class="btn btn-primary" id="emptyCustomerBtn"><i class="fa-solid fa-plus"></i> Novo Cliente</button>
    </div>`;
    const emptyBtn = $('#emptyCustomerBtn');
    if (emptyBtn) emptyBtn.addEventListener('click', () => openCustomerModal());
    return;
  }

  grid.innerHTML = customers.map((c, idx) => {
    const initials = c.name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
    const perm = currentUser ? PERMISSIONS[currentUser.roleClass] || PERMISSIONS.editor : PERMISSIONS.editor;
    const canEdit = perm.customers.edit;
    const canDelete = perm.customers.delete;
    const custBtns = [];
    if (canEdit) custBtns.push(`<button class="action-btn edit-btn" data-customer="${idx}" title="Editar"><i class="fa-solid fa-pen-to-square"></i></button>`);
    if (canDelete) custBtns.push(`<button class="action-btn delete-btn" data-customer="${idx}" title="Excluir"><i class="fa-solid fa-trash-can"></i></button>`);
    return `<div class="customer-card">
      <div class="customer-card-header">
        <div class="customer-avatar">${initials}</div>
        <div class="customer-info">
          <div class="customer-name">${c.name}</div>
          <div class="customer-contact">
            <span><i class="fa-solid fa-phone" style="width:14px;"></i> ${c.phone}</span>
            <span><i class="fa-solid fa-envelope" style="width:14px;"></i> ${c.email}</span>
          </div>
        </div>
      </div>
      <div class="customer-stats">
        <div class="customer-stat">
          <span class="customer-stat-label">Total Gasto</span>
          <span class="customer-stat-value" style="color:var(--green);">${formatCurrency(c.totalSpent)}</span>
        </div>
        <div class="customer-stat">
          <span class="customer-stat-label">Visitas</span>
          <span class="customer-stat-value">${c.visits}</span>
        </div>
        <div class="customer-stat">
          <span class="customer-stat-label">Ticket Médio</span>
          <span class="customer-stat-value">${c.visits > 0 ? formatCurrency(c.totalSpent / c.visits) : 'R$ 0'}</span>
        </div>
      </div>
      ${c.notes ? `<div style="font-size:0.75rem;color:var(--text-muted);padding:6px 0;border-top:1px solid var(--border-light);"><i class="fa-solid fa-note-sticky"></i> ${c.notes}</div>` : ''}
      <div class="customer-card-actions">
        ${custBtns.join('')}
      </div>
    </div>`;
  }).join('');

  const perm = currentUser ? PERMISSIONS[currentUser.roleClass] || PERMISSIONS.editor : PERMISSIONS.editor;
  if (perm.customers.edit) {
    $$('.edit-btn', grid).forEach(btn => btn.addEventListener('click', () => openCustomerModal(parseInt(btn.dataset.customer))));
  }
  if (perm.customers.delete) {
    $$('.delete-btn', grid).forEach(btn => btn.addEventListener('click', () => {
      const idx = parseInt(btn.dataset.customer);
      if (idx >= 0 && confirm(`Excluir "${customers[idx].name}"?`)) {
        const id = customers[idx]._id;
        customers.splice(idx, 1);
        if (id) deleteCustomerById(id).catch(console.warn);
        renderCustomers();
        populatePOSCustomerSelect();
        showToast('Cliente excluído', 'info');
      }
    }));
  }
}

function openCustomerModal(idx) {
  document.getElementById('editCustomerIndex').value = idx !== undefined ? idx : '-1';
  document.getElementById('customerModalTitle').textContent = idx !== undefined ? 'Editar Cliente' : 'Novo Cliente';
  document.getElementById('customerModalSaveText').textContent = idx !== undefined ? 'Atualizar' : 'Salvar';

  if (idx !== undefined && customers[idx]) {
    document.getElementById('custName').value = customers[idx].name;
    document.getElementById('custPhone').value = customers[idx].phone;
    document.getElementById('custEmail').value = customers[idx].email;
    document.getElementById('custNotes').value = customers[idx].notes || '';
  } else {
    document.getElementById('custName').value = '';
    document.getElementById('custPhone').value = '';
    document.getElementById('custEmail').value = '';
    document.getElementById('custNotes').value = '';
  }
  document.getElementById('customerModalOverlay').classList.add('open');
}

function closeCustomerModal() {
  document.getElementById('customerModalOverlay').classList.remove('open');
}

function saveCustomer(e) {
  e.preventDefault();
  const name = document.getElementById('custName').value.trim();
  const phone = document.getElementById('custPhone').value.trim();
  const email = document.getElementById('custEmail').value.trim();
  const notes = document.getElementById('custNotes').value.trim();
  const idx = parseInt(document.getElementById('editCustomerIndex').value);

  if (!name) { showToast('Informe o nome do cliente', 'warning'); return; }

  if (idx >= 0 && customers[idx]) {
    // Update
    customers[idx].name = name;
    customers[idx].phone = phone;
    customers[idx].email = email;
    customers[idx].notes = notes;
    if (customers[idx]._id) {
      updateCustomer(customers[idx]._id, { name, phone, email, notes }).catch(console.warn);
    }
    showToast('Cliente atualizado', 'success');
  } else {
    // Create
    const newCust = { name, phone, email, totalSpent: 0, visits: 0, notes, active: true, _id: null };
    customers.push(newCust);
    showToast('Cliente cadastrado com sucesso!', 'success');
    // Persist to backend
    createCustomer({ name, phone, email, notes, total_spent: 0, visits: 0, active: true })
      .then(data => { if (data && data[0]) newCust._id = data[0].id; })
      .catch(console.warn);
  }

  closeCustomerModal();
  renderCustomers();
  populatePOSCustomerSelect();
}

function populatePOSCustomerSelect() {
  const sel = document.getElementById('posCustomerSelect');
  if (!sel) return;
  sel.innerHTML = '<option value="">Cliente: Balcão (sem identificação)</option>';
  customers.forEach((c, idx) => {
    const opt = document.createElement('option');
    opt.value = idx;
    opt.textContent = `${c.name} — ${c.phone}`;
    sel.appendChild(opt);
  });
}

// ============================================
// FEATURE 5: SELLER GOALS
// ============================================

const DEFAULT_GOAL = 15000;
let sellerGoals = {};

function getSellerGoal(sellerName) {
  if (!sellerGoals[sellerName]) sellerGoals[sellerName] = DEFAULT_GOAL;
  return sellerGoals[sellerName];
}

function renderSellerGoals() {
  const grid = document.getElementById('sellerGoalsGrid');
  if (!grid) return;
  const stats = getSellerStats();

  if (stats.length === 0) {
    grid.innerHTML = '<div style="text-align:center;padding:20px;color:var(--text-muted);">Nenhum vendedor disponível</div>';
    return;
  }

  document.getElementById('defaultGoalDisplay').textContent = formatCurrency(DEFAULT_GOAL);

  grid.innerHTML = stats.map(s => {
    const goal = getSellerGoal(s.name);
    const progress = goal > 0 ? Math.min(100, (s.total / goal) * 100) : 0;
    const progressClass = progress >= 75 ? 'above75' : progress < 50 ? 'below50' : '';
    const hitGoal = progress >= 100;
    return `<div class="goal-card">
      <div class="goal-card-header">
        <span class="goal-name">${s.name}</span>
        ${hitGoal ? '<span class="goal-badge"><i class="fa-solid fa-check"></i> Meta Batida!</span>' : ''}
      </div>
      <div class="goal-progress-wrapper">
        <div class="goal-progress-bar">
          <div class="goal-progress-fill ${progressClass}" style="width:${Math.min(100, progress)}%;"></div>
        </div>
        <span class="goal-pct" style="color:${progress >= 100 ? 'var(--green)' : progress >= 50 ? 'var(--accent)' : 'var(--red)'};">${Math.round(progress)}%</span>
      </div>
      <div class="goal-info-row">
        <span>${formatCurrency(s.total)} vendido</span>
        <span>Meta: <input type="text" class="goal-edit-input" data-seller="${s.name}" value="${formatCurrency(goal).replace('R$ ', '')}" /></span>
      </div>
    </div>`;
  }).join('');

  $$('.goal-edit-input', grid).forEach(input => {
    input.addEventListener('change', function() {
      let val = this.value.replace(/[^0-9,.]/g, '').replace(',', '.');
      const num = parseFloat(val);
      if (num > 0) {
        sellerGoals[this.dataset.seller] = num;
        upsertSellerGoal({
          seller_name: this.dataset.seller,
          goal_value: num,
          year: new Date().getFullYear(),
          month: new Date().getMonth() + 1
        }).catch(console.warn);
        renderSellerGoals();
        showToast(`Meta de ${this.dataset.seller} atualizada para ${formatCurrency(num)}`, 'success');
      }
    });
    input.addEventListener('focus', function() { this.select(); });
  });
}

// ============================================
// FEATURE 6: RESTOCK FORECAST
// ============================================

function renderRestockForecast() {
  const list = document.getElementById('restockList');
  if (!list) return;

  const lowStock = products.filter(p => p.quantity < 20);
  if (lowStock.length === 0) {
    list.innerHTML = '<div style="text-align:center;padding:24px;color:var(--text-muted);"><i class="fa-solid fa-check-circle" style="font-size:2rem;display:block;margin-bottom:8px;color:var(--green);"></i>Nenhum produto precisa de reposição no momento</div>';
    return;
  }

  list.innerHTML = lowStock.map(p => {
    const velocity = Math.max(1, Math.round((50 - p.quantity) / 5));
    const daysLeft = Math.max(1, Math.round(p.quantity / velocity));
    const urgent = daysLeft <= 7;
    const critical = p.quantity <= 5;
    const qtyToBuy = Math.max(10, Math.round(20 - p.quantity));

    return `<div class="restock-item">
      <div class="restock-icon ${critical ? 'critical' : ''}"><i class="${p.icon}"></i></div>
      <div class="restock-info">
        <div class="restock-product-name">${p.name}</div>
        <div class="restock-detail">Compre mais <strong>${qtyToBuy} unidades</strong> — estoque vai durar ~${daysLeft} dias</div>
      </div>
      <span class="restock-urgency ${urgent ? 'urgent' : 'normal'}">${urgent ? 'Urgente' : 'OK'}</span>
    </div>`;
  }).join('');
}

// ============================================
// FEATURE 7: CUSTOMIZABLE THEME (SETTINGS)
// ============================================

function loadStoreSettings() {
  const saved = localStorage.getItem('stoklytics_store');
  if (saved) {
    try {
      const settings = JSON.parse(saved);
      const nameInput = document.getElementById('storeName');
      const colorInput = document.getElementById('storeColor');
      const logoInput = document.getElementById('storeLogo');
      const hexSpan = document.getElementById('storeColorHex');
      if (nameInput) nameInput.value = settings.name || 'Stoklytics';
      if (colorInput) colorInput.value = settings.color || '#6366F1';
      if (hexSpan) hexSpan.textContent = settings.color || '#6366F1';
      if (logoInput) logoInput.value = settings.logo || '';

      applyStoreSettings(settings);
    } catch(e) {}
  }
}

function applyStoreSettings(settings) {
  if (settings.name) {
    const logoTexts = $$('.logo-text');
    logoTexts.forEach(el => { el.textContent = settings.name; });
    document.title = `Stoklytics — ${settings.name}`;
  }
  if (settings.color) {
    document.documentElement.style.setProperty('--accent', settings.color);
    document.documentElement.style.setProperty('--accent-hover', settings.color + 'CC');
    document.documentElement.style.setProperty('--accent-subtle', settings.color + '1F');
    document.documentElement.style.setProperty('--accent-glow', settings.color + '40');
  }
}

function saveStoreSettings() {
  const name = document.getElementById('storeName').value.trim() || 'Stoklytics';
  const color = document.getElementById('storeColor').value;
  const logo = document.getElementById('storeLogo').value.trim();
  const settings = { name, color, logo };
  localStorage.setItem('stoklytics_store', JSON.stringify(settings));
  applyStoreSettings(settings);
  saveStoreSettingsDB(settings).catch(console.warn);
  showToast('Configurações da loja salvas!', 'success');
}

// ============================================
// COUPON MANAGEMENT (Settings)
// ============================================

function renderCoupons() {
  const list = document.getElementById('couponsList');
  if (!list) return;
  if (coupons.length === 0) {
    list.innerHTML = '<div style="text-align:center;padding:24px;color:var(--text-muted);"><i class="fa-solid fa-tag" style="font-size:2rem;display:block;margin-bottom:8px;"></i>Nenhum cupom cadastrado</div>';
    return;
  }
  list.innerHTML = coupons.map((c, idx) => {
    const discountLabel = c.discount_type === 'percentage' ? `${c.discount_value}%` : `R$ ${c.discount_value.toFixed(2)}`;
    const restrictions = [];
    if (c.category_restriction) {
      const cats = c.category_restriction.split(',').map(s => s.trim()).filter(Boolean);
      restrictions.push(`<i class="fa-solid fa-tag"></i> ${cats.join(', ')}`);
    }
    if (c.min_quantity > 0) restrictions.push(`<i class="fa-solid fa-cubes"></i> Mín ${c.min_quantity} itens`);
    if (c.usage_limit) restrictions.push(`<i class="fa-solid fa-repeat"></i> ${c.used_count}/${c.usage_limit} usos`);
    if (c.expires_at) restrictions.push(`<i class="fa-regular fa-calendar"></i> até ${new Date(c.expires_at).toLocaleDateString('pt-BR')}`);
    const activeClass = c.active ? '' : ' style="opacity:0.5;"';
    return `<div class="coupon-card"${activeClass}>
      <div class="coupon-card-icon"><i class="fa-solid fa-tag"></i></div>
      <div class="coupon-card-info">
        <div class="coupon-card-code">${c.code}</div>
        <div class="coupon-card-desc">${c.description || discountLabel}</div>
        <div class="coupon-card-meta">${restrictions.join(' · ')}</div>
      </div>
      <div class="coupon-card-actions">
        <button onclick="toggleCouponActive(${idx})" title="${c.active ? 'Desativar' : 'Ativar'}">
          <i class="fa-solid ${c.active ? 'fa-toggle-on' : 'fa-toggle-off'}"></i>
        </button>
        <button onclick="openCouponModal(${idx})" title="Editar"><i class="fa-solid fa-pen"></i></button>
        <button onclick="handleDeleteCoupon(${idx})" title="Excluir"><i class="fa-solid fa-trash"></i></button>
      </div>
    </div>`;
  }).join('');
}

function openCouponModal(idx) {
  if (idx >= 0 && idx < coupons.length) {
    const c = coupons[idx];
    couponModalTitle.textContent = 'Editar Cupom';
    couponModalSaveText.textContent = 'Salvar';
    editCouponIndex.value = idx;
    couponCode.value = c.code;
    couponDescription.value = c.description || '';
    couponDiscountType.value = c.discount_type;
    couponDiscountValue.value = c.discount_value;
    couponMinQuantity.value = c.min_quantity;
    couponCategoryRestriction.dataset.selected = c.category_restriction || '';
    couponUsageLimit.value = c.usage_limit || '';
    couponExpiresAt.value = c.expires_at || '';
  } else {
    couponModalTitle.textContent = 'Novo Cupom';
    couponModalSaveText.textContent = 'Criar';
    editCouponIndex.value = '-1';
    couponForm.reset();
    couponDiscountValue.value = '';
    couponMinQuantity.value = 0;
    couponUsageLimit.value = '';
    couponExpiresAt.value = '';
  }
  // Populate category chips
  const container = couponCategoryRestriction;
  const currentCats = couponCategoryRestriction.dataset.selected || '';
  const catSet = new Set(currentCats ? currentCats.split(',').map(s => s.trim()).filter(Boolean) : []);
  const allCats = [...new Set(products.map(p => p.category))];
  container.innerHTML = '';
  allCats.forEach(cat => {
    const chip = document.createElement('span');
    chip.className = 'chip' + (catSet.has(cat) ? ' active' : '');
    chip.textContent = cat;
    chip.dataset.value = cat;
    chip.addEventListener('click', () => {
      chip.classList.toggle('active');
    });
    container.appendChild(chip);
  });
  couponModalOverlay.classList.add('open');
}

function closeCouponModal() {
  couponModalOverlay.classList.remove('open');
  delete couponCategoryRestriction.dataset.selected;
}

async function saveCoupon() {
  const code = couponCode.value.trim().toUpperCase();
  if (!code) { showToast('Digite um código para o cupom.', 'warning'); return; }
  const discountValue = parseFloat(couponDiscountValue.value);
  if (!discountValue || discountValue <= 0) { showToast('Informe um valor de desconto válido.', 'warning'); return; }
  const idx = parseInt(editCouponIndex.value);
  // Collect selected category chips
  const chips = couponCategoryRestriction.querySelectorAll('.chip');
  const selected = [...chips].filter(chip => chip.classList.contains('active')).map(chip => chip.dataset.value);
  const categoryRestriction = selected.length > 0 ? selected.join(',') : null;
  const data = {
    code,
    description: couponDescription.value.trim(),
    discount_type: couponDiscountType.value,
    discount_value: discountValue,
    min_quantity: parseInt(couponMinQuantity.value) || 0,
    category_restriction: categoryRestriction,
    usage_limit: parseInt(couponUsageLimit.value) || null,
    expires_at: couponExpiresAt.value || null,
    active: true
  };
  try {
    if (idx >= 0 && idx < coupons.length) {
      const result = await updateCoupon(coupons[idx]._id, { ...data, active: coupons[idx].active });
      if (result) Object.assign(coupons[idx], data, { _id: result.id });
    } else {
      const result = await createCoupon(data);
      if (result) coupons.push({ _id: result.id, ...data, used_count: 0, active: true });
    }
    closeCouponModal();
    renderCoupons();
    renderCouponSelect();
    showToast(`Cupom ${idx >= 0 ? 'atualizado' : 'criado'} com sucesso!`, 'success');
  } catch (e) {
    showToast('Erro ao salvar cupom: ' + e.message, 'error');
  }
}

function handleDeleteCoupon(idx) {
  const c = coupons[idx];
  if (!c) return;
  if (!confirm(`Tem certeza que deseja excluir o cupom "${c.code}"?`)) return;
  apiFetch(`/coupons/${c._id}`, { method: 'DELETE' }).then(() => {
    coupons.splice(idx, 1);
    renderCoupons();
    renderCouponSelect();
    // Remove from applied coupons if present
    const appliedIdx = appliedCoupons.findIndex(ac => ac._id === c._id);
    if (appliedIdx >= 0) removeSpecificCoupon(appliedIdx);
    showToast(`Cupom "${c.code}" excluído!`, 'success');
  }).catch(e => showToast('Erro ao excluir cupom: ' + e.message, 'error'));
}

async function toggleCouponActive(idx) {
  const c = coupons[idx];
  if (!c) return;
  try {
    const result = await updateCoupon(c._id, { ...c, active: !c.active });
    if (result) {
      c.active = !c.active;
      renderCoupons();
      renderCouponSelect();
      // Remove from applied coupons if being deactivated
      if (!c.active) {
        const appIdx = appliedCoupons.findIndex(ac => ac._id === c._id);
        if (appIdx >= 0) removeSpecificCoupon(appIdx);
      }
      showToast(`Cupom "${c.code}" ${c.active ? 'ativado' : 'desativado'}!`, 'success');
    }
  } catch (e) {
    showToast('Erro: ' + e.message, 'error');
  }
}

// ============================================
// POS COUPON INTEGRATION
// ============================================

function matchesCategory(restriction, productCategory) {
  if (!restriction) return true;
  return restriction.split(',').map(s => s.trim()).includes(productCategory);
}

function categoryOverlap(restrictionA, restrictionB) {
  if (!restrictionA || !restrictionB) return false;
  const catsA = restrictionA.split(',').map(s => s.trim());
  const catsB = restrictionB.split(',').map(s => s.trim());
  return catsA.some(c => catsB.includes(c));
}

function renderCouponSelect() {
  if (!couponSelectContainer) return;
  couponSelectContainer.innerHTML = '';

  const available = coupons.filter(c => {
    if (!c.active) return false;
    if (c.usage_limit && c.used_count >= c.usage_limit) return false;
    if (c.expires_at) {
      const exp = new Date(c.expires_at);
      exp.setHours(23, 59, 59, 999);
      if (new Date() > exp) return false;
    }
    return true;
  });

  if (available.length === 0) {
    couponSelectContainer.innerHTML = '<div style="font-size:0.72rem;color:var(--text-muted);padding:4px 0;">Nenhum cupom disponível</div>';
    return;
  }

  available.forEach((c, i) => {
    const alreadyApplied = appliedCoupons.some(ac => ac._id === c._id);
    const hasGlobalApplied = appliedCoupons.some(ac => !ac.category_restriction);
    const isGlobal = !c.category_restriction;
    const hasOverlap = c.category_restriction && appliedCoupons.some(ac => categoryOverlap(ac.category_restriction, c.category_restriction));
    const blockedByGlobal = hasGlobalApplied && !alreadyApplied;
    const blockedByCategory = isGlobal && appliedCoupons.length > 0 && !alreadyApplied;
    const disabled = alreadyApplied || hasOverlap || blockedByGlobal || blockedByCategory || posCart.length === 0;

    const discountLabel = c.discount_type === 'percentage'
      ? `${c.discount_value}%`
      : `R$ ${Number(c.discount_value).toFixed(2)}`;

    const card = document.createElement('div');
    card.className = 'pos-coupon-card' + (alreadyApplied ? ' applied' : '');

    const cats = c.category_restriction
      ? c.category_restriction.split(',').map(s => s.trim()).filter(Boolean)
      : [];

    card.innerHTML = `
      <span class="pos-coupon-card-badge">${discountLabel}</span>
      <div class="pos-coupon-card-body">
        <span class="pos-coupon-card-code">${c.code}</span>
        <span class="pos-coupon-card-meta">
          ${c.description ? `<span>${c.description}</span>` : ''}
          ${c.min_quantity > 0 ? `<span>mín. ${c.min_quantity} itens</span>` : ''}
          ${cats.length > 0 ? cats.map(cat => `<span class="cat-tag">${cat}</span>`).join('') : ''}
        </span>
      </div>
      <i class="fa-solid ${alreadyApplied ? 'fa-circle-check' : 'fa-plus-circle'}"></i>
    `;

    if (!disabled) {
      card.addEventListener('click', () => {
        const couponIdx = coupons.indexOf(c);
        if (couponIdx === -1) return;
        // Apply coupon on click
        const coupon = coupons[couponIdx];
        if (!coupon) return;

        if (appliedCoupons.some(ac => ac._id === coupon._id)) {
          showToast(`Cupom "${coupon.code}" já está aplicado.`, 'warning');
          return;
        }

        // Regra: se já existe cupom global, não pode adicionar cupom de categoria
        if (coupon.category_restriction && appliedCoupons.some(ac => !ac.category_restriction)) {
          showToast('Remova o cupom global primeiro para aplicar cupons de categoria.', 'warning');
          return;
        }

        // Regra: se já existe cupom de categoria, não pode adicionar cupom global
        if (!coupon.category_restriction && appliedCoupons.some(ac => ac.category_restriction)) {
          showToast('Remova os cupons de categoria primeiro para aplicar um cupom global.', 'warning');
          return;
        }

        if (coupon.category_restriction && appliedCoupons.some(ac => categoryOverlap(ac.category_restriction, coupon.category_restriction))) {
          const overlapCats = coupon.category_restriction.split(',').map(s => s.trim()).join(', ');
          showToast(`Já existe um cupom aplicado para a(s) categoria(s): "${overlapCats}".`, 'warning');
          return;
        }

        const validation = validateCoupon(coupon, posCart);
        if (!validation.valid) {
          showToast(validation.reason, 'error');
          return;
        }

        appliedCoupons.push(coupon);
        renderAppliedCoupons();
        renderCouponSelect();
        updateCartUI();
        showToast(`Cupom "${coupon.code}" aplicado!`, 'success');
      });
    } else if (!alreadyApplied) {
      card.style.opacity = '0.4';
      card.style.cursor = 'not-allowed';
      if (hasOverlap) {
        card.title = 'Já existe um cupom aplicado para essas categorias';
      } else if (blockedByGlobal) {
        card.title = 'Remova o cupom global primeiro para aplicar cupons de categoria';
      } else if (blockedByCategory) {
        card.title = 'Remova os cupons de categoria primeiro para aplicar um cupom global';
      } else if (posCart.length === 0) {
        card.title = 'Adicione produtos ao carrinho primeiro';
      }
    }

    couponSelectContainer.appendChild(card);
  });
}

function validateCoupon(coupon, cartItems) {
  if (!coupon || !coupon.active) return { valid: false, reason: 'Cupom inativo ou inválido.' };
  // Check usage limit
  if (coupon.usage_limit && coupon.used_count >= coupon.usage_limit) {
    return { valid: false, reason: 'Este cupom já atingiu o limite de usos.' };
  }
  // Check expiration
  if (coupon.expires_at) {
    const exp = new Date(coupon.expires_at);
    exp.setHours(23, 59, 59, 999);
    if (new Date() > exp) return { valid: false, reason: 'Este cupom está expirado.' };
  }
  // Check min quantity — only count qualifying items when category restriction exists
  const qualifyingQty = cartItems.reduce((sum, item) => {
    const p = products[item.productIndex];
    if (!p) return sum;
    if (!matchesCategory(coupon.category_restriction, p.category)) return sum;
    return sum + item.qty;
  }, 0);
  if (coupon.min_quantity > 0 && qualifyingQty < coupon.min_quantity) {
    return { valid: false, reason: `Mínimo de ${coupon.min_quantity} itens necessário na categoria "${coupon.category_restriction ? coupon.category_restriction.split(',').map(s=>s.trim()).join(', ') : 'qualquer'}". Carrinho tem ${qualifyingQty} elegíveis.` };
  }
  // Check category restriction
  if (coupon.category_restriction) {
    const hasMatchingCategory = cartItems.some(item => {
      const p = products[item.productIndex];
      return p && matchesCategory(coupon.category_restriction, p.category);
    });
    if (!hasMatchingCategory) {
      return { valid: false, reason: `Este cupom é válido apenas para a(s) categoria(s): ${coupon.category_restriction.split(',').map(s=>s.trim()).join(', ')}.` };
    }
  }
  return { valid: true };
}

function renderAppliedCoupons() {
  if (!appliedCouponsContainer) return;
  if (appliedCoupons.length === 0) {
    appliedCouponsContainer.innerHTML = '';
    return;
  }
  appliedCouponsContainer.innerHTML = appliedCoupons.map((c, idx) => `
    <div class="pos-coupon-chip">
      <span class="pos-coupon-chip-info">${c.code} — ${c.discount_type === 'percentage' ? c.discount_value + '%' : formatCurrency(c.discount_value)}</span>
      <span class="pos-coupon-chip-remove" data-applied-idx="${idx}"><i class="fa-solid fa-xmark"></i></span>
    </div>
  `).join('');
  appliedCouponsContainer.querySelectorAll('.pos-coupon-chip-remove').forEach(el => {
    el.addEventListener('click', () => {
      const idx = parseInt(el.dataset.appliedIdx);
      removeSpecificCoupon(idx);
    });
  });
}

function removeSpecificCoupon(idx) {
  if (idx < 0 || idx >= appliedCoupons.length) return;
  const removed = appliedCoupons[idx];
  appliedCoupons.splice(idx, 1);
  renderAppliedCoupons();
  updateCartUI();
  showToast(`Cupom "${removed.code}" removido.`, 'info');
}

// ============================================
// My Account (Settings)
// ============================================

function loadAccountInfo() {
  if (!currentUser) return;
  const nameEl = document.getElementById('accountName');
  const emailEl = document.getElementById('accountEmail');
  const roleEl = document.getElementById('accountRoleBadge');
  if (nameEl) nameEl.textContent = currentUser.name || '—';
  if (emailEl) emailEl.textContent = currentUser.email || '—';
  if (roleEl) roleEl.textContent = currentUser.role || '—';
}

async function saveAccountPassword() {
  const currentPw = document.getElementById('accountCurrentPassword');
  const newPw = document.getElementById('accountNewPassword');
  const confirmPw = document.getElementById('accountConfirmPassword');

  if (!currentPw.value) { showToast('Digite sua senha atual.', 'warning'); return; }
  if (!newPw.value || newPw.value.length < 4) { showToast('A nova senha deve ter no mínimo 4 caracteres.', 'warning'); return; }
  if (newPw.value !== confirmPw.value) { showToast('As senhas não conferem.', 'error'); return; }

  try {
    await changePassword(currentUser.id, currentPw.value, newPw.value);
    showToast('Senha alterada com sucesso!', 'success');
    currentPw.value = '';
    newPw.value = '';
    confirmPw.value = '';
  } catch (e) {
    showToast('Erro: ' + e.message, 'error');
  }
}

// ============================================
// FEATURE 8: PDF EXPORT
// ============================================

function exportSalesPDF() {
  const storeName = localStorage.getItem('stoklytics_store')
    ? JSON.parse(localStorage.getItem('stoklytics_store')).name
    : 'Stoklytics';

  // Temporarily inject print data
  const existingPrintHeader = document.querySelector('.print-header');
  if (!existingPrintHeader) {
    const header = document.createElement('div');
    header.className = 'print-header';
    header.id = 'printHeader';
    header.innerHTML = `
      <h1>${storeName}</h1>
      <p>Relatório de Vendas — ${new Date().toLocaleDateString('pt-BR')}</p>
    `;
    document.getElementById('section-sales').insertBefore(header, document.getElementById('section-sales').firstChild);
  } else {
    const h1 = existingPrintHeader.querySelector('h1');
    const p = existingPrintHeader.querySelector('p');
    if (h1) h1.textContent = storeName;
    if (p) p.textContent = `Relatório de Vendas — ${new Date().toLocaleDateString('pt-BR')}`;
  }

  // Build totals table
  const concludedSales = sales.filter(s => s.status === 'Concluído');
  const totalRevenue = concludedSales.reduce((s, v) => s + v.total, 0);
  const totalOrders = concludedSales.length;

  // Remove previous totals if exists
  const oldTotals = document.querySelector('.print-totals');
  if (oldTotals) oldTotals.remove();

  const totalsDiv = document.createElement('div');
  totalsDiv.className = 'print-totals';
  totalsDiv.innerHTML = `
    <h3>Resumo do Período</h3>
    <p><strong>Total de Pedidos:</strong> ${totalOrders}</p>
    <p><strong>Faturamento Total:</strong> ${formatCurrency(totalRevenue)}</p>
    <p><strong>Ticket Médio:</strong> ${totalOrders > 0 ? formatCurrency(totalRevenue / totalOrders) : 'R$ 0,00'}</p>
    <p><strong>Período:</strong> ${sales.length > 0 ? sales[sales.length-1].date.split(' ')[0] + ' a ' + sales[0].date.split(' ')[0] : 'N/A'}</p>
  `;
  document.getElementById('section-sales').appendChild(totalsDiv);

  window.print();

  // Clean up
  const printHeader = document.querySelector('.print-header');
  if (printHeader) printHeader.remove();
  if (totalsDiv.parentNode) totalsDiv.remove();
}

// ============================================
// FEATURE 10: PRICE HISTORY
// ============================================

let priceHistory = [];

function recordPriceChange(productIndex, oldPrice, newPrice) {
  if (oldPrice === newPrice) return;
  const p = products[productIndex];
  if (!p) return;
  priceHistory.push({
    productIndex,
    oldPrice,
    newPrice,
    date: new Date().toLocaleDateString('pt-BR') + ' ' + new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
  });
}

function renderPriceHistory(productIndex) {
  const row = document.getElementById('priceHistoryRow');
  const list = document.getElementById('priceHistoryList');
  if (!row || !list) return;

  const history = priceHistory.filter(h => h.productIndex === productIndex);
  if (history.length === 0) {
    row.style.display = 'none';
    return;
  }

  row.style.display = 'block';
  list.innerHTML = history.map(h => `
    <div class="price-history-item">
      <span class="ph-date">${h.date}</span>
      <span><span class="ph-old">${formatCurrency(h.oldPrice)}</span> → <span class="ph-new">${formatCurrency(h.newPrice)}</span></span>
    </div>
  `).join('');
}

// ============================================
// FEATURE 11: ONBOARDING TUTORIAL
// ============================================

let onboardingStep = 0;

function showOnboarding() {
  const flag = localStorage.getItem('stoklytics_onboarding_done');
  if (flag === 'true') return;

  onboardingStep = 0;
  document.getElementById('onboardingOverlay').classList.add('open');
  updateOnboardingStep(0);
}

function updateOnboardingStep(step) {
  onboardingStep = step;
  $$('.onboarding-step').forEach(el => el.classList.remove('active'));
  const activeStep = $(`[data-step="${step}"]`);
  if (activeStep) activeStep.classList.add('active');

  $$('#onboardingDots .dot').forEach(el => el.classList.remove('active'));
  const activeDot = $(`#onboardingDots .dot[data-step="${step}"]`);
  if (activeDot) activeDot.classList.add('active');

  const nextBtn = $('#onboardingNext');
  if (nextBtn) {
    if (step >= 2) {
      nextBtn.innerHTML = 'Concluir <i class="fa-solid fa-check"></i>';
    } else {
      nextBtn.innerHTML = 'Próximo <i class="fa-solid fa-arrow-right"></i>';
    }
  }
}

function nextOnboardingStep() {
  if (onboardingStep >= 2) {
    closeOnboarding();
    return;
  }
  updateOnboardingStep(onboardingStep + 1);
}

function closeOnboarding() {
  document.getElementById('onboardingOverlay').classList.remove('open');
  localStorage.setItem('stoklytics_onboarding_done', 'true');
}

// ============================================
// MODIFIED EXISTING FUNCTIONS
// ============================================

// Wrap saveProduct to record price history
saveProduct = function(e) {
  e.preventDefault();
  const name = fName.value.trim();
  const sku = fSku.value.trim();
  const category = fCategory.value;
  const sizes = parseSizes(fSizes.value);
  const quantity = parseInt(fQuantity.value) || 0;
  const costPrice = parseBrPrice(fCostPrice.value);
  const salePrice = parseBrPrice(fSalePrice.value);
  const icon = fIcon.value.trim() || 'fa-solid fa-shirt';
  const photo = fPhotoImg.src || '';

  if (!name || !sku || !category) { showToast('Preencha todos os campos obrigatórios.', 'warning'); return; }

  const existingIdx = products.findIndex(p => p.sku === sku);
  const editIdx = parseInt(editIndex.value);

  if (editIdx >= 0) {
    if (existingIdx !== -1 && existingIdx !== editIdx) { showToast('Já existe outro produto com este SKU.', 'error'); return; }

    // Record price history before updating
    const oldPrice = products[editIdx].salePrice;
    if (oldPrice !== salePrice) {
      recordPriceChange(editIdx, oldPrice, salePrice);
    }

    products[editIdx] = { ...products[editIdx], name, sku, category, sizes, quantity, costPrice, salePrice, icon, photo };
    addActivity('edit', 'Produto Atualizado', `${name} — dados alterados`);
    showToast('Produto atualizado com sucesso!', 'success');

    // Persist to backend
    const prodId = products[editIdx]._id;
    if (prodId) {
      updateProduct(prodId, {
        name, sku, category, sizes, quantity,
        cost_price: costPrice, sale_price: salePrice, icon, photo
      }).catch(console.warn);
    }
  } else {
    if (existingIdx !== -1) { showToast('Já existe um produto com este SKU.', 'error'); return; }
    const newProd = { name, sku, category, sizes, quantity, costPrice, salePrice, icon, photo };
    products.push(newProd);
    addActivity('entry', 'Produto Cadastrado', `${name} (${sku}) adicionado ao catálogo`);
    showToast('Produto cadastrado com sucesso!', 'success');

    // Persist to backend
    createProduct({
      name, sku, category, sizes, quantity,
      cost_price: costPrice, sale_price: salePrice, icon, photo
    }).then(data => {
      if (data && data[0]) {
        newProd._id = data[0].id;
      }
    }).catch(console.warn);
  }

  closeModal();
  fullRefresh();
};

// Wrap openEditModal to show price history
openEditModal = function(index) {
  const p = products[index];
  if (!p) return;
  editIndex.value = index;
  modalTitle.textContent = 'Editar Produto';
  modalSaveText.textContent = 'Atualizar Produto';
  fName.value = p.name;
  fSku.value = p.sku;
  fCategory.value = p.category;
  fSizes.value = p.sizes.join(', ');
  fQuantity.value = p.quantity;
  fCostPrice.value = formatBrCurrency(String(Math.round(p.costPrice * 100)));
  fSalePrice.value = formatBrCurrency(String(Math.round(p.salePrice * 100)));
  fIcon.value = p.icon;
  syncSizesChips();
  if (prodIconPicker) renderIconPicker(prodIconPicker, fIcon, p.icon);
  if (p.photo) {
    fPhotoImg.src = p.photo;
    fPhotoPreview.style.display = 'block';
    setProductMedia('photo');
  } else {
    fPhotoPreview.style.display = 'none';
    setProductMedia('icon');
  }
  renderPriceHistory(index);
  openModal();
};

// ============================================
// SALE DETAIL MODAL
// ============================================

function openSaleDetail(saleIndex) {
  const s = sales[saleIndex];
  if (!s) return;

  const itemsHtml = s.items.map(i =>
    `<tr><td>${i.name}</td><td style="text-align:center;">${i.qty}</td><td style="text-align:right;">${formatCurrency(i.qty * (s.total / s.items.reduce((sum, it) => sum + it.qty, 0)))}</td></tr>`
  ).join('');

  saleDetailContent.innerHTML = `
    <div style="display:grid;gap:12px;">
      <div style="display:flex;justify-content:space-between;border-bottom:1px solid var(--border-color);padding-bottom:8px;">
        <span style="color:var(--text-muted);">Pedido</span>
        <span style="font-weight:700;font-family:monospace;">${s.order}</span>
      </div>
      <div style="display:flex;justify-content:space-between;border-bottom:1px solid var(--border-color);padding-bottom:8px;">
        <span style="color:var(--text-muted);">Data</span>
        <span>${s.date}</span>
      </div>
      <div style="display:flex;justify-content:space-between;border-bottom:1px solid var(--border-color);padding-bottom:8px;">
        <span style="color:var(--text-muted);">Vendedor</span>
        <span>${s.seller}</span>
      </div>
      <div style="display:flex;justify-content:space-between;border-bottom:1px solid var(--border-color);padding-bottom:8px;">
        <span style="color:var(--text-muted);">Pagamento</span>
        <span>${s.payment}</span>
      </div>
      <div style="display:flex;justify-content:space-between;border-bottom:1px solid var(--border-color);padding-bottom:8px;">
        <span style="color:var(--text-muted);">Status</span>
        <span class="status-badge ${s.status === 'Concluído' ? 'concluded' : s.status === 'Cancelado' ? 'cancelled' : 'pending'}"><span class="dot"></span> ${s.status}</span>
      </div>
      <div>
        <p style="color:var(--text-muted);margin-bottom:6px;font-size:0.85rem;">Itens</p>
        <table style="width:100%;font-size:0.85rem;">
          <thead><tr style="color:var(--text-muted);"><th style="text-align:left;">Produto</th><th style="text-align:center;">Qtd</th><th style="text-align:right;">Valor Est.</th></tr></thead>
          <tbody>${itemsHtml}</tbody>
        </table>
      </div>
      <div style="display:flex;justify-content:space-between;padding-top:8px;border-top:2px solid var(--border-color);font-weight:700;font-size:1.1rem;">
        <span>Total</span>
        <span>${formatCurrency(s.total)}</span>
      </div>
    </div>
  `;
  saleDetailOverlay.classList.add('open');
}

function closeSaleDetail() {
  saleDetailOverlay.classList.remove('open');
}

// ============================================
// SALES PERIOD TOGGLE (6M / 12M)
// ============================================

function setSalesPeriod(months) {
  salesPeriod = months;
  periodBtns.forEach(btn => {
    const val = parseInt(btn.textContent, 10);
    btn.classList.toggle('active', val === months);
  });
  initCharts();
}

// ============================================
// NOTIFICATION BELL
// ============================================

function handleBellClick() {
  showToast('Nenhuma notificação nova.', 'info');
}

// ============================================
// UPDATE NAVIGATION FOR NEW SECTIONS
// ============================================

navigateTo = function(sectionId) {
  applyPermissions();
  navLinks.forEach(l => l.classList.remove('active'));
  const activeLink = $(`[data-section="${sectionId}"]`);
  if (activeLink) activeLink.classList.add('active');

  sections.forEach(s => s.classList.remove('active'));
  const target = $(`#section-${sectionId}`);
  if (target) target.classList.add('active');

  // Bottom nav sync
  $$('.bottom-nav-item').forEach(item => {
    item.classList.toggle('active', item.dataset.section === sectionId);
  });

  // Refresh section-specific data
  if (sectionId === 'overview') {
    updateKPIs();
    renderRecent();
    setTimeout(initCharts, 50);
  }
  if (sectionId === 'inventory') applyFilters();
  if (sectionId === 'sales') { applySalesFilters(); updateSalesKPIs(); }
  if (sectionId === 'pos') { renderPOSProducts(); renderCouponSelect(); }
  if (sectionId === 'sellers') { renderSellerRanking(); renderSellerGoals(); }
  if (sectionId === 'categories') renderCategories();
  if (sectionId === 'reports') { renderReports(); renderRestockForecast(); }
  if (sectionId === 'settings') { renderUsers(); loadStoreSettings(); renderCoupons(); }
  if (sectionId === 'cashflow') { renderCashFlow(); updateCashFlowKPIs(); }
  if (sectionId === 'customers') renderCustomers();

  sidebar.classList.remove('mobile-open');
  sidebarOverlay.classList.remove('active');
};

// ============================================
// INIT
// ============================================

async function init() {
  localStorage.removeItem('stoklytics_token');
  currentUser = {
    id: 'demo',
    name: 'Demonstração',
    email: 'demo@stoklytics.local',
    role: 'Administrador',
    roleClass: 'admin',
    initials: 'DE',
    color: '#6366F1'
  };
  localStorage.setItem('stoklytics_user', JSON.stringify(currentUser));
  await showApp();

  // Always register event listeners (run regardless of session)
  initEventListeners();
}

function initEventListeners() {
  if (sidebarToggle) sidebarToggle.addEventListener('click', toggleSidebar);
  if (mobileMenuBtn) {
    mobileMenuBtn.addEventListener('click', () => {
      sidebar.classList.toggle('mobile-open');
      sidebarOverlay.classList.toggle('active');
    });
  }
  if (sidebarOverlay) {
    sidebarOverlay.addEventListener('click', () => {
      sidebar.classList.remove('mobile-open');
      sidebarOverlay.classList.remove('active');
    });
  }

  // Navigation
  navLinks.forEach(link => {
    link.addEventListener('click', e => {
      e.preventDefault();
      if (link.dataset.section) navigateTo(link.dataset.section);
    });
  });

  // "Ver todas" link in overview
  $$('.view-all').forEach(el => {
    el.addEventListener('click', e => {
      e.preventDefault();
      if (el.dataset.section) navigateTo(el.dataset.section);
    });
  });

  // Login
  if (loginForm) loginForm.addEventListener('submit', handleLogin);
  if (pwToggle) {
    pwToggle.addEventListener('click', () => {
      const isPassword = loginPassword.type === 'password';
      loginPassword.type = isPassword ? 'text' : 'password';
      pwToggle.innerHTML = isPassword ? '<i class="fa-solid fa-eye-slash"></i>' : '<i class="fa-solid fa-eye"></i>';
    });
  }

  // User dropdown toggle & logout
  if (userProfile) {
    userProfile.addEventListener('click', (e) => {
      e.stopPropagation();
      userDropdown.classList.toggle('open');
    });
  }
  if (logoutBtn) {
    logoutBtn.addEventListener('click', handleLogout);
  }
  // Close dropdown on click outside
  document.addEventListener('click', () => {
    userDropdown?.classList.remove('open');
  });

  // Inventory modal
  if (openModalBtn) openModalBtn.addEventListener('click', () => { resetForm(); openModal(); });
  if (modalClose) modalClose.addEventListener('click', closeModal);
  if (modalCancel) modalCancel.addEventListener('click', closeModal);
  if (modalOverlay) modalOverlay.addEventListener('click', e => { if (e.target === modalOverlay) closeModal(); });
  if (productForm) productForm.addEventListener('submit', saveProduct);
  if (modalSave) modalSave.addEventListener('click', () => { saveProduct(new Event('submit')); });

  // Currency mask for price inputs — only formats on blur
  function formatOnBlur(input) {
    const val = input.value.trim().replace(/\D/g, '');
    if (!val) { input.value = ''; return; }
    // Add ",00" if user typed just an integer
    if (!input.value.includes(',') && !input.value.includes('.')) {
      input.value = val.replace(/\B(?=(\d{3})+(?!\d))/g, '.') + ',00';
    } else {
      // Already has comma/decimal — just normalize
      const num = parseBrPrice(input.value);
      if (num > 0) {
        const str = num.toFixed(2).replace('.', ',');
        const int = str.slice(0, -3);
        input.value = int.replace(/\B(?=(\d{3})+(?!\d))/g, '.') + ',' + str.slice(-2);
      } else {
        input.value = '';
      }
    }
  }
  if (fCostPrice) fCostPrice.addEventListener('blur', function() { formatOnBlur(this); });
  if (fSalePrice) fSalePrice.addEventListener('blur', function() { formatOnBlur(this); });

  // Product photo preview
  // Init product icon picker
  if (prodIconPicker) renderIconPicker(prodIconPicker, fIcon, fIcon.value);
  if (fPhoto) fPhoto.addEventListener('change', function() {
    const file = this.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = function(e) {
      fPhotoImg.src = e.target.result;
      fPhotoPreview.style.display = 'block';
    };
    reader.readAsDataURL(file);
  });
  if (fPhotoRemove) fPhotoRemove.addEventListener('click', function() {
    fPhotoImg.src = '';
    fPhotoPreview.style.display = 'none';
    fPhoto.value = '';
  });

  // Media toggle (icon / photo)
  document.querySelectorAll('.media-toggle-btn').forEach(btn => {
    btn.addEventListener('click', function() {
      setProductMedia(this.dataset.media);
    });
  });

  // Size chips (click to toggle)
  document.querySelectorAll('.size-chip').forEach(chip => {
    chip.addEventListener('click', function() {
      const sizes = fSizes.value.split(',').map(s => s.trim()).filter(Boolean);
      const size = this.dataset.size;
      const idx = sizes.indexOf(size);
      if (idx >= 0) { sizes.splice(idx, 1); } else { sizes.push(size); }
      fSizes.value = sizes.sort((a, b) => SIZE_ORDER.indexOf(a) - SIZE_ORDER.indexOf(b)).join(', ');
      this.classList.toggle('selected');
    });
  });

  // Category modal
  if (addCategoryBtn) addCategoryBtn.addEventListener('click', () => openCategoryModal());
  if (catModalClose) catModalClose.addEventListener('click', closeCategoryModal);
  if (catModalCancel) catModalCancel.addEventListener('click', closeCategoryModal);
  if (catModalOverlay) catModalOverlay.addEventListener('click', e => { if (e.target === catModalOverlay) closeCategoryModal(); });
  if (catModalSave) catModalSave.addEventListener('click', () => { if (categoryForm) categoryForm.requestSubmit(); });
  if (categoryForm) categoryForm.addEventListener('submit', saveCategory);

  // User modal
  if (addUserBtn) addUserBtn.addEventListener('click', () => openUserModal());
  if (userModalClose) userModalClose.addEventListener('click', closeUserModal);
  if (userModalCancel) userModalCancel.addEventListener('click', closeUserModal);
  if (userModalOverlay) userModalOverlay.addEventListener('click', e => { if (e.target === userModalOverlay) closeUserModal(); });
  if (userModalSave) userModalSave.addEventListener('click', () => { if (userForm) userForm.requestSubmit(); });
  if (userForm) userForm.addEventListener('submit', saveUser);

  // Inventory search/filter
  if (inventorySearch) inventorySearch.addEventListener('input', applyFilters);
  if (categoryFilter) categoryFilter.addEventListener('change', applyFilters);
  if (statusFilter) statusFilter.addEventListener('change', applyFilters);

  // Sales search/filter
  if (salesSearch) salesSearch.addEventListener('input', applySalesFilters);
  if (paymentFilter) paymentFilter.addEventListener('change', applySalesFilters);
  if (salesStatusFilter) salesStatusFilter.addEventListener('change', applySalesFilters);

  // Sort
  $$('.sortable').forEach(th => {
    th.addEventListener('click', () => { if (th.dataset.sort) sortProducts(th.dataset.sort); });
  });

  // Settings tabs
  settingsTabs.forEach(tab => {
    tab.addEventListener('click', () => {
      settingsTabs.forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      settingsPanels.forEach(p => p.classList.remove('active'));
      const panel = $(`#settings-${tab.dataset.tab}`);
      if (panel) panel.classList.add('active');
      if (tab.dataset.tab === 'coupons') renderCoupons();
    });
  });

  // Theme toggle
  const themeToggle = document.getElementById('themeToggle');
  if (themeToggle) themeToggle.addEventListener('click', toggleTheme);

  // Cash flow events
  const addTxBtn = document.getElementById('addTransactionBtn');
  if (addTxBtn) addTxBtn.addEventListener('click', openCashFlowModal);
  const cfModalClose = document.getElementById('cfModalClose');
  if (cfModalClose) cfModalClose.addEventListener('click', closeCashFlowModal);
  const cfModalCancel = document.getElementById('cfModalCancel');
  if (cfModalCancel) cfModalCancel.addEventListener('click', closeCashFlowModal);
  const cfModalOverlay = document.getElementById('cfModalOverlay');
  if (cfModalOverlay) cfModalOverlay.addEventListener('click', e => { if (e.target === cfModalOverlay) closeCashFlowModal(); });
  const cfForm = document.getElementById('cfForm');
  if (cfForm) cfForm.addEventListener('submit', saveCashFlow);
  const cfSearch = document.getElementById('cfSearch');
  if (cfSearch) cfSearch.addEventListener('input', renderCashFlow);
  const cfTypeFilter = document.getElementById('cfTypeFilter');
  if (cfTypeFilter) cfTypeFilter.addEventListener('change', renderCashFlow);
  const cfCategoryFilter = document.getElementById('cfCategoryFilter');
  if (cfCategoryFilter) cfCategoryFilter.addEventListener('change', renderCashFlow);

  // Customer events
  const addCustBtn = document.getElementById('addCustomerBtn');
  if (addCustBtn) addCustBtn.addEventListener('click', () => openCustomerModal());
  const custModalClose = document.getElementById('customerModalClose');
  if (custModalClose) custModalClose.addEventListener('click', closeCustomerModal);
  const custModalCancel = document.getElementById('customerModalCancel');
  if (custModalCancel) custModalCancel.addEventListener('click', closeCustomerModal);
  const custModalOverlay = document.getElementById('customerModalOverlay');
  if (custModalOverlay) custModalOverlay.addEventListener('click', e => { if (e.target === custModalOverlay) closeCustomerModal(); });
  const custForm = document.getElementById('customerForm');
  if (custForm) custForm.addEventListener('submit', saveCustomer);

  // Store settings
  const saveStoreBtn = document.getElementById('saveStoreSettings');
  if (saveStoreBtn) saveStoreBtn.addEventListener('click', saveStoreSettings);
  const storeColor = document.getElementById('storeColor');
  const storeColorHex = document.getElementById('storeColorHex');
  if (storeColor && storeColorHex) {
    storeColor.addEventListener('input', () => { storeColorHex.textContent = storeColor.value; });
  }

  // My Account
  const saveAccountBtn = document.getElementById('saveAccountPassword');
  if (saveAccountBtn) saveAccountBtn.addEventListener('click', saveAccountPassword);

  // Coupon modal
  if (addCouponBtn) addCouponBtn.addEventListener('click', () => openCouponModal(-1));
  if (couponModalClose) couponModalClose.addEventListener('click', closeCouponModal);
  if (couponModalCancel) couponModalCancel.addEventListener('click', closeCouponModal);
  if (couponModalOverlay) couponModalOverlay.addEventListener('click', e => { if (e.target === couponModalOverlay) closeCouponModal(); });
  if (couponModalSave) couponModalSave.addEventListener('click', saveCoupon);

  // POS coupon — cards rendered via renderCouponSelect()

  // PDF export
  const reportsExportBtn = document.getElementById('reportsExportBtn');
  if (reportsExportBtn) reportsExportBtn.addEventListener('click', exportSalesPDF);
  const exportSalesBtn = document.getElementById('exportSalesBtn');
  if (exportSalesBtn) {
    exportSalesBtn.addEventListener('click', exportSalesPDF);
  }

  // Onboarding
  const onboardingNext = document.getElementById('onboardingNext');
  if (onboardingNext) onboardingNext.addEventListener('click', nextOnboardingStep);
  const onboardingSkip = document.getElementById('onboardingSkip');
  if (onboardingSkip) onboardingSkip.addEventListener('click', closeOnboarding);
  $$('#onboardingDots .dot').forEach(dot => {
    dot.addEventListener('click', () => updateOnboardingStep(parseInt(dot.dataset.step)));
  });

  // Bottom nav
  $$('.bottom-nav-item').forEach(item => {
    item.addEventListener('click', e => {
      e.preventDefault();
      if (item.dataset.section) navigateTo(item.dataset.section);
    });
  });

  // Sale detail modal — event delegation on sales table
  if (salesBody) {
    salesBody.addEventListener('click', e => {
      const btn = e.target.closest('.view-btn');
      if (btn && btn.dataset.index !== undefined) {
        openSaleDetail(parseInt(btn.dataset.index));
      }
    });
  }
  if (saleDetailClose) saleDetailClose.addEventListener('click', closeSaleDetail);
  if (saleDetailCancel) saleDetailCancel.addEventListener('click', closeSaleDetail);
  if (saleDetailOverlay) saleDetailOverlay.addEventListener('click', e => { if (e.target === saleDetailOverlay) closeSaleDetail(); });

  // Period buttons (6M / 12M)
  periodBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const months = parseInt(btn.textContent, 10);
      if (!isNaN(months)) setSalesPeriod(months);
    });
  });

  // Notification bell
  if (bellBtn) bellBtn.addEventListener('click', handleBellClick);

  // Escape key for new modals
  // Already handled below, but we need to extend the escape handler:
  // (Extended below in the existing escape handler)

  // AI Promotions refresh button
  const refreshPromoBtn = document.getElementById('refreshPromoBtn');
  if (refreshPromoBtn) {
    refreshPromoBtn.addEventListener('click', (e) => {
      e.preventDefault();
      renderAIPromotions();
    });
  }



  // Global search Ctrl+K / Escape
  document.addEventListener('keydown', e => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
      e.preventDefault();
      if (globalSearch) globalSearch.focus();
    }
    if (e.key === 'Escape') {
      if (modalOverlay.classList.contains('open')) closeModal();
      if (catModalOverlay.classList.contains('open')) closeCategoryModal();
      if (userModalOverlay.classList.contains('open')) closeUserModal();
      if (document.getElementById('cfModalOverlay').classList.contains('open')) closeCashFlowModal();
      if (document.getElementById('customerModalOverlay').classList.contains('open')) closeCustomerModal();
      if (document.getElementById('onboardingOverlay').classList.contains('open')) closeOnboarding();
      if (saleDetailOverlay && saleDetailOverlay.classList.contains('open')) closeSaleDetail();
    }
  });

  // Close mobile sidebar on resize
  window.addEventListener('resize', () => {
    if (window.innerWidth > 768) {
      sidebar.classList.remove('mobile-open');
      sidebarOverlay.classList.remove('active');
    }
  });

  console.log('Stoklytics inicializado com sucesso!');
}

document.addEventListener('DOMContentLoaded', init);

// ============================================
// Export to Excel
// ============================================
window.exportToExcel = async function(table) {
  try {
    const tables = table === 'all'
      ? ['products', 'customers', 'sales', 'categories', 'cash_flow_transactions']
      : [table];

    const wb = XLSX.utils.book_new();

    for (const t of tables) {
      let data;
      switch (t) {
        case 'products': data = await fetchProducts(); break;
        case 'customers': data = await fetchCustomers(); break;
        case 'sales': data = await fetchSales(); break;
        case 'categories': data = await fetchCategories(); break;
        case 'cash_flow_transactions': data = await fetchCashFlow(); break;
        default: data = [];
      }
      if (data.length === 0) continue;

      const clean = data.map(item => {
        const { id, _id, ...rest } = item;
        return rest;
      });

      const ws = XLSX.utils.json_to_sheet(clean);
      XLSX.utils.book_append_sheet(wb, ws, t.charAt(0).toUpperCase() + t.slice(1));
    }

    const filename = table === 'all' ? 'stoklytics_completo.xlsx' : `stoklytics_${table}.xlsx`;
    XLSX.writeFile(wb, filename);
    console.log(`Exportado: ${filename}`);
  } catch (err) {
    console.error('Erro ao exportar:', err);
    alert('Erro ao exportar: ' + err.message);
  }
}
