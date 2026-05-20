const pool = require('../config/db');

const genNum = async (prefix, table, col) => {
  const year = new Date().getFullYear();
  const cnt  = parseInt((await pool.query(`SELECT COUNT(*) FROM ${table} WHERE ${col} LIKE $1`, [`${prefix}-${year}-%`])).rows[0].count);
  return `${prefix}-${year}-${String(cnt + 1).padStart(4, '0')}`;
};

/* ══════════ INVOICES ══════════ */
const getInvoices = async (req, res, next) => {
  try {
    const { status='', search='', page=1, limit=10 } = req.query;
    const offset = (page-1)*limit;
    const params = [];
    let where = 'WHERE 1=1';
    if (status) { params.push(status); where += ` AND si.status=$${params.length}`; }
    if (search) { params.push(`%${search}%`); where += ` AND (si.invoice_number ILIKE $${params.length} OR s.name ILIKE $${params.length})`; }

    const total = parseInt((await pool.query(`SELECT COUNT(*) FROM supplier_invoices si LEFT JOIN suppliers s ON si.supplier_id=s.id ${where}`, params)).rows[0].count);
    params.push(limit, offset);
    const rows = (await pool.query(
      `SELECT si.*, s.name AS supplier_name, po.po_number
       FROM supplier_invoices si
       LEFT JOIN suppliers s ON si.supplier_id=s.id
       LEFT JOIN purchase_orders po ON si.po_id=po.id
       ${where} ORDER BY si.created_at DESC
       LIMIT $${params.length-1} OFFSET $${params.length}`, params
    )).rows;
    res.json({ success:true, data:rows, total, page:+page, limit:+limit });
  } catch(err) { next(err); }
};

const createInvoice = async (req, res, next) => {
  try {
    const { invoice_number, supplier_id, po_id, invoice_date, due_date, amount, tax_amount, notes } = req.body;
    if (!invoice_number?.trim()) return res.status(400).json({ message:'Invoice number required' });
    if (!supplier_id)            return res.status(400).json({ message:'Supplier required' });
    if (!amount || amount <= 0)  return res.status(400).json({ message:'Amount must be > 0' });

    const dup = await pool.query('SELECT id FROM supplier_invoices WHERE invoice_number=$1', [invoice_number]);
    if (dup.rows[0]) return res.status(400).json({ message:'Invoice number already exists' });

    const tax  = parseFloat(tax_amount)||0;
    const total = parseFloat(amount) + tax;
    const row = (await pool.query(
      `INSERT INTO supplier_invoices (invoice_number,supplier_id,po_id,invoice_date,due_date,amount,tax_amount,total_amount)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *`,
      [invoice_number.trim(), supplier_id, po_id||null, invoice_date||null, due_date||null,
       parseFloat(amount), tax, total]
    )).rows[0];
    res.status(201).json({ success:true, data:row });
  } catch(err) { next(err); }
};

const updateInvoiceStatus = async (req, res, next) => {
  try {
    const { status } = req.body;
    if (!['pending','approved','paid','disputed'].includes(status)) return res.status(400).json({ message:'Invalid status' });
    const row = (await pool.query(
      `UPDATE supplier_invoices SET status=$1, updated_at=NOW() WHERE id=$2 RETURNING *`,
      [status, req.params.id]
    )).rows[0];
    if (!row) return res.status(404).json({ message:'Invoice not found' });
    res.json({ success:true, data:row });
  } catch(err) { next(err); }
};

/* ══════════ PAYMENTS ══════════ */
const getPayments = async (req, res, next) => {
  try {
    const { page=1, limit=10, search='', status='' } = req.query;
    const offset = (page-1)*limit;
    const params = [];
    let where = 'WHERE 1=1';
    if (search) { params.push(`%${search}%`); where += ` AND (p.payment_number ILIKE $${params.length} OR s.name ILIKE $${params.length})`; }
    if (status) { params.push(status); where += ` AND p.method=$${params.length}`; }

    const total = parseInt((await pool.query(`SELECT COUNT(*) FROM payments p LEFT JOIN suppliers s ON p.supplier_id=s.id ${where}`, params)).rows[0].count);
    params.push(limit, offset);
    const rows = (await pool.query(
      `SELECT p.*, s.name AS supplier_name, si.invoice_number, u.name AS created_by_name
       FROM payments p
       LEFT JOIN suppliers s  ON p.supplier_id=s.id
       LEFT JOIN supplier_invoices si ON p.invoice_id=si.id
       LEFT JOIN users u ON p.created_by=u.id
       ${where} ORDER BY p.created_at DESC
       LIMIT $${params.length-1} OFFSET $${params.length}`, params
    )).rows;
    res.json({ success:true, data:rows, total, page:+page, limit:+limit });
  } catch(err) { next(err); }
};

