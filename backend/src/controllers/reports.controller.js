const pool = require('../config/db');

/* ── helpers ── */
const parseRange = (from, to) => {
  const f = from || new Date(new Date().getFullYear(), 0, 1).toISOString().split('T')[0];
  const t = to   || new Date().toISOString().split('T')[0];
  return [f, t];
};

/* ══════════ OVERVIEW ══════════ */
const overview = async (req, res, next) => {
  try {
    const [from, to] = parseRange(req.query.from, req.query.to);

    const [suppliers, employees, inventory, procurement, finance, payroll] = await Promise.all([
      pool.query(`SELECT COUNT(*) total, COUNT(*) FILTER(WHERE status='active') active,
                  COUNT(*) FILTER(WHERE status='blacklisted') blacklisted FROM suppliers`),
      pool.query(`SELECT COUNT(*) total, COUNT(*) FILTER(WHERE status='active') active FROM employees`),
      pool.query(`SELECT COUNT(*) total_items, COALESCE(SUM(current_stock),0) total_units,
                  COUNT(*) FILTER(WHERE current_stock<=reorder_level AND reorder_level>0) low_stock,
                  COUNT(*) FILTER(WHERE current_stock=0) out_of_stock FROM items`),
      pool.query(`SELECT COUNT(*) total_pr, COUNT(*) FILTER(WHERE status='pending') pending_pr,
                  COUNT(*) FILTER(WHERE status='approved') approved_pr,
                  (SELECT COUNT(*) FROM purchase_orders WHERE created_at::date BETWEEN $1 AND $2) total_po,
                  (SELECT COALESCE(SUM(total_amount),0) FROM purchase_orders WHERE created_at::date BETWEEN $1 AND $2) po_value
                  FROM purchase_requisitions WHERE created_at::date BETWEEN $1 AND $2`, [from, to]),
      pool.query(`SELECT COALESCE(SUM(total_amount),0) total_invoiced,
                  COALESCE(SUM(total_amount) FILTER(WHERE status='pending'),0) pending_invoiced,
                  COALESCE(SUM(total_amount) FILTER(WHERE status='paid'),0) paid_invoiced,
                  (SELECT COALESCE(SUM(amount),0) FROM expenses WHERE expense_date BETWEEN $1 AND $2 AND status='approved') total_expenses,
                  (SELECT COALESCE(SUM(amount),0) FROM payments WHERE payment_date BETWEEN $1 AND $2) total_payments
                  FROM supplier_invoices WHERE invoice_date BETWEEN $1 AND $2`, [from, to]),
      pool.query(`SELECT COALESCE(SUM(net_salary),0) net_total,
                  COALESCE(SUM(gross_salary),0) gross_total,
                  COALESCE(SUM(epf_employer+etf_employer),0) employer_contrib,
                  COUNT(*) payslips FROM payroll
                  WHERE status IN ('approved','paid')
                  AND MAKE_DATE(year, month, 1) BETWEEN $1::date AND $2::date`, [from, to]),
    ]);

    res.json({ success: true, data: {
      date_range: { from, to },
      suppliers: suppliers.rows[0],
      employees: employees.rows[0],
      inventory: inventory.rows[0],
      procurement: procurement.rows[0],
      finance: finance.rows[0],
      payroll: payroll.rows[0],
    }});
  } catch(err) { next(err); }
};

/* ══════════ PROCUREMENT REPORT ══════════ */
const procurement = async (req, res, next) => {
  try {
    const [from, to] = parseRange(req.query.from, req.query.to);

    const [prStatus, poMonthly, topSuppliers, prDept, poStatus] = await Promise.all([
      pool.query(`SELECT status, COUNT(*) count FROM purchase_requisitions
                  WHERE created_at::date BETWEEN $1 AND $2 GROUP BY status ORDER BY count DESC`, [from, to]),
      pool.query(`SELECT TO_CHAR(order_date,'Mon YY') AS label, EXTRACT(YEAR FROM order_date)*100+EXTRACT(MONTH FROM order_date) AS sort_key,
                  COUNT(*) orders, COALESCE(SUM(total_amount),0) value
                  FROM purchase_orders WHERE order_date BETWEEN $1 AND $2
                  GROUP BY TO_CHAR(order_date,'Mon YY'), EXTRACT(YEAR FROM order_date)*100+EXTRACT(MONTH FROM order_date)
                  ORDER BY sort_key`, [from, to]),
      pool.query(`SELECT s.name, COUNT(po.id) orders, COALESCE(SUM(po.total_amount),0) total_value
                  FROM purchase_orders po JOIN suppliers s ON po.supplier_id=s.id
                  WHERE po.order_date BETWEEN $1 AND $2
                  GROUP BY s.name ORDER BY total_value DESC LIMIT 8`, [from, to]),
      pool.query(`SELECT COALESCE(department,'Unassigned') dept, COUNT(*) count
                  FROM purchase_requisitions WHERE created_at::date BETWEEN $1 AND $2
                  GROUP BY department ORDER BY count DESC LIMIT 8`, [from, to]),
      pool.query(`SELECT status, COUNT(*) count, COALESCE(SUM(total_amount),0) value
                  FROM purchase_orders WHERE order_date BETWEEN $1 AND $2
                  GROUP BY status`, [from, to]),
    ]);

    res.json({ success:true, data:{
      date_range:{from,to},
      pr_by_status:   prStatus.rows,
      po_monthly:     poMonthly.rows,
      top_suppliers:  topSuppliers.rows,
      pr_by_dept:     prDept.rows,
      po_by_status:   poStatus.rows,
    }});
  } catch(err) { next(err); }
};

