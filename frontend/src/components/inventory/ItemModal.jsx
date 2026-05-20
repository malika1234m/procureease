import { useState, useEffect } from 'react';
import { X, Save, Loader2, Package } from 'lucide-react';
import { getCategories } from '../../services/inventoryService';

const EMPTY = { name:'', code:'', description:'', category_id:'', unit:'pcs', current_stock:0, reorder_level:0 };

const iStyle = { width:'100%', padding:'10px 12px', borderRadius:10, border:'1px solid #e2e8f0', fontSize:13, color:'#0f172a', background:'#f8fafc', outline:'none', boxSizing:'border-box' };
const focus  = (e) => { e.target.style.borderColor='#16a34a'; e.target.style.boxShadow='0 0 0 3px rgba(22,163,74,.1)'; };
const blur   = (e) => { e.target.style.borderColor='#e2e8f0'; e.target.style.boxShadow='none'; };

const Field = ({ label, children, error }) => (
  <div>
    <label style={{ display:'block', fontSize:11, fontWeight:700, textTransform:'uppercase', letterSpacing:'0.06em', color:'#94a3b8', marginBottom:6 }}>{label}</label>
    {children}
    {error && <p style={{ fontSize:11, color:'#dc2626', marginTop:4 }}>{error}</p>}
  </div>
);

const ItemModal = ({ item, onClose, onSave }) => {
  const editing = !!item?.id;
  const [form, setForm]       = useState(EMPTY);
  const [categories, setCats] = useState([]);
  const [errors, setErrors]   = useState({});
  const [saving, setSaving]   = useState(false);

  useEffect(() => {
    getCategories().then(r=>setCats(r.data.data)).catch(()=>{});
    if (item?.id) {
      setForm({ name:item.name||'', code:item.code||'', description:item.description||'',
        category_id:item.category_id||'', unit:item.unit||'pcs',
        current_stock:item.current_stock||0, reorder_level:item.reorder_level||0 });
    } else { setForm(EMPTY); }
    setErrors({});
  }, [item]);

  const set = (k,v) => { setForm(f=>({...f,[k]:v})); setErrors(e=>({...e,[k]:''})); };

  const validate = () => {
    const e = {};
    if (!form.name.trim()) e.name='Item name is required';
    setErrors(e);
    return !Object.keys(e).length;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    setSaving(true);
    try { await onSave({ ...form, category_id: form.category_id||null }); }
    finally { setSaving(false); }
  };

  return (
    <div style={{ position:'fixed', inset:0, zIndex:50, display:'flex', alignItems:'center', justifyContent:'center', padding:16 }} onClick={onClose}>
      <div style={{ position:'absolute', inset:0, background:'rgba(15,23,42,.55)', backdropFilter:'blur(6px)' }}/>
      <div className="fade-up" style={{ position:'relative', width:'100%', maxWidth:520, background:'#fff', borderRadius:20, border:'1px solid #e2e8f0', boxShadow:'0 20px 60px rgba(0,0,0,.15)', overflow:'hidden' }} onClick={e=>e.stopPropagation()}>

        <div style={{ height:4, background:'linear-gradient(90deg,#16a34a,#4ade80)' }}/>

        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'18px 24px', borderBottom:'1px solid #f1f5f9' }}>
          <div style={{ display:'flex', alignItems:'center', gap:12 }}>
            <div style={{ width:38, height:38, borderRadius:10, background:'#dcfce7', display:'flex', alignItems:'center', justifyContent:'center' }}>
              <Package size={18} style={{ color:'#16a34a' }}/>
            </div>
            <div>
              <h2 style={{ fontSize:15, fontWeight:700, color:'#0f172a' }}>{editing ? 'Edit Item' : 'Add New Item'}</h2>
              <p style={{ fontSize:12, color:'#64748b', marginTop:2 }}>{editing ? item.name : 'Add to inventory'}</p>
            </div>
          </div>
          <button onClick={onClose} style={{ width:32, height:32, borderRadius:8, border:'1px solid #e2e8f0', background:'#f8fafc', display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer', color:'#64748b' }}>
            <X size={15}/>
          </button>
        </div>

        <form onSubmit={handleSubmit} style={{ padding:'20px 24px', display:'flex', flexDirection:'column', gap:14 }}>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:14 }}>
            <div style={{ gridColumn:'1 / -1' }}>
              <Field label="Item Name *" error={errors.name}>
                <input value={form.name} onChange={e=>set('name',e.target.value)} placeholder="e.g. A4 Paper Ream" style={iStyle} onFocus={focus} onBlur={blur}/>
              </Field>
            </div>
            <Field label="Item Code">
              <input value={form.code} onChange={e=>set('code',e.target.value)} placeholder="e.g. ITM-001" style={iStyle} onFocus={focus} onBlur={blur}/>
            </Field>
            <Field label="Category">
              <select value={form.category_id} onChange={e=>set('category_id',e.target.value)} style={iStyle} onFocus={focus} onBlur={blur}>
                <option value="">— No Category —</option>
                {categories.map(c=><option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </Field>
            <Field label="Unit of Measure">
              <select value={form.unit} onChange={e=>set('unit',e.target.value)} style={iStyle} onFocus={focus} onBlur={blur}>
                {['pcs','kg','ltr','box','roll','pkt','set','pair','m','ft','ton','dozen'].map(u=><option key={u} value={u}>{u}</option>)}
              </select>
            </Field>
            <Field label="Reorder Level">
              <input type="number" min="0" step="0.01" value={form.reorder_level} onChange={e=>set('reorder_level',e.target.value)} placeholder="0" style={iStyle} onFocus={focus} onBlur={blur}/>
            </Field>
            {!editing && (
              <div style={{ gridColumn:'1 / -1' }}>
                <Field label="Opening Stock">
                  <input type="number" min="0" step="0.01" value={form.current_stock} onChange={e=>set('current_stock',e.target.value)} placeholder="0" style={iStyle} onFocus={focus} onBlur={blur}/>
                </Field>
              </div>
            )}
            <div style={{ gridColumn:'1 / -1' }}>
              <Field label="Description">
                <textarea value={form.description} onChange={e=>set('description',e.target.value)} rows={2} placeholder="Optional description..."
                  style={{ ...iStyle, resize:'none', height:'auto' }} onFocus={focus} onBlur={blur}/>
              </Field>
            </div>
          </div>

          <div style={{ display:'flex', gap:10 }}>
            <button type="button" onClick={onClose} className="btn-secondary" style={{ flex:1 }}>Cancel</button>
            <button type="submit" disabled={saving} className="btn-primary" style={{ flex:1, justifyContent:'center', opacity:saving?0.7:1 }}>
              {saving ? <Loader2 size={14} style={{ animation:'spin 1s linear infinite' }}/> : <Save size={14}/>}
              {saving ? 'Saving...' : editing ? 'Save Changes' : 'Add Item'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ItemModal;
