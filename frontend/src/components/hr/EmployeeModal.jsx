import { useState, useEffect } from 'react';
import { X, Save, Loader2, User } from 'lucide-react';

const EMPTY = {
  name:'', nic:'', email:'', phone:'', address:'', date_of_birth:'',
  date_joined: new Date().toISOString().split('T')[0],
  department:'', designation:'', employment_type:'permanent',
  basic_salary:'', allowances:'0', status:'active',
};

const iStyle = { width:'100%', padding:'10px 12px', borderRadius:10, border:'1px solid #e2e8f0', fontSize:13, color:'#0f172a', background:'#f8fafc', outline:'none', boxSizing:'border-box' };
const focus  = (e) => { e.target.style.borderColor='#16a34a'; e.target.style.boxShadow='0 0 0 3px rgba(22,163,74,.1)'; };
const blur   = (e) => { e.target.style.borderColor='#e2e8f0'; e.target.style.boxShadow='none'; };

const F = ({ label, children, error }) => (
  <div>
    <label style={{ display:'block', fontSize:11, fontWeight:700, textTransform:'uppercase', letterSpacing:'0.06em', color:'#94a3b8', marginBottom:6 }}>{label}</label>
    {children}
    {error && <p style={{ fontSize:11, color:'#dc2626', marginTop:4 }}>{error}</p>}
  </div>
);

const DEPARTMENTS = ['Management','IT','Finance','HR','Operations','Procurement','Warehouse','Sales','Marketing','Administration'];
const EMP_TYPES   = [['permanent','Permanent'],['contract','Contract'],['part_time','Part-Time'],['probation','Probation']];

