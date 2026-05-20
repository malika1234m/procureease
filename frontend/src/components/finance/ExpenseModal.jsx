import { useState, useEffect } from 'react';
import { X, Save, Loader2, Receipt } from 'lucide-react';
import { getExpenseCategories } from '../../services/financeService';

const EXP_CATEGORIES = ['Travel','Office Supplies','Utilities','Maintenance','Marketing','Software','Training','Meals','Fuel','Other'];

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

const ExpenseModal = ({ onClose, onSave }) => {
  const [form, setForm]    = useState({ title:'', category:'', amount:'', expense_date:new Date().toISOString().split('T')[0], vendor:'', description:'' });
  const [dbCats, setDbCats]= useState([]);
  const [errors, setErrors]= useState({});
  const [saving, setSaving]= useState(false);

  useEffect(() => { getExpenseCategories().then(r=>setDbCats(r.data.data)).catch(()=>{}); }, []);

  const set = (k,v) => { setForm(f=>({...f,[k]:v})); setErrors(e=>({...e,[k]:''})); };
  const allCats = [...new Set([...EXP_CATEGORIES, ...dbCats])].sort();

  const validate = () => {
    const e = {};
    if (!form.title.trim())                           e.title='Title required';
    if (!form.amount || parseFloat(form.amount)<=0)   e.amount='Amount must be > 0';
    setErrors(e); return !Object.keys(e).length;
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
      <div className="fade-up" style={{ position:'relative', width:'100%', maxWidth:520, background:'#fff', borderRadius:20, border:'1px solid #e2e8f0', boxShadow:'0 20px 60px rgba(0,0,0,.15)', overflow:'hidden' }} onClick={e=>e.stopPropagation()}>

        <div style={{ height:4, background:'linear-gradient(90deg,#d97706,#f59e0b)' }}/>

        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'18px 24px', borderBottom:'1px solid #f1f5f9' }}>
          <div style={{ display:'flex', alignItems:'center', gap:12 }}>
            <div style={{ width:38, height:38, borderRadius:10, background:'#fef9c3', display:'flex', alignItems:'center', justifyContent:'center' }}>
              <Receipt size={18} style={{ color:'#d97706' }}/>
            </div>
            <div>
              <h2 style={{ fontSize:15, fontWeight:700, color:'#0f172a' }}>Add Expense</h2>
              <p style={{ fontSize:12, color:'#64748b', marginTop:2 }}>Record a company expense</p>
            </div>
          </div>
          <button onClick={onClose} style={{ width:32, height:32, borderRadius:8, border:'1px solid #e2e8f0', background:'#f8fafc', display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer', color:'#64748b' }}>
            <X size={15}/>
          </button>
        </div>

        <form onSubmit={handleSubmit} style={{ padding:'20px 24px', display:'flex', flexDirection:'column', gap:14 }}>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:14 }}>
            <div style={{ gridColumn:'1 / -1' }}>
              <F label="Title *" error={errors.title}>
                <input value={form.title} onChange={e=>set('title',e.target.value)} placeholder="e.g. Office Printer Paper" style={iStyle} onFocus={focus} onBlur={blur}/>
              </F>
            </div>
            <F label="Category">
              <select value={form.category} onChange={e=>set('category',e.target.value)} style={iStyle} onFocus={focus} onBlur={blur}>
                <option value="">— Select —</option>
                {allCats.map(c=><option key={c} value={c}>{c}</option>)}
              </select>
            </F>
            <F label="Vendor / Payee">
              <input value={form.vendor} onChange={e=>set('vendor',e.target.value)} placeholder="e.g. Cargills" style={iStyle} onFocus={focus} onBlur={blur}/>
            </F>
            <F label="Amount (LKR) *" error={errors.amount}>
              <input type="number" min="0" step="0.01" value={form.amount} onChange={e=>set('amount',e.target.value)} placeholder="0.00" style={iStyle} onFocus={focus} onBlur={blur}/>
            </F>
            <F label="Date">
              <input type="date" value={form.expense_date} onChange={e=>set('expense_date',e.target.value)} style={{ ...iStyle, colorScheme:'light' }} onFocus={focus} onBlur={blur}/>
            </F>
            <div style={{ gridColumn:'1 / -1' }}>
              <F label="Description">
                <textarea value={form.description} onChange={e=>set('description',e.target.value)} rows={2} placeholder="Details..."
                  style={{ ...iStyle, resize:'none', height:'auto' }} onFocus={focus} onBlur={blur}/>
              </F>
            </div>
          </div>
          <div style={{ display:'flex', gap:10 }}>
            <button type="button" onClick={onClose} className="btn-secondary" style={{ flex:1 }}>Cancel</button>
            <button type="submit" disabled={saving} className="btn-primary" style={{ flex:1, justifyContent:'center', opacity:saving?0.7:1 }}>
              {saving?<Loader2 size={14} style={{ animation:'spin 1s linear infinite' }}/>:<Save size={14}/>}
              {saving?'Saving...':'Add Expense'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ExpenseModal;
