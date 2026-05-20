import { useState, useEffect } from 'react';
import { X, Save, Loader2, UserCog, Eye, EyeOff } from 'lucide-react';

const ROLES = [
  ['admin',               'Administrator',       'Full access to all modules'],
  ['procurement_manager', 'Procurement Manager', 'Procurement, suppliers & inventory'],
  ['store_keeper',        'Store Keeper',        'Inventory & stock management'],
  ['finance_officer',     'Finance Officer',     'Invoices, payments & expenses'],
  ['employee',            'Employee',            'Basic read access'],
];

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

const UserModal = ({ user, onClose, onSave }) => {
  const editing = !!user?.id;
  const [form, setForm]     = useState({ name:'', email:'', password:'', role:'employee', is_active:true });
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [showPw, setShowPw] = useState(false);

  useEffect(() => {
    if (user?.id) {
      setForm({ name:user.name||'', email:user.email||'', password:'', role:user.role||'employee', is_active:user.is_active!==false });
    } else {
      setForm({ name:'', email:'', password:'', role:'employee', is_active:true });
    }
    setErrors({});
  }, [user]);

  const set = (k, v) => { setForm(f => ({ ...f, [k]:v })); setErrors(e => ({ ...e, [k]:'' })); };

  const validate = () => {
    const e = {};
    if (!form.name.trim())  e.name  = 'Name is required';
    if (!form.email.trim()) e.email = 'Email is required';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) e.email = 'Invalid email address';
    if (!editing && (!form.password || form.password.length < 6)) e.password = 'Password must be at least 6 characters';
    if (editing && form.password && form.password.length < 6) e.password = 'Password must be at least 6 characters';
    setErrors(e);
    return !Object.keys(e).length;
  };

  const handleSubmit = async (ev) => {
    ev.preventDefault();
    if (!validate()) return;
    setSaving(true);
    try {
      const payload = { name:form.name, email:form.email, role:form.role, is_active:form.is_active };
      if (form.password) payload.password = form.password;
      await onSave(payload);
    } finally { setSaving(false); }
  };

  return (
    <div style={{ position:'fixed', inset:0, zIndex:50, display:'flex', alignItems:'center', justifyContent:'center', padding:16 }} onClick={onClose}>
      <div style={{ position:'absolute', inset:0, background:'rgba(15,23,42,.55)', backdropFilter:'blur(6px)' }}/>
      <div className="fade-up" style={{ position:'relative', width:'100%', maxWidth:540, background:'#fff', borderRadius:20, border:'1px solid #e2e8f0', boxShadow:'0 20px 60px rgba(0,0,0,.15)', overflow:'hidden' }} onClick={e => e.stopPropagation()}>

        <div style={{ height:4, background:'linear-gradient(90deg,#0f172a,#16a34a)' }}/>

        {/* Header */}
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'18px 24px', borderBottom:'1px solid #f1f5f9' }}>
          <div style={{ display:'flex', alignItems:'center', gap:12 }}>
            <div style={{ width:38, height:38, borderRadius:10, background:'#f1f5f9', display:'flex', alignItems:'center', justifyContent:'center' }}>
              <UserCog size={18} style={{ color:'#0f172a' }}/>
            </div>
            <div>
              <h2 style={{ fontSize:15, fontWeight:700, color:'#0f172a' }}>{editing ? 'Edit User' : 'Create User'}</h2>
              <p style={{ fontSize:12, color:'#64748b', marginTop:2 }}>{editing ? user.email : 'Add a new system user'}</p>
            </div>
          </div>
          <button onClick={onClose} style={{ width:32, height:32, borderRadius:8, border:'1px solid #e2e8f0', background:'#f8fafc', display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer', color:'#64748b' }}>
            <X size={15}/>
          </button>
        </div>

        <form onSubmit={handleSubmit} style={{ padding:'20px 24px', display:'flex', flexDirection:'column', gap:16 }}>

          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:14 }}>
            <F label="Full Name *" error={errors.name}>
              <input value={form.name} onChange={e => set('name', e.target.value)} placeholder="e.g. Kamal Perera" style={iStyle} onFocus={focus} onBlur={blur}/>
            </F>
            <F label="Email Address *" error={errors.email}>
              <input type="email" value={form.email} onChange={e => set('email', e.target.value)} placeholder="user@company.lk" style={iStyle} onFocus={focus} onBlur={blur}/>
            </F>
          </div>

          <F label={editing ? 'New Password (leave blank to keep)' : 'Password *'} error={errors.password}>
            <div style={{ position:'relative' }}>
              <input type={showPw ? 'text' : 'password'} value={form.password} onChange={e => set('password', e.target.value)}
                placeholder={editing ? '••••••  (leave blank to keep current)' : 'Min. 6 characters'}
                style={{ ...iStyle, paddingRight:40 }} onFocus={focus} onBlur={blur}/>
              <button type="button" onClick={() => setShowPw(!showPw)}
                style={{ position:'absolute', right:12, top:'50%', transform:'translateY(-50%)', background:'none', border:'none', cursor:'pointer', color:'#94a3b8', display:'flex' }}>
                {showPw ? <EyeOff size={15}/> : <Eye size={15}/>}
              </button>
            </div>
          </F>

          {/* Role selector */}
          <div>
            <label style={{ display:'block', fontSize:11, fontWeight:700, textTransform:'uppercase', letterSpacing:'0.06em', color:'#94a3b8', marginBottom:8 }}>Role</label>
            <div style={{ display:'flex', flexDirection:'column', gap:6 }}>
              {ROLES.map(([value, label, desc]) => (
                <button key={value} type="button" onClick={() => set('role', value)}
                  style={{
                    display:'flex', alignItems:'center', gap:12, padding:'10px 14px', borderRadius:10, cursor:'pointer', textAlign:'left', width:'100%',
                    border: `1px solid ${form.role === value ? '#bbf7d0' : '#e2e8f0'}`,
                    background: form.role === value ? '#f0fdf4' : '#f8fafc',
                    transition:'all .15s',
                  }}>
                  <div style={{ width:16, height:16, borderRadius:'50%', border:`2px solid ${form.role===value?'#16a34a':'#cbd5e1'}`, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                    {form.role === value && <div style={{ width:8, height:8, borderRadius:'50%', background:'#16a34a' }}/>}
                  </div>
                  <div>
                    <p style={{ fontSize:13, fontWeight:600, color: form.role===value?'#15803d':'#0f172a' }}>{label}</p>
                    <p style={{ fontSize:11, color:'#94a3b8', marginTop:1 }}>{desc}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Active toggle */}
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'12px 14px', background:'#f8fafc', borderRadius:10, border:'1px solid #e2e8f0' }}>
            <div>
              <p style={{ fontSize:13, fontWeight:600, color:'#0f172a' }}>Account Active</p>
              <p style={{ fontSize:11, color:'#94a3b8', marginTop:2 }}>Inactive users cannot sign in</p>
            </div>
            <button type="button" onClick={() => set('is_active', !form.is_active)}
              style={{
                width:44, height:24, borderRadius:99, border:'none', cursor:'pointer', position:'relative', transition:'background .2s',
                background: form.is_active ? '#16a34a' : '#cbd5e1',
              }}>
              <div style={{ position:'absolute', top:3, left: form.is_active?22:3, width:18, height:18, borderRadius:'50%', background:'#fff', transition:'left .2s', boxShadow:'0 1px 4px rgba(0,0,0,.2)' }}/>
            </button>
          </div>

          <div style={{ display:'flex', gap:10, paddingTop:4 }}>
            <button type="button" onClick={onClose} className="btn-secondary" style={{ flex:1 }}>Cancel</button>
            <button type="submit" disabled={saving} className="btn-primary" style={{ flex:1, justifyContent:'center', opacity:saving?0.7:1 }}>
              {saving ? <Loader2 size={14} style={{ animation:'spin 1s linear infinite' }}/> : <Save size={14}/>}
              {saving ? 'Saving…' : editing ? 'Save Changes' : 'Create User'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default UserModal;
