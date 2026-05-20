import { useState } from 'react';
import { X, Plus, Trash2, Save, Loader2, Package } from 'lucide-react';

const EMPTY_ITEM = { item_name:'', quantity:1, estimated_unit_price:'', unit:'pcs', notes:'' };

const iStyle = { width:'100%', padding:'9px 12px', borderRadius:10, border:'1px solid #e2e8f0', fontSize:13, color:'#0f172a', background:'#f8fafc', outline:'none', boxSizing:'border-box' };
const sStyle = { ...iStyle };
const focus  = (e) => { e.target.style.borderColor='#16a34a'; e.target.style.boxShadow='0 0 0 3px rgba(22,163,74,.1)'; };
const blur   = (e) => { e.target.style.borderColor='#e2e8f0'; e.target.style.boxShadow='none'; };

const Field = ({ label, children, error }) => (
  <div>
    <label style={{ display:'block', fontSize:11, fontWeight:700, textTransform:'uppercase', letterSpacing:'0.06em', color:'#94a3b8', marginBottom:6 }}>{label}</label>
    {children}
    {error && <p style={{ fontSize:11, color:'#dc2626', marginTop:4 }}>{error}</p>}
  </div>
);

const PRModal = ({ onClose, onSave }) => {
  const [form, setForm]   = useState({ department:'', required_date:'', notes:'' });
  const [items, setItems] = useState([{ ...EMPTY_ITEM }]);
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);

  const setField = (k,v) => { setForm(f=>({...f,[k]:v})); setErrors(e=>({...e,[k]:''})); };
  const setItem  = (i,k,v) => setItems(a=>a.map((it,idx)=>idx===i?{...it,[k]:v}:it));
  const addItem  = () => setItems(a=>[...a,{...EMPTY_ITEM}]);
  const rmItem   = (i) => setItems(a=>a.filter((_,idx)=>idx!==i));

  const totalEst = items.reduce((s,it)=>s+(parseFloat(it.quantity)||0)*(parseFloat(it.estimated_unit_price)||0),0);

  const validate = () => {
    const e = {};
    items.forEach((it,i)=>{
      if (!it.item_name?.trim()) e[`item_${i}`]='Item name required';
      if (!it.quantity || it.quantity < 1) e[`qty_${i}`]='Qty required';
    });
    setErrors(e);
    return !Object.keys(e).length;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    setSaving(true);
    try {
      await onSave({
        ...form,
        items: items.map(it=>({
          item_name: it.item_name,
          quantity: parseFloat(it.quantity),
          estimated_unit_price: it.estimated_unit_price ? parseFloat(it.estimated_unit_price) : null,
          unit: it.unit,
          notes: it.notes || null,
        })),
      });
    } finally { setSaving(false); }
  };

  return (
    <div style={{ position:'fixed', inset:0, zIndex:50, display:'flex', alignItems:'center', justifyContent:'center', padding:16 }} onClick={onClose}>
      <div style={{ position:'absolute', inset:0, background:'rgba(15,23,42,.55)', backdropFilter:'blur(6px)' }}/>
      <div className="fade-up" style={{ position:'relative', width:'100%', maxWidth:680, maxHeight:'90vh', display:'flex', flexDirection:'column', background:'#fff', borderRadius:20, border:'1px solid #e2e8f0', boxShadow:'0 20px 60px rgba(0,0,0,.15)', overflow:'hidden' }} onClick={e=>e.stopPropagation()}>

        <div style={{ height:4, background:'linear-gradient(90deg,#16a34a,#4ade80)', flexShrink:0 }}/>

        {/* Header */}
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'18px 24px', borderBottom:'1px solid #f1f5f9', flexShrink:0 }}>
          <div style={{ display:'flex', alignItems:'center', gap:12 }}>
            <div style={{ width:38, height:38, borderRadius:10, background:'#dcfce7', display:'flex', alignItems:'center', justifyContent:'center' }}>
              <Package size={18} style={{ color:'#16a34a' }}/>
            </div>
            <div>
              <h2 style={{ fontSize:15, fontWeight:700, color:'#0f172a' }}>New Purchase Requisition</h2>
              <p style={{ fontSize:12, color:'#64748b', marginTop:2 }}>Request items for procurement</p>
            </div>
          </div>
          <button onClick={onClose} style={{ width:32, height:32, borderRadius:8, border:'1px solid #e2e8f0', background:'#f8fafc', display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer', color:'#64748b' }}>
            <X size={15}/>
          </button>
        </div>

        {/* Scrollable body */}
        <form onSubmit={handleSubmit} style={{ display:'flex', flexDirection:'column', flex:1, overflow:'hidden' }}>
          <div style={{ flex:1, overflowY:'auto', padding:'20px 24px', display:'flex', flexDirection:'column', gap:16 }}>

            {/* PR details */}
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:14 }}>
              <Field label="Department">
                <input value={form.department} onChange={e=>setField('department',e.target.value)} placeholder="e.g. Operations"
                  style={iStyle} onFocus={focus} onBlur={blur}/>
              </Field>
              <Field label="Required By Date">
                <input type="date" value={form.required_date} onChange={e=>setField('required_date',e.target.value)}
                  style={{ ...iStyle, colorScheme:'light' }} onFocus={focus} onBlur={blur}/>
              </Field>
              <div style={{ gridColumn:'1 / -1' }}>
                <Field label="Notes">
                  <textarea value={form.notes} onChange={e=>setField('notes',e.target.value)} rows={2}
                    placeholder="Reason for this requisition..."
                    style={{ ...iStyle, resize:'none', height:'auto' }} onFocus={focus} onBlur={blur}/>
                </Field>
              </div>
            </div>

            {/* Items section */}
            <div>
              <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:10 }}>
                <span style={{ fontSize:11, fontWeight:700, textTransform:'uppercase', letterSpacing:'0.06em', color:'#94a3b8' }}>Items ({items.length})</span>
                <button type="button" onClick={addItem} className="btn-primary" style={{ padding:'6px 12px', fontSize:12 }}>
                  <Plus size={12}/> Add Item
                </button>
              </div>

              {/* Column headers */}
              <div style={{ display:'grid', gridTemplateColumns:'3fr 1fr 1.2fr 0.8fr 0.4fr', gap:8, padding:'0 4px', marginBottom:6 }}>
                {['Item Name','Qty','Est. Price (LKR)','Unit',''].map(h=>(
                  <span key={h} style={{ fontSize:10, fontWeight:700, textTransform:'uppercase', letterSpacing:'0.05em', color:'#94a3b8' }}>{h}</span>
                ))}
              </div>

              <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
                {items.map((item,i)=>(
                  <div key={i} style={{ display:'grid', gridTemplateColumns:'3fr 1fr 1.2fr 0.8fr 0.4fr', gap:8, alignItems:'start' }}>
                    <div>
                      <input value={item.item_name} onChange={e=>setItem(i,'item_name',e.target.value)} placeholder="e.g. A4 Paper Ream"
                        style={iStyle} onFocus={focus} onBlur={blur}/>
                      {errors[`item_${i}`] && <p style={{ fontSize:11, color:'#dc2626', marginTop:3 }}>{errors[`item_${i}`]}</p>}
                    </div>
                    <div>
                      <input type="number" min="1" value={item.quantity} onChange={e=>setItem(i,'quantity',e.target.value)} placeholder="1"
                        style={iStyle} onFocus={focus} onBlur={blur}/>
                      {errors[`qty_${i}`] && <p style={{ fontSize:11, color:'#dc2626', marginTop:3 }}>{errors[`qty_${i}`]}</p>}
                    </div>
                    <input type="number" min="0" step="0.01" value={item.estimated_unit_price} onChange={e=>setItem(i,'estimated_unit_price',e.target.value)} placeholder="0.00"
                      style={iStyle} onFocus={focus} onBlur={blur}/>
                    <select value={item.unit} onChange={e=>setItem(i,'unit',e.target.value)} style={sStyle} onFocus={focus} onBlur={blur}>
                      {['pcs','kg','ltr','box','roll','pkt','set','pair','m','ft'].map(u=><option key={u} value={u}>{u}</option>)}
                    </select>
                    {items.length > 1 ? (
                      <button type="button" onClick={()=>rmItem(i)}
                        style={{ width:34, height:34, borderRadius:8, border:'1px solid #e2e8f0', background:'#f8fafc', display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer', color:'#64748b', marginTop:1 }}
                        onMouseEnter={e=>{e.currentTarget.style.color='#dc2626'; e.currentTarget.style.borderColor='#fecaca';}}
                        onMouseLeave={e=>{e.currentTarget.style.color='#64748b'; e.currentTarget.style.borderColor='#e2e8f0';}}>
                        <Trash2 size={13}/>
                      </button>
                    ) : <div/>}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Footer */}
          <div style={{ padding:'16px 24px', borderTop:'1px solid #f1f5f9', display:'flex', alignItems:'center', justifyContent:'space-between', flexShrink:0 }}>
            <div>
              <p style={{ fontSize:11, color:'#94a3b8' }}>Estimated Total</p>
              <p style={{ fontSize:18, fontWeight:800, color:'#0f172a' }}>LKR {totalEst.toLocaleString('en-LK',{minimumFractionDigits:2})}</p>
            </div>
            <div style={{ display:'flex', gap:10 }}>
              <button type="button" onClick={onClose} className="btn-secondary">Cancel</button>
              <button type="submit" disabled={saving} className="btn-primary" style={{ opacity:saving?0.7:1 }}>
                {saving ? <Loader2 size={14} style={{ animation:'spin 1s linear infinite' }}/> : <Save size={14}/>}
                {saving ? 'Submitting...' : 'Submit Requisition'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default PRModal;
