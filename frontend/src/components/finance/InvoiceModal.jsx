import { useState, useEffect } from 'react';
import { X, Save, Loader2, FileText } from 'lucide-react';
import { getSuppliers } from '../../services/supplierService';
import { getPurchaseOrders } from '../../services/procurementService';

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

const InvoiceModal = ({ onClose, onSave }) => {
  const [form, setForm]     = useState({ invoice_number:'', supplier_id:'', po_id:'', invoice_date:'', due_date:'', amount:'', tax_amount:'0', notes:'' });
  const [suppliers, setSup] = useState([]);
  const [orders, setOrders] = useState([]);
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    Promise.all([
      getSuppliers({ limit:100, status:'active' }),
      getPurchaseOrders({ limit:100, status:'sent' }),
    ]).then(([s,p])=>{ setSup(s.data.data); setOrders(p.data.data); }).catch(()=>{});
  }, []);

  const set = (k,v) => { setForm(f=>({...f,[k]:v})); setErrors(e=>({...e,[k]:''})); };
  const amount    = parseFloat(form.amount)||0;
  const taxAmount = parseFloat(form.tax_amount)||0;
  const total     = amount + taxAmount;

  const validate = () => {
    const e = {};
    if (!form.invoice_number.trim()) e.invoice_number='Invoice number required';
    if (!form.supplier_id)           e.supplier_id='Select a supplier';
    if (!form.amount || amount<=0)   e.amount='Amount must be > 0';
    setErrors(e); return !Object.keys(e).length;
  };

  const handleSubmit = async (ev) => {
    ev.preventDefault();
    if (!validate()) return;
    setSaving(true);
    try { await onSave({ ...form, supplier_id:parseInt(form.supplier_id), po_id:form.po_id||null }); }
    finally { setSaving(false); }
  };

  return (
    <div style={{ position:'fixed', inset:0, zIndex:50, display:'flex', alignItems:'center', justifyContent:'center', padding:16 }} onClick={onClose}>
      <div style={{ position:'absolute', inset:0, background:'rgba(15,23,42,.55)', backdropFilter:'blur(6px)' }}/>
      <div className="fade-up" style={{ position:'relative', width:'100%', maxWidth:520, background:'#fff', borderRadius:20, border:'1px solid #e2e8f0', boxShadow:'0 20px 60px rgba(0,0,0,.15)', overflow:'hidden' }} onClick={e=>e.stopPropagation()}>

        <div style={{ height:4, background:'linear-gradient(90deg,#7c3aed,#a78bfa)' }}/>

        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'18px 24px', borderBottom:'1px solid #f1f5f9' }}>
          <div style={{ display:'flex', alignItems:'center', gap:12 }}>
            <div style={{ width:38, height:38, borderRadius:10, background:'#ede9fe', display:'flex', alignItems:'center', justifyContent:'center' }}>
              <FileText size={18} style={{ color:'#7c3aed' }}/>
            </div>
            <div>
              <h2 style={{ fontSize:15, fontWeight:700, color:'#0f172a' }}>New Invoice</h2>
              <p style={{ fontSize:12, color:'#64748b', marginTop:2 }}>Record supplier invoice</p>
            </div>
          </div>
          <button onClick={onClose} style={{ width:32, height:32, borderRadius:8, border:'1px solid #e2e8f0', background:'#f8fafc', display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer', color:'#64748b' }}>
            <X size={15}/>
          </button>
        </div>

        <form onSubmit={handleSubmit} style={{ padding:'20px 24px', display:'flex', flexDirection:'column', gap:14 }}>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:14 }}>
            <div style={{ gridColumn:'1 / -1' }}>
              <F label="Invoice Number *" error={errors.invoice_number}>
                <input value={form.invoice_number} onChange={e=>set('invoice_number',e.target.value)} placeholder="e.g. INV-2026-001" style={iStyle} onFocus={focus} onBlur={blur}/>
              </F>
            </div>
            <div style={{ gridColumn:'1 / -1' }}>
              <F label="Supplier *" error={errors.supplier_id}>
                <select value={form.supplier_id} onChange={e=>set('supplier_id',e.target.value)} style={iStyle} onFocus={focus} onBlur={blur}>
                  <option value="">— Select Supplier —</option>
                  {suppliers.map(s=><option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
              </F>
            </div>
            <div style={{ gridColumn:'1 / -1' }}>
              <F label="Linked Purchase Order">
                <select value={form.po_id} onChange={e=>set('po_id',e.target.value)} style={iStyle} onFocus={focus} onBlur={blur}>
                  <option value="">— None —</option>
                  {orders.map(o=><option key={o.id} value={o.id}>{o.po_number} — {o.supplier_name}</option>)}
                </select>
              </F>
            </div>
            <F label="Invoice Date">
              <input type="date" value={form.invoice_date} onChange={e=>set('invoice_date',e.target.value)} style={{ ...iStyle, colorScheme:'light' }} onFocus={focus} onBlur={blur}/>
            </F>
            <F label="Due Date">
              <input type="date" value={form.due_date} onChange={e=>set('due_date',e.target.value)} style={{ ...iStyle, colorScheme:'light' }} onFocus={focus} onBlur={blur}/>
            </F>
            <F label="Amount (LKR) *" error={errors.amount}>
              <input type="number" min="0" step="0.01" value={form.amount} onChange={e=>set('amount',e.target.value)} placeholder="0.00" style={iStyle} onFocus={focus} onBlur={blur}/>
            </F>
            <F label="Tax / VAT (LKR)">
              <input type="number" min="0" step="0.01" value={form.tax_amount} onChange={e=>set('tax_amount',e.target.value)} placeholder="0.00" style={iStyle} onFocus={focus} onBlur={blur}/>
            </F>
            <div style={{ gridColumn:'1 / -1' }}>
              <F label="Notes">
                <textarea value={form.notes} onChange={e=>set('notes',e.target.value)} rows={2} placeholder="Additional notes..."
                  style={{ ...iStyle, resize:'none', height:'auto' }} onFocus={focus} onBlur={blur}/>
              </F>
            </div>
          </div>

          {amount > 0 && (
            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'12px 16px', background:'#ede9fe', borderRadius:10, border:'1px solid #ddd6fe' }}>
              <span style={{ fontSize:13, color:'#64748b' }}>Total Amount</span>
              <span style={{ fontSize:16, fontWeight:800, color:'#0f172a' }}>LKR {total.toLocaleString('en-LK',{minimumFractionDigits:2})}</span>
            </div>
          )}

          <div style={{ display:'flex', gap:10 }}>
            <button type="button" onClick={onClose} className="btn-secondary" style={{ flex:1 }}>Cancel</button>
            <button type="submit" disabled={saving} className="btn-primary" style={{ flex:1, justifyContent:'center', opacity:saving?0.7:1 }}>
              {saving?<Loader2 size={14} style={{ animation:'spin 1s linear infinite' }}/>:<Save size={14}/>}
              {saving?'Saving...':'Save Invoice'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default InvoiceModal;
