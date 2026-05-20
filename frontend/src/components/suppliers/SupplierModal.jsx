import { useState, useEffect } from 'react';
import { X, Save, Loader2, Truck } from 'lucide-react';

const EMPTY = { name:'', email:'', phone:'', contact_person:'', address:'', payment_terms:30, status:'active' };

const Field = ({ label, error, children }) => (
  <div>
    <label style={{ display:'block', fontSize:11, fontWeight:700, textTransform:'uppercase', letterSpacing:'0.06em', color:'#94a3b8', marginBottom:6 }}>{label}</label>
    {children}
    {error && <p style={{ fontSize:11, color:'#dc2626', marginTop:4 }}>{error}</p>}
  </div>
);

const inputStyle = { width:'100%', padding:'10px 14px', borderRadius:10, border:'1px solid #e2e8f0', fontSize:13, color:'#0f172a', background:'#f8fafc', outline:'none', boxSizing:'border-box' };
const focusInput = (e) => { e.target.style.borderColor='#16a34a'; e.target.style.boxShadow='0 0 0 3px rgba(22,163,74,.1)'; };
const blurInput  = (e) => { e.target.style.borderColor='#e2e8f0'; e.target.style.boxShadow='none'; };

const SupplierModal = ({ supplier, onClose, onSave }) => {
  const editing = !!supplier?.id;
  const [form, setForm]   = useState(EMPTY);
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setForm(supplier?.id ? {
      name: supplier.name||'', email: supplier.email||'', phone: supplier.phone||'',
      contact_person: supplier.contact_person||'', address: supplier.address||'',
      payment_terms: supplier.payment_terms||30, status: supplier.status||'active',
    } : EMPTY);
    setErrors({});
  }, [supplier]);

  const onChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    if (errors[e.target.name]) setErrors({ ...errors, [e.target.name]:'' });
  };

  const validate = () => {
    const e = {};
    if (!form.name.trim()) e.name = 'Supplier name is required';
    if (form.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) e.email = 'Invalid email address';
    if (form.payment_terms < 1 || form.payment_terms > 365) e.payment_terms = 'Must be between 1 and 365 days';
    setErrors(e);
    return !Object.keys(e).length;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    setSaving(true);
    try { await onSave(form); } finally { setSaving(false); }
  };

  return (
    <div style={{ position:'fixed', inset:0, zIndex:50, display:'flex', alignItems:'center', justifyContent:'center', padding:16 }} onClick={onClose}>
      <div style={{ position:'absolute', inset:0, background:'rgba(15,23,42,.55)', backdropFilter:'blur(6px)' }}/>
      <div className="fade-up" style={{ position:'relative', width:'100%', maxWidth:520, background:'#fff', borderRadius:20, border:'1px solid #e2e8f0', boxShadow:'0 20px 60px rgba(0,0,0,.15)', overflow:'hidden' }} onClick={e=>e.stopPropagation()}>

        {/* Accent bar */}
        <div style={{ height:4, background:'linear-gradient(90deg,#16a34a,#4ade80)' }}/>

        {/* Header */}
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'20px 24px 16px', borderBottom:'1px solid #f1f5f9' }}>
          <div style={{ display:'flex', alignItems:'center', gap:12 }}>
            <div style={{ width:38, height:38, borderRadius:10, background:'#dcfce7', display:'flex', alignItems:'center', justifyContent:'center' }}>
              <Truck size={18} style={{ color:'#16a34a' }}/>
            </div>
            <div>
              <h2 style={{ fontSize:15, fontWeight:700, color:'#0f172a' }}>{editing ? 'Edit Supplier' : 'Add New Supplier'}</h2>
              <p style={{ fontSize:12, color:'#64748b', marginTop:2 }}>{editing ? `Editing: ${supplier.name}` : 'Fill in the supplier details'}</p>
            </div>
          </div>
          <button onClick={onClose} style={{ width:32, height:32, borderRadius:8, border:'1px solid #e2e8f0', background:'#f8fafc', display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer', color:'#64748b' }}
            onMouseEnter={e=>{e.currentTarget.style.background='#f1f5f9';}} onMouseLeave={e=>{e.currentTarget.style.background='#f8fafc';}}>
            <X size={15}/>
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} style={{ padding:'20px 24px', display:'flex', flexDirection:'column', gap:16 }}>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:14 }}>
            <div style={{ gridColumn:'1 / -1' }}>
              <Field label="Supplier Name *" error={errors.name}>
                <input name="name" value={form.name} onChange={onChange} placeholder="e.g. ABC Traders (Pvt) Ltd"
                  style={inputStyle} onFocus={focusInput} onBlur={blurInput}/>
              </Field>
            </div>
            <Field label="Email" error={errors.email}>
              <input type="email" name="email" value={form.email} onChange={onChange} placeholder="info@supplier.lk"
                style={inputStyle} onFocus={focusInput} onBlur={blurInput}/>
            </Field>
            <Field label="Phone">
              <input name="phone" value={form.phone} onChange={onChange} placeholder="+94 77 000 0000"
                style={inputStyle} onFocus={focusInput} onBlur={blurInput}/>
            </Field>
            <Field label="Contact Person">
              <input name="contact_person" value={form.contact_person} onChange={onChange} placeholder="Mr. Kamal Perera"
                style={inputStyle} onFocus={focusInput} onBlur={blurInput}/>
            </Field>
            <Field label="Payment Terms (days)" error={errors.payment_terms}>
              <input type="number" name="payment_terms" value={form.payment_terms} onChange={onChange} min="1" max="365"
                style={inputStyle} onFocus={focusInput} onBlur={blurInput}/>
            </Field>
            <div style={{ gridColumn:'1 / -1' }}>
              <Field label="Address">
                <textarea name="address" value={form.address} onChange={onChange} rows={2}
                  placeholder="No. 45, Main Street, Colombo 03"
                  style={{ ...inputStyle, resize:'none', height:'auto' }} onFocus={focusInput} onBlur={blurInput}/>
              </Field>
            </div>
            <div style={{ gridColumn:'1 / -1' }}>
              <Field label="Status">
                <div style={{ display:'flex', gap:8 }}>
                  {[['active','Active','#dcfce7','#16a34a','#bbf7d0'],
                    ['inactive','Inactive','#f1f5f9','#64748b','#e2e8f0'],
                    ['blacklisted','Blacklisted','#fee2e2','#dc2626','#fecaca']
                  ].map(([val, label, bg, color, border]) => (
                    <button key={val} type="button" onClick={() => setForm({...form, status:val})}
                      style={{ flex:1, padding:'9px 0', borderRadius:10, fontSize:12, fontWeight:600, cursor:'pointer', border:`1px solid ${form.status===val ? border : '#e2e8f0'}`, background:form.status===val ? bg : '#f8fafc', color:form.status===val ? color : '#64748b', transition:'all .15s' }}>
                      {label}
                    </button>
                  ))}
                </div>
              </Field>
            </div>
          </div>

          <div style={{ display:'flex', gap:10, paddingTop:4 }}>
            <button type="button" onClick={onClose} className="btn-secondary" style={{ flex:1 }}>Cancel</button>
            <button type="submit" disabled={saving} className="btn-primary" style={{ flex:1, justifyContent:'center', opacity:saving?0.7:1 }}>
              {saving ? <Loader2 size={14} style={{ animation:'spin 1s linear infinite' }}/> : <Save size={14}/>}
              {saving ? 'Saving...' : editing ? 'Save Changes' : 'Add Supplier'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default SupplierModal;
