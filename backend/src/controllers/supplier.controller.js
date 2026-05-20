const pool = require('../config/db');

const getAll = async (req, res, next) => {
  try {
    const { search = '', status = '', page = 1, limit = 10 } = req.query;
    const offset = (page - 1) * limit;

    let where = 'WHERE 1=1';
    const params = [];

    if (search) {
      params.push(`%${search}%`);
      where += ` AND (s.name ILIKE $${params.length} OR s.email ILIKE $${params.length} OR s.contact_person ILIKE $${params.length})`;
    }
    if (status) {
      params.push(status);
      where += ` AND s.status = $${params.length}`;
    }

    const countRes = await pool.query(`SELECT COUNT(*) FROM suppliers s ${where}`, params);
    const total = parseInt(countRes.rows[0].count);

    params.push(limit, offset);
    const result = await pool.query(
      `SELECT s.*, u.name AS created_by_name
       FROM suppliers s
       LEFT JOIN users u ON s.created_by = u.id
       ${where}
       ORDER BY s.created_at DESC
       LIMIT $${params.length - 1} OFFSET $${params.length}`,
      params
    );

    res.json({ success: true, data: result.rows, total, page: +page, limit: +limit });
  } catch (err) { next(err); }
};

const getOne = async (req, res, next) => {
  try {
    const { id } = req.params;
    const result = await pool.query(
      `SELECT s.*, u.name AS created_by_name
       FROM suppliers s LEFT JOIN users u ON s.created_by = u.id
       WHERE s.id = $1`,
      [id]
    );
    if (!result.rows[0]) return res.status(404).json({ message: 'Supplier not found' });
    res.json({ success: true, data: result.rows[0] });
  } catch (err) { next(err); }
};

const create = async (req, res, next) => {
  try {
    const { name, email, phone, address, contact_person, payment_terms, status } = req.body;
    if (!name) return res.status(400).json({ message: 'Supplier name is required' });

    const result = await pool.query(
      `INSERT INTO suppliers (name, email, phone, address, contact_person, payment_terms, status, created_by)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *`,
      [name, email || null, phone || null, address || null, contact_person || null,
       payment_terms || 30, status || 'active', req.user.id]
    );
    res.status(201).json({ success: true, data: result.rows[0] });
  } catch (err) { next(err); }
};

const update = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, email, phone, address, contact_person, payment_terms, status } = req.body;

    const existing = await pool.query('SELECT id FROM suppliers WHERE id = $1', [id]);
    if (!existing.rows[0]) return res.status(404).json({ message: 'Supplier not found' });

    const result = await pool.query(
      `UPDATE suppliers SET
         name=$1, email=$2, phone=$3, address=$4, contact_person=$5,
         payment_terms=$6, status=$7, updated_at=NOW()
       WHERE id=$8 RETURNING *`,
      [name, email || null, phone || null, address || null, contact_person || null,
       payment_terms || 30, status || 'active', id]
    );
    res.json({ success: true, data: result.rows[0] });
  } catch (err) { next(err); }
};

const remove = async (req, res, next) => {
  try {
    const { id } = req.params;
    const existing = await pool.query('SELECT id FROM suppliers WHERE id = $1', [id]);
    if (!existing.rows[0]) return res.status(404).json({ message: 'Supplier not found' });

    await pool.query('DELETE FROM suppliers WHERE id = $1', [id]);
    res.json({ success: true, message: 'Supplier deleted' });
  } catch (err) { next(err); }
};

const stats = async (req, res, next) => {
  try {
    const result = await pool.query(
      `SELECT
         COUNT(*) AS total,
         COUNT(*) FILTER (WHERE status='active') AS active,
         COUNT(*) FILTER (WHERE status='inactive') AS inactive,
         COUNT(*) FILTER (WHERE status='blacklisted') AS blacklisted
       FROM suppliers`
    );
    res.json({ success: true, data: result.rows[0] });
  } catch (err) { next(err); }
};

module.exports = { getAll, getOne, create, update, remove, stats };
