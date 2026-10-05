/* ============================================
   Stoklytics — Express REST API Server
   ============================================ */

const express = require('express');
const path = require('path');
const cors = require('cors');
const { query, queryOne, execute, initDatabase } = require('./database');

const crypto = require('crypto');

const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '..')));

// ============================================
// Session Store (in-memory)
// ============================================

const sessions = new Map();

function createSession(user) {
  const token = crypto.randomBytes(32).toString('hex');
  sessions.set(token, {
    userId: user.id,
    email: user.email,
    role: user.cargo,
    roleClass: user.classe_cargo,
    name: user.nome,
    createdAt: new Date().toISOString()
  });
  return token;
}

// ============================================
// Auth Middleware
// ============================================

function requireAuth(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Token de autenticação não fornecido' });
  }
  const token = authHeader.slice(7);
  const session = sessions.get(token);
  if (!session) {
    return res.status(401).json({ error: 'Sessão inválida ou expirada' });
  }
  req.user = session;
  next();
}

function requireSection(section) {
  return (req, res, next) => {
    const permMap = {
      admin: { sections: ['overview','inventory','sales','pos','cashflow','customers','categories','sellers','reports','settings'] },
      manager: { sections: ['overview','inventory','sales','pos','cashflow','customers','categories','sellers','reports','settings'] },
      editor: { sections: ['overview','inventory','pos','customers','sellers','settings'] },
      viewer: { sections: ['overview','inventory','settings'] }
    };
    const allowed = permMap[req.user.roleClass] || permMap.editor;
    if (!allowed.sections.includes(section)) {
      return res.status(403).json({ error: 'Acesso negado a esta seção' });
    }
    next();
  };
}

function requirePerm(resource, action) {
  return (req, res, next) => {
    const permMap = {
      admin: {
        inventory: { view: true, create: true, edit: true, delete: true },
        customers: { view: true, create: true, edit: true, delete: true },
        users: { create: true, edit: true, delete: true }
      },
      manager: {
        inventory: { view: true, create: true, edit: true, delete: true },
        customers: { view: true, create: true, edit: true, delete: true },
        users: { create: true, edit: true, delete: true }
      },
      editor: {
        inventory: { view: true, create: true, edit: false, delete: false },
        customers: { view: true, create: true, edit: true, delete: false },
        users: { create: false, edit: false, delete: false }
      },
      viewer: {
        inventory: { view: true, create: true, edit: false, delete: false },
        customers: { view: false, create: false, edit: false, delete: false },
        users: { create: false, edit: false, delete: false }
      }
    };
    const perms = permMap[req.user.roleClass] || permMap.editor;
    const resourcePerms = perms[resource];
    if (!resourcePerms || !resourcePerms[action]) {
      return res.status(403).json({ error: 'Ação não permitida para seu cargo' });
    }
    next();
  };
}

// ============================================
// Helpers
// ============================================

function parseRow(row) {
  if (!row) return null;
  if (row.active !== undefined) row.active = row.active === 1 || row.active === true;
  return row;
}

// ============================================
// Auth
// ============================================

app.post('/api/auth/signin', (req, res) => {
  const { email, password } = req.body;
  const user = queryOne('SELECT * FROM usuarios_app WHERE email=?', [email]);
  if (!user || user.senha !== password) {
    return res.status(401).json({ error: 'E-mail ou senha inválidos' });
  }
  const token = createSession(user);
  res.json({
    token,
    user: {
      id: user.id,
      email: user.email,
      name: user.nome,
      role: user.cargo,
      roleClass: user.classe_cargo,
      initials: user.iniciais,
      color: user.cor
    }
  });
});

app.post('/api/auth/signout', (req, res) => {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    sessions.delete(authHeader.slice(7));
  }
  res.json({ ok: true });
});

