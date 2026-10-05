/* ============================================
   Stoklytics — Synthetic Data Seed
   Generates data from 2025-10-01 to 2026-08-02
   ============================================ */

const { getDb, query, queryOne, execute, initDatabase } = require('./database');

// ── Helpers ──────────────────────────────────────────
function rand(min, max) { return Math.floor(Math.random() * (max - min + 1)) + min; }
function pick(arr) { return arr[rand(0, arr.length - 1)]; }
function fmtDate(d) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}
function fmtDatetime(d) {
  const date = fmtDate(d);
  const h = String(d.getHours()).padStart(2, '0');
  const mi = String(d.getMinutes()).padStart(2, '0');
  const s = String(d.getSeconds()).padStart(2, '0');
  return `${date} ${h}:${mi}:${s}`;
}

// ── Data pools ───────────────────────────────────────
const sellers = ['Vitor Marques', 'Ana Oliveira'];
const payments = ['Pix', 'Cartão de Crédito', 'Cartão de Débito', 'Dinheiro'];
const statuses = ['Concluído', 'Concluído', 'Concluído', 'Concluído', 'Cancelado'];

const produtos = [
  { nome: 'Camiseta Oversized Cotton', preco: 89.90, categoria: 'Camisetas' },
  { nome: 'Calça Jeans Wide Leg',     preco: 189.90, categoria: 'Calças' },
  { nome: 'Jaqueta Puffer Noir',      preco: 349.90, categoria: 'Jaquetas' },
  { nome: 'Vestido Midi Floral',      preco: 159.90, categoria: 'Vestidos' },
  { nome: 'Tênis Urban Runner',       preco: 259.90, categoria: 'Calçados' },
  { nome: 'Regata Cropped Slim',      preco: 59.90,  categoria: 'Camisetas' },
  { nome: 'Calça Cargo Street',       preco: 199.90, categoria: 'Calças' },
  { nome: 'Blazer Estruturado',       preco: 329.90, categoria: 'Jaquetas' },
  { nome: 'Bolsa Tote Couro Vegano',  preco: 219.90, categoria: 'Acessórios' },
  { nome: 'Sandália Anabela',         preco: 139.90, categoria: 'Calçados' },
];

const clienteNomes = [
  'Maria Silva', 'João Santos', 'Ana Costa', 'Pedro Oliveira', 'Carla Souza',
  'Lucas Oliveira', 'Juliana Lima', 'Rafael Alves', 'Fernanda Rocha', 'Bruno Costa',
  'Amanda Pereira', 'Diego Martins', 'Larissa Santos', 'Felipe Barbosa', 'Patrícia Souza',
  'Thiago Fernandes', 'Camila Ribeiro', 'Gustavo Azevedo', 'Vanessa Cardoso', 'Eduardo Gomes',
  'Letícia Carvalho', 'Rodrigo Teixeira', 'Isabela Nunes', 'Marcos Antunes', 'Bianca Freitas',
];

const descricoesEntrada = [
  'Venda avulsa', 'Venda balcão', 'Venda online', 'Venda por catálogo',
  'Venda no estoque', 'Venda promocional', 'Venda para cliente VIP',
];
const descricoesSaida = [
  'Fornecedor de tecidos', 'Aluguel da loja', 'Energia elétrica',
  'Salário funcionários', 'Manutenção do sistema', 'Material de escritório',
  'Marketing e publicidade', 'Frete de mercadorias', 'Impostos', 'Pró-labore',
];
const catSaida = [
  'Fornecedores', 'Operacional', 'Marketing', 'Folha de Pagamento', 'Impostos',
];

const meses = [
  { ano: 2025, mes: 10 }, { ano: 2025, mes: 11 }, { ano: 2025, mes: 12 },
  { ano: 2026, mes: 1 },  { ano: 2026, mes: 2 },  { ano: 2026, mes: 3 },
  { ano: 2026, mes: 4 },  { ano: 2026, mes: 5 },  { ano: 2026, mes: 6 },
  { ano: 2026, mes: 7 },  { ano: 2026, mes: 8 },
];

