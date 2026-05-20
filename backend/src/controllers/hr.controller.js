const pool = require('../config/db');

/* ── number generators ── */
const genEmpNumber = async () => {
  const cnt = parseInt((await pool.query('SELECT COUNT(*) FROM employees')).rows[0].count);
  return `EMP-${String(cnt + 1).padStart(4, '0')}`;
};
const genPayrollNumber = async (month, year) => {
  const cnt = parseInt((await pool.query(
    `SELECT COUNT(*) FROM payroll WHERE month=$1 AND year=$2`, [month, year]
  )).rows[0].count);
  return `PAY-${year}-${String(month).padStart(2,'0')}-${String(cnt+1).padStart(3,'0')}`;
};

/* ══════════ EMPLOYEES ══════════ */
const getEmployees = async (req, res, next) => {
  try {
    const { search='', department='', status='', page=1, limit=10 } = req.query;
    const offset = (page-1)*limit;
    const params = [];
    let where = 'WHERE 1=1';

    if (search)     { params.push(`%${search}%`); where += ` AND (e.name ILIKE $${params.length} OR e.emp_number ILIKE $${params.length} OR e.designation ILIKE $${params.length})`; }
    if (department) { params.push(`%${department}%`); where += ` AND e.department ILIKE $${params.length}`; }
    if (status)     { params.push(status); where += ` AND e.status=$${params.length}`; }

    const total = parseInt((await pool.query(`SELECT COUNT(*) FROM employees e ${where}`, params)).rows[0].count);
    params.push(limit, offset);
    const rows = (await pool.query(
      `SELECT e.* FROM employees e ${where} ORDER BY e.name LIMIT $${params.length-1} OFFSET $${params.length}`,
      params
    )).rows;
    res.json({ success:true, data:rows, total, page:+page, limit:+limit });
  } catch(err) { next(err); }
};

const getEmployee = async (req, res, next) => {
  try {
    const emp = (await pool.query('SELECT * FROM employees WHERE id=$1', [req.params.id])).rows[0];
    if (!emp) return res.status(404).json({ message:'Employee not found' });

    const [attendance, payroll] = await Promise.all([
      pool.query(`SELECT * FROM attendance WHERE employee_id=$1 AND date >= NOW()-INTERVAL '30 days' ORDER BY date DESC`, [req.params.id]),
      pool.query(`SELECT * FROM payroll WHERE employee_id=$1 ORDER BY year DESC, month DESC LIMIT 6`, [req.params.id]),
    ]);
    res.json({ success:true, data:{ ...emp, recent_attendance:attendance.rows, recent_payroll:payroll.rows }});
  } catch(err) { next(err); }
};

const createEmployee = async (req, res, next) => {
  try {
    const { name, nic, email, phone, address, date_of_birth, date_joined, department,
            designation, employment_type, basic_salary, allowances, status } = req.body;
    if (!name?.trim()) return res.status(400).json({ message:'Employee name is required' });
    if (nic) {
      const dup = await pool.query('SELECT id FROM employees WHERE nic=$1', [nic]);
      if (dup.rows[0]) return res.status(400).json({ message:'NIC already registered' });
    }
    const emp_number = await genEmpNumber();
    const row = (await pool.query(
      `INSERT INTO employees (emp_number,name,nic,email,phone,address,date_of_birth,date_joined,
        department,designation,employment_type,basic_salary,allowances,status,created_by)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15) RETURNING *`,
      [emp_number, name.trim(), nic||null, email||null, phone||null, address||null,
       date_of_birth||null, date_joined||new Date().toISOString().split('T')[0],
       department||null, designation||null, employment_type||'permanent',
       parseFloat(basic_salary)||0, parseFloat(allowances)||0, status||'active', req.user.id]
    )).rows[0];
    res.status(201).json({ success:true, data:row });
  } catch(err) { next(err); }
};

const updateEmployee = async (req, res, next) => {
  try {
    const { name, nic, email, phone, address, date_of_birth, date_joined, department,
            designation, employment_type, basic_salary, allowances, status } = req.body;
    if (nic) {
      const dup = await pool.query('SELECT id FROM employees WHERE nic=$1 AND id!=$2', [nic, req.params.id]);
      if (dup.rows[0]) return res.status(400).json({ message:'NIC already in use' });
    }
    const row = (await pool.query(
      `UPDATE employees SET name=$1,nic=$2,email=$3,phone=$4,address=$5,date_of_birth=$6,
        date_joined=$7,department=$8,designation=$9,employment_type=$10,basic_salary=$11,
        allowances=$12,status=$13,updated_at=NOW() WHERE id=$14 RETURNING *`,
      [name, nic||null, email||null, phone||null, address||null, date_of_birth||null,
       date_joined, department||null, designation||null, employment_type||'permanent',
       parseFloat(basic_salary)||0, parseFloat(allowances)||0, status||'active', req.params.id]
    )).rows[0];
    if (!row) return res.status(404).json({ message:'Employee not found' });
    res.json({ success:true, data:row });
  } catch(err) { next(err); }
};

