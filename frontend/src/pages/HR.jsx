import { useState, useEffect, useCallback } from 'react';
import { Plus, Search, X, RefreshCw, Users, Pencil, Trash2, ChevronLeft, ChevronRight, CheckCircle2, XCircle, DollarSign, Calendar, FileText, Building2, Banknote } from 'lucide-react';
import { getHRStats, getEmployees, createEmployee, updateEmployee, deleteEmployee, getAttendanceSummary, markAttendance, getPayroll, generatePayroll, updatePayrollStatus, getPayslip } from '../services/hrService';
import EmployeeModal from '../components/hr/EmployeeModal';
import PayslipModal  from '../components/hr/PayslipModal';

const MONTHS = ['','January','February','March','April','May','June','July','August','September','October','November','December'];
const LIMIT = 10;
const avatarColors = ['#2563eb','#16a34a','#d97706','#7c3aed','#dc2626','#0891b2','#be185d','#b45309'];
const Avatar = ({ name, size=34 }) => {
  const c = avatarColors[(name?.charCodeAt(0)||0) % avatarColors.length];
  return <div style={{ width:size, height:size, borderRadius:size/3, background:c, display:'flex', alignItems:'center', justifyContent:'center', color:'#fff', fontWeight:700, fontSize:size*0.38, flexShrink:0 }}>{name?.charAt(0).toUpperCase()}</div>;
};
const EMP_TYPE_CLS = { permanent:'badge-blue', contract:'badge-violet', part_time:'badge-amber', probation:'badge-slate' };
const PAY_STATUS_CLS = { draft:'badge-slate', approved:'badge-green', paid:'badge-blue' };
const ATT_COLORS = { present:'#16a34a', absent:'#dc2626', half_day:'#d97706', late:'#f97316', leave:'#7c3aed' };
const ATT_LABELS = { present:'Present', absent:'Absent', half_day:'Half-Day', late:'Late', leave:'Leave' };