/* ══════════ INVENTORY REPORT ══════════ */
const inventory = async (req, res, next) => {
  try {
    const [from, to] = parseRange(req.query.from, req.query.to);

    const [stockLevels, byCategory, movements, lowStock, valuation] = await Promise.all([
      pool.query(`SELECT
                  COUNT(*) FILTER(WHERE current_stock > reorder_level) in_stock,
                  COUNT(*) FILTER(WHERE current_stock <= reorder_level AND reorder_level > 0 AND current_stock > 0) low_stock,
                  COUNT(*) FILTER(WHERE current_stock = 0) out_of_stock,
                  COUNT(*) total FROM items`),
      pool.query(`SELECT c.name, COUNT(i.id) item_count, COALESCE(SUM(i.current_stock),0) total_units
                  FROM categories c LEFT JOIN items i ON i.category_id=c.id
                  GROUP BY c.name ORDER BY item_count DESC`),
      pool.query(`SELECT TO_CHAR(created_at,'Mon YY') AS label,
                  EXTRACT(YEAR FROM created_at)*100+EXTRACT(MONTH FROM created_at) AS sort_key,
                  COALESCE(SUM(quantity) FILTER(WHERE type='in'),0)  AS stock_in,
                  COALESCE(SUM(quantity) FILTER(WHERE type='out'),0) AS stock_out
                  FROM stock_movements WHERE created_at::date BETWEEN $1 AND $2
                  GROUP BY TO_CHAR(created_at,'Mon YY'), EXTRACT(YEAR FROM created_at)*100+EXTRACT(MONTH FROM created_at)
                  ORDER BY sort_key`, [from, to]),
      pool.query(`SELECT i.name, i.current_stock, i.reorder_level, i.unit, c.name AS category
                  FROM items i LEFT JOIN categories c ON i.category_id=c.id
                  WHERE i.current_stock <= i.reorder_level AND i.reorder_level > 0
                  ORDER BY (i.current_stock / NULLIF(i.reorder_level,0)) ASC LIMIT 10`),
      pool.query(`SELECT COUNT(*) total_items, COALESCE(SUM(current_stock),0) total_units,
                  COUNT(DISTINCT category_id) categories FROM items`),
    ]);

    res.json({ success:true, data:{
      date_range:{from,to},
      stock_levels:  stockLevels.rows[0],
      by_category:   byCategory.rows,
      movements:     movements.rows,
      low_stock:     lowStock.rows,
      valuation:     valuation.rows[0],
    }});
  } catch(err) { next(err); }
};

/* ══════════ HR REPORT ══════════ */
const hr = async (req, res, next) => {
  try {
    const [from, to] = parseRange(req.query.from, req.query.to);

    const [headcount, byDept, byType, payrollTrend, topEarners, attendance] = await Promise.all([
      pool.query(`SELECT COUNT(*) total, COUNT(*) FILTER(WHERE status='active') active,
                  COUNT(*) FILTER(WHERE status='inactive') inactive,
                  COUNT(*) FILTER(WHERE status='terminated') terminated FROM employees`),
      pool.query(`SELECT COALESCE(department,'Unassigned') dept, COUNT(*) count
                  FROM employees WHERE status='active' GROUP BY department ORDER BY count DESC`),
      pool.query(`SELECT employment_type, COUNT(*) count FROM employees WHERE status='active'
                  GROUP BY employment_type ORDER BY count DESC`),
      pool.query(`SELECT year, month, COALESCE(SUM(gross_salary),0) gross, COALESCE(SUM(net_salary),0) net,
                  COALESCE(SUM(epf_employer+etf_employer),0) employer_cost, COUNT(*) headcount
                  FROM payroll WHERE MAKE_DATE(year,month,1) BETWEEN $1::date AND $2::date
                  GROUP BY year, month ORDER BY year, month`, [from, to]),
      pool.query(`SELECT e.name, e.department, e.designation, p.net_salary, p.gross_salary
                  FROM employees e JOIN payroll p ON e.id=p.employee_id
                  WHERE p.status IN ('approved','paid')
                  ORDER BY p.net_salary DESC LIMIT 8`),
      pool.query(`SELECT status, COUNT(*) count FROM attendance
                  WHERE date BETWEEN $1 AND $2 GROUP BY status`, [from, to]),
    ]);

    res.json({ success:true, data:{
      date_range:{from,to},
      headcount:     headcount.rows[0],
      by_department: byDept.rows,
      by_type:       byType.rows,
      payroll_trend: payrollTrend.rows,
      top_earners:   topEarners.rows,
      attendance:    attendance.rows,
    }});
  } catch(err) { next(err); }
};

