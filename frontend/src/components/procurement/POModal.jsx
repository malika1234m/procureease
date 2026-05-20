import { useState, useEffect } from 'react';
import { X, Plus, Trash2, Save, Loader2, ShoppingCart } from 'lucide-react';
import { getSuppliers } from '../../services/supplierService';

const EMPTY_ITEM = { item_name:'', quantity:1, unit_price:'', unit:'pcs', tax_percent:0 };

const iStyle = { width:'100%', padding:'9px 12px', borderRadius:10, border:'1px solid #e2e8f0', fontSize:13, color:'#0f172a', background:'#f8fafc', outline:'none', boxSizing:'border-box' };
const focus  = (e) => { e.target.style.borderColor='#16a34a'; e.target.style.boxShadow='0 0 0 3px rgba(22,163,74,.1)'; };
const blur   = (e) => { e.target.style.borderColor='#e2e8f0'; e.target.style.boxShadow='none'; };

const Field = ({ label, children, error }) => (
  <div>
    <label style={{ display:'block', fontSize:11, fontWeight:700, textTransform:'uppercase', letterSpacing:'0.06em', color:'#94a3b8', marginBottom:6 }}>{label}</label>
    {children}
    {error && <p style={{ fontSize:11, color:'#dc2626', marginTop:4 }}>{error}</p>}
  </div>
);

