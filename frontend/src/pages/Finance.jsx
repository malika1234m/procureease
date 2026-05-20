import { useState, useEffect, useCallback } from 'react';
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { Plus, Search, X, RefreshCw, FileText, CreditCard, Receipt, TrendingUp, AlertTriangle, CheckCircle2, ChevronLeft, ChevronRight, DollarSign, Clock, XCircle, Trash2 } from 'lucide-react';
import { getFinanceStats, getInvoices, createInvoice, updateInvoiceStatus, getPayments, createPayment, getExpenses, createExpense, updateExpenseStatus, deleteExpense } from '../services/financeService';
import InvoiceModal from '../components/finance/InvoiceModal';
import PaymentModal from '../components/finance/PaymentModal';
import ExpenseModal from '../components/finance/ExpenseModal';

const fmtLKR = (v) => `LKR ${parseFloat(v||0).toLocaleString('en-LK',{maximumFractionDigits:0})}`;
const fmtK   = (v) => { const n=parseFloat(v||0); return n>=1e6?`${(n/1e6).toFixed(1)}M`:n>=1000?`${(n/1000).toFixed(0)}K`:n.toFixed(0); };
const INV_STATUS = { pending:{label:'Pending',cls:'badge-amber'}, approved:{label:'Approved',cls:'badge-green'}, paid:{label:'Paid',cls:'badge-blue'}, disputed:{label:'Disputed',cls:'badge-red'} };
const EXP_STATUS = { recorded:{label:'Recorded',cls:'badge-slate'}, approved:{label:'Approved',cls:'badge-green'}, rejected:{label:'Rejected',cls:'badge-red'} };
const PAY_METHOD = { bank_transfer:'Bank', cheque:'Cheque', cash:'Cash', online:'Online' };
const LIMIT = 10;
const PIE_COLORS = ['#16a34a','#3b82f6','#f59e0b','#8b5cf6','#dc2626','#0891b2'];

const ChartTip = ({ active, payload, label }) => {
  if (!active||!payload?.length) return null;
  return <div style={{ background:'#fff', border:'1px solid #e2e8f0', borderRadius:10, padding:'8px 12px', fontSize:12, boxShadow:'0 4px 12px rgba(0,0,0,.08)' }}><p style={{ color:'#64748b' }}>{label}</p><p style={{ color:'#0f172a', fontWeight:700 }}>LKR {fmtK(payload[0]?.value)}</p></div>;
};

