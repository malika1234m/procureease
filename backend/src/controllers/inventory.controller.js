const pool = require('../config/db');

/* ─── CATEGORIES ─── */
const getCategories = async (req, res, next) => {
  try {
    const rows = (await pool.query(
      `SELECT c.*, COUNT(i.id) AS item_count
       FROM categories c LEFT JOIN items i ON i.category_id = c.id
       GROUP BY c.id ORDER BY c.name`
    )).rows;
    res.json({ success: true, data: rows });
  } catch (err) { next(err); }
};

const createCategory = async (req, res, next) => {
  try {
    const { name, description } = req.body;
    if (!name?.trim()) return res.status(400).json({ message: 'Category name is required' });
    const exists = await pool.query('SELECT id FROM categories WHERE LOWER(name)=LOWER($1)', [name]);
    if (exists.rows[0]) return res.status(400).json({ message: 'Category already exists' });
    const row = (await pool.query(
      'INSERT INTO categories (name, description) VALUES ($1,$2) RETURNING *',
      [name.trim(), description || null]
    )).rows[0];
    res.status(201).json({ success: true, data: row });
  } catch (err) { next(err); }
};

const updateCategory = async (req, res, next) => {
  try {
    const { name, description } = req.body;
    const row = (await pool.query(
      'UPDATE categories SET name=$1, description=$2 WHERE id=$3 RETURNING *',
      [name, description || null, req.params.id]
    )).rows[0];
    if (!row) return res.status(404).json({ message: 'Category not found' });
    res.json({ success: true, data: row });
  } catch (err) { next(err); }
};

const deleteCategory = async (req, res, next) => {
  try {
    const linked = await pool.query('SELECT id FROM items WHERE category_id=$1 LIMIT 1', [req.params.id]);
    if (linked.rows[0]) return res.status(400).json({ message: 'Category has items — reassign them first' });
    await pool.query('DELETE FROM categories WHERE id=$1', [req.params.id]);
    res.json({ success: true, message: 'Category deleted' });
  } catch (err) { next(err); }
};

/* ─── ITEMS ─── */
const getItems = async (req, res, next) => {
  try {
    const { search = '', category = '', stock = '', page = 1, limit = 10 } = req.query;
    const offset = (page - 1) * limit;
    const params = [];
    let where = 'WHERE 1=1';

    if (search) { params.push(`%${search}%`); where += ` AND (i.name ILIKE $${params.length} OR i.code ILIKE $${params.length})`; }
    if (category) { params.push(category); where += ` AND i.category_id=$${params.length}`; }
    if (stock === 'low')  where += ` AND i.current_stock <= i.reorder_level AND i.reorder_level > 0`;
    if (stock === 'out')  where += ` AND i.current_stock = 0`;
    if (stock === 'good') where += ` AND i.current_stock > i.reorder_level`;

    const total = parseInt((await pool.query(
      `SELECT COUNT(*) FROM items i ${where}`, params
    )).rows[0].count);

    params.push(limit, offset);
    const rows = (await pool.query(
      `SELECT i.*, c.name AS category_name
       FROM items i LEFT JOIN categories c ON i.category_id = c.id
       ${where} ORDER BY i.name
       LIMIT $${params.length-1} OFFSET $${params.length}`,
      params
    )).rows;

    res.json({ success: true, data: rows, total, page: +page, limit: +limit });
  } catch (err) { next(err); }
};

const getItem = async (req, res, next) => {
  try {
    const item = (await pool.query(
      `SELECT i.*, c.name AS category_name FROM items i LEFT JOIN categories c ON i.category_id=c.id WHERE i.id=$1`,
      [req.params.id]
    )).rows[0];
    if (!item) return res.status(404).json({ message: 'Item not found' });

    const movements = (await pool.query(
      `SELECT sm.*, u.name AS created_by_name FROM stock_movements sm
       LEFT JOIN users u ON sm.created_by=u.id
       WHERE sm.item_id=$1 ORDER BY sm.created_at DESC LIMIT 20`,
      [req.params.id]
    )).rows;

    res.json({ success: true, data: { ...item, movements } });
  } catch (err) { next(err); }
};