const deleteEmployee = async (req, res, next) => {
  try {
    const emp = (await pool.query('SELECT id FROM employees WHERE id=$1',[req.params.id])).rows[0];
    if (!emp) return res.status(404).json({ message:'Employee not found' });
    await pool.query('DELETE FROM employees WHERE id=$1',[req.params.id]);
    res.json({ success:true, message:'Employee deleted' });
  } catch(err) { next(err); }
};

const getDepartments = async (req, res, next) => {
  try {
    const rows = (await pool.query(
      `SELECT department, COUNT(*) AS count FROM employees WHERE department IS NOT NULL AND status='active'
       GROUP BY department ORDER BY department`
    )).rows;
    res.json({ success:true, data:rows });
  } catch(err) { next(err); }
};

/* ══════════ ATTENDANCE ══════════ */
const getAttendance = async (req, res, next) => {
  try {
    const { employee_id, month, year } = req.query;
    const m = parseInt(month) || new Date().getMonth()+1;
    const y = parseInt(year)  || new Date().getFullYear();
    let where = `WHERE EXTRACT(MONTH FROM a.date)=$1 AND EXTRACT(YEAR FROM a.date)=$2`;
    const params = [m, y];
    if (employee_id) { params.push(employee_id); where += ` AND a.employee_id=$${params.length}`; }

    const rows = (await pool.query(
      `SELECT a.*, e.name AS employee_name, e.emp_number, e.department
       FROM attendance a JOIN employees e ON a.employee_id=e.id
       ${where} ORDER BY a.date DESC, e.name`, params
    )).rows;
    res.json({ success:true, data:rows });
  } catch(err) { next(err); }
};

const markAttendance = async (req, res, next) => {
  const client = await pool.connect();
  try {
    const { records } = req.body; // [{ employee_id, date, status, in_time, out_time, notes }]
    if (!records?.length) return res.status(400).json({ message:'No records provided' });
    await client.query('BEGIN');
    const saved = [];
    for (const r of records) {
      const row = (await client.query(
        `INSERT INTO attendance (employee_id,date,status,in_time,out_time,notes,created_by)
         VALUES ($1,$2,$3,$4,$5,$6,$7)
         ON CONFLICT (employee_id,date) DO UPDATE
           SET status=$3,in_time=$4,out_time=$5,notes=$6 RETURNING *`,
        [r.employee_id, r.date, r.status||'present', r.in_time||null, r.out_time||null, r.notes||null, req.user.id]
      )).rows[0];
      saved.push(row);
    }
    await client.query('COMMIT');
    res.json({ success:true, data:saved });
  } catch(err) { await client.query('ROLLBACK'); next(err); }
  finally { client.release(); }
};

const getAttendanceSummary = async (req, res, next) => {
  try {
    const { month, year } = req.query;
    const m = parseInt(month)||new Date().getMonth()+1;
    const y = parseInt(year)||new Date().getFullYear();
    const rows = (await pool.query(
      `SELECT e.id, e.emp_number, e.name, e.department,
         COUNT(a.id) FILTER (WHERE a.status='present') AS present,
         COUNT(a.id) FILTER (WHERE a.status='absent')  AS absent,
         COUNT(a.id) FILTER (WHERE a.status='half_day')AS half_day,
         COUNT(a.id) FILTER (WHERE a.status='late')    AS late,
         COUNT(a.id) FILTER (WHERE a.status='leave')   AS leave
       FROM employees e
       LEFT JOIN attendance a ON a.employee_id=e.id
         AND EXTRACT(MONTH FROM a.date)=$1 AND EXTRACT(YEAR FROM a.date)=$2
       WHERE e.status='active'
       GROUP BY e.id ORDER BY e.name`,
      [m, y]
    )).rows;
    res.json({ success:true, data:rows });
  } catch(err) { next(err); }
};

/* ══════════ PAYROLL ══════════ */
const EPF_EMP  = 0.08;  // 8% employee
const EPF_EMPR = 0.12;  // 12% employer
const ETF_EMPR = 0.03;  // 3% employer

const calcPayroll = (basic, allowances, overtime=0, other_deductions=0) => {
  const gross       = +basic + +allowances + +overtime;
  const epf_employee= +(gross * EPF_EMP).toFixed(2);
  const epf_employer= +(gross * EPF_EMPR).toFixed(2);
  const etf_employer= +(gross * ETF_EMPR).toFixed(2);
  const net         = +(gross - epf_employee - +other_deductions).toFixed(2);
  return { gross_salary:+gross.toFixed(2), epf_employee, epf_employer, etf_employer, net_salary:net };
};