/* ── Overview ── */
const OverviewTab = ({ stats }) => {
  if (!stats) return <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16 }}>{Array.from({length:4}).map((_,i)=><div key={i} className="shimmer" style={{height:200,borderRadius:16}}/>)}</div>;
  const d = stats;
  return (
    <div style={{ display:'flex', flexDirection:'column', gap:20 }}>
      {parseInt(d.overdue_count) > 0 && (
        <div style={{ background:'#fef2f2', border:'1px solid #fecaca', borderRadius:14, padding:'14px 18px', display:'flex', alignItems:'center', gap:12 }}>
          <AlertTriangle size={18} style={{ color:'#dc2626', flexShrink:0 }}/>
          <div>
            <p style={{ fontSize:13, fontWeight:600, color:'#dc2626' }}>{d.overdue_count} overdue invoice{d.overdue_count>1?'s':''}</p>
            <p style={{ fontSize:12, color:'#ef4444' }}>Past due date and not yet paid. Review and process immediately.</p>
          </div>
        </div>
      )}
      <div style={{ display:'grid', gridTemplateColumns:'2fr 1fr', gap:16 }}>
        <div className="section-card">
          <div className="section-header"><div><p style={{ fontSize:14, fontWeight:600, color:'#0f172a' }}>Payment Trend</p><p style={{ fontSize:11, color:'#94a3b8', marginTop:2 }}>Last 6 months outflow (LKR)</p></div><span style={{ fontSize:18, fontWeight:800, color:'#0f172a' }}>{fmtLKR(d.monthly_payments)}</span></div>
          <div style={{ padding:'20px' }}>
            {d.monthly_trend?.length > 0 ? (
              <ResponsiveContainer width="100%" height={160}>
                <AreaChart data={d.monthly_trend} margin={{ top:0, right:0, left:-25, bottom:0 }}>
                  <defs><linearGradient id="pg" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#16a34a" stopOpacity={0.2}/><stop offset="100%" stopColor="#16a34a" stopOpacity={0}/></linearGradient></defs>
                  <XAxis dataKey="month" tick={{ fill:'#94a3b8', fontSize:11 }} axisLine={false} tickLine={false}/>
                  <YAxis tick={{ fill:'#94a3b8', fontSize:11 }} axisLine={false} tickLine={false} tickFormatter={fmtK}/>
                  <Tooltip content={<ChartTip/>}/>
                  <Area type="monotone" dataKey="paid" stroke="#16a34a" strokeWidth={2} fill="url(#pg)"/>
                </AreaChart>
              </ResponsiveContainer>
            ) : <div style={{ height:160, display:'flex', alignItems:'center', justifyContent:'center', color:'#94a3b8' }}><p style={{ fontSize:12 }}>No payment data yet</p></div>}
          </div>
        </div>
        <div className="section-card">
          <div className="section-header"><div><p style={{ fontSize:14, fontWeight:600, color:'#0f172a' }}>Expenses by Category</p><p style={{ fontSize:11, color:'#94a3b8' }}>Approved only</p></div></div>
          <div style={{ padding:'20px' }}>
            {d.exp_by_category?.length > 0 ? (
              <>
                <ResponsiveContainer width="100%" height={120}>
                  <PieChart><Pie data={d.exp_by_category} cx="50%" cy="50%" innerRadius={32} outerRadius={50} dataKey="total" paddingAngle={3} stroke="none" nameKey="category">
                    {d.exp_by_category.map((_,i)=><Cell key={i} fill={PIE_COLORS[i%PIE_COLORS.length]}/>)}
                  </Pie><Tooltip formatter={v=>fmtLKR(v)} contentStyle={{ background:'#fff', border:'1px solid #e2e8f0', borderRadius:10, fontSize:11 }}/></PieChart>
                </ResponsiveContainer>
                <div style={{ display:'flex', flexDirection:'column', gap:5, marginTop:8 }}>
                  {d.exp_by_category.slice(0,5).map((c,i)=>(
                    <div key={c.category} style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
                      <div style={{ display:'flex', alignItems:'center', gap:6 }}><span style={{ width:8, height:8, borderRadius:'50%', background:PIE_COLORS[i%PIE_COLORS.length], display:'block' }}/><span style={{ fontSize:11, color:'#64748b' }}>{c.category}</span></div>
                      <span style={{ fontSize:11, fontWeight:600, color:'#374151' }}>LKR {fmtK(c.total)}</span>
                    </div>
                  ))}
                </div>
              </>
            ) : <div style={{ height:160, display:'flex', alignItems:'center', justifyContent:'center', color:'#94a3b8' }}><p style={{ fontSize:12 }}>No expense data</p></div>}
          </div>
        </div>
      </div>
      <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:14 }}>
        {[
          { label:'This Month Payments', value:fmtLKR(d.monthly_payments), Icon:CreditCard,    bg:'#f0fdf4', c:'#15803d' },
          { label:'This Month Expenses', value:fmtLKR(d.monthly_expenses), Icon:Receipt,       bg:'#fff7ed', c:'#c2410c' },
          { label:'Overdue Invoices',    value:d.overdue_count||0,          Icon:AlertTriangle, bg:'#fef2f2', c:'#dc2626' },
        ].map(({ label, value, Icon, bg, c }) => (
          <div key={label} style={{ background:bg, borderRadius:14, padding:'18px', display:'flex', alignItems:'center', gap:14 }}>
            <div style={{ width:44, height:44, borderRadius:12, background:'rgba(255,255,255,.7)', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}><Icon size={20} style={{ color:c }}/></div>
            <div><p style={{ fontSize:18, fontWeight:800, color:c }}>{value}</p><p style={{ fontSize:12, color:'#64748b', marginTop:3 }}>{label}</p></div>
          </div>
        ))}
      </div>
    </div>
  );
};

