const bcrypt = require('bcryptjs');
const pool   = require('../config/db');

const getAll = async (req, res, next) => {
  try {
    const { search = '', role = '', status = '', page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;
    const params = [];
    let where = 'WHERE 1=1';

    if (search) { params.push(`%${search}%`); where += ` AND (u.name ILIKE $${params.length} OR u.email ILIKE $${params.length})`; }
    if (role)   { params.push(role);   where += ` AND u.role=$${params.length}`; }
    if (status === 'active')   where += ` AND u.is_active=true`;
    if (status === 'inactive') where += ` AND u.is_active=false`;

    const total = parseInt((await pool.query(`SELECT COUNT(*) FROM users u ${where}`, params)).rows[0].count);
    params.push(limit, offset);
    const rows = (await pool.query(
      `SELECT u.id, u.name, u.email, u.role, u.is_active, u.created_at
       FROM users u ${where} ORDER BY u.created_at DESC
       LIMIT $${params.length - 1} OFFSET $${params.length}`,
      params
    )).rows;

    res.json({ success: true, data: rows, total, page: +page, limit: +limit });
  } catch (err) { next(err); }
};

const getOne = async (req, res, next) => {
  try {
    const row = (await pool.query(
      'SELECT id, name, email, role, is_active, created_at FROM users WHERE id=$1',
      [req.params.id]
    )).rows[0];
    if (!row) return res.status(404).json({ message: 'User not found' });
    res.json({ success: true, data: row });
  } catch (err) { next(err); }
};

const create = async (req, res, next) => {
  try {
    const { name, email, password, role } = req.body;
    if (!name?.trim())     return res.status(400).json({ message: 'Name is required' });
    if (!email?.trim())    return res.status(400).json({ message: 'Email is required' });
    if (!password || password.length < 6) return res.status(400).json({ message: 'Password must be at least 6 characters' });

    const dup = await pool.query('SELECT id FROM users WHERE email=$1', [email.toLowerCase()]);
    if (dup.rows[0]) return res.status(400).json({ message: 'Email already registered' });

    const validRoles = ['admin','procurement_manager','store_keeper','finance_officer','employee'];
    const userRole = validRoles.includes(role) ? role : 'employee';

    const hash = await bcrypt.hash(password, 10);
    const row  = (await pool.query(
      `INSERT INTO users (name, email, password, role) VALUES ($1,$2,$3,$4)
       RETURNING id, name, email, role, is_active, created_at`,
      [name.trim(), email.toLowerCase(), hash, userRole]
    )).rows[0];

    res.status(201).json({ success: true, data: row });
  } catch (err) { next(err); }
};

const update = async (req, res, next) => {
  try {
    const { name, email, role, is_active } = req.body;
    if (parseInt(req.params.id) === req.user.id && is_active === false)
      return res.status(400).json({ message: 'You cannot deactivate your own account' });

    if (email) {
      const dup = await pool.query('SELECT id FROM users WHERE email=$1 AND id!=$2', [email.toLowerCase(), req.params.id]);
      if (dup.rows[0]) return res.status(400).json({ message: 'Email already in use' });
    }

    const validRoles = ['admin','procurement_manager','store_keeper','finance_officer','employee'];
    const row = (await pool.query(
      `UPDATE users SET
         name=$1, email=$2, role=$3, is_active=$4, updated_at=NOW()
       WHERE id=$5
       RETURNING id, name, email, role, is_active, created_at`,
      [name, email?.toLowerCase(), validRoles.includes(role) ? role : 'employee',
       is_active !== undefined ? is_active : true, req.params.id]
    )).rows[0];
    if (!row) return res.status(404).json({ message: 'User not found' });
    res.json({ success: true, data: row });
  } catch (err) { next(err); }
};

const resetPassword = async (req, res, next) => {
  try {
    const { password } = req.body;
    if (!password || password.length < 6) return res.status(400).json({ message: 'Password must be at least 6 characters' });
    const hash = await bcrypt.hash(password, 10);
    const row  = (await pool.query(
      `UPDATE users SET password=$1, updated_at=NOW() WHERE id=$2 RETURNING id`,
      [hash, req.params.id]
    )).rows[0];
    if (!row) return res.status(404).json({ message: 'User not found' });
    res.json({ success: true, message: 'Password reset successfully' });
  } catch (err) { next(err); }
};

const remove = async (req, res, next) => {
  try {
    if (parseInt(req.params.id) === req.user.id)
      return res.status(400).json({ message: 'You cannot delete your own account' });
    const row = (await pool.query('SELECT id FROM users WHERE id=$1', [req.params.id])).rows[0];
    if (!row) return res.status(404).json({ message: 'User not found' });
    await pool.query('DELETE FROM users WHERE id=$1', [req.params.id]);
    res.json({ success: true, message: 'User deleted' });
  } catch (err) { next(err); }
};

const stats = async (req, res, next) => {
  try {
    const r = (await pool.query(
      `SELECT COUNT(*) total,
              COUNT(*) FILTER (WHERE is_active=true)  active,
              COUNT(*) FILTER (WHERE is_active=false) inactive,
              COUNT(*) FILTER (WHERE role='admin')               admins,
              COUNT(*) FILTER (WHERE role='procurement_manager') procurement,
              COUNT(*) FILTER (WHERE role='store_keeper')        store,
              COUNT(*) FILTER (WHERE role='finance_officer')     finance,
              COUNT(*) FILTER (WHERE role='employee')            employees
       FROM users`
    )).rows[0];
    res.json({ success: true, data: r });
  } catch (err) { next(err); }
};

module.exports = { getAll, getOne, create, update, resetPassword, remove, stats };
