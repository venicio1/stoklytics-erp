/* ============================================
   Stoklytics — SQLite Database Layer (sql.js)
   ============================================ */

const initSqlJs = require('sql.js');
const fs = require('fs');
const path = require('path');

const DB_PATH = path.join(__dirname, '..', 'stoklytics.db');

let db = null;

async function getDb() {
  if (db) return db;

  const SQL = await initSqlJs();

  if (fs.existsSync(DB_PATH)) {
    const buffer = fs.readFileSync(DB_PATH);
    db = new SQL.Database(buffer);
  } else {
    db = new SQL.Database();
  }

  db.run('PRAGMA foreign_keys = ON');
  return db;
}

function saveDb() {
  if (!db) return;
  const data = db.export();
  const buffer = Buffer.from(data);
  fs.writeFileSync(DB_PATH, buffer);
}

function query(sql, params = []) {
  const stmt = db.prepare(sql);
  if (params.length > 0) stmt.bind(params);
  const rows = [];
  while (stmt.step()) {
    rows.push(stmt.getAsObject());
  }
  stmt.free();
  return rows;
}

function queryOne(sql, params = []) {
  const rows = query(sql, params);
  return rows.length > 0 ? rows[0] : null;
}

function execute(sql, params = []) {
  db.run(sql, params.map(p => p === undefined ? null : p));
  const lastId = getLastId();
  saveDb();
  return { changes: db.getRowsModified(), lastInsertRowid: lastId };
}

function getLastId() {
  const r = queryOne('SELECT last_insert_rowid() as id');
  return r ? r.id : 0;
}

function execRaw(sql) {
  // Split multiple statements and run individually
  const stmts = sql.split(';').map(s => s.trim()).filter(s => s.length > 0);
  for (const stmt of stmts) {
    try {
      db.run(stmt + ';');
    } catch (e) {
      console.error('SQL error on:', stmt.substring(0, 80));
      throw e;
    }
  }
  saveDb();
}

// ============================================
// Initialize schema + seed
// ============================================

