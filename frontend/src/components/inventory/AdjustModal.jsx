import { useState } from 'react';
import { X, ArrowUpCircle, ArrowDownCircle, RefreshCw, Loader2 } from 'lucide-react';

const TYPES = [
  { value:'in',         label:'Stock In',   icon:ArrowUpCircle,   color:'#16a34a', bg:'#dcfce7',  border:'#bbf7d0'  },
  { value:'out',        label:'Stock Out',  icon:ArrowDownCircle, color:'#dc2626', bg:'#fee2e2',  border:'#fecaca'  },
  { value:'adjustment', label:'Adjustment', icon:RefreshCw,       color:'#d97706', bg:'#fef9c3',  border:'#fde68a'  },
];

const iStyle = { width:'100%', padding:'10px 12px', borderRadius:10, border:'1px solid #e2e8f0', fontSize:13, color:'#0f172a', background:'#f8fafc', outline:'none', boxSizing:'border-box' };
const focus  = (e) => { e.target.style.borderColor='#16a34a'; e.target.style.boxShadow='0 0 0 3px rgba(22,163,74,.1)'; };
const blur   = (e) => { e.target.style.borderColor='#e2e8f0'; e.target.style.boxShadow='none'; };

const AdjustModal = ({ item, onClose, onSave }) => {
  const [type, setType]     = useState('in');
  const [quantity, setQty]  = useState('');
  const [notes, setNotes]   = useState('');
  const [error, setError]   = useState('');
  const [saving, setSaving] = useState(false);

  const current = parseFloat(item?.current_stock)||0;
  const qty     = parseFloat(quantity)||0;
  const preview = type==='in' ? current+qty : type==='out' ? current-qty : qty;
  const selected = TYPES.find(t=>t.value===type);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!quantity || qty<=0) { setError('Enter a valid quantity'); return; }
    if (type==='out' && qty>current) { setError('Insufficient stock'); return; }
    setSaving(true);
    try { await onSave({ type, quantity:qty, notes }); }
    finally { setSaving(false); }
  };

  return (
    <div style={{ position:'fixed', inset:0, zIndex:50, display:'flex', alignItems:'center', justifyContent:'center', padding:16 }} onClick={onClose}>
      <div style={{ position:'absolute', inset:0, background:'rgba(15,23,42,.55)', backdropFilter:'blur(6px)' }}/>
      <div className="fade-up" style={{ position:'relative', width:'100%', maxWidth:440, background:'#fff', borderRadius:20, border:'1px solid #e2e8f0', boxShadow:'0 20px 60px rgba(0,0,0,.15)', overflow:'hidden' }} onClick={e=>e.stopPropagation()}>

        <div style={{ height:4, background:`linear-gradient(90deg,${selected.color},${selected.color}88)` }}/>

        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'18px 24px', borderBottom:'1px solid #f1f5f9' }}>
          <div>
            <h2 style={{ fontSize:15, fontWeight:700, color:'#0f172a' }}>Adjust Stock</h2>
            <p style={{ fontSize:12, color:'#64748b', marginTop:2 }}>{item?.name}</p>
          </div>
          <button onClick={onClose} style={{ width:32, height:32, borderRadius:8, border:'1px solid #e2e8f0', background:'#f8fafc', display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer', color:'#64748b' }}>
            <X size={15}/>
          </button>
        </div>

        <form onSubmit={handleSubmit} style={{ padding:'20px 24px', display:'flex', flexDirection:'column', gap:16 }}>
          {/* Current / preview */}
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'14px 16px', background:'#f8fafc', borderRadius:12, border:'1px solid #f1f5f9' }}>
            <div>
              <p style={{ fontSize:11, color:'#94a3b8', textTransform:'uppercase', letterSpacing:'0.05em' }}>Current Stock</p>
              <p style={{ fontSize:22, fontWeight:800, color:'#0f172a', marginTop:2 }}>{current} <span style={{ fontSize:13, fontWeight:400, color:'#64748b' }}>{item?.unit}</span></p>
            </div>
            {quantity && (
              <div style={{ textAlign:'right' }}>
                <p style={{ fontSize:11, color:'#94a3b8', textTransform:'uppercase', letterSpacing:'0.05em' }}>After Adjustment</p>
                <p style={{ fontSize:22, fontWeight:800, marginTop:2, color: preview<0?'#dc2626':preview<=(parseFloat(item?.reorder_level)||0)?'#d97706':'#16a34a' }}>
                  {preview.toFixed(2)} <span style={{ fontSize:13, fontWeight:400, color:'#64748b' }}>{item?.unit}</span>
                </p>
              </div>
            )}
          </div>

          {/* Type selector */}
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:8 }}>
            {TYPES.map(t=>(
              <button key={t.value} type="button" onClick={()=>{ setType(t.value); setError(''); }}
                style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:6, padding:'12px 8px', borderRadius:12, fontSize:12, fontWeight:600, cursor:'pointer', border:`1px solid ${type===t.value ? t.border : '#e2e8f0'}`, background:type===t.value ? t.bg : '#f8fafc', color:type===t.value ? t.color : '#64748b', transition:'all .15s' }}>
                <t.icon size={16}/>
                {t.label}
              </button>
            ))}
          </div>

          {/* Quantity */}
          <div>
            <label style={{ display:'block', fontSize:11, fontWeight:700, textTransform:'uppercase', letterSpacing:'0.06em', color:'#94a3b8', marginBottom:6 }}>
              {type==='adjustment' ? 'New Stock Level' : 'Quantity'}
            </label>
            <input type="number" min="0.01" step="0.01" value={quantity} onChange={e=>{ setQty(e.target.value); setError(''); }}
              placeholder={type==='adjustment' ? 'Enter new stock level' : 'Enter quantity'}
              style={iStyle} onFocus={focus} onBlur={blur}/>
            {error && <p style={{ fontSize:11, color:'#dc2626', marginTop:4 }}>{error}</p>}
          </div>

          {/* Notes */}
          <div>
            <label style={{ display:'block', fontSize:11, fontWeight:700, textTransform:'uppercase', letterSpacing:'0.06em', color:'#94a3b8', marginBottom:6 }}>Notes</label>
            <textarea value={notes} onChange={e=>setNotes(e.target.value)} rows={2} placeholder="Reason for adjustment..."
              style={{ ...iStyle, resize:'none', height:'auto' }} onFocus={focus} onBlur={blur}/>
          </div>

          <div style={{ display:'flex', gap:10 }}>
            <button type="button" onClick={onClose} className="btn-secondary" style={{ flex:1 }}>Cancel</button>
            <button type="submit" disabled={saving}
              style={{ flex:1, display:'flex', alignItems:'center', justifyContent:'center', gap:8, padding:'10px 18px', borderRadius:10, border:'none', fontSize:13, fontWeight:600, cursor:'pointer', color:'#fff', background:selected.color, opacity:saving?0.7:1 }}>
              {saving ? <Loader2 size={14} style={{ animation:'spin 1s linear infinite' }}/> : <selected.icon size={14}/>}
              {saving ? 'Saving...' : 'Apply'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AdjustModal;
