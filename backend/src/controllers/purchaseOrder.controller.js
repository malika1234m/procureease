const pool = require('../config/db');

const genPONumber = async () => {
  const year = new Date().getFullYear();
  const res  = await pool.query(
    `SELECT COUNT(*) FROM purchase_orders WHERE po_number LIKE $1`, [`PO-${year}-%`]
  );
  const seq = String(parseInt(res.rows[0].count) + 1).padStart(4, '0');
  return `PO-${year}-${seq}`;
};

const getAll = async (req, res, next) => {
  try {
    const { status = '', search = '', page = 1, limit = 10 } = req.query;
    const offset = (page - 1) * limit;
    const params = [];
    let where = 'WHERE 1=1';

    if (status) { params.push(status); where += ` AND po.status=$${params.length}`; }
    if (search) {
      params.push(`%${search}%`);
      where += ` AND (po.po_number ILIKE $${params.length} OR s.name ILIKE $${params.length})`;
    }

    const total = parseInt((await pool.query(
      `SELECT COUNT(*) FROM purchase_orders po LEFT JOIN suppliers s ON po.supplier_id=s.id ${where}`, params
    )).rows[0].count);

    params.push(limit, offset);
    const rows = (await pool.query(
      `SELECT po.*, s.name AS supplier_name, s.contact_person AS supplier_contact,
              pr.pr_number, u.name AS created_by_name,
              (SELECT COUNT(*) FROM po_items WHERE po_id=po.id) AS item_count
       FROM purchase_orders po
       LEFT JOIN suppliers s  ON po.supplier_id=s.id
       LEFT JOIN purchase_requisitions pr ON po.pr_id=pr.id
       LEFT JOIN users u ON po.created_by=u.id
       ${where} ORDER BY po.created_at DESC
       LIMIT $${params.length-1} OFFSET $${params.length}`,
      params
    )).rows;

    res.json({ success: true, data: rows, total, page: +page, limit: +limit });
  } catch (err) { next(err); }
};

const getOne = async (req, res, next) => {
  try {
    const po = (await pool.query(
      `SELECT po.*, s.name AS supplier_name, s.email AS supplier_email,
              s.phone AS supplier_phone, s.address AS supplier_address,
              s.contact_person AS supplier_contact,
              pr.pr_number, u.name AS created_by_name
       FROM purchase_orders po
       LEFT JOIN suppliers s ON po.supplier_id=s.id
       LEFT JOIN purchase_requisitions pr ON po.pr_id=pr.id
       LEFT JOIN users u ON po.created_by=u.id
       WHERE po.id=$1`, [req.params.id]
    )).rows[0];
    if (!po) return res.status(404).json({ message: 'Purchase order not found' });

    const items = (await pool.query(
      `SELECT pi.*, COALESCE(pi.item_name, i.name) AS item_name,
              COALESCE(pi.unit, i.unit) AS unit
       FROM po_items pi LEFT JOIN items i ON pi.item_id=i.id WHERE pi.po_id=$1`,
      [req.params.id]
    )).rows;

    res.json({ success: true, data: { ...po, items } });
  } catch (err) { next(err); }
};

const create = async (req, res, next) => {
  const client = await pool.connect();
  try {
    const { supplier_id, pr_id, expected_delivery, notes, items, tax_percent = 0 } = req.body;
    if (!supplier_id) return res.status(400).json({ message: 'Supplier is required' });
    if (!items?.length)  return res.status(400).json({ message: 'At least one item is required' });

    await client.query('BEGIN');

    const subtotal = items.reduce((s, i) => s + parseFloat(i.quantity) * parseFloat(i.unit_price), 0);
    const tax_amount   = +(subtotal * (tax_percent / 100)).toFixed(2);
    const total_amount = +(subtotal + tax_amount).toFixed(2);
    const po_number    = await genPONumber();

    const po = (await client.query(
      `INSERT INTO purchase_orders (po_number, supplier_id, pr_id, expected_delivery, notes,
        subtotal, tax_amount, total_amount, created_by)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING *`,
      [po_number, supplier_id, pr_id || null, expected_delivery || null, notes || null,
       subtotal.toFixed(2), tax_amount, total_amount, req.user.id]
    )).rows[0];

    for (const item of items) {
      const total = +(parseFloat(item.quantity) * parseFloat(item.unit_price)).toFixed(2);
      await client.query(
        `INSERT INTO po_items (po_id, item_id, item_name, quantity, unit, unit_price, tax_percent, total)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8)`,
        [po.id, item.item_id || null, item.item_name || null, item.quantity,
         item.unit || 'pcs', item.unit_price, item.tax_percent || 0, total]
      );
    }

    if (pr_id) {
      await client.query(
        `UPDATE purchase_requisitions SET status='converted', updated_at=NOW() WHERE id=$1`,
        [pr_id]
      );
    }

    await client.query('COMMIT');
    res.status(201).json({ success: true, data: po });
  } catch (err) { await client.query('ROLLBACK'); next(err); }
  finally { client.release(); }
};

const updateStatus = async (req, res, next) => {
  try {
    const { status } = req.body;
    const valid = ['draft','sent','partial','received','cancelled'];
    if (!valid.includes(status)) return res.status(400).json({ message: 'Invalid status' });

    const po = (await pool.query('SELECT id FROM purchase_orders WHERE id=$1', [req.params.id])).rows[0];
    if (!po) return res.status(404).json({ message: 'Purchase order not found' });

    const updated = (await pool.query(
      `UPDATE purchase_orders SET status=$1, updated_at=NOW() WHERE id=$2 RETURNING *`,
      [status, req.params.id]
    )).rows[0];
    res.json({ success: true, data: updated });
  } catch (err) { next(err); }
};

const stats = async (req, res, next) => {
  try {
    const r = (await pool.query(
      `SELECT COUNT(*) AS total,
              COUNT(*) FILTER (WHERE status='sent')     AS sent,
              COUNT(*) FILTER (WHERE status='received') AS received,
              COUNT(*) FILTER (WHERE status='cancelled')AS cancelled,
              COALESCE(SUM(total_amount),0)             AS total_value
       FROM purchase_orders`
    )).rows[0];
    res.json({ success: true, data: r });
  } catch (err) { next(err); }
};

module.exports = { getAll, getOne, create, updateStatus, stats };