const getPayroll = async (req, res, next) => {
  try {
    const { month, year, status='', page=1, limit=10 } = req.query;
    const m = parseInt(month)||new Date().getMonth()+1;
    const y = parseInt(year)||new Date().getFullYear();
    const offset = (page-1)*limit;
    const params = [m, y];
    let where = `WHERE p.month=$1 AND p.year=$2`;
    if (status) { params.push(status); where += ` AND p.status=$${params.length}`; }

    const total = parseInt((await pool.query(`SELECT COUNT(*) FROM payroll p ${where}`, params)).rows[0].count);
    params.push(limit, offset);
    const rows = (await pool.query(
      `SELECT p.*, e.name AS employee_name, e.emp_number, e.department, e.designation
       FROM payroll p JOIN employees e ON p.employee_id=e.id
       ${where} ORDER BY e.name LIMIT $${params.length-1} OFFSET $${params.length}`,
      params
    )).rows;
    res.json({ success:true, data:rows, total, page:+page, limit:+limit, month:m, year:y });
  } catch(err) { next(err); }
};

const generatePayroll = async (req, res, next) => {
  const client = await pool.connect();
  try {
    const { month, year, employee_ids, overrides={} } = req.body;
    if (!month||!year) return res.status(400).json({ message:'Month and year required' });

    await client.query('BEGIN');
    const empQuery = employee_ids?.length
      ? await client.query(`SELECT * FROM employees WHERE id=ANY($1) AND status='active'`, [employee_ids])
      : await client.query(`SELECT * FROM employees WHERE status='active'`);

    const created = [];
    for (const emp of empQuery.rows) {
      const existing = await client.query('SELECT id FROM payroll WHERE employee_id=$1 AND month=$2 AND year=$3',[emp.id,month,year]);
      if (existing.rows[0]) continue;

      const ov = overrides[emp.id] || {};
      const basic    = parseFloat(ov.basic_salary    ?? emp.basic_salary);
      const allowances= parseFloat(ov.allowances     ?? emp.allowances);
      const overtime = parseFloat(ov.overtime        ?? 0);
      const other_ded= parseFloat(ov.other_deductions?? 0);
      const calc     = calcPayroll(basic, allowances, overtime, other_ded);
      const payroll_number = await genPayrollNumber(month, year);

      const row = (await client.query(
        `INSERT INTO payroll (payroll_number,employee_id,month,year,basic_salary,allowances,overtime,
          gross_salary,epf_employee,epf_employer,etf_employer,other_deductions,net_salary,notes,processed_by)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15) RETURNING *`,
        [payroll_number, emp.id, month, year, basic, allowances, overtime,
         calc.gross_salary, calc.epf_employee, calc.epf_employer, calc.etf_employer,
         other_ded, calc.net_salary, ov.notes||null, req.user.id]
      )).rows[0];
      created.push(row);
    }
    await client.query('COMMIT');
    res.status(201).json({ success:true, data:created, count:created.length });
  } catch(err) { await client.query('ROLLBACK'); next(err); }
  finally { client.release(); }
};

const updatePayrollStatus = async (req, res, next) => {
  try {
    const { status } = req.body;
    if (!['draft','approved','paid'].includes(status)) return res.status(400).json({ message:'Invalid status' });
    const row = (await pool.query(
      `UPDATE payroll SET status=$1,updated_at=NOW() WHERE id=$2 RETURNING *`,
      [status, req.params.id]
    )).rows[0];
    if (!row) return res.status(404).json({ message:'Payroll record not found' });
    res.json({ success:true, data:row });
  } catch(err) { next(err); }
};

const getPayslip = async (req, res, next) => {
  try {
    const row = (await pool.query(
      `SELECT p.*, e.name AS employee_name, e.emp_number, e.nic, e.department, e.designation, e.date_joined
       FROM payroll p JOIN employees e ON p.employee_id=e.id WHERE p.id=$1`,
      [req.params.id]
    )).rows[0];
    if (!row) return res.status(404).json({ message:'Payslip not found' });
    res.json({ success:true, data:row });
  } catch(err) { next(err); }
};

/* ══════════ STATS ══════════ */
const stats = async (req, res, next) => {
  try {
    const today = new Date().toISOString().split('T')[0];
    const m = new Date().getMonth()+1, y = new Date().getFullYear();
    const [emps, att, pay] = await Promise.all([
      pool.query(`SELECT COUNT(*) total, COUNT(*) FILTER (WHERE status='active') active, COUNT(*) FILTER (WHERE status='inactive') inactive FROM employees`),
      pool.query(`SELECT COUNT(*) FILTER (WHERE status='present') present, COUNT(*) FILTER (WHERE status='absent') absent FROM attendance WHERE date=$1`,[today]),
      pool.query(`SELECT COUNT(*) total, COALESCE(SUM(net_salary),0) net_total, COALESCE(SUM(epf_employer+etf_employer),0) employer_contrib FROM payroll WHERE month=$1 AND year=$2`,[m,y]),
    ]);
    res.json({ success:true, data:{
      ...emps.rows[0], ...att.rows[0], ...pay.rows[0],
      current_month: m, current_year: y,
    }});
  } catch(err) { next(err); }
};

module.exports = {
  getEmployees, getEmployee, createEmployee, updateEmployee, deleteEmployee, getDepartments,
  getAttendance, markAttendance, getAttendanceSummary,
  getPayroll, generatePayroll, updatePayrollStatus, getPayslip,
  stats,
};