app.post('/api/auth/signup', (req, res) => {
  const { email, password, userData } = req.body;
  const now = new Date().toISOString();
  const result = execute(
    `INSERT INTO usuarios_app (auth_id, email, senha, nome, cargo, classe_cargo, avatar, iniciais, cor, active, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?, ?)`,
    ['local_' + Date.now(), email, password || '', userData.name, userData.role || 'Vendedor', userData.roleClass || 'editor',
     userData.initials || '', userData.initials || '', userData.color || '#6366F1', now, now]
  );
  const newUser = queryOne('SELECT * FROM usuarios_app WHERE id=?', [result.lastInsertRowid]);
  const token = createSession(newUser);
  res.json({
    token,
    user: { id: newUser.id, email: newUser.email }
  });
});

// ============================================
// App Users (authenticated)
// ============================================

app.get('/api/app_users', requireAuth, (req, res) => {
  res.json(query('SELECT * FROM usuarios_app ORDER BY nome'));
});

app.put('/api/app_users/:id', requireAuth, requirePerm('users', 'edit'), (req, res) => {
  const { name, email, password, role, role_class, active } = req.body;
  const now = new Date().toISOString();
  if (password) {
    execute(
      `UPDATE usuarios_app SET nome=?, email=?, senha=?, cargo=?, classe_cargo=?, active=?, updated_at=? WHERE id=?`,
      [name, email, password, role, role_class, active ? 1 : 0, now, req.params.id]
    );
  } else {
    execute(
      `UPDATE usuarios_app SET nome=?, email=?, cargo=?, classe_cargo=?, active=?, updated_at=? WHERE id=?`,
      [name, email, role, role_class, active ? 1 : 0, now, req.params.id]
    );
  }
  res.json(parseRow(queryOne('SELECT * FROM usuarios_app WHERE id=?', [req.params.id])));
});

app.post('/api/app_users', requireAuth, requirePerm('users', 'create'), (req, res) => {
  const { name, email, password, role, role_class, initials, color } = req.body;
  const now = new Date().toISOString();
  const result = execute(
    `INSERT INTO usuarios_app (auth_id, email, senha, nome, cargo, classe_cargo, avatar, iniciais, cor, active, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?, ?)`,
    ['local_' + Date.now(), email, password || '', name, role || 'Vendedor', role_class || 'editor',
     initials || '', initials || '', color || '#6366F1', now, now]
  );
  res.json(parseRow(queryOne('SELECT * FROM usuarios_app WHERE id=?', [result.lastInsertRowid])));
});

app.post('/api/auth/change-password', requireAuth, (req, res) => {
  const { userId, currentPassword, newPassword } = req.body;
  const user = queryOne('SELECT * FROM usuarios_app WHERE id=?', [userId]);
  if (!user) return res.status(404).json({ error: 'Usuário não encontrado' });
  if (user.senha !== currentPassword) return res.status(401).json({ error: 'Senha atual inválida' });
  execute('UPDATE usuarios_app SET senha=?, updated_at=datetime(\'now\') WHERE id=?', [newPassword, userId]);
  res.json({ ok: true });
});

app.delete('/api/app_users/:id', requireAuth, requirePerm('users', 'delete'), (req, res) => {
  execute('DELETE FROM usuarios_app WHERE id=?', [req.params.id]);
  res.json({ ok: true });
});

// ============================================
// Categories (authenticated)
// ============================================

app.get('/api/categories', requireAuth, (req, res) => {
  res.json(query('SELECT * FROM categorias ORDER BY name'));
});

app.post('/api/categories', requireAuth, requireSection('categories'), (req, res) => {
  const { name, icon, color } = req.body;
  const result = execute('INSERT INTO categorias (name, icone, cor) VALUES (?, ?, ?)', [name, icon, color]);
  res.json(queryOne('SELECT * FROM categorias WHERE id=?', [result.lastInsertRowid]));
});

app.put('/api/categories/:id', requireAuth, requireSection('categories'), (req, res) => {
  const { name, icon, color } = req.body;
  execute('UPDATE categorias SET name=?, icone=?, cor=? WHERE id=?', [name, icon, color, req.params.id]);
  res.json(queryOne('SELECT * FROM categorias WHERE id=?', [req.params.id]));
});

app.delete('/api/categories/:id', requireAuth, requireSection('categories'), (req, res) => {
  execute('DELETE FROM categorias WHERE id=?', [req.params.id]);
  res.json({ ok: true });
});