/* ── Generic table tab ── */
const TableTab = ({ title, fetchFn, renderHeader, renderRow, ModalComp, onCreate, filterButtons, emptyText }) => {
  const [rows, setRows]     = useState([]); const [total, setTotal] = useState(0);
  const [page, setPage]     = useState(1);  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState(''); const [loading, setLoading] = useState(true);
  const [modal, setModal]   = useState(false); const [toast, setToast] = useState(null);
  const showToast = (msg, type='success') => { setToast({msg,type}); setTimeout(()=>setToast(null),3000); };
  const fetch = useCallback(async () => {
    setLoading(true);
    try { const r = await fetchFn({ search, status:filter, page, limit:LIMIT }); setRows(r.data.data); setTotal(r.data.total); }
    catch { showToast('Failed to load','error'); } finally { setLoading(false); }
  }, [search, filter, page]);
  useEffect(() => { fetch(); }, [fetch]); useEffect(() => { setPage(1); }, [search, filter]);
  const totalPages = Math.ceil(total / LIMIT);
  return (
    <div style={{ display:'flex', flexDirection:'column', gap:16 }}>
      {toast && <div style={{ position:'fixed', top:20, right:20, zIndex:9999, padding:'12px 18px', borderRadius:12, fontSize:13, fontWeight:500, boxShadow:'0 8px 24px rgba(0,0,0,.12)', background:toast.type==='error'?'#fef2f2':'#f0fdf4', color:toast.type==='error'?'#dc2626':'#15803d', border:`1px solid ${toast.type==='error'?'#fecaca':'#bbf7d0'}` }}>{toast.type==='error'?<X size={13}/>:<CheckCircle2 size={13}/>} {toast.msg}</div>}
      <div style={{ display:'flex', gap:10, alignItems:'center', background:'#fff', padding:'14px 16px', borderRadius:14, border:'1px solid #f1f5f9', boxShadow:'0 1px 3px rgba(0,0,0,.04)' }}>
        <div style={{ position:'relative', flex:1 }}>
          <Search size={14} style={{ position:'absolute', left:11, top:'50%', transform:'translateY(-50%)', color:'#94a3b8' }}/>
          <input value={search} onChange={e=>setSearch(e.target.value)} placeholder={`Search ${title.toLowerCase()}…`} className="input-field" style={{ paddingLeft:34 }}/>
          {search && <button onClick={()=>setSearch('')} style={{ position:'absolute', right:10, top:'50%', transform:'translateY(-50%)', background:'none', border:'none', cursor:'pointer', color:'#94a3b8', display:'flex' }}><X size={14}/></button>}
        </div>
        {filterButtons?.map(([v,l])=>(
          <button key={v} onClick={()=>setFilter(v)} style={{ padding:'8px 12px', borderRadius:8, fontSize:12, fontWeight:500, cursor:'pointer', background:filter===v?'#16a34a':'#f8fafc', color:filter===v?'#fff':'#475569', border:filter===v?'1px solid #16a34a':'1px solid #e2e8f0' }}>{l}</button>
        ))}
        <button onClick={fetch} style={{ width:36, height:36, borderRadius:8, border:'1px solid #e2e8f0', background:'#f8fafc', display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer', color:'#64748b' }}><RefreshCw size={14} className={loading?'animate-spin':''}/></button>
        <button className="btn-primary" onClick={()=>setModal(true)}><Plus size={14}/> New {title.slice(0,-1)}</button>
      </div>
      <div className="data-table">
        {renderHeader()}
        {loading && Array.from({length:4}).map((_,i)=><div key={i} className="data-table-row" style={{ padding:'14px 20px', display:'flex', gap:12, alignItems:'center' }}>{[100,140,80,80,80,60].map((w,j)=><div key={j} className="shimmer" style={{height:13,width:w,borderRadius:6}}/>)}</div>)}
        {!loading && rows.length === 0 && (
          <div style={{ padding:'60px 20px', textAlign:'center' }}>
            <div style={{ width:56, height:56, borderRadius:16, background:'#f1f5f9', display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 12px' }}>
              <FileText size={26} style={{ color:'#94a3b8' }}/>
            </div>
            <p style={{ fontSize:14, fontWeight:600, color:'#374151' }}>{emptyText}</p>
            <p style={{ fontSize:12, color:'#94a3b8', marginTop:4, marginBottom:16 }}>{search?'Try a different search':'Click the button above to add one'}</p>
          </div>
        )}
        {!loading && rows.map((row,idx) => renderRow(row, idx, rows.length, fetch, showToast))}
        {totalPages > 1 && (
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'12px 20px', borderTop:'1px solid #f1f5f9' }}>
            <p style={{ fontSize:12, color:'#94a3b8' }}>Showing {(page-1)*LIMIT+1}–{Math.min(page*LIMIT,total)} of {total}</p>
            <div style={{ display:'flex', gap:4 }}>
              <button onClick={()=>setPage(p=>p-1)} disabled={page===1} style={{ width:32, height:32, borderRadius:8, border:'1px solid #e2e8f0', background:'#fff', display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer', opacity:page===1?.4:1 }}><ChevronLeft size={14}/></button>
              {Array.from({length:totalPages},(_,i)=>i+1).map(n=><button key={n} onClick={()=>setPage(n)} style={{ width:32, height:32, borderRadius:8, border:n===page?'1px solid #16a34a':'1px solid #e2e8f0', background:n===page?'#16a34a':'#fff', color:n===page?'#fff':'#374151', fontSize:12, fontWeight:600, cursor:'pointer' }}>{n}</button>)}
              <button onClick={()=>setPage(p=>p+1)} disabled={page===totalPages} style={{ width:32, height:32, borderRadius:8, border:'1px solid #e2e8f0', background:'#fff', display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer', opacity:page===totalPages?.4:1 }}><ChevronRight size={14}/></button>
            </div>
          </div>
        )}
      </div>
      {modal && ModalComp && <ModalComp onClose={()=>setModal(false)} onSave={async(form)=>{ await onCreate(form); showToast(`${title.slice(0,-1)} saved`); setModal(false); fetch(); }}/>}
    </div>
  );
};

/* ── Main ── */
const Finance = () => {
  const [tab, setTab]     = useState('overview');
  const [stats, setStats] = useState(null);
  useEffect(() => { getFinanceStats().then(r=>setStats(r.data.data)).catch(()=>{}); }, [tab]);

  const kpis = [
    { label:'Total Invoiced', value:fmtLKR(stats?.invoices?.total_value),  bg:'#f5f3ff', ic:'#7c3aed', icon:FileText     },
    { label:'Outstanding',    value:fmtLKR(stats?.invoices?.pending_value), bg:'#fef9c3', ic:'#d97706', icon:Clock        },
    { label:'Total Paid',     value:fmtLKR(stats?.payments?.total_paid),    bg:'#f0fdf4', ic:'#16a34a', icon:CheckCircle2 },
    { label:'Total Expenses', value:fmtLKR(stats?.expenses?.total_amount),  bg:'#fff7ed', ic:'#c2410c', icon:Receipt      },
  ];

  const headerStyle = (cols) => (
    <div className="data-table-header" style={{ display:'grid', gridTemplateColumns:cols, gap:12, padding:'11px 20px' }}>
      {arguments[1].map(h=><span key={h} style={{ fontSize:11, fontWeight:700, color:'#94a3b8', textTransform:'uppercase', letterSpacing:'.05em' }}>{h}</span>)}
    </div>
  );

  return (
    <div className="page" style={{ display:'flex', flexDirection:'column', gap:24 }}>
      <div>
        <h1 style={{ fontSize:22, fontWeight:800, color:'#0f172a' }}>Finance</h1>
        <p style={{ fontSize:13, color:'#64748b', marginTop:3 }}>Invoices, payments, expenses and financial overview</p>
      </div>
      <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:16 }}>
        {kpis.map(({ label, value, bg, ic, icon:Icon }) => (
          <div key={label} className="stat-card" style={{ background:'#fff' }}>
            <div style={{ width:46, height:46, borderRadius:12, background:bg, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}><Icon size={20} style={{ color:ic }}/></div>
            <div><p style={{ fontSize:18, fontWeight:800, color:'#0f172a', lineHeight:1.1 }}>{value ?? '—'}</p><p style={{ fontSize:12, color:'#64748b', marginTop:4 }}>{label}</p></div>
          </div>
        ))}
      </div>
      <div style={{ display:'flex', gap:4, background:'#fff', padding:'6px', borderRadius:12, border:'1px solid #f1f5f9', width:'fit-content', boxShadow:'0 1px 3px rgba(0,0,0,.04)' }}>
        {[['overview','Overview'],['invoices','Invoices'],['payments','Payments'],['expenses','Expenses']].map(([id,label])=>(
          <button key={id} onClick={()=>setTab(id)} style={{ padding:'8px 18px', borderRadius:8, fontSize:13, fontWeight:500, cursor:'pointer', background:tab===id?'#16a34a':'transparent', color:tab===id?'#fff':'#64748b', border:'none' }}>{label}</button>
        ))}
      </div>
      {tab==='overview' && <OverviewTab stats={stats}/>}
      {tab==='invoices' && (
        <TableTab title="Invoices" fetchFn={getInvoices} emptyText="No invoices found"
          filterButtons={[['','All'],['pending','Pending'],['approved','Approved'],['paid','Paid'],['disputed','Disputed']]}
          ModalComp={InvoiceModal} onCreate={createInvoice}
          renderHeader={() => (
            <div className="data-table-header" style={{ display:'grid', gridTemplateColumns:'1.2fr 2fr 1fr 1fr 1.2fr 1fr 0.9fr', gap:12, padding:'11px 20px' }}>
              {['Invoice #','Supplier','Amount','Tax','Total','Due Date','Status'].map(h=><span key={h} style={{ fontSize:11, fontWeight:700, color:'#94a3b8', textTransform:'uppercase', letterSpacing:'.05em' }}>{h}</span>)}
            </div>
          )}
          renderRow={(inv, idx, len, fetch, showToast) => {
            const isOverdue = inv.due_date && new Date(inv.due_date) < new Date() && inv.status !== 'paid';
            return (
              <div key={inv.id} className="data-table-row" style={{ display:'grid', gridTemplateColumns:'1.2fr 2fr 1fr 1fr 1.2fr 1fr 0.9fr', gap:12, padding:'13px 20px', alignItems:'center', borderBottom:idx<len-1?'1px solid #f8fafc':'none' }}>
                <div><p style={{ fontSize:12, fontWeight:600, color:'#7c3aed' }}>{inv.invoice_number}</p>{inv.po_number&&<p style={{ fontSize:10, color:'#94a3b8' }}>{inv.po_number}</p>}</div>
                <span style={{ fontSize:12, color:'#374151', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{inv.supplier_name}</span>
                <span style={{ fontSize:12, color:'#374151' }}>LKR {fmtK(inv.amount)}</span>
                <span style={{ fontSize:12, color:'#94a3b8' }}>LKR {fmtK(inv.tax_amount)}</span>
                <span style={{ fontSize:13, fontWeight:700, color:'#0f172a' }}>LKR {fmtK(inv.total_amount)}</span>
                <div>
                  <span style={{ fontSize:12, color: isOverdue?'#dc2626':'#374151', fontWeight: isOverdue?600:400 }}>{inv.due_date ? new Date(inv.due_date).toLocaleDateString('en-LK') : '—'}</span>
                  {isOverdue && <p style={{ fontSize:10, color:'#dc2626' }}>Overdue</p>}
                </div>
                <div style={{ display:'flex', alignItems:'center', gap:4 }}>
                  <span className={`badge ${INV_STATUS[inv.status]?.cls||'badge-slate'}`}>{INV_STATUS[inv.status]?.label||inv.status}</span>
                  {inv.status==='pending' && <button onClick={async()=>{ await updateInvoiceStatus(inv.id,'approved'); showToast('Approved'); fetch(); }} style={{ width:24, height:24, borderRadius:6, border:'1px solid #e2e8f0', background:'#fff', display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer', color:'#64748b' }} title="Approve"><CheckCircle2 size={11}/></button>}
                  {inv.status==='approved' && <button onClick={async()=>{ await updateInvoiceStatus(inv.id,'paid'); showToast('Marked paid'); fetch(); }} style={{ width:24, height:24, borderRadius:6, border:'1px solid #e2e8f0', background:'#fff', display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer', color:'#64748b' }} title="Mark Paid"><DollarSign size={11}/></button>}
                </div>
              </div>
            );
          }}
        />
      )}
      {tab==='payments' && (
        <TableTab title="Payments" fetchFn={getPayments} emptyText="No payments recorded"
          ModalComp={PaymentModal} onCreate={createPayment}
          renderHeader={() => (
            <div className="data-table-header" style={{ display:'grid', gridTemplateColumns:'1.2fr 2fr 1.2fr 1fr 1fr 1.5fr', gap:12, padding:'11px 20px' }}>
              {['Payment #','Supplier','Amount','Method','Date','Invoice'].map(h=><span key={h} style={{ fontSize:11, fontWeight:700, color:'#94a3b8', textTransform:'uppercase', letterSpacing:'.05em' }}>{h}</span>)}
            </div>
          )}
          renderRow={(p, idx, len) => (
            <div key={p.id} className="data-table-row" style={{ display:'grid', gridTemplateColumns:'1.2fr 2fr 1.2fr 1fr 1fr 1.5fr', gap:12, padding:'13px 20px', alignItems:'center', borderBottom:idx<len-1?'1px solid #f8fafc':'none' }}>
              <span style={{ fontSize:12, fontWeight:600, color:'#16a34a' }}>{p.payment_number}</span>
              <span style={{ fontSize:12, color:'#374151' }}>{p.supplier_name}</span>
              <span style={{ fontSize:13, fontWeight:700, color:'#0f172a' }}>LKR {fmtK(p.amount)}</span>
              <span className="badge badge-slate" style={{ fontSize:10 }}>{PAY_METHOD[p.method]||p.method}</span>
              <span style={{ fontSize:12, color:'#374151' }}>{new Date(p.payment_date).toLocaleDateString('en-LK')}</span>
              <span style={{ fontSize:12, color:'#94a3b8' }}>{p.invoice_number||'—'}</span>
            </div>
          )}
        />
      )}
      {tab==='expenses' && (
        <TableTab title="Expenses" fetchFn={getExpenses} emptyText="No expenses recorded"
          filterButtons={[['','All'],['recorded','Recorded'],['approved','Approved'],['rejected','Rejected']]}
          ModalComp={ExpenseModal} onCreate={createExpense}
          renderHeader={() => (
            <div className="data-table-header" style={{ display:'grid', gridTemplateColumns:'2fr 1fr 1fr 1fr 1fr 0.8fr 80px', gap:12, padding:'11px 20px' }}>
              {['Title','Category','Vendor','Amount','Date','Status',''].map(h=><span key={h} style={{ fontSize:11, fontWeight:700, color:'#94a3b8', textTransform:'uppercase', letterSpacing:'.05em' }}>{h}</span>)}
            </div>
          )}
          renderRow={(exp, idx, len, fetch, showToast) => (
            <div key={exp.id} className="data-table-row" style={{ display:'grid', gridTemplateColumns:'2fr 1fr 1fr 1fr 1fr 0.8fr 80px', gap:12, padding:'13px 20px', alignItems:'center', borderBottom:idx<len-1?'1px solid #f8fafc':'none' }}>
              <div><p style={{ fontSize:13, fontWeight:600, color:'#0f172a' }}>{exp.title}</p><p style={{ fontSize:10, color:'#94a3b8' }}>{exp.expense_number}</p></div>
              <span style={{ fontSize:12, color:'#374151' }}>{exp.category||'—'}</span>
              <span style={{ fontSize:12, color:'#374151' }}>{exp.vendor||'—'}</span>
              <span style={{ fontSize:13, fontWeight:700, color:'#0f172a' }}>LKR {fmtK(exp.amount)}</span>
              <span style={{ fontSize:12, color:'#374151' }}>{new Date(exp.expense_date).toLocaleDateString('en-LK')}</span>
              <span className={`badge ${EXP_STATUS[exp.status]?.cls||'badge-slate'}`}>{EXP_STATUS[exp.status]?.label||exp.status}</span>
              <div style={{ display:'flex', gap:4 }}>
                {exp.status==='recorded' && <>
                  <button onClick={async()=>{ await updateExpenseStatus(exp.id,'approved'); showToast('Approved'); fetch(); }} style={{ width:28, height:28, borderRadius:7, border:'1px solid #e2e8f0', background:'#fff', display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer', color:'#64748b' }} title="Approve"><CheckCircle2 size={12}/></button>
                  <button onClick={async()=>{ await updateExpenseStatus(exp.id,'rejected'); showToast('Rejected'); fetch(); }} style={{ width:28, height:28, borderRadius:7, border:'1px solid #e2e8f0', background:'#fff', display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer', color:'#64748b' }} title="Reject"><XCircle size={12}/></button>
                </>}
                {exp.status!=='approved' && <button onClick={async()=>{ if(!confirm('Delete?'))return; await deleteExpense(exp.id); showToast('Deleted'); fetch(); }} style={{ width:28, height:28, borderRadius:7, border:'1px solid #e2e8f0', background:'#fff', display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer', color:'#64748b' }} title="Delete"><Trash2 size={12}/></button>}
              </div>
            </div>
          )}
        />
      )}
    </div>
  );
};

export default Finance;
