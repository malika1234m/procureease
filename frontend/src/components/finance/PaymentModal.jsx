import { useState, useEffect } from 'react';
import { X, Save, Loader2, CreditCard } from 'lucide-react';
import { getSuppliers } from '../../services/supplierService';
import { getApprovedInvoices } from '../../services/financeService';

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

const METHODS = [['bank_transfer','Bank Transfer'],['cheque','Cheque'],['cash','Cash'],['online','Online/Card']];

const PaymentModal = ({ onClose, onSave }) => {
  const [form, setForm]     = useState({ supplier_id:'', invoice_id:'', amount:'', payment_date:new Date().toISOString().split('T')[0], method:'bank_transfer', reference:'', notes:'' });
  const [suppliers, setSup] = useState([]);
  const [invoices, setInv]  = useState([]);
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    Promise.all([getSuppliers({ limit:100 }), getApprovedInvoices()])
      .then(([s,i])=>{ setSup(s.data.data); setInv(i.data.data); }).catch(()=>{});
  }, []);

  const set = (k,v) => {
    const upd = { ...form, [k]:v };
    if (k==='invoice_id' && v) {
      const inv = invoices.find(i=>i.id===parseInt(v));
      if (inv) { upd.supplier_id=inv.supplier_id||''; upd.amount=inv.total_amount||''; }
    }
    setForm(upd); setErrors(e=>({...e,[k]:''}));
  };

  const validate = () => {
    const e = {};
    if (!form.supplier_id)                          e.supplier_id='Select supplier';
    if (!form.amount || parseFloat(form.amount)<=0) e.amount='Amount must be > 0';
    if (!form.payment_date)                         e.payment_date='Date required';
    setErrors(e); return !Object.keys(e).length;
  };

  const handleSubmit = async (ev) => {
    ev.preventDefault();
    if (!validate()) return;
    setSaving(true);
    try { await onSave({ ...form, supplier_id:parseInt(form.supplier_id), invoice_id:form.invoice_id||null }); }
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
              <CreditCard size={18} style={{ color:'#16a34a' }}/>
            </div>
            <div>
              <h2 style={{ fontSize:15, fontWeight:700, color:'#0f172a' }}>Record Payment</h2>
              <p style={{ fontSize:12, color:'#64748b', marginTop:2 }}>Pay a supplier invoice</p>
            </div>
          </div>
          <button onClick={onClose} style={{ width:32, height:32, borderRadius:8, border:'1px solid #e2e8f0', background:'#f8fafc', display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer', color:'#64748b' }}>
            <X size={15}/>
          </button>
        </div>

        <form onSubmit={handleSubmit} style={{ padding:'20px 24px', display:'flex', flexDirection:'column', gap:14 }}>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:14 }}>
            <div style={{ gridColumn:'1 / -1' }}>
              <F label="Invoice (optional)">
                <select value={form.invoice_id} onChange={e=>set('invoice_id',e.target.value)} style={iStyle} onFocus={focus} onBlur={blur}>
                  <option value="">— Direct Payment (no invoice) —</option>
                  {invoices.map(i=><option key={i.id} value={i.id}>{i.invoice_number} — {i.supplier_name} — LKR {parseFloat(i.total_amount).toLocaleString()}</option>)}
                </select>
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
            <F label="Amount (LKR) *" error={errors.amount}>
              <input type="number" min="0" step="0.01" value={form.amount} onChange={e=>set('amount',e.target.value)} placeholder="0.00" style={iStyle} onFocus={focus} onBlur={blur}/>
            </F>
            <F label="Payment Date *" error={errors.payment_date}>
              <input type="date" value={form.payment_date} onChange={e=>set('payment_date',e.target.value)} style={{ ...iStyle, colorScheme:'light' }} onFocus={focus} onBlur={blur}/>
            </F>
            <div style={{ gridColumn:'1 / -1' }}>
              <F label="Payment Method">
                <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:8 }}>
                  {METHODS.map(([v,l])=>(
                    <button key={v} type="button" onClick={()=>set('method',v)}
                      style={{ padding:'9px 4px', borderRadius:10, fontSize:11, fontWeight:600, cursor:'pointer', border:`1px solid ${form.method===v?'#bbf7d0':'#e2e8f0'}`, background:form.method===v?'#dcfce7':'#f8fafc', color:form.method===v?'#15803d':'#64748b', transition:'all .15s' }}>
                      {l}
                    </button>
                  ))}
                </div>
              </F>
            </div>
            <div style={{ gridColumn:'1 / -1' }}>
              <F label="Reference / Cheque No.">
                <input value={form.reference} onChange={e=>set('reference',e.target.value)} placeholder="Transaction reference..." style={iStyle} onFocus={focus} onBlur={blur}/>
              </F>
            </div>
            <div style={{ gridColumn:'1 / -1' }}>
              <F label="Notes">
                <textarea value={form.notes} onChange={e=>set('notes',e.target.value)} rows={2} placeholder="Additional notes..."
                  style={{ ...iStyle, resize:'none', height:'auto' }} onFocus={focus} onBlur={blur}/>
              </F>
            </div>
          </div>
          <div style={{ display:'flex', gap:10 }}>
            <button type="button" onClick={onClose} className="btn-secondary" style={{ flex:1 }}>Cancel</button>
            <button type="submit" disabled={saving} className="btn-primary" style={{ flex:1, justifyContent:'center', opacity:saving?0.7:1 }}>
              {saving?<Loader2 size={14} style={{ animation:'spin 1s linear infinite' }}/>:<Save size={14}/>}
              {saving?'Saving...':'Record Payment'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default PaymentModal;