// ============================================
// Products (authenticated)
// ============================================

app.get('/api/products', requireAuth, (req, res) => {
  const rows = query('SELECT * FROM produtos ORDER BY nome');
  for (const r of rows) {
    try { r.tamanhos = JSON.parse(r.tamanhos); } catch {}
  }
  res.json(rows);
});

app.get('/api/products/:id', requireAuth, (req, res) => {
  const r = queryOne('SELECT * FROM produtos WHERE id=?', [req.params.id]);
  if (!r) return res.status(404).json({ error: 'Produto não encontrado' });
  try { r.tamanhos = JSON.parse(r.tamanhos); } catch {}
  res.json(r);
});

app.post('/api/products', requireAuth, requirePerm('inventory', 'create'), (req, res) => {
  const { name, sku, category, sizes, quantity, cost_price, sale_price, icon } = req.body;
  const result = execute(
    'INSERT INTO produtos (nome, codigo, categoria, tamanhos, quantidade, preco_custo, preco_venda, icone, foto) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
    [name, sku, category, JSON.stringify(sizes || []), quantity, cost_price, sale_price, icon || 'fa-solid fa-shirt', req.body.photo || '']
  );
  const r = queryOne('SELECT * FROM produtos WHERE id=?', [result.lastInsertRowid]);
  try { r.tamanhos = JSON.parse(r.tamanhos); } catch {}
  res.json(r);
});

app.put('/api/products/:id', requireAuth, requirePerm('inventory', 'edit'), (req, res) => {
  const { name, sku, category, sizes, quantity, cost_price, sale_price, icon } = req.body;
  const existing = queryOne('SELECT * FROM produtos WHERE id=?', [req.params.id]);
  if (!existing) return res.status(404).json({ error: 'Produto não encontrado' });
  execute(
    `UPDATE produtos SET nome=?, codigo=?, categoria=?, tamanhos=?, quantidade=?, preco_custo=?, preco_venda=?, icone=?, foto=?, updated_at=datetime('now') WHERE id=?`,
    [name ?? existing.nome, sku ?? existing.codigo, category ?? existing.categoria,
     JSON.stringify(sizes ?? JSON.parse(existing.tamanhos)), quantity ?? existing.quantidade,
     cost_price ?? existing.preco_custo, sale_price ?? existing.preco_venda,
     icon ?? (existing.icone || 'fa-solid fa-shirt'),
     req.body.photo ?? (existing.foto || ''),
     req.params.id]
  );
  const r = queryOne('SELECT * FROM produtos WHERE id=?', [req.params.id]);
  try { r.tamanhos = JSON.parse(r.tamanhos); } catch {}
  res.json(r);
});

app.delete('/api/products/:id', requireAuth, requirePerm('inventory', 'delete'), (req, res) => {
  execute('DELETE FROM produtos WHERE id=?', [req.params.id]);
  res.json({ ok: true });
});

// ============================================
// Customers (authenticated)
// ============================================

app.get('/api/customers', requireAuth, (req, res) => {
  res.json(query('SELECT * FROM clientes ORDER BY nome').map(parseRow));
});

app.post('/api/customers', requireAuth, requirePerm('customers', 'create'), (req, res) => {
  const { name, phone, email, notes } = req.body;
  const result = execute(
    'INSERT INTO clientes (nome, phone, email, observacoes) VALUES (?, ?, ?, ?)',
    [name, phone || '', email || '', notes || '']
  );
  res.json(parseRow(queryOne('SELECT * FROM clientes WHERE id=?', [result.lastInsertRowid])));
});

app.put('/api/customers/:id', requireAuth, requirePerm('customers', 'edit'), (req, res) => {
  const { name, phone, email, total_spent, visits, notes, active } = req.body;
  execute(
    `UPDATE clientes SET nome=?, phone=?, email=?, total_gasto=?, visitas=?, observacoes=?, active=?, updated_at=datetime('now') WHERE id=?`,
    [name, phone, email, total_spent, visits, notes, active ? 1 : 0, req.params.id]
  );
  res.json(parseRow(queryOne('SELECT * FROM clientes WHERE id=?', [req.params.id])));
});