const createPayment = async (req, res, next) => {
  const client = await pool.connect();
  try {
    const { invoice_id, supplier_id, amount, payment_date, method, reference, notes } = req.body;
    if (!supplier_id)           return res.status(400).json({ message:'Supplier required' });
    if (!amount || amount <= 0) return res.status(400).json({ message:'Amount must be > 0' });

    await client.query('BEGIN');
    const payment_number = await genNum('PAY', 'payments', 'payment_number');
    const row = (await client.query(
      `INSERT INTO payments (payment_number,invoice_id,supplier_id,amount,payment_date,method,reference,notes,created_by)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING *`,
      [payment_number, invoice_id||null, supplier_id, parseFloat(amount),
       payment_date||new Date().toISOString().split('T')[0], method||'bank_transfer',
       reference||null, notes||null, req.user.id]
    )).rows[0];

    if (invoice_id) {
      await client.query(`UPDATE supplier_invoices SET status='paid', updated_at=NOW() WHERE id=$1`, [invoice_id]);
    }
    await client.query('COMMIT');
    res.status(201).json({ success:true, data:row });
  } catch(err) { await client.query('ROLLBACK'); next(err); }
  finally { client.release(); }
};

/* ══════════ EXPENSES ══════════ */
const getExpenses = async (req, res, next) => {
  try {
    const { status='', category='', search='', page=1, limit=10 } = req.query;
    const offset = (page-1)*limit;
    const params = [];
    let where = 'WHERE 1=1';
    if (status)   { params.push(status);   where += ` AND e.status=$${params.length}`; }
    if (category) { params.push(`%${category}%`); where += ` AND e.category ILIKE $${params.length}`; }
    if (search)   { params.push(`%${search}%`); where += ` AND (e.title ILIKE $${params.length} OR e.vendor ILIKE $${params.length})`; }

    const total = parseInt((await pool.query(`SELECT COUNT(*) FROM expenses e ${where}`, params)).rows[0].count);
    params.push(limit, offset);
    const rows = (await pool.query(
      `SELECT e.*, u.name AS created_by_name, a.name AS approved_by_name
       FROM expenses e
       LEFT JOIN users u ON e.created_by=u.id
       LEFT JOIN users a ON e.approved_by=a.id
       ${where} ORDER BY e.expense_date DESC
       LIMIT $${params.length-1} OFFSET $${params.length}`, params
    )).rows;
    res.json({ success:true, data:rows, total, page:+page, limit:+limit });
  } catch(err) { next(err); }
};

const createExpense = async (req, res, next) => {
  try {
    const { title, category, amount, expense_date, vendor, description } = req.body;
    if (!title?.trim())          return res.status(400).json({ message:'Title required' });
    if (!amount || amount <= 0)  return res.status(400).json({ message:'Amount must be > 0' });

    const expense_number = await genNum('EXP', 'expenses', 'expense_number');
    const row = (await pool.query(
      `INSERT INTO expenses (expense_number,title,category,amount,expense_date,vendor,description,created_by)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *`,
      [expense_number, title.trim(), category||null, parseFloat(amount),
       expense_date||new Date().toISOString().split('T')[0], vendor||null, description||null, req.user.id]
    )).rows[0];
    res.status(201).json({ success:true, data:row });
  } catch(err) { next(err); }
};

const updateExpenseStatus = async (req, res, next) => {
  try {
    const { status } = req.body;
    if (!['recorded','approved','rejected'].includes(status)) return res.status(400).json({ message:'Invalid status' });
    const row = (await pool.query(
      `UPDATE expenses SET status=$1, approved_by=$2, updated_at=NOW() WHERE id=$3 RETURNING *`,
      [status, req.user.id, req.params.id]
    )).rows[0];
    if (!row) return res.status(404).json({ message:'Expense not found' });
    res.json({ success:true, data:row });
  } catch(err) { next(err); }
};

