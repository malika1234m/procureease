const pool = require('../config/db');

const genPRNumber = async () => {
  const year = new Date().getFullYear();
  const res  = await pool.query(
    `SELECT COUNT(*) FROM purchase_requisitions WHERE pr_number LIKE $1`,
    [`PR-${year}-%`]
  );
  const seq = String(parseInt(res.rows[0].count) + 1).padStart(4, '0');
  return `PR-${year}-${seq}`;
};

const getAll = async (req, res, next) => {
  try {
    const { status = '', search = '', page = 1, limit = 10 } = req.query;
    const offset = (page - 1) * limit;
    const params = [];
    let where = 'WHERE 1=1';

    if (status) { params.push(status); where += ` AND pr.status=$${params.length}`; }
    if (search) {
      params.push(`%${search}%`);
      where += ` AND (pr.pr_number ILIKE $${params.length} OR pr.department ILIKE $${params.length} OR u.name ILIKE $${params.length})`;
    }

    const total = parseInt((await pool.query(
      `SELECT COUNT(*) FROM purchase_requisitions pr LEFT JOIN users u ON pr.requested_by=u.id ${where}`, params
    )).rows[0].count);

    params.push(limit, offset);
    const rows = (await pool.query(
      `SELECT pr.*, u.name AS requested_by_name, a.name AS approved_by_name,
              (SELECT COUNT(*) FROM pr_items WHERE pr_id=pr.id) AS item_count
       FROM purchase_requisitions pr
       LEFT JOIN users u ON pr.requested_by=u.id
       LEFT JOIN users a ON pr.approved_by=a.id
       ${where} ORDER BY pr.created_at DESC
       LIMIT $${params.length-1} OFFSET $${params.length}`,
      params
    )).rows;

    res.json({ success: true, data: rows, total, page: +page, limit: +limit });
  } catch (err) { next(err); }
};

const getOne = async (req, res, next) => {
  try {
    const pr = (await pool.query(
      `SELECT pr.*, u.name AS requested_by_name, a.name AS approved_by_name
       FROM purchase_requisitions pr
       LEFT JOIN users u ON pr.requested_by=u.id
       LEFT JOIN users a ON pr.approved_by=a.id
       WHERE pr.id=$1`, [req.params.id]
    )).rows[0];
    if (!pr) return res.status(404).json({ message: 'Requisition not found' });

    const items = (await pool.query(
      `SELECT pi.*, COALESCE(pi.item_name, i.name) AS item_name,
              COALESCE(pi.unit, i.unit) AS unit
       FROM pr_items pi LEFT JOIN items i ON pi.item_id=i.id
       WHERE pi.pr_id=$1`, [req.params.id]
    )).rows;

    res.json({ success: true, data: { ...pr, items } });
  } catch (err) { next(err); }
};

const create = async (req, res, next) => {
  const client = await pool.connect();
  try {
    const { department, required_date, notes, items } = req.body;
    if (!items?.length) return res.status(400).json({ message: 'At least one item is required' });

    await client.query('BEGIN');
    const pr_number = await genPRNumber();

    const pr = (await client.query(
      `INSERT INTO purchase_requisitions (pr_number, requested_by, department, required_date, notes)
       VALUES ($1,$2,$3,$4,$5) RETURNING *`,
      [pr_number, req.user.id, department || null, required_date || null, notes || null]
    )).rows[0];

    for (const item of items) {
      await client.query(
        `INSERT INTO pr_items (pr_id, item_id, item_name, quantity, unit, estimated_unit_price, notes)
         VALUES ($1,$2,$3,$4,$5,$6,$7)`,
        [pr.id, item.item_id || null, item.item_name || null, item.quantity,
         item.unit || 'pcs', item.estimated_unit_price || null, item.notes || null]
      );
    }

    await client.query('COMMIT');
    res.status(201).json({ success: true, data: pr });
  } catch (err) { await client.query('ROLLBACK'); next(err); }
  finally { client.release(); }
};

const approve = async (req, res, next) => {
  try {
    const pr = (await pool.query('SELECT * FROM purchase_requisitions WHERE id=$1', [req.params.id])).rows[0];
    if (!pr) return res.status(404).json({ message: 'Requisition not found' });
    if (pr.status !== 'pending') return res.status(400).json({ message: 'Only pending requisitions can be approved' });

    const updated = (await pool.query(
      `UPDATE purchase_requisitions SET status='approved', approved_by=$1, approved_at=NOW(), updated_at=NOW()
       WHERE id=$2 RETURNING *`,
      [req.user.id, req.params.id]
    )).rows[0];
    res.json({ success: true, data: updated });
  } catch (err) { next(err); }
};

const reject = async (req, res, next) => {
  try {
    const pr = (await pool.query('SELECT * FROM purchase_requisitions WHERE id=$1', [req.params.id])).rows[0];
    if (!pr) return res.status(404).json({ message: 'Requisition not found' });
    if (pr.status !== 'pending') return res.status(400).json({ message: 'Only pending requisitions can be rejected' });

    const updated = (await pool.query(
      `UPDATE purchase_requisitions SET status='rejected', approved_by=$1, approved_at=NOW(),
       notes=COALESCE(notes,'') || $2, updated_at=NOW() WHERE id=$3 RETURNING *`,
      [req.user.id, req.body.reason ? `\n[Rejection reason: ${req.body.reason}]` : '', req.params.id]
    )).rows[0];
    res.json({ success: true, data: updated });
  } catch (err) { next(err); }
};

const remove = async (req, res, next) => {
  try {
    const pr = (await pool.query('SELECT * FROM purchase_requisitions WHERE id=$1', [req.params.id])).rows[0];
    if (!pr) return res.status(404).json({ message: 'Requisition not found' });
    if (!['pending','rejected'].includes(pr.status))
      return res.status(400).json({ message: 'Cannot delete approved or converted requisitions' });

    await pool.query('DELETE FROM purchase_requisitions WHERE id=$1', [req.params.id]);
    res.json({ success: true, message: 'Requisition deleted' });
  } catch (err) { next(err); }
};

const stats = async (req, res, next) => {
  try {
    const r = (await pool.query(
      `SELECT COUNT(*) AS total,
              COUNT(*) FILTER (WHERE status='pending')   AS pending,
              COUNT(*) FILTER (WHERE status='approved')  AS approved,
              COUNT(*) FILTER (WHERE status='rejected')  AS rejected,
              COUNT(*) FILTER (WHERE status='converted') AS converted
       FROM purchase_requisitions`
    )).rows[0];
    res.json({ success: true, data: r });
  } catch (err) { next(err); }
};

module.exports = { getAll, getOne, create, approve, reject, remove, stats };