const createItem = async (req, res, next) => {
  try {
    const { name, code, description, category_id, unit, current_stock, reorder_level } = req.body;
    if (!name?.trim()) return res.status(400).json({ message: 'Item name is required' });
    if (code) {
      const dup = await pool.query('SELECT id FROM items WHERE code=$1', [code]);
      if (dup.rows[0]) return res.status(400).json({ message: 'Item code already exists' });
    }
    const item = (await pool.query(
      `INSERT INTO items (name, code, description, category_id, unit, current_stock, reorder_level)
       VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *`,
      [name.trim(), code || null, description || null, category_id || null,
       unit || 'pcs', parseFloat(current_stock)||0, parseFloat(reorder_level)||0]
    )).rows[0];

    if (parseFloat(current_stock) > 0) {
      await pool.query(
        `INSERT INTO stock_movements (item_id, type, quantity, reference, notes, created_by)
         VALUES ($1,'in',$2,'Opening Stock','Initial stock entry',$3)`,
        [item.id, parseFloat(current_stock), req.user.id]
      );
    }
    res.status(201).json({ success: true, data: item });
  } catch (err) { next(err); }
};

const updateItem = async (req, res, next) => {
  try {
    const { name, code, description, category_id, unit, reorder_level } = req.body;
    if (code) {
      const dup = await pool.query('SELECT id FROM items WHERE code=$1 AND id!=$2', [code, req.params.id]);
      if (dup.rows[0]) return res.status(400).json({ message: 'Item code already in use' });
    }
    const item = (await pool.query(
      `UPDATE items SET name=$1, code=$2, description=$3, category_id=$4, unit=$5, reorder_level=$6, updated_at=NOW()
       WHERE id=$7 RETURNING *`,
      [name, code || null, description || null, category_id || null,
       unit || 'pcs', parseFloat(reorder_level)||0, req.params.id]
    )).rows[0];
    if (!item) return res.status(404).json({ message: 'Item not found' });
    res.json({ success: true, data: item });
  } catch (err) { next(err); }
};

const deleteItem = async (req, res, next) => {
  try {
    const item = (await pool.query('SELECT * FROM items WHERE id=$1', [req.params.id])).rows[0];
    if (!item) return res.status(404).json({ message: 'Item not found' });
    if (parseFloat(item.current_stock) > 0)
      return res.status(400).json({ message: 'Cannot delete item with stock. Adjust to 0 first.' });
    await pool.query('DELETE FROM items WHERE id=$1', [req.params.id]);
    res.json({ success: true, message: 'Item deleted' });
  } catch (err) { next(err); }
};

/* ─── STOCK ADJUSTMENT ─── */
const adjustStock = async (req, res, next) => {
  const client = await pool.connect();
  try {
    const { type, quantity, notes } = req.body;
    const qty = parseFloat(quantity);
    if (!['in','out','adjustment'].includes(type)) return res.status(400).json({ message: 'Invalid type' });
    if (!qty || qty <= 0) return res.status(400).json({ message: 'Quantity must be greater than 0' });

    const item = (await client.query('SELECT * FROM items WHERE id=$1', [req.params.id])).rows[0];
    if (!item) return res.status(404).json({ message: 'Item not found' });

    const newStock = type === 'in'
      ? parseFloat(item.current_stock) + qty
      : type === 'out'
        ? parseFloat(item.current_stock) - qty
        : qty;

    if (newStock < 0) return res.status(400).json({ message: 'Insufficient stock' });

    await client.query('BEGIN');
    await client.query('UPDATE items SET current_stock=$1, updated_at=NOW() WHERE id=$2', [newStock, req.params.id]);
    await client.query(
      `INSERT INTO stock_movements (item_id, type, quantity, reference, notes, created_by)
       VALUES ($1,$2,$3,'Manual Adjustment',$4,$5)`,
      [req.params.id, type, qty, notes || null, req.user.id]
    );
    await client.query('COMMIT');
    res.json({ success: true, data: { ...item, current_stock: newStock } });
  } catch (err) { await client.query('ROLLBACK'); next(err); }
  finally { client.release(); }
};

/* ─── GRN ─── */
const genGRNNumber = async () => {
  const year = new Date().getFullYear();
  const cnt  = parseInt((await pool.query(`SELECT COUNT(*) FROM grn WHERE grn_number LIKE $1`, [`GRN-${year}-%`])).rows[0].count);
  return `GRN-${year}-${String(cnt+1).padStart(4,'0')}`;
};