const deleteExpense = async (req, res, next) => {
  try {
    const exp = (await pool.query('SELECT status FROM expenses WHERE id=$1', [req.params.id])).rows[0];
    if (!exp) return res.status(404).json({ message:'Expense not found' });
    if (exp.status === 'approved') return res.status(400).json({ message:'Cannot delete approved expense' });
    await pool.query('DELETE FROM expenses WHERE id=$1', [req.params.id]);
    res.json({ success:true, message:'Expense deleted' });
  } catch(err) { next(err); }
};

/* ══════════ STATS & OVERVIEW ══════════ */
const stats = async (req, res, next) => {
  try {
    const year  = new Date().getFullYear();
    const month = new Date().getMonth() + 1;

    const [inv, pay, exp, monthlyPay, monthlyExp, overdue] = await Promise.all([
      pool.query(`SELECT COUNT(*) total, COUNT(*) FILTER(WHERE status='pending') pending, COUNT(*) FILTER(WHERE status='paid') paid,
                  COALESCE(SUM(total_amount),0) total_value, COALESCE(SUM(total_amount) FILTER(WHERE status='pending'),0) pending_value
                  FROM supplier_invoices`),
      pool.query(`SELECT COUNT(*) total, COALESCE(SUM(amount),0) total_paid FROM payments`),
      pool.query(`SELECT COUNT(*) total, COALESCE(SUM(amount),0) total_amount, COALESCE(SUM(amount) FILTER(WHERE status='approved'),0) approved_amount FROM expenses`),
      pool.query(`SELECT COALESCE(SUM(amount),0) AS amount FROM payments WHERE EXTRACT(MONTH FROM payment_date)=$1 AND EXTRACT(YEAR FROM payment_date)=$2`, [month, year]),
      pool.query(`SELECT COALESCE(SUM(amount),0) AS amount FROM expenses WHERE EXTRACT(MONTH FROM expense_date)=$1 AND EXTRACT(YEAR FROM expense_date)=$2 AND status='approved'`, [month, year]),
      pool.query(`SELECT COUNT(*) FROM supplier_invoices WHERE due_date < CURRENT_DATE AND status NOT IN ('paid')`),
    ]);

    const monthlyTrend = (await pool.query(
      `SELECT TO_CHAR(payment_date,'Mon') AS month, EXTRACT(MONTH FROM payment_date) AS mon_num,
              EXTRACT(YEAR FROM payment_date) AS yr, SUM(amount) AS paid
       FROM payments WHERE payment_date >= NOW() - INTERVAL '6 months'
       GROUP BY TO_CHAR(payment_date,'Mon'), EXTRACT(MONTH FROM payment_date), EXTRACT(YEAR FROM payment_date)
       ORDER BY yr, mon_num`
    )).rows;

    const expByCategory = (await pool.query(
      `SELECT category, SUM(amount) AS total FROM expenses WHERE status='approved' AND category IS NOT NULL GROUP BY category ORDER BY total DESC LIMIT 6`
    )).rows;

    res.json({ success:true, data: {
      invoices:       inv.rows[0],
      payments:       pay.rows[0],
      expenses:       exp.rows[0],
      monthly_payments: monthlyPay.rows[0].amount,
      monthly_expenses: monthlyExp.rows[0].amount,
      overdue_count:  overdue.rows[0].count,
      monthly_trend:  monthlyTrend,
      exp_by_category: expByCategory,
    }});
  } catch(err) { next(err); }
};

const getApprovedInvoices = async (req, res, next) => {
  try {
    const rows = (await pool.query(
      `SELECT si.id, si.invoice_number, si.total_amount, si.due_date,
              si.supplier_id, s.name AS supplier_name
       FROM supplier_invoices si JOIN suppliers s ON si.supplier_id=s.id
       WHERE si.status='approved' ORDER BY si.due_date`
    )).rows;
    res.json({ success:true, data:rows });
  } catch(err) { next(err); }
};

const getExpenseCategories = async (req, res, next) => {
  try {
    const rows = (await pool.query(
      `SELECT DISTINCT category FROM expenses WHERE category IS NOT NULL ORDER BY category`
    )).rows;
    res.json({ success:true, data: rows.map(r => r.category) });
  } catch(err) { next(err); }
};

module.exports = {
  getInvoices, createInvoice, updateInvoiceStatus,
  getPayments, createPayment,
  getExpenses, createExpense, updateExpenseStatus, deleteExpense,
  stats, getApprovedInvoices, getExpenseCategories,
};