/* ── Employees ── */
const EmployeesTab = ({ showToast, onStatsChange }) => {
  const [rows, setRows]   = useState([]); const [total, setTotal] = useState(0);
  const [page, setPage]   = useState(1);  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState(''); const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(false); const [edit, setEdit] = useState(null);

  const fetch = useCallback(async () => {
    setLoading(true);
    try { const r = await getEmployees({ search, status:filter, page, limit:LIMIT }); setRows(r.data.data); setTotal(r.data.total); }
    catch { showToast('Failed to load employees','error'); } finally { setLoading(false); }
  }, [search, filter, page]);
  useEffect(() => { fetch(); }, [fetch]);
  useEffect(() => { setPage(1); }, [search, filter]);

  const handleSave = async (form) => {
    try {
      if (edit?.id) { await updateEmployee(edit.id, form); showToast('Employee updated'); }
      else          { await createEmployee(form);          showToast('Employee added');   }
      setModal(false); setEdit(null); fetch(); onStatsChange();
    } catch (err) { showToast(err.response?.data?.message||'Error','error'); throw err; }
  };
  const handleDelete = async (emp) => {
    if (!confirm(`Delete "${emp.name}"?`)) return;
    try { await deleteEmployee(emp.id); showToast('Employee deleted'); fetch(); onStatsChange(); }
    catch (err) { showToast(err.response?.data?.message||'Cannot delete','error'); }
  };
  const totalPages = Math.ceil(total / LIMIT);
  return (
    <div style={{ display:'flex', flexDirection:'column', gap:16 }}>
      <div style={{ display:'flex', gap:10, alignItems:'center', background:'#fff', padding:'14px 16px', borderRadius:14, border:'1px solid #f1f5f9', boxShadow:'0 1px 3px rgba(0,0,0,.04)' }}>
        <div style={{ position:'relative', flex:1 }}>
          <Search size={14} style={{ position:'absolute', left:11, top:'50%', transform:'translateY(-50%)', color:'#94a3b8' }}/>
          <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search employees…" className="input-field" style={{ paddingLeft:34 }}/>
          {search && <button onClick={()=>setSearch('')} style={{ position:'absolute', right:10, top:'50%', transform:'translateY(-50%)', background:'none', border:'none', cursor:'pointer', color:'#94a3b8', display:'flex' }}><X size={14}/></button>}
        </div>
        <div style={{ display:'flex', gap:6 }}>
          {[['','All'],['active','Active'],['inactive','Inactive'],['terminated','Terminated']].map(([v,l])=>(
            <button key={v} onClick={()=>setFilter(v)} style={{ padding:'8px 12px', borderRadius:8, fontSize:12, fontWeight:500, cursor:'pointer', background:filter===v?'#16a34a':'#f8fafc', color:filter===v?'#fff':'#475569', border:filter===v?'1px solid #16a34a':'1px solid #e2e8f0' }}>{l}</button>
          ))}
        </div>
        <button onClick={fetch} style={{ width:36, height:36, borderRadius:8, border:'1px solid #e2e8f0', background:'#f8fafc', display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer', color:'#64748b' }}><RefreshCw size={14} className={loading?'animate-spin':''}/></button>
        <button className="btn-primary" onClick={()=>{ setEdit(null); setModal(true); }}><Plus size={14}/> Add Employee</button>
      </div>
      <div className="data-table">
        <div className="data-table-header" style={{ display:'grid', gridTemplateColumns:'2.5fr 1.2fr 1.2fr 1fr 1.2fr 0.8fr 80px', gap:12, padding:'11px 20px' }}>
          {['Employee','Department','Designation','Type','Basic Salary','Status',''].map(h=>(
            <span key={h} style={{ fontSize:11, fontWeight:700, color:'#94a3b8', textTransform:'uppercase', letterSpacing:'.05em' }}>{h}</span>
          ))}
        </div>
        {loading && Array.from({length:5}).map((_,i)=>(
          <div key={i} className="data-table-row" style={{ display:'grid', gridTemplateColumns:'2.5fr 1.2fr 1.2fr 1fr 1.2fr 0.8fr 80px', gap:12, padding:'14px 20px', alignItems:'center' }}>
            {[160,90,100,70,90,60,40].map((w,j)=><div key={j} className="shimmer" style={{height:13,width:w,borderRadius:6}}/>)}
          </div>
        ))}
        {!loading && rows.length === 0 && (
          <div style={{ padding:'60px 20px', textAlign:'center' }}>
            <div style={{ width:56, height:56, borderRadius:16, background:'#f1f5f9', display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 12px' }}>
              <Users size={26} style={{ color:'#94a3b8' }}/>
            </div>
            <p style={{ fontSize:14, fontWeight:600, color:'#374151' }}>No employees found</p>
            <p style={{ fontSize:12, color:'#94a3b8', marginTop:4, marginBottom:16 }}>Add your first employee to get started</p>
            <button className="btn-primary" onClick={()=>{ setEdit(null); setModal(true); }} style={{ margin:'0 auto' }}><Plus size={14}/> Add Employee</button>
          </div>
        )}
        {!loading && rows.map(emp => (
          <div key={emp.id} className="data-table-row" style={{ display:'grid', gridTemplateColumns:'2.5fr 1.2fr 1.2fr 1fr 1.2fr 0.8fr 80px', gap:12, padding:'13px 20px', alignItems:'center' }}>
            <div style={{ display:'flex', alignItems:'center', gap:10 }}>
              <Avatar name={emp.name}/>
              <div>
                <p style={{ fontSize:13, fontWeight:600, color:'#0f172a' }}>{emp.name}</p>
                <p style={{ fontSize:11, color:'#94a3b8', marginTop:1 }}>{emp.emp_number}</p>
              </div>
            </div>
            <span style={{ fontSize:12, color:'#374151' }}>{emp.department||'—'}</span>
            <span style={{ fontSize:12, color:'#374151' }}>{emp.designation||'—'}</span>
            <span className={`badge ${EMP_TYPE_CLS[emp.employment_type]||'badge-slate'}`} style={{ fontSize:10 }}>{emp.employment_type?.replace('_',' ')}</span>
            <span style={{ fontSize:13, fontWeight:600, color:'#0f172a' }}>LKR {parseFloat(emp.basic_salary).toLocaleString('en-LK',{maximumFractionDigits:0})}</span>
            <span className={`badge ${emp.status==='active'?'badge-green':emp.status==='terminated'?'badge-red':'badge-slate'}`}>{emp.status}</span>
            <div style={{ display:'flex', gap:6 }}>
              <button onClick={()=>{ setEdit(emp); setModal(true); }} style={{ width:30, height:30, borderRadius:8, border:'1px solid #e2e8f0', background:'#fff', display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer', color:'#64748b' }}
                onMouseEnter={e=>{ e.currentTarget.style.borderColor='#16a34a'; e.currentTarget.style.color='#16a34a'; }}
                onMouseLeave={e=>{ e.currentTarget.style.borderColor='#e2e8f0'; e.currentTarget.style.color='#64748b'; }}><Pencil size={13}/></button>
              <button onClick={()=>handleDelete(emp)} style={{ width:30, height:30, borderRadius:8, border:'1px solid #e2e8f0', background:'#fff', display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer', color:'#64748b' }}
                onMouseEnter={e=>{ e.currentTarget.style.borderColor='#dc2626'; e.currentTarget.style.color='#dc2626'; }}
                onMouseLeave={e=>{ e.currentTarget.style.borderColor='#e2e8f0'; e.currentTarget.style.color='#64748b'; }}><Trash2 size={13}/></button>
            </div>
          </div>
        ))}
        {totalPages > 1 && (
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'12px 20px', borderTop:'1px solid #f1f5f9' }}>
            <p style={{ fontSize:12, color:'#94a3b8' }}>Showing {(page-1)*LIMIT+1}–{Math.min(page*LIMIT,total)} of {total}</p>
            <div style={{ display:'flex', gap:4 }}>
              <button onClick={()=>setPage(p=>p-1)} disabled={page===1} style={{ width:32, height:32, borderRadius:8, border:'1px solid #e2e8f0', background:'#fff', display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer', opacity:page===1?.4:1 }}><ChevronLeft size={14}/></button>
              {Array.from({length:totalPages},(_,i)=>i+1).map(n=>(
                <button key={n} onClick={()=>setPage(n)} style={{ width:32, height:32, borderRadius:8, border:n===page?'1px solid #16a34a':'1px solid #e2e8f0', background:n===page?'#16a34a':'#fff', color:n===page?'#fff':'#374151', fontSize:12, fontWeight:600, cursor:'pointer' }}>{n}</button>
              ))}
              <button onClick={()=>setPage(p=>p+1)} disabled={page===totalPages} style={{ width:32, height:32, borderRadius:8, border:'1px solid #e2e8f0', background:'#fff', display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer', opacity:page===totalPages?.4:1 }}><ChevronRight size={14}/></button>
            </div>
          </div>
        )}
      </div>
      {modal && <EmployeeModal employee={edit} onClose={()=>{ setModal(false); setEdit(null); }} onSave={handleSave}/>}
    </div>
  );
};

/* ── Attendance ── */
const AttendanceTab = ({ showToast }) => {
  const now = new Date();
  const [month, setMonth] = useState(now.getMonth()+1); const [year, setYear] = useState(now.getFullYear());
  const [rows, setRows]   = useState([]); const [loading, setLoading] = useState(true);
  const [marking, setMarking] = useState(false); const [today, setToday] = useState({});

  const fetch = useCallback(async () => {
    setLoading(true);
    try { const r = await getAttendanceSummary({ month, year }); setRows(r.data.data); const init={}; r.data.data.forEach(e=>{init[e.id]='present';}); setToday(init); }
    catch { showToast('Failed to load attendance','error'); } finally { setLoading(false); }
  }, [month, year]);
  useEffect(() => { fetch(); }, [fetch]);

  const handleMark = async () => {
    const date = new Date().toISOString().split('T')[0];
    const records = Object.entries(today).map(([employee_id, status]) => ({ employee_id:parseInt(employee_id), date, status }));
    setMarking(true);
    try { await markAttendance({ records }); showToast(`Attendance marked for ${records.length} employees`); fetch(); }
    catch (err) { showToast(err.response?.data?.message||'Error','error'); } finally { setMarking(false); }
  };

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:16 }}>
      <div style={{ display:'flex', alignItems:'center', gap:10, background:'#fff', padding:'14px 16px', borderRadius:14, border:'1px solid #f1f5f9', boxShadow:'0 1px 3px rgba(0,0,0,.04)' }}>
        <select value={month} onChange={e=>setMonth(+e.target.value)} className="input-field" style={{ width:'auto', minWidth:130 }}>
          {MONTHS.slice(1).map((m,i)=><option key={i+1} value={i+1}>{m}</option>)}
        </select>
        <select value={year} onChange={e=>setYear(+e.target.value)} className="input-field" style={{ width:'auto', minWidth:90 }}>
          {[2024,2025,2026,2027].map(y=><option key={y} value={y}>{y}</option>)}
        </select>
        <button onClick={fetch} style={{ width:36, height:36, borderRadius:8, border:'1px solid #e2e8f0', background:'#f8fafc', display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer', color:'#64748b' }}><RefreshCw size={14} className={loading?'animate-spin':''}/></button>
        <div style={{ flex:1 }}/>
        <button className="btn-primary" onClick={handleMark} disabled={marking||rows.length===0}>
          {marking ? <RefreshCw size={14} className="animate-spin"/> : <CheckCircle2 size={14}/>} Save Today's Attendance
        </button>
      </div>
      <div style={{ display:'flex', gap:12, background:'#fff', padding:'12px 16px', borderRadius:12, border:'1px solid #f1f5f9' }}>
        {Object.entries(ATT_COLORS).map(([k,c])=>(
          <div key={k} style={{ display:'flex', alignItems:'center', gap:6 }}>
            <span style={{ width:10, height:10, borderRadius:3, background:c, display:'block' }}/>
            <span style={{ fontSize:12, color:'#374151' }}>{ATT_LABELS[k]}</span>
          </div>
        ))}
      </div>
      <div className="data-table">
        <div className="data-table-header" style={{ display:'grid', gridTemplateColumns:'2fr 1.2fr 1fr 1fr 1fr 1fr 1fr', gap:12, padding:'11px 20px' }}>
          {['Employee','Mark Today','Present','Absent','Half-Day','Late','Leave'].map(h=>(
            <span key={h} style={{ fontSize:11, fontWeight:700, color:'#94a3b8', textTransform:'uppercase', letterSpacing:'.05em', textAlign: h==='Mark Today'||h==='Employee'?'left':'center' }}>{h}</span>
          ))}
        </div>
        {loading ? Array.from({length:4}).map((_,i)=>(
          <div key={i} className="data-table-row" style={{ display:'grid', gridTemplateColumns:'2fr 1.2fr 1fr 1fr 1fr 1fr 1fr', gap:12, padding:'14px 20px', alignItems:'center' }}>
            {[160,100,40,40,40,40,40].map((w,j)=><div key={j} className="shimmer" style={{height:13,width:w,borderRadius:6,margin:j>1?'0 auto':'0'}}/>)}
          </div>
        )) : rows.length === 0 ? (
          <div style={{ padding:'50px 20px', textAlign:'center' }}>
            <div style={{ width:52, height:52, borderRadius:14, background:'#f1f5f9', display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 10px' }}>
              <Calendar size={24} style={{ color:'#94a3b8' }}/>
            </div>
            <p style={{ fontSize:13, color:'#64748b' }}>No employees found</p>
          </div>
        ) : rows.map(emp => (
          <div key={emp.id} className="data-table-row" style={{ display:'grid', gridTemplateColumns:'2fr 1.2fr 1fr 1fr 1fr 1fr 1fr', gap:12, padding:'12px 20px', alignItems:'center' }}>
            <div style={{ display:'flex', alignItems:'center', gap:10 }}>
              <Avatar name={emp.name} size={30}/>
              <div>
                <p style={{ fontSize:12, fontWeight:600, color:'#0f172a' }}>{emp.name}</p>
                <p style={{ fontSize:10, color:'#94a3b8' }}>{emp.department||emp.emp_number}</p>
              </div>
            </div>
            <select value={today[emp.id]||'present'} onChange={e=>setToday(t=>({...t,[emp.id]:e.target.value}))}
              className="input-field" style={{ padding:'6px 10px', fontSize:12 }}>
              {Object.entries(ATT_LABELS).map(([v,l])=><option key={v} value={v}>{l}</option>)}
            </select>
            {['present','absent','half_day','late','leave'].map(k=>(
              <div key={k} style={{ textAlign:'center' }}>
                <span style={{ fontSize:15, fontWeight:700, color: parseInt(emp[k])>0?ATT_COLORS[k]:'#cbd5e1' }}>{emp[k]||0}</span>
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
};

/* ── Payroll ── */
const PayrollTab = ({ showToast }) => {
  const now = new Date();
  const [month, setMonth]   = useState(now.getMonth()+1); const [year, setYear] = useState(now.getFullYear());
  const [rows, setRows]     = useState([]); const [loading, setLoading] = useState(true);
  const [generating, setGen]= useState(false); const [payslip, setPayslip] = useState(null);

  const fetch = useCallback(async () => {
    setLoading(true);
    try { const r = await getPayroll({ month, year, limit:50 }); setRows(r.data.data); }
    catch { showToast('Failed to load payroll','error'); } finally { setLoading(false); }
  }, [month, year]);
  useEffect(() => { fetch(); }, [fetch]);

  const handleGenerate = async () => {
    if (!confirm(`Generate payroll for ${MONTHS[month]} ${year}?`)) return;
    setGen(true);
    try { const r = await generatePayroll({ month, year }); showToast(`Generated ${r.data.count} payslip(s)`); fetch(); }
    catch (err) { showToast(err.response?.data?.message||'Error','error'); } finally { setGen(false); }
  };
  const handleStatus = async (id, status) => {
    try { await updatePayrollStatus(id, status); showToast(`Status updated`); fetch(); }
    catch (err) { showToast(err.response?.data?.message||'Error','error'); }
  };
  const handleView = async (id) => {
    try { const r = await getPayslip(id); setPayslip(r.data.data); }
    catch { showToast('Could not load payslip','error'); }
  };

  const totalNet = rows.reduce((s,r)=>s+parseFloat(r.net_salary||0),0);

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:16 }}>
      <div style={{ display:'flex', alignItems:'center', gap:10, background:'#fff', padding:'14px 16px', borderRadius:14, border:'1px solid #f1f5f9', boxShadow:'0 1px 3px rgba(0,0,0,.04)' }}>
        <select value={month} onChange={e=>setMonth(+e.target.value)} className="input-field" style={{ width:'auto', minWidth:130 }}>
          {MONTHS.slice(1).map((m,i)=><option key={i+1} value={i+1}>{m}</option>)}
        </select>
        <select value={year} onChange={e=>setYear(+e.target.value)} className="input-field" style={{ width:'auto', minWidth:90 }}>
          {[2024,2025,2026,2027].map(y=><option key={y} value={y}>{y}</option>)}
        </select>
        <button onClick={fetch} style={{ width:36, height:36, borderRadius:8, border:'1px solid #e2e8f0', background:'#f8fafc', display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer', color:'#64748b' }}><RefreshCw size={14} className={loading?'animate-spin':''}/></button>
        <div style={{ flex:1 }}/>
        {rows.length > 0 && (
          <div style={{ display:'flex', gap:16, padding:'10px 16px', background:'#f0fdf4', border:'1px solid #bbf7d0', borderRadius:10 }}>
            <div style={{ textAlign:'center' }}>
              <p style={{ fontSize:10, color:'#64748b', textTransform:'uppercase' }}>Net Payroll</p>
              <p style={{ fontSize:14, fontWeight:700, color:'#15803d' }}>LKR {totalNet.toLocaleString('en-LK',{maximumFractionDigits:0})}</p>
            </div>
            <div style={{ width:1, background:'#bbf7d0' }}/>
            <div style={{ textAlign:'center' }}>
              <p style={{ fontSize:10, color:'#64748b', textTransform:'uppercase' }}>Employees</p>
              <p style={{ fontSize:14, fontWeight:700, color:'#15803d' }}>{rows.length}</p>
            </div>
          </div>
        )}
        {rows.length === 0 && (
          <button className="btn-primary" onClick={handleGenerate} disabled={generating}>
            {generating ? <RefreshCw size={14} className="animate-spin"/> : <DollarSign size={14}/>} Generate {MONTHS[month]} Payroll
          </button>
        )}
      </div>
      <div className="data-table">
        <div className="data-table-header" style={{ display:'grid', gridTemplateColumns:'2fr 1fr 1fr 1fr 1fr 1.2fr 0.8fr 80px', gap:12, padding:'11px 20px' }}>
          {['Employee','Basic','Allowances','Gross','EPF (8%)','Net Pay','Status',''].map(h=>(
            <span key={h} style={{ fontSize:11, fontWeight:700, color:'#94a3b8', textTransform:'uppercase', letterSpacing:'.05em' }}>{h}</span>
          ))}
        </div>
        {loading ? Array.from({length:4}).map((_,i)=>(
          <div key={i} className="data-table-row" style={{ display:'grid', gridTemplateColumns:'2fr 1fr 1fr 1fr 1fr 1.2fr 0.8fr 80px', gap:12, padding:'14px 20px', alignItems:'center' }}>
            {[140,70,70,70,70,80,60,30].map((w,j)=><div key={j} className="shimmer" style={{height:13,width:w,borderRadius:6}}/>)}
          </div>
        )) : rows.length === 0 ? (
          <div style={{ padding:'60px 20px', textAlign:'center' }}>
            <div style={{ width:56, height:56, borderRadius:16, background:'#f1f5f9', display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 12px' }}>
              <Banknote size={26} style={{ color:'#94a3b8' }}/>
            </div>
            <p style={{ fontSize:14, fontWeight:600, color:'#374151' }}>No payroll for {MONTHS[month]} {year}</p>
            <p style={{ fontSize:12, color:'#94a3b8', marginTop:4, marginBottom:16 }}>Click "Generate Payroll" above to process all active employees</p>
          </div>
        ) : rows.map(pay => (
          <div key={pay.id} className="data-table-row" style={{ display:'grid', gridTemplateColumns:'2fr 1fr 1fr 1fr 1fr 1.2fr 0.8fr 80px', gap:12, padding:'13px 20px', alignItems:'center' }}>
            <div style={{ display:'flex', alignItems:'center', gap:10 }}>
              <Avatar name={pay.employee_name} size={32}/>
              <div>
                <p style={{ fontSize:12, fontWeight:600, color:'#0f172a' }}>{pay.employee_name}</p>
                <p style={{ fontSize:10, color:'#94a3b8' }}>{pay.emp_number} · {pay.department||'—'}</p>
              </div>
            </div>
            {[pay.basic_salary, pay.allowances, pay.gross_salary, pay.epf_employee].map((v,i)=>(
              <span key={i} style={{ fontSize:12, color:'#374151' }}>LKR {parseFloat(v||0).toLocaleString('en-LK',{maximumFractionDigits:0})}</span>
            ))}
            <span style={{ fontSize:13, fontWeight:700, color:'#0f172a' }}>LKR {parseFloat(pay.net_salary||0).toLocaleString('en-LK',{maximumFractionDigits:0})}</span>
            <span className={`badge ${PAY_STATUS_CLS[pay.status]||'badge-slate'}`}>{pay.status}</span>
            <div style={{ display:'flex', gap:4 }}>
              <button onClick={()=>handleView(pay.id)} title="View Payslip" style={{ width:28, height:28, borderRadius:7, border:'1px solid #e2e8f0', background:'#fff', display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer', color:'#64748b' }}
                onMouseEnter={e=>{e.currentTarget.style.borderColor='#3b82f6';e.currentTarget.style.color='#3b82f6';}} onMouseLeave={e=>{e.currentTarget.style.borderColor='#e2e8f0';e.currentTarget.style.color='#64748b';}}><FileText size={12}/></button>
              {pay.status==='draft' && <button onClick={()=>handleStatus(pay.id,'approved')} title="Approve" style={{ width:28, height:28, borderRadius:7, border:'1px solid #e2e8f0', background:'#fff', display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer', color:'#64748b' }}
                onMouseEnter={e=>{e.currentTarget.style.borderColor='#16a34a';e.currentTarget.style.color='#16a34a';}} onMouseLeave={e=>{e.currentTarget.style.borderColor='#e2e8f0';e.currentTarget.style.color='#64748b';}}><CheckCircle2 size={12}/></button>}
              {pay.status==='approved' && <button onClick={()=>handleStatus(pay.id,'paid')} title="Mark Paid" style={{ width:28, height:28, borderRadius:7, border:'1px solid #e2e8f0', background:'#fff', display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer', color:'#64748b' }}
                onMouseEnter={e=>{e.currentTarget.style.borderColor='#7c3aed';e.currentTarget.style.color='#7c3aed';}} onMouseLeave={e=>{e.currentTarget.style.borderColor='#e2e8f0';e.currentTarget.style.color='#64748b';}}><DollarSign size={12}/></button>}
            </div>
          </div>
        ))}
      </div>
      {payslip && <PayslipModal payslip={payslip} onClose={()=>setPayslip(null)}/>}
    </div>
  );
};

/* ── Main ── */
const HR = () => {
  const [tab, setTab]     = useState('employees');
  const [stats, setStats] = useState(null);
  const [toast, setToast] = useState(null);
  const showToast = (msg, type='success') => { setToast({msg,type}); setTimeout(()=>setToast(null),3500); };
  const loadStats = useCallback(async () => {
    try { const r = await getHRStats(); setStats(r.data.data); } catch {}
  }, []);
  useEffect(() => { loadStats(); }, [loadStats]);

  const kpis = [
    { label:'Total Employees', value:stats?.total,          bg:'#eff6ff', ic:'#2563eb', icon:Users        },
    { label:'Active',          value:stats?.active,         bg:'#f0fdf4', ic:'#16a34a', icon:CheckCircle2  },
    { label:'Present Today',   value:stats?.present||0,     bg:'#fef9c3', ic:'#d97706', icon:Building2     },
    { label:`${MONTHS[stats?.current_month||1]} Net Pay`, value: stats?.net_total ? `LKR ${parseFloat(stats.net_total).toLocaleString('en-LK',{maximumFractionDigits:0})}` : 'LKR 0', bg:'#dcfce7', ic:'#15803d', icon:Banknote },
  ];

  return (
    <div className="page" style={{ display:'flex', flexDirection:'column', gap:24 }}>
      {toast && (
        <div style={{ position:'fixed', top:20, right:20, zIndex:9999, padding:'12px 18px', borderRadius:12, fontSize:13, fontWeight:500, boxShadow:'0 8px 24px rgba(0,0,0,.12)', background:toast.type==='error'?'#fef2f2':'#f0fdf4', color:toast.type==='error'?'#dc2626':'#15803d', border:`1px solid ${toast.type==='error'?'#fecaca':'#bbf7d0'}` }}>
          {toast.type==='error'?<X size={13}/>:<CheckCircle2 size={13}/>} {toast.msg}
        </div>
      )}
      <div>
        <h1 style={{ fontSize:22, fontWeight:800, color:'#0f172a' }}>HR & Payroll</h1>
        <p style={{ fontSize:13, color:'#64748b', marginTop:3 }}>Manage employees, attendance and salary processing</p>
      </div>
      <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:16 }}>
        {kpis.map(({ label, value, bg, ic, icon:Icon }) => (
          <div key={label} className="stat-card" style={{ background:'#fff' }}>
            <div style={{ width:46, height:46, borderRadius:12, background:bg, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}><Icon size={20} style={{ color:ic }}/></div>
            <div><p style={{ fontSize:22, fontWeight:800, color:'#0f172a', lineHeight:1 }}>{value ?? '—'}</p><p style={{ fontSize:12, color:'#64748b', marginTop:4 }}>{label}</p></div>
          </div>
        ))}
      </div>
      {/* EPF/ETF info */}
      <div style={{ background:'#f0fdf4', border:'1px solid #bbf7d0', borderRadius:14, padding:'14px 20px', display:'flex', alignItems:'center', gap:20, flexWrap:'wrap' }}>
        <p style={{ fontSize:12, fontWeight:700, color:'#15803d', textTransform:'uppercase', letterSpacing:'.05em' }}>Sri Lanka EPF / ETF</p>
        {[['EPF Employee','8% of gross','#dc2626'],['EPF Employer','12% of gross','#7c3aed'],['ETF Employer','3% of gross','#0891b2']].map(([l,v,c])=>(
          <div key={l} style={{ display:'flex', alignItems:'center', gap:6 }}>
            <span style={{ width:8, height:8, borderRadius:'50%', background:c, display:'block' }}/>
            <span style={{ fontSize:12, color:'#374151' }}>{l}: <strong style={{ color:c }}>{v}</strong></span>
          </div>
        ))}
      </div>
      <div style={{ display:'flex', gap:4, background:'#fff', padding:'6px', borderRadius:12, border:'1px solid #f1f5f9', width:'fit-content', boxShadow:'0 1px 3px rgba(0,0,0,.04)' }}>
        {[['employees','Employees'],['attendance','Attendance'],['payroll','Payroll']].map(([id,label])=>(
          <button key={id} onClick={()=>setTab(id)} style={{ padding:'8px 18px', borderRadius:8, fontSize:13, fontWeight:500, cursor:'pointer', background:tab===id?'#16a34a':'transparent', color:tab===id?'#fff':'#64748b', border:'none' }}>{label}</button>
        ))}
      </div>
      {tab==='employees'  && <EmployeesTab showToast={showToast} onStatsChange={loadStats}/>}
      {tab==='attendance' && <AttendanceTab showToast={showToast}/>}
      {tab==='payroll'    && <PayrollTab showToast={showToast}/>}
    </div>
  );
};

export default HR;