const POModal = ({ pr, onClose, onSave }) => {
  const [suppliers, setSuppliers] = useState([]);
  const [form, setForm]   = useState({ supplier_id:'', expected_delivery:'', notes:'', tax_percent:0 });
  const [items, setItems] = useState(pr ? pr.items.map(i=>({
    item_name: i.item_name||'', quantity: i.quantity, unit_price: i.estimated_unit_price||'', unit: i.unit||'pcs', tax_percent:0,
  })) : [{ ...EMPTY_ITEM }]);
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    getSuppliers({ limit:100, status:'active' }).then(r=>setSuppliers(r.data.data)).catch(()=>{});
  }, []);

  const setField = (k,v) => { setForm(f=>({...f,[k]:v})); setErrors(e=>({...e,[k]:''})); };
  const setItem  = (i,k,v) => setItems(a=>a.map((it,idx)=>idx===i?{...it,[k]:v}:it));
  const addItem  = () => setItems(a=>[...a,{...EMPTY_ITEM}]);
  const rmItem   = (i) => setItems(a=>a.filter((_,idx)=>idx!==i));

  const subtotal    = items.reduce((s,i)=>s+(parseFloat(i.quantity)||0)*(parseFloat(i.unit_price)||0),0);
  const taxAmount   = +(subtotal*(parseFloat(form.tax_percent)||0)/100).toFixed(2);
  const totalAmount = +(subtotal+taxAmount).toFixed(2);

  const validate = () => {
    const e = {};
    if (!form.supplier_id) e.supplier_id='Select a supplier';
    items.forEach((it,i)=>{
      if (!it.item_name?.trim()) e[`name_${i}`]='Required';
      if (!it.unit_price || parseFloat(it.unit_price)<=0) e[`price_${i}`]='Required';
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
        supplier_id: parseInt(form.supplier_id),
        pr_id: pr?.id || null,
        expected_delivery: form.expected_delivery || null,
        notes: form.notes || null,
        tax_percent: parseFloat(form.tax_percent)||0,
        items: items.map(it=>({
          item_name: it.item_name,
          quantity: parseFloat(it.quantity),
          unit_price: parseFloat(it.unit_price),
          unit: it.unit,
          tax_percent: parseFloat(it.tax_percent)||0,
        })),
      });
    } finally { setSaving(false); }
  };

  return (
    <div style={{ position:'fixed', inset:0, zIndex:50, display:'flex', alignItems:'center', justifyContent:'center', padding:16 }} onClick={onClose}>
      <div style={{ position:'absolute', inset:0, background:'rgba(15,23,42,.55)', backdropFilter:'blur(6px)' }}/>
      <div className="fade-up" style={{ position:'relative', width:'100%', maxWidth:680, maxHeight:'90vh', display:'flex', flexDirection:'column', background:'#fff', borderRadius:20, border:'1px solid #e2e8f0', boxShadow:'0 20px 60px rgba(0,0,0,.15)', overflow:'hidden' }} onClick={e=>e.stopPropagation()}>

        <div style={{ height:4, background:'linear-gradient(90deg,#2563eb,#3b82f6)', flexShrink:0 }}/>

        {/* Header */}
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'18px 24px', borderBottom:'1px solid #f1f5f9', flexShrink:0 }}>
          <div style={{ display:'flex', alignItems:'center', gap:12 }}>
            <div style={{ width:38, height:38, borderRadius:10, background:'#dbeafe', display:'flex', alignItems:'center', justifyContent:'center' }}>
              <ShoppingCart size={18} style={{ color:'#2563eb' }}/>
            </div>
            <div>
              <h2 style={{ fontSize:15, fontWeight:700, color:'#0f172a' }}>Create Purchase Order</h2>
              <p style={{ fontSize:12, color:'#64748b', marginTop:2 }}>{pr ? `From PR: ${pr.pr_number}` : 'Direct purchase order'}</p>
            </div>
          </div>
          <button onClick={onClose} style={{ width:32, height:32, borderRadius:8, border:'1px solid #e2e8f0', background:'#f8fafc', display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer', color:'#64748b' }}>
            <X size={15}/>
          </button>
        </div>

        <form onSubmit={handleSubmit} style={{ display:'flex', flexDirection:'column', flex:1, overflow:'hidden' }}>
          <div style={{ flex:1, overflowY:'auto', padding:'20px 24px', display:'flex', flexDirection:'column', gap:14 }}>

            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:14 }}>
              <div style={{ gridColumn:'1 / -1' }}>
                <Field label="Supplier *" error={errors.supplier_id}>
                  <select value={form.supplier_id} onChange={e=>setField('supplier_id',e.target.value)} style={iStyle} onFocus={focus} onBlur={blur}>
                    <option value="">— Select Supplier —</option>
                    {suppliers.map(s=><option key={s.id} value={s.id}>{s.name}</option>)}
                  </select>
                </Field>
              </div>
              <Field label="Expected Delivery">
                <input type="date" value={form.expected_delivery} onChange={e=>setField('expected_delivery',e.target.value)}
                  style={{ ...iStyle, colorScheme:'light' }} onFocus={focus} onBlur={blur}/>
              </Field>
              <Field label="Tax % (VAT)">
                <input type="number" min="0" max="100" step="0.1" value={form.tax_percent} onChange={e=>setField('tax_percent',e.target.value)} placeholder="0"
                  style={iStyle} onFocus={focus} onBlur={blur}/>
              </Field>
              <div style={{ gridColumn:'1 / -1' }}>
                <Field label="Notes">
                  <textarea value={form.notes} onChange={e=>setField('notes',e.target.value)} rows={2}
                    placeholder="Additional instructions for supplier..."
                    style={{ ...iStyle, resize:'none', height:'auto' }} onFocus={focus} onBlur={blur}/>
                </Field>
              </div>
            </div>

            {/* Line items */}
            <div>
              <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:10 }}>
                <span style={{ fontSize:11, fontWeight:700, textTransform:'uppercase', letterSpacing:'0.06em', color:'#94a3b8' }}>Order Items ({items.length})</span>
                <button type="button" onClick={addItem} className="btn-primary" style={{ padding:'6px 12px', fontSize:12 }}>
                  <Plus size={12}/> Add Item
                </button>
              </div>

              <div style={{ display:'grid', gridTemplateColumns:'3fr 1fr 1.2fr 0.7fr 0.4fr', gap:8, padding:'0 4px', marginBottom:6 }}>
                {['Description','Qty','Unit Price (LKR)','Unit',''].map(h=>(
                  <span key={h} style={{ fontSize:10, fontWeight:700, textTransform:'uppercase', letterSpacing:'0.05em', color:'#94a3b8' }}>{h}</span>
                ))}
              </div>

              <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
                {items.map((item,i)=>(
                  <div key={i} style={{ display:'grid', gridTemplateColumns:'3fr 1fr 1.2fr 0.7fr 0.4fr', gap:8, alignItems:'start' }}>
                    <div>
                      <input value={item.item_name} onChange={e=>setItem(i,'item_name',e.target.value)} placeholder="Item description"
                        style={iStyle} onFocus={focus} onBlur={blur}/>
                      {errors[`name_${i}`] && <p style={{ fontSize:11, color:'#dc2626', marginTop:3 }}>{errors[`name_${i}`]}</p>}
                    </div>
                    <input type="number" min="1" value={item.quantity} onChange={e=>setItem(i,'quantity',e.target.value)} placeholder="1"
                      style={iStyle} onFocus={focus} onBlur={blur}/>
                    <div>
                      <input type="number" min="0" step="0.01" value={item.unit_price} onChange={e=>setItem(i,'unit_price',e.target.value)} placeholder="0.00"
                        style={iStyle} onFocus={focus} onBlur={blur}/>
                      {errors[`price_${i}`] && <p style={{ fontSize:11, color:'#dc2626', marginTop:3 }}>{errors[`price_${i}`]}</p>}
                    </div>
                    <select value={item.unit} onChange={e=>setItem(i,'unit',e.target.value)} style={iStyle} onFocus={focus} onBlur={blur}>
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

          {/* Footer with totals */}
          <div style={{ padding:'16px 24px', borderTop:'1px solid #f1f5f9', flexShrink:0 }}>
            <div style={{ display:'flex', alignItems:'flex-end', justifyContent:'space-between' }}>
              <div style={{ display:'flex', flexDirection:'column', gap:4 }}>
                {[['Subtotal', subtotal],['Tax', taxAmount]].map(([l,v])=>(
                  <div key={l} style={{ display:'flex', gap:48, alignItems:'center' }}>
                    <span style={{ fontSize:13, color:'#64748b', width:60 }}>{l}</span>
                    <span style={{ fontSize:13, color:'#374151' }}>LKR {v.toLocaleString('en-LK',{minimumFractionDigits:2})}</span>
                  </div>
                ))}
                <div style={{ display:'flex', gap:48, alignItems:'center', borderTop:'1px solid #e2e8f0', paddingTop:6, marginTop:2 }}>
                  <span style={{ fontSize:14, fontWeight:700, color:'#0f172a', width:60 }}>Total</span>
                  <span style={{ fontSize:18, fontWeight:800, color:'#0f172a' }}>LKR {totalAmount.toLocaleString('en-LK',{minimumFractionDigits:2})}</span>
                </div>
              </div>
              <div style={{ display:'flex', gap:10 }}>
                <button type="button" onClick={onClose} className="btn-secondary">Cancel</button>
                <button type="submit" disabled={saving} className="btn-primary" style={{ opacity:saving?0.7:1 }}>
                  {saving ? <Loader2 size={14} style={{ animation:'spin 1s linear infinite' }}/> : <Save size={14}/>}
                  {saving ? 'Creating...' : 'Create PO'}
                </button>
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default POModal;