/* ══════════ FINANCE REPORT ══════════ */
const finance = async (req, res, next) => {
  try {
    const [from, to] = parseRange(req.query.from, req.query.to);

    const [summary, invoiceMonthly, expenseByCategory, paymentMonthly, topVendors, overdueInvoices] = await Promise.all([
      pool.query(`SELECT
                  COALESCE(SUM(total_amount),0) total_invoiced,
                  COALESCE(SUM(total_amount) FILTER(WHERE status='paid'),0) total_paid,
                  COALESCE(SUM(total_amount) FILTER(WHERE status='pending'),0) total_pending,
                  COALESCE(SUM(total_amount) FILTER(WHERE status='disputed'),0) total_disputed,
                  COUNT(*) FILTER(WHERE due_date < CURRENT_DATE AND status!='paid') overdue_count
                  FROM supplier_invoices WHERE invoice_date BETWEEN $1 AND $2`, [from, to]),
      pool.query(`SELECT TO_CHAR(invoice_date,'Mon YY') AS label,
                  EXTRACT(YEAR FROM invoice_date)*100+EXTRACT(MONTH FROM invoice_date) AS sort_key,
                  COALESCE(SUM(total_amount),0) invoiced, COALESCE(SUM(total_amount) FILTER(WHERE status='paid'),0) paid
                  FROM supplier_invoices WHERE invoice_date BETWEEN $1 AND $2
                  GROUP BY TO_CHAR(invoice_date,'Mon YY'), EXTRACT(YEAR FROM invoice_date)*100+EXTRACT(MONTH FROM invoice_date)
                  ORDER BY sort_key`, [from, to]),
      pool.query(`SELECT COALESCE(category,'Uncategorised') category, COALESCE(SUM(amount),0) total, COUNT(*) count
                  FROM expenses WHERE expense_date BETWEEN $1 AND $2 AND status='approved'
                  GROUP BY category ORDER BY total DESC`, [from, to]),
      pool.query(`SELECT TO_CHAR(payment_date,'Mon YY') AS label,
                  EXTRACT(YEAR FROM payment_date)*100+EXTRACT(MONTH FROM payment_date) AS sort_key,
                  COALESCE(SUM(amount),0) total, COUNT(*) count
                  FROM payments WHERE payment_date BETWEEN $1 AND $2
                  GROUP BY TO_CHAR(payment_date,'Mon YY'), EXTRACT(YEAR FROM payment_date)*100+EXTRACT(MONTH FROM payment_date)
                  ORDER BY sort_key`, [from, to]),
      pool.query(`SELECT s.name supplier, COUNT(si.id) invoices, COALESCE(SUM(si.total_amount),0) total_value
                  FROM supplier_invoices si JOIN suppliers s ON si.supplier_id=s.id
                  WHERE si.invoice_date BETWEEN $1 AND $2
                  GROUP BY s.name ORDER BY total_value DESC LIMIT 8`, [from, to]),
      pool.query(`SELECT si.invoice_number, s.name supplier, si.due_date, si.total_amount, si.status,
                  (CURRENT_DATE - si.due_date) AS days_overdue
                  FROM supplier_invoices si JOIN suppliers s ON si.supplier_id=s.id
                  WHERE si.due_date < CURRENT_DATE AND si.status NOT IN ('paid')
                  ORDER BY days_overdue DESC LIMIT 10`),
    ]);

    res.json({ success:true, data:{
      date_range:{from,to},
      summary:           summary.rows[0],
      invoice_monthly:   invoiceMonthly.rows,
      expense_by_category: expenseByCategory.rows,
      payment_monthly:   paymentMonthly.rows,
      top_vendors:       topVendors.rows,
      overdue_invoices:  overdueInvoices.rows,
    }});
  } catch(err) { next(err); }
};

module.exports = { overview, procurement, inventory, hr, finance };