async function initDatabase() {
  await getDb();

  // === MIGRATION: rename tables from English to Portuguese ===
  const tableMap = {
    'app_users': 'usuarios_app',
    'categories': 'categorias',
    'products': 'produtos',
    'customers': 'clientes',
    'sales': 'vendas',
    'sale_items': 'itens_venda',
    'cash_flow_transactions': 'transacoes_fluxo_caixa',
    'seller_goals': 'metas_vendedor',
    'store_settings': 'config_loja',
    'recent_activity': 'atividade_recente',
    'coupons': 'cupons'
  };
  for (const [oldName, newName] of Object.entries(tableMap)) {
    try { db.run(`ALTER TABLE "${oldName}" RENAME TO "${newName}"`); saveDb(); } catch (e) {}
  }

  // Rename columns in migrated tables
  const colMigrations = [
    ['produtos', 'sku', 'codigo'], ['produtos', 'cost_price', 'preco_custo'], ['produtos', 'sale_price', 'preco_venda'],
    ['produtos', 'quantity', 'quantidade'], ['produtos', 'sizes', 'tamanhos'], ['produtos', 'category', 'categoria'], ['produtos', 'icon', 'icone'],
    ['clientes', 'total_spent', 'total_gasto'], ['clientes', 'visits', 'visitas'], ['clientes', 'notes', 'observacoes'],
    ['vendas', 'order_number', 'numero_pedido'], ['vendas', 'seller', 'vendedor'], ['vendas', 'payment', 'pagamento'], ['vendas', 'customer_id', 'cliente_id'],
    ['itens_venda', 'sale_id', 'venda_id'], ['itens_venda', 'product_name', 'nome_produto'], ['itens_venda', 'quantity', 'quantidade'], ['itens_venda', 'unit_price', 'preco_unitario'],
    ['transacoes_fluxo_caixa', 'description', 'descricao'], ['transacoes_fluxo_caixa', 'type', 'tipo'], ['transacoes_fluxo_caixa', 'value', 'valor'], ['transacoes_fluxo_caixa', 'category', 'categoria'], ['transacoes_fluxo_caixa', 'sale_id', 'venda_id'],
    ['metas_vendedor', 'seller_name', 'nome_vendedor'], ['metas_vendedor', 'goal_value', 'valor_meta'], ['metas_vendedor', 'goal_year', 'ano_meta'], ['metas_vendedor', 'goal_month', 'mes_meta'],
    ['config_loja', 'name', 'nome_loja'], ['config_loja', 'color', 'cor'], ['config_loja', 'logo', 'logotipo'],
    ['atividade_recente', 'type', 'tipo'], ['atividade_recente', 'title', 'titulo'], ['atividade_recente', 'description', 'descricao'],
    ['usuarios_app', 'password', 'senha'], ['usuarios_app', 'name', 'nome'], ['usuarios_app', 'role', 'cargo'], ['usuarios_app', 'role_class', 'classe_cargo'], ['usuarios_app', 'initials', 'iniciais'], ['usuarios_app', 'color', 'cor'],
    ['cupons', 'description', 'descricao'], ['cupons', 'discount_type', 'tipo_desconto'], ['cupons', 'discount_value', 'valor_desconto'], ['cupons', 'min_quantity', 'quantidade_minima'], ['cupons', 'category_restriction', 'restricao_categoria'], ['cupons', 'usage_limit', 'limite_uso'], ['cupons', 'used_count', 'usos_realizados'], ['cupons', 'expires_at', 'expira_em']
  ];
  for (const [tbl, oldCol, newCol] of colMigrations) {
    try { db.run(`ALTER TABLE "${tbl}" RENAME COLUMN "${oldCol}" TO "${newCol}"`); saveDb(); } catch (e) {}
  }

  // Drop old-named indexes, create new ones
  db.run('DROP INDEX IF EXISTS idx_products_category');
  db.run('DROP INDEX IF EXISTS idx_sales_date');
  db.run('DROP INDEX IF EXISTS idx_sales_seller');
  db.run('DROP INDEX IF EXISTS idx_customers_name');
  db.run('DROP INDEX IF EXISTS idx_cash_flow_date');
  db.run('DROP INDEX IF EXISTS idx_recent_activity_created');
  db.run('DROP INDEX IF EXISTS idx_seller_goals_unique');

  // Individual CREATE TABLE statements — avoids sql.js multi-statement issues
  db.run(`CREATE TABLE IF NOT EXISTS usuarios_app (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    auth_id TEXT,
    email TEXT UNIQUE NOT NULL,
    senha TEXT NOT NULL DEFAULT '',
    nome TEXT NOT NULL,
    cargo TEXT NOT NULL DEFAULT 'Vendedor',
    classe_cargo TEXT NOT NULL DEFAULT 'editor',
    avatar TEXT NOT NULL DEFAULT '',
    cor TEXT NOT NULL DEFAULT '#6366F1',
    iniciais TEXT NOT NULL DEFAULT '',
    active INTEGER NOT NULL DEFAULT 1,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
  )`);
  db.run(`CREATE TABLE IF NOT EXISTS categorias (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT UNIQUE NOT NULL,
    icone TEXT NOT NULL DEFAULT 'fa-solid fa-shirt',
    cor TEXT NOT NULL DEFAULT '#6366F1',
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  )`);
  db.run(`CREATE TABLE IF NOT EXISTS produtos (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nome TEXT NOT NULL,
    codigo TEXT UNIQUE NOT NULL,
    categoria TEXT NOT NULL,
    tamanhos TEXT NOT NULL DEFAULT '[]',
    quantidade INTEGER NOT NULL DEFAULT 0,
    preco_custo REAL NOT NULL DEFAULT 0,
    preco_venda REAL NOT NULL DEFAULT 0,
    icone TEXT NOT NULL DEFAULT 'fa-solid fa-shirt',
    foto TEXT NOT NULL DEFAULT '',
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
  )`);
  db.run(`CREATE TABLE IF NOT EXISTS clientes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nome TEXT NOT NULL,
    phone TEXT NOT NULL DEFAULT '',
    email TEXT NOT NULL DEFAULT '',
    total_gasto REAL NOT NULL DEFAULT 0,
    visitas INTEGER NOT NULL DEFAULT 0,
    observacoes TEXT DEFAULT '',
    active INTEGER NOT NULL DEFAULT 1,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
  )`);
  db.run(`CREATE TABLE IF NOT EXISTS vendas (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    numero_pedido TEXT UNIQUE NOT NULL,
    date TEXT NOT NULL DEFAULT (datetime('now')),
    vendedor TEXT NOT NULL,
    total REAL NOT NULL DEFAULT 0,
    pagamento TEXT NOT NULL DEFAULT 'Pix',
    status TEXT NOT NULL DEFAULT 'Concluído',
    cliente_id INTEGER REFERENCES clientes(id) ON DELETE SET NULL,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  )`);
  db.run(`CREATE TABLE IF NOT EXISTS itens_venda (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    venda_id INTEGER NOT NULL REFERENCES vendas(id) ON DELETE CASCADE,
    nome_produto TEXT NOT NULL,
    quantidade INTEGER NOT NULL DEFAULT 1,
    preco_unitario REAL NOT NULL DEFAULT 0
  )`);
  db.run(`CREATE TABLE IF NOT EXISTS transacoes_fluxo_caixa (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    date TEXT NOT NULL DEFAULT (date('now')),
    descricao TEXT NOT NULL,
    tipo TEXT NOT NULL CHECK (tipo IN ('entrada','saida')),
    valor REAL NOT NULL DEFAULT 0,
    categoria TEXT NOT NULL DEFAULT 'Outros',
    venda_id INTEGER REFERENCES vendas(id) ON DELETE SET NULL,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  )`);
  db.run(`CREATE TABLE IF NOT EXISTS metas_vendedor (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nome_vendedor TEXT NOT NULL,
    valor_meta REAL NOT NULL DEFAULT 15000,
    ano_meta INTEGER NOT NULL DEFAULT 2026,
    mes_meta INTEGER NOT NULL DEFAULT 1,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  )`);
  db.run('CREATE UNIQUE INDEX IF NOT EXISTS idx_metas_vendedor_unique ON metas_vendedor(nome_vendedor, ano_meta, mes_meta)');
  db.run(`CREATE TABLE IF NOT EXISTS config_loja (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nome_loja TEXT NOT NULL DEFAULT 'Stoklytics',
    cor TEXT NOT NULL DEFAULT '#6366F1',
    logotipo TEXT NOT NULL DEFAULT '',
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
  )`);
  db.run(`CREATE TABLE IF NOT EXISTS atividade_recente (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    tipo TEXT NOT NULL CHECK (tipo IN ('entry','exit','edit')),
    titulo TEXT NOT NULL,
    descricao TEXT NOT NULL DEFAULT '',
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS cupons (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    code TEXT UNIQUE NOT NULL,
    descricao TEXT NOT NULL DEFAULT '',
    tipo_desconto TEXT NOT NULL DEFAULT 'percentage' CHECK (tipo_desconto IN ('percentage', 'fixed')),
    valor_desconto REAL NOT NULL DEFAULT 0,
    quantidade_minima INTEGER NOT NULL DEFAULT 0,
    restricao_categoria TEXT DEFAULT NULL,
    active INTEGER NOT NULL DEFAULT 1,
    limite_uso INTEGER DEFAULT NULL,
    usos_realizados INTEGER NOT NULL DEFAULT 0,
    expira_em TEXT DEFAULT NULL,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
  )`);

  // Indexes
  db.run('CREATE INDEX IF NOT EXISTS idx_produtos_categoria ON produtos(categoria)');
  db.run('CREATE INDEX IF NOT EXISTS idx_vendas_date ON vendas(date DESC)');
  db.run('CREATE INDEX IF NOT EXISTS idx_vendas_vendedor ON vendas(vendedor)');
  db.run('CREATE INDEX IF NOT EXISTS idx_clientes_nome ON clientes(nome)');
  db.run('CREATE INDEX IF NOT EXISTS idx_fluxo_caixa_date ON transacoes_fluxo_caixa(date DESC)');
  db.run('CREATE INDEX IF NOT EXISTS idx_atividade_data ON atividade_recente(created_at DESC)');

  saveDb();

  // Seed
  const count = queryOne('SELECT COUNT(*) as count FROM categorias');
  if (count.count === 0) {
    const cats = ['Camisetas', 'Calças', 'Vestidos', 'Calçados', 'Jaquetas', 'Acessórios'];
    const icons = ['fa-solid fa-shirt', 'fa-solid fa-shirt', 'fa-solid fa-shirt', 'fa-solid fa-shoe-prints', 'fa-solid fa-shirt', 'fa-solid fa-bag-shopping'];
    const colors = ['#6366F1', '#22C55E', '#EAB308', '#EF4444', '#8B5CF6', '#06B6D4'];
    for (let i = 0; i < cats.length; i++) {
      execute('INSERT OR IGNORE INTO categorias (name, icone, cor) VALUES (?, ?, ?)', [cats[i], icons[i], colors[i]]);
    }

    const products = [
      ['Camiseta Oversized Cotton', 'SKU-001', 'Camisetas', JSON.stringify(['P','M','G','GG']), 48, 32.90, 89.90],
      ['Calça Jeans Wide Leg', 'SKU-002', 'Calças', JSON.stringify(['36','38','40','42','44']), 32, 67.50, 189.90],
      ['Jaqueta Puffer Noir', 'SKU-003', 'Jaquetas', JSON.stringify(['P','M','G','GG']), 8, 145.00, 349.90],
      ['Vestido Midi Floral', 'SKU-004', 'Vestidos', JSON.stringify(['P','M','G']), 22, 54.30, 159.90],
      ['Tênis Urban Runner', 'SKU-005', 'Calçados', JSON.stringify(['35','36','37','38','39','40','41','42']), 4, 98.00, 259.90],
      ['Regata Cropped Slim', 'SKU-006', 'Camisetas', JSON.stringify(['PP','P','M','G']), 0, 22.40, 59.90],
      ['Calça Cargo Street', 'SKU-007', 'Calças', JSON.stringify(['P','M','G','GG']), 18, 73.00, 199.90],
      ['Blazer Estruturado', 'SKU-008', 'Jaquetas', JSON.stringify(['P','M','G','GG']), 6, 132.00, 329.90],
      ['Bolsa Tote Couro Vegano', 'SKU-009', 'Acessórios', JSON.stringify(['Único']), 14, 89.00, 219.90],
      ['Sandália Anabela', 'SKU-010', 'Calçados', JSON.stringify(['34','35','36','37','38','39']), 0, 47.80, 139.90]
    ];
    for (const p of products) {
      execute('INSERT OR IGNORE INTO produtos (nome, codigo, categoria, tamanhos, quantidade, preco_custo, preco_venda) VALUES (?, ?, ?, ?, ?, ?, ?)', p);
    }

    const customers = [
      ['Maria Silva', '(11) 98888-0001', 'maria.silva@email.com', 1259.70, 4, 'Cliente VIP, prefere roupas casuais'],
      ['João Santos', '(11) 97777-0002', 'joao.santos@email.com', 839.50, 3, 'Compra para a esposa'],
      ['Ana Costa', '(11) 96666-0003', 'ana.costa@email.com', 2109.90, 6, 'Influenciadora local'],
      ['Pedro Oliveira', '(11) 95555-0004', 'pedro.oliveira@email.com', 449.80, 2, ''],
      ['Carla Souza', '(11) 94444-0005', 'carla.souza@email.com', 679.60, 3, 'Prefere calçados e acessórios']
    ];
    for (const c of customers) {
      execute('INSERT OR IGNORE INTO clientes (nome, phone, email, total_gasto, visitas, observacoes) VALUES (?, ?, ?, ?, ?, ?)', c);
    }

    execute('INSERT OR IGNORE INTO config_loja (id, nome_loja, cor, logotipo) VALUES (1, ?, ?, ?)', ['Stoklytics', '#6366F1', '']);

    const userCount = queryOne('SELECT COUNT(*) as count FROM usuarios_app');
    if (userCount.count === 0) {
      const seedUsers = [
        ['admin@stoklytics.com.br', 'admin123', 'Vitor Marques', 'Administrador', 'admin', 'VM', 'VM', '#6366F1'],
        ['ana@stoklytics.com.br', 'ana123', 'Ana Oliveira', 'Vendedora', 'editor', 'AO', 'AO', '#22C55E'],
        ['carlos@stoklytics.com.br', 'carlos123', 'Carlos Mendes', 'Estoquista', 'viewer', 'CM', 'CM', '#EAB308']
      ];
      for (const u of seedUsers) {
        execute(
          `INSERT OR IGNORE INTO usuarios_app (email, senha, nome, cargo, classe_cargo, avatar, iniciais, cor, active, created_at, updated_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1, datetime('now'), datetime('now'))`,
          u
        );
      }
    }

    const couponCount = queryOne('SELECT COUNT(*) as count FROM cupons');
    if (couponCount.count === 0) {
      const coupons = [
        ['FRETE10', '10% de desconto em Camisetas', 'percentage', 10, 0, 'Camisetas', null, 1, null, null],
        ['PROMO20', 'R$ 20 off em compras acima de 3 peças', 'fixed', 20, 3, null, null, 1, null, null],
        ['VERAO25', '25% off em Vestidos', 'percentage', 25, 0, 'Vestidos', null, 1, 50, null]
      ];
      for (const c of coupons) {
        execute(
          `INSERT OR IGNORE INTO cupons (code, descricao, tipo_desconto, valor_desconto, quantidade_minima, restricao_categoria, limite_uso, usos_realizados, active, expira_em) VALUES (?, ?, ?, ?, ?, ?, ?, 0, ?, ?)`,
          c
        );
      }
    }
  }
}

module.exports = { getDb, query, queryOne, execute, execRaw, initDatabase };