app.delete('/api/customers/:id', requireAuth, requirePerm('customers', 'delete'), (req, res) => {
  execute('DELETE FROM clientes WHERE id=?', [req.params.id]);
  res.json({ ok: true });
});

// ============================================
// Sales (authenticated)
// ============================================

app.get('/api/sales', requireAuth, (req, res) => {
  res.json(query('SELECT * FROM vendas ORDER BY date'));
});

app.post('/api/sales', requireAuth, requireSection('sales'), (req, res) => {
  const { order_number, date, seller, total, payment, status, customer_id } = req.body;
  const result = execute(
    'INSERT INTO vendas (numero_pedido, date, vendedor, total, pagamento, status, cliente_id) VALUES (?, ?, ?, ?, ?, ?, ?)',
    [order_number, date || new Date().toISOString(), seller, total, payment, status, customer_id || null]
  );
  const saleId = result.lastInsertRowid;

  if (req.body.items && req.body.items.length > 0) {
    for (const item of req.body.items) {
      execute('INSERT INTO itens_venda (venda_id, nome_produto, quantidade, preco_unitario) VALUES (?, ?, ?, ?)',
        [saleId, item.product_name, item.quantity, item.unit_price]);
    }
  }

  res.json({ ...req.body, id: saleId });
});

// ============================================
// Cash Flow (authenticated)
// ============================================

app.get('/api/cash_flow_transactions', requireAuth, (req, res) => {
  res.json(query('SELECT * FROM transacoes_fluxo_caixa ORDER BY date'));
});

app.post('/api/cash_flow_transactions', requireAuth, requireSection('cashflow'), (req, res) => {
  const { date, description, type, value, category, sale_id } = req.body;
  const result = execute(
    'INSERT INTO transacoes_fluxo_caixa (date, descricao, tipo, valor, categoria, venda_id) VALUES (?, ?, ?, ?, ?, ?)',
    [date, description, type, value, category || 'Outros', sale_id || null]
  );
  res.json({ ...req.body, id: result.lastInsertRowid });
});

app.delete('/api/cash_flow_transactions/:id', requireAuth, requireSection('cashflow'), (req, res) => {
  execute('DELETE FROM transacoes_fluxo_caixa WHERE id=?', [req.params.id]);
  res.json({ ok: true });
});

// ============================================
// Seller Goals (authenticated)
// ============================================

app.get('/api/seller_goals', requireAuth, (req, res) => {
  const y = parseInt(req.query.year) || new Date().getFullYear();
  const m = parseInt(req.query.month) || new Date().getMonth() + 1;
  res.json(query('SELECT * FROM metas_vendedor WHERE ano_meta=? AND mes_meta=?', [y, m]));
});

app.post('/api/seller_goals', requireAuth, requireSection('sellers'), (req, res) => {
  const { seller_name, goal_value, year, month } = req.body;
  const y = year || new Date().getFullYear();
  const m = month || new Date().getMonth() + 1;
  const existing = queryOne('SELECT * FROM metas_vendedor WHERE nome_vendedor=? AND ano_meta=? AND mes_meta=?', [seller_name, y, m]);
  if (existing) {
    execute("UPDATE metas_vendedor SET valor_meta=?, updated_at=datetime('now') WHERE id=?", [goal_value, existing.id]);
    res.json(queryOne('SELECT * FROM metas_vendedor WHERE id=?', [existing.id]));
  } else {
    const result = execute('INSERT INTO metas_vendedor (nome_vendedor, valor_meta, ano_meta, mes_meta) VALUES (?, ?, ?, ?)', [seller_name, goal_value, y, m]);
    res.json(queryOne('SELECT * FROM metas_vendedor WHERE id=?', [result.lastInsertRowid]));
  }
});

// ============================================
// Store Settings (authenticated)
// ============================================

app.get('/api/store_settings', requireAuth, (req, res) => {
  res.json(queryOne('SELECT * FROM config_loja LIMIT 1') || null);
});