const EmployeeModal = ({ employee, onClose, onSave }) => {
  const editing = !!employee?.id;
  const [form, setForm]   = useState(EMPTY);
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (employee?.id) {
      setForm({
        name: employee.name||'', nic: employee.nic||'', email: employee.email||'',
        phone: employee.phone||'', address: employee.address||'',
        date_of_birth: employee.date_of_birth ? employee.date_of_birth.split('T')[0] : '',
        date_joined: employee.date_joined ? employee.date_joined.split('T')[0] : '',
        department: employee.department||'', designation: employee.designation||'',
        employment_type: employee.employment_type||'permanent',
        basic_salary: employee.basic_salary||'', allowances: employee.allowances||'0',
        status: employee.status||'active',
      });
    } else { setForm(EMPTY); }
    setErrors({});
  }, [employee]);

  const set = (k,v) => { setForm(f=>({...f,[k]:v})); setErrors(e=>({...e,[k]:''})); };

  const validate = () => {
    const e = {};
    if (!form.name.trim()) e.name = 'Name is required';
    if (!form.date_joined) e.date_joined = 'Join date is required';
    if (!form.basic_salary || parseFloat(form.basic_salary)<=0) e.basic_salary = 'Salary must be > 0';
    setErrors(e);
    return !Object.keys(e).length;
  };

  const handleSubmit = async (ev) => {
    ev.preventDefault();
    if (!validate()) return;
    setSaving(true);
    try { await onSave(form); } finally { setSaving(false); }
  };

  return (
    <div style={{ position:'fixed', inset:0, zIndex:50, display:'flex', alignItems:'center', justifyContent:'center', padding:16 }} onClick={onClose}>
      <div style={{ position:'absolute', inset:0, background:'rgba(15,23,42,.55)', backdropFilter:'blur(6px)' }}/>
      <div className="fade-up" style={{ position:'relative', width:'100%', maxWidth:680, maxHeight:'90vh', display:'flex', flexDirection:'column', background:'#fff', borderRadius:20, border:'1px solid #e2e8f0', boxShadow:'0 20px 60px rgba(0,0,0,.15)', overflow:'hidden' }} onClick={e=>e.stopPropagation()}>

        <div style={{ height:4, background:'linear-gradient(90deg,#16a34a,#4ade80)', flexShrink:0 }}/>

        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'18px 24px', borderBottom:'1px solid #f1f5f9', flexShrink:0 }}>
          <div style={{ display:'flex', alignItems:'center', gap:12 }}>
            <div style={{ width:38, height:38, borderRadius:10, background:'#dcfce7', display:'flex', alignItems:'center', justifyContent:'center' }}>
              <User size={18} style={{ color:'#16a34a' }}/>
            </div>
            <div>
              <h2 style={{ fontSize:15, fontWeight:700, color:'#0f172a' }}>{editing ? 'Edit Employee' : 'Add Employee'}</h2>
              <p style={{ fontSize:12, color:'#64748b', marginTop:2 }}>{editing ? employee.name : 'New employee record'}</p>
            </div>
          </div>
          <button onClick={onClose} style={{ width:32, height:32, borderRadius:8, border:'1px solid #e2e8f0', background:'#f8fafc', display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer', color:'#64748b' }}>
            <X size={15}/>
          </button>
        </div>

        <form onSubmit={handleSubmit} style={{ display:'flex', flexDirection:'column', flex:1, overflow:'hidden' }}>
          <div style={{ flex:1, overflowY:'auto', padding:'20px 24px' }}>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:14 }}>
              <div style={{ gridColumn:'1 / -1' }}><F label="Full Name *" error={errors.name}><input value={form.name} onChange={e=>set('name',e.target.value)} placeholder="e.g. Kamal Perera" style={iStyle} onFocus={focus} onBlur={blur}/></F></div>
              <F label="NIC Number"><input value={form.nic} onChange={e=>set('nic',e.target.value)} placeholder="e.g. 199012345678" style={iStyle} onFocus={focus} onBlur={blur}/></F>
              <F label="Email"><input type="email" value={form.email} onChange={e=>set('email',e.target.value)} placeholder="email@company.lk" style={iStyle} onFocus={focus} onBlur={blur}/></F>
              <F label="Phone"><input value={form.phone} onChange={e=>set('phone',e.target.value)} placeholder="+94 77 000 0000" style={iStyle} onFocus={focus} onBlur={blur}/></F>
              <F label="Date of Birth"><input type="date" value={form.date_of_birth} onChange={e=>set('date_of_birth',e.target.value)} style={{ ...iStyle, colorScheme:'light' }} onFocus={focus} onBlur={blur}/></F>
              <F label="Date Joined *" error={errors.date_joined}><input type="date" value={form.date_joined} onChange={e=>set('date_joined',e.target.value)} style={{ ...iStyle, colorScheme:'light' }} onFocus={focus} onBlur={blur}/></F>
              <F label="Department">
                <select value={form.department} onChange={e=>set('department',e.target.value)} style={iStyle} onFocus={focus} onBlur={blur}>
                  <option value="">— Select —</option>
                  {DEPARTMENTS.map(d=><option key={d} value={d}>{d}</option>)}
                </select>
              </F>
              <F label="Designation"><input value={form.designation} onChange={e=>set('designation',e.target.value)} placeholder="e.g. Senior Developer" style={iStyle} onFocus={focus} onBlur={blur}/></F>
              <F label="Employment Type">
                <select value={form.employment_type} onChange={e=>set('employment_type',e.target.value)} style={iStyle} onFocus={focus} onBlur={blur}>
                  {EMP_TYPES.map(([v,l])=><option key={v} value={v}>{l}</option>)}
                </select>
              </F>
              <F label="Status">
                <select value={form.status} onChange={e=>set('status',e.target.value)} style={iStyle} onFocus={focus} onBlur={blur}>
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                  <option value="terminated">Terminated</option>
                </select>
              </F>
              <F label="Basic Salary (LKR) *" error={errors.basic_salary}><input type="number" min="0" step="0.01" value={form.basic_salary} onChange={e=>set('basic_salary',e.target.value)} placeholder="0.00" style={iStyle} onFocus={focus} onBlur={blur}/></F>
              <F label="Allowances (LKR)"><input type="number" min="0" step="0.01" value={form.allowances} onChange={e=>set('allowances',e.target.value)} placeholder="0.00" style={iStyle} onFocus={focus} onBlur={blur}/></F>
              <div style={{ gridColumn:'1 / -1' }}>
                <F label="Address">
                  <textarea value={form.address} onChange={e=>set('address',e.target.value)} rows={2} placeholder="Residential address..."
                    style={{ ...iStyle, resize:'none', height:'auto' }} onFocus={focus} onBlur={blur}/>
                </F>
              </div>

              {/* EPF/ETF preview */}
              {parseFloat(form.basic_salary) > 0 && (
                <div style={{ gridColumn:'1 / -1', background:'#f0fdf4', border:'1px solid #bbf7d0', borderRadius:12, padding:'14px 16px' }}>
                  <p style={{ fontSize:11, fontWeight:700, textTransform:'uppercase', letterSpacing:'0.06em', color:'#16a34a', marginBottom:12 }}>EPF / ETF Preview (Sri Lanka)</p>
                  <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:10 }}>
                    {[
                      ['EPF (Employee 8%)',  ((parseFloat(form.basic_salary)||0)+(parseFloat(form.allowances)||0))*0.08, '#dc2626'],
                      ['EPF (Employer 12%)', ((parseFloat(form.basic_salary)||0)+(parseFloat(form.allowances)||0))*0.12, '#7c3aed'],
                      ['ETF (Employer 3%)',  ((parseFloat(form.basic_salary)||0)+(parseFloat(form.allowances)||0))*0.03, '#2563eb'],
                    ].map(([l,v,c])=>(
                      <div key={l} style={{ background:'#fff', borderRadius:10, padding:'10px 12px', textAlign:'center', border:'1px solid #e2e8f0' }}>
                        <p style={{ fontSize:14, fontWeight:700, color:c }}>LKR {v.toFixed(2)}</p>
                        <p style={{ fontSize:10, color:'#64748b', marginTop:3 }}>{l}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          <div style={{ padding:'16px 24px', borderTop:'1px solid #f1f5f9', display:'flex', gap:10, flexShrink:0 }}>
            <button type="button" onClick={onClose} className="btn-secondary" style={{ flex:1 }}>Cancel</button>
            <button type="submit" disabled={saving} className="btn-primary" style={{ flex:1, justifyContent:'center', opacity:saving?0.7:1 }}>
              {saving ? <Loader2 size={14} style={{ animation:'spin 1s linear infinite' }}/> : <Save size={14}/>}
              {saving ? 'Saving...' : editing ? 'Save Changes' : 'Add Employee'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EmployeeModal;