async function seed() {
  await initDatabase();
  console.log('Database initialized.');

  // Clean existing data (keep users, config, categories, products, coupons)
  execute('DELETE FROM itens_venda');
  execute('DELETE FROM vendas');
  execute('DELETE FROM transacoes_fluxo_caixa');
  execute('DELETE FROM atividade_recente');
  execute('DELETE FROM metas_vendedor');
  execute('DELETE FROM clientes');
  console.log('Old data cleared.');

  // ── Customers ──
  const clientes = [];
  const phones = [
    '(11) 9', '(11) 8', '(13) 9', '(19) 9', '(21) 9',
    '(31) 9', '(41) 9', '(51) 9', '(61) 9', '(71) 9',
  ];
  for (let i = 0; i < clienteNomes.length; i++) {
    const nome = clienteNomes[i];
    const phone = `${pick(phones)}${String(rand(1000, 9999))}-${String(rand(1000, 9999))}`;
    const email = nome.toLowerCase().replace(/\s+/g, '.') + '@email.com';
    // Created at random from Jul 2024 to Sep 2025
    const created = new Date(2024, 6 + rand(0, 14), rand(1, 28));
    const result = execute(
      `INSERT INTO clientes (nome, phone, email, total_gasto, visitas, observacoes, active, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, 1, ?, ?)`,
      [nome, phone, email, 0, 0, '', fmtDatetime(created), fmtDatetime(created)]
    );
    clientes.push({ id: result.lastInsertRowid, nome });
  }
  console.log(`Inserted ${clientes.length} customers.`);

  // ── Sales & Sale Items ──
  let orderNum = 1000;
  const allSales = [];

  for (const { ano, mes } of meses) {
    const daysInMonth = mes === 8 ? 2 : new Date(ano, mes, 0).getDate(); // Aug only up to day 2
    const numSales =mes === 8 ? rand(6, 12) : rand(18, 35);

    for (let s = 0; s < numSales; s++) {
      const day = rand(1, daysInMonth);
      // avoid weekends slightly less sales
      const d = new Date(ano, mes - 1, day);
      const hour = rand(9, 19);
      const min = rand(0, 59);
      const saleDate = new Date(ano, mes - 1, day, hour, min);
      const seller = pick(sellers);
      const payment = pick(payments);
      const status = pick(statuses);
      if (status === 'Cancelado') continue; // skip cancelled

      const cliente = pick(clientes);
      orderNum++;
      const numItems = rand(1, 4);
      const selectedProducts = [];
      for (let i = 0; i < numItems; i++) {
        selectedProducts.push(pick(produtos));
      }

      let total = 0;
      const items = selectedProducts.map(p => {
        const qty = rand(1, 3);
        const unitPrice = p.preco + (p.preco * rand(-10, 10) / 100); // ±10% variation
        const roundedPrice = Math.round(unitPrice * 100) / 100;
        total += roundedPrice * qty;
        return { nome: p.nome, qty, price: roundedPrice, categoria: p.categoria };
      });
      total = Math.round(total * 100) / 100;

      const saleResult = execute(
        `INSERT INTO vendas (numero_pedido, date, vendedor, total, pagamento, status, cliente_id, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [`PED-${orderNum}`, fmtDatetime(saleDate), seller, total, payment, status, cliente.id, fmtDatetime(saleDate)]
      );
      const saleId = saleResult.lastInsertRowid;

      for (const item of items) {
        execute(
          `INSERT INTO itens_venda (venda_id, nome_produto, quantidade, preco_unitario)
           VALUES (?, ?, ?, ?)`,
          [saleId, item.nome, item.qty, item.price]
        );
      }

      // Deduct from product stock
      for (const item of items) {
        const prod = queryOne('SELECT id, quantidade FROM produtos WHERE nome=?', [item.nome]);
        if (prod && prod.quantidade > 0) {
          const newQty = Math.max(0, prod.quantidade - item.qty);
          execute('UPDATE produtos SET quantidade=?, updated_at=datetime("now") WHERE id=?', [newQty, prod.id]);
        }
      }

      allSales.push({ id: saleId, date: saleDate, total, tipo: 'entrada', descricao: `Venda #${orderNum}` });

      // ── Cash flow: entrada for the sale ──
      execute(
        `INSERT INTO transacoes_fluxo_caixa (date, descricao, tipo, valor, categoria, venda_id, created_at)
         VALUES (?, ?, 'entrada', ?, 'Vendas', ?, ?)`,
        [fmtDate(saleDate), `Venda PED-${orderNum}`, total, saleId, fmtDatetime(saleDate)]
      );

      // ── Recent activity ──
      execute(
        `INSERT INTO atividade_recente (tipo, titulo, descricao, created_at)
         VALUES ('entry', 'Nova venda', ?, ?)`,
        [`Venda PED-${orderNum} — ${items.length} item(ns) — ${seller}`, fmtDatetime(saleDate)]
      );
    }
  }
  console.log(`Inserted ${allSales.length} sales with items.`);

  // ── Additional Cash Flow (expenses) ──
  let expenseCount = 0;
  for (const { ano, mes } of meses) {
    const daysInMonth = mes === 8 ? 2 : new Date(ano, mes, 0).getDate();
    const numExpenses = rand(4, 10);
    for (let e = 0; e < numExpenses; e++) {
      const day = rand(1, daysInMonth);
      const expDate = new Date(ano, mes - 1, day);
      const descricao = pick(descricoesSaida);
      const valor = Math.round((rand(150, 12000) + Math.random()) * 100) / 100;
      const cat = pick(catSaida);
      execute(
        `INSERT INTO transacoes_fluxo_caixa (date, descricao, tipo, valor, categoria, created_at)
         VALUES (?, ?, 'saida', ?, ?, ?)`,
        [fmtDate(expDate), descricao, valor, cat, fmtDatetime(expDate)]
      );
      expenseCount++;
    }
  }
  console.log(`Inserted ${expenseCount} cash flow expenses.`);

  // ── Seller Goals ──
  let goalCount = 0;
  for (const { ano, mes } of meses) {
    if (ano === 2026 && mes === 8) continue; // skip current partial month
    for (const seller of sellers) {
      const goalValue = rand(120, 35) * 100; // R$ 12k — R$ 35k
      execute(
        `INSERT INTO metas_vendedor (nome_vendedor, valor_meta, ano_meta, mes_meta)
         VALUES (?, ?, ?, ?)`,
        [seller, goalValue, ano, mes]
      );
      goalCount++;
    }
  }
  console.log(`Inserted ${goalCount} seller goals.`);

  // ── Update customer totals ──
  for (const c of clientes) {
    const spent = queryOne('SELECT COALESCE(SUM(total), 0) as total FROM vendas WHERE cliente_id=?', [c.id]);
    const visits = queryOne('SELECT COUNT(*) as count FROM vendas WHERE cliente_id=?', [c.id]);
    execute('UPDATE clientes SET total_gasto=?, visitas=? WHERE id=?',
      [Math.round(spent.total * 100) / 100, visits.count, c.id]);
  }

  // ── Recalculate product stock from seed ──
  // Reset products to original stock levels minus what was sold
  const prodSeed = [
    ['Camiseta Oversized Cotton', 48], ['Calça Jeans Wide Leg', 32], ['Jaqueta Puffer Noir', 8],
    ['Vestido Midi Floral', 22], ['Tênis Urban Runner', 4], ['Regata Cropped Slim', 0],
    ['Calça Cargo Street', 18], ['Blazer Estruturado', 6], ['Bolsa Tote Couro Vegano', 14],
    ['Sandália Anabela', 0],
  ];
  for (const [nome, qty] of prodSeed) {
    const sold = queryOne(
      "SELECT COALESCE(SUM(quantidade), 0) as total FROM itens_venda WHERE nome_produto=?",
      [nome]
    );
    const remaining = Math.max(0, qty - (sold ? sold.total : 0));
    execute('UPDATE produtos SET quantidade=?, updated_at=datetime("now") WHERE nome=?', [remaining, nome]);
  }

  // ── Recent activity entries for inventory ──
  console.log('Seed complete!');
}

seed().catch(err => { console.error('Seed error:', err); process.exit(1); });