app.put('/api/store_settings', requireAuth, requireSection('settings'), (req, res) => {
  const existing = queryOne('SELECT * FROM config_loja LIMIT 1');
  if (existing) {
    execute("UPDATE config_loja SET nome_loja=?, cor=?, logotipo=?, updated_at=datetime('now') WHERE id=?", [req.body.name, req.body.color, req.body.logo, existing.id]);
  } else {
    execute('INSERT INTO config_loja (nome_loja, cor, logotipo) VALUES (?, ?, ?)', [req.body.name, req.body.color, req.body.logo]);
  }
  res.json(queryOne('SELECT * FROM config_loja LIMIT 1'));
});

// ============================================
// Recent Activity (authenticated)
// ============================================

app.get('/api/recent_activity', requireAuth, (req, res) => {
  const limit = parseInt(req.query.limit) || 10;
  res.json(query('SELECT * FROM atividade_recente ORDER BY created_at DESC LIMIT ?', [limit]));
});

app.post('/api/recent_activity', requireAuth, (req, res) => {
  const { type, title, description } = req.body;
  const result = execute('INSERT INTO atividade_recente (tipo, titulo, descricao) VALUES (?, ?, ?)', [type, title, description || '']);
  res.json({ ...req.body, id: result.lastInsertRowid });
});

// ============================================
// Coupons (authenticated)
// ============================================

app.get('/api/coupons', requireAuth, (req, res) => {
  res.json(query('SELECT * FROM cupons ORDER BY code'));
});

app.post('/api/coupons', requireAuth, requireSection('settings'), (req, res) => {
  const { code, description, discount_type, discount_value, min_quantity, category_restriction, usage_limit, expires_at } = req.body;
  const result = execute(
    `INSERT INTO cupons (code, descricao, tipo_desconto, valor_desconto, quantidade_minima, restricao_categoria, limite_uso, expira_em, active) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1)`,
    [code.toUpperCase(), description, discount_type, discount_value, min_quantity || 0, category_restriction || null, usage_limit || null, expires_at || null]
  );
  res.json(queryOne('SELECT * FROM cupons WHERE id=?', [result.lastInsertRowid]));
});

app.put('/api/coupons/:id', requireAuth, requireSection('settings'), (req, res) => {
  const { code, description, discount_type, discount_value, min_quantity, category_restriction, usage_limit, expires_at, active } = req.body;
  execute(
    `UPDATE cupons SET code=?, descricao=?, tipo_desconto=?, valor_desconto=?, quantidade_minima=?, restricao_categoria=?, limite_uso=?, expira_em=?, active=?, updated_at=datetime('now') WHERE id=?`,
    [code, description, discount_type, discount_value, min_quantity, category_restriction, usage_limit, expires_at || null, active ? 1 : 0, req.params.id]
  );
  res.json(queryOne('SELECT * FROM cupons WHERE id=?', [req.params.id]));
});

app.post('/api/coupons/:id/use', requireAuth, (req, res) => {
  const coupon = queryOne('SELECT * FROM cupons WHERE id=?', [req.params.id]);
  if (!coupon) return res.status(404).json({ error: 'Cupom não encontrado' });
  execute('UPDATE cupons SET usos_realizados = usos_realizados + 1 WHERE id=?', [req.params.id]);
  res.json({ ok: true });
});

app.delete('/api/coupons/:id', requireAuth, requireSection('settings'), (req, res) => {
  execute('DELETE FROM cupons WHERE id=?', [req.params.id]);
  res.json({ ok: true });
});

// ============================================
// Global error handler (prevents server crash)
// ============================================

app.use((err, req, res, next) => {
  console.error('Unhandled error:', err.message);
  res.status(500).json({ error: err.message || 'Erro interno do servidor' });
});

// ============================================
// Start server
// ============================================

async function start() {
  await initDatabase();
  app.listen(PORT, () => {
    console.log(`Stoklytics API rodando em http://localhost:${PORT}`);
  });
}

start().catch(err => {
  console.error('Erro ao iniciar servidor:', err);
  process.exit(1);
});