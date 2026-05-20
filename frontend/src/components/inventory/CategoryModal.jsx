import { useState, useEffect } from 'react';
import { X, Save, Loader2, Tag } from 'lucide-react';

const iStyle = { width:'100%', padding:'10px 12px', borderRadius:10, border:'1px solid #e2e8f0', fontSize:13, color:'#0f172a', background:'#f8fafc', outline:'none', boxSizing:'border-box' };
const focus  = (e) => { e.target.style.borderColor='#16a34a'; e.target.style.boxShadow='0 0 0 3px rgba(22,163,74,.1)'; };
const blur   = (e) => { e.target.style.borderColor='#e2e8f0'; e.target.style.boxShadow='none'; };

const CategoryModal = ({ category, onClose, onSave }) => {
  const editing = !!category?.id;
  const [form, setForm]   = useState({ name:'', description:'' });
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setForm({ name:category?.name||'', description:category?.description||'' });
    setError('');
  }, [category]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) { setError('Category name is required'); return; }
    setSaving(true);
    try { await onSave(form); } finally { setSaving(false); }
  };

  return (
    <div style={{ position:'fixed', inset:0, zIndex:50, display:'flex', alignItems:'center', justifyContent:'center', padding:16 }} onClick={onClose}>
      <div style={{ position:'absolute', inset:0, background:'rgba(15,23,42,.55)', backdropFilter:'blur(6px)' }}/>
      <div className="fade-up" style={{ position:'relative', width:'100%', maxWidth:400, background:'#fff', borderRadius:20, border:'1px solid #e2e8f0', boxShadow:'0 20px 60px rgba(0,0,0,.15)', overflow:'hidden' }} onClick={e=>e.stopPropagation()}>

        <div style={{ height:4, background:'linear-gradient(90deg,#d97706,#f59e0b)' }}/>

        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'18px 24px', borderBottom:'1px solid #f1f5f9' }}>
          <div style={{ display:'flex', alignItems:'center', gap:12 }}>
            <div style={{ width:38, height:38, borderRadius:10, background:'#fef9c3', display:'flex', alignItems:'center', justifyContent:'center' }}>
              <Tag size={17} style={{ color:'#d97706' }}/>
            </div>
            <h2 style={{ fontSize:15, fontWeight:700, color:'#0f172a' }}>{editing ? 'Edit Category' : 'New Category'}</h2>
          </div>
          <button onClick={onClose} style={{ width:32, height:32, borderRadius:8, border:'1px solid #e2e8f0', background:'#f8fafc', display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer', color:'#64748b' }}>
            <X size={15}/>
          </button>
        </div>

        <form onSubmit={handleSubmit} style={{ padding:'20px 24px', display:'flex', flexDirection:'column', gap:14 }}>
          <div>
            <label style={{ display:'block', fontSize:11, fontWeight:700, textTransform:'uppercase', letterSpacing:'0.06em', color:'#94a3b8', marginBottom:6 }}>Category Name *</label>
            <input value={form.name} onChange={e=>{ setForm(f=>({...f,name:e.target.value})); setError(''); }}
              placeholder="e.g. Raw Materials" style={iStyle} onFocus={focus} onBlur={blur}/>
            {error && <p style={{ fontSize:11, color:'#dc2626', marginTop:4 }}>{error}</p>}
          </div>
          <div>
            <label style={{ display:'block', fontSize:11, fontWeight:700, textTransform:'uppercase', letterSpacing:'0.06em', color:'#94a3b8', marginBottom:6 }}>Description</label>
            <textarea value={form.description} onChange={e=>setForm(f=>({...f,description:e.target.value}))} rows={2}
              placeholder="Optional..." style={{ ...iStyle, resize:'none', height:'auto' }} onFocus={focus} onBlur={blur}/>
          </div>
          <div style={{ display:'flex', gap:10 }}>
            <button type="button" onClick={onClose} className="btn-secondary" style={{ flex:1 }}>Cancel</button>
            <button type="submit" disabled={saving}
              style={{ flex:1, display:'flex', alignItems:'center', justifyContent:'center', gap:8, padding:'10px 18px', borderRadius:10, border:'none', fontSize:13, fontWeight:600, cursor:'pointer', color:'#fff', background:'#d97706', opacity:saving?0.7:1 }}>
              {saving ? <Loader2 size={14} style={{ animation:'spin 1s linear infinite' }}/> : <Save size={14}/>}
              {saving ? 'Saving...' : editing ? 'Update' : 'Create'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CategoryModal;