const getGRNs = async (req, res, next) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const offset = (page - 1) * limit;
    const total = parseInt((await pool.query('SELECT COUNT(*) FROM grn')).rows[0].count);
    const rows  = (await pool.query(
      `SELECT g.*, po.po_number, s.name AS supplier_name, u.name AS received_by_name
       FROM grn g
       LEFT JOIN purchase_orders po ON g.po_id = po.id
       LEFT JOIN suppliers s ON po.supplier_id = s.id
       LEFT JOIN users u ON g.received_by = u.id
       ORDER BY g.created_at DESC LIMIT $1 OFFSET $2`,
      [limit, offset]
    )).rows;
    res.json({ success: true, data: rows, total, page: +page, limit: +limit });
  } catch (err) { next(err); }
};

const createGRN = async (req, res, next) => {
  const client = await pool.connect();
  try {
    const { po_id, received_date, notes, items } = req.body;
    if (!items?.length) return res.status(400).json({ message: 'At least one item required' });

    await client.query('BEGIN');
    const grn_number = await genGRNNumber();
    const allReceived = items.every(i => parseFloat(i.received_quantity) >= parseFloat(i.ordered_quantity));

    const grn = (await client.query(
      `INSERT INTO grn (grn_number, po_id, received_date, received_by, status, notes)
       VALUES ($1,$2,$3,$4,$5,$6) RETURNING *`,
      [grn_number, po_id || null, received_date || new Date().toISOString().split('T')[0],
       req.user.id, allReceived ? 'complete' : 'partial', notes || null]
    )).rows[0];

    for (const item of items) {
      await client.query(
        `INSERT INTO grn_items (grn_id, po_item_id, item_id, ordered_quantity, received_quantity, notes)
         VALUES ($1,$2,$3,$4,$5,$6)`,
        [grn.id, item.po_item_id || null, item.item_id || null,
         item.ordered_quantity || 0, item.received_quantity, item.notes || null]
      );
      if (item.item_id && parseFloat(item.received_quantity) > 0) {
        await client.query('UPDATE items SET current_stock = current_stock + $1, updated_at=NOW() WHERE id=$2',
          [item.received_quantity, item.item_id]);
        await client.query(
          `INSERT INTO stock_movements (item_id, type, quantity, reference, notes, created_by)
           VALUES ($1,'in',$2,$3,$4,$5)`,
          [item.item_id, item.received_quantity, grn_number, `Received via ${grn_number}`, req.user.id]
        );
      }
    }

    if (po_id) {
      await client.query(
        `UPDATE purchase_orders SET status=$1, updated_at=NOW() WHERE id=$2`,
        [allReceived ? 'received' : 'partial', po_id]
      );
    }

    await client.query('COMMIT');
    res.status(201).json({ success: true, data: grn });
  } catch (err) { await client.query('ROLLBACK'); next(err); }
  finally { client.release(); }
};

/* ─── STATS ─── */
const stats = async (req, res, next) => {
  try {
    const [items, lowStock, outOfStock, categories, movements] = await Promise.all([
      pool.query('SELECT COUNT(*) AS total, COALESCE(SUM(current_stock),0) AS total_units FROM items'),
      pool.query('SELECT COUNT(*) FROM items WHERE current_stock <= reorder_level AND reorder_level > 0 AND current_stock > 0'),
      pool.query('SELECT COUNT(*) FROM items WHERE current_stock = 0'),
      pool.query('SELECT COUNT(*) FROM categories'),
      pool.query('SELECT COUNT(*) FROM stock_movements WHERE created_at >= NOW() - INTERVAL \'30 days\''),
    ]);
    res.json({ success: true, data: {
      total_items:   items.rows[0].total,
      total_units:   items.rows[0].total_units,
      low_stock:     lowStock.rows[0].count,
      out_of_stock:  outOfStock.rows[0].count,
      categories:    categories.rows[0].count,
      movements_30d: movements.rows[0].count,
    }});
  } catch (err) { next(err); }
};

const getLowStockItems = async (req, res, next) => {
  try {
    const rows = (await pool.query(
      `SELECT i.*, c.name AS category_name FROM items i
       LEFT JOIN categories c ON i.category_id=c.id
       WHERE i.current_stock <= i.reorder_level AND i.reorder_level > 0
       ORDER BY (i.current_stock / NULLIF(i.reorder_level,0)) ASC LIMIT 20`
    )).rows;
    res.json({ success: true, data: rows });
  } catch (err) { next(err); }
};

module.exports = {
  getCategories, createCategory, updateCategory, deleteCategory,
  getItems, getItem, createItem, updateItem, deleteItem,
  adjustStock, getGRNs, createGRN, stats, getLowStockItems,
};
