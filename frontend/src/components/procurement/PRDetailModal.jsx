import { X, CheckCircle2, XCircle, ShoppingCart, Calendar, User, Hash, FileText } from 'lucide-react';
import { useState } from 'react';
import { useAuth } from '../../context/AuthContext';

const badgeCls = { pending:'badge badge-amber', approved:'badge badge-green', rejected:'badge badge-red', converted:'badge badge-violet' };
const badgeLabel = { pending:'Pending', approved:'Approved', rejected:'Rejected', converted:'Converted' };

const PRDetailModal = ({ pr, onClose, onApprove, onReject, onCreatePO }) => {
  const { user } = useAuth();
  const [rejectReason, setRejectReason] = useState('');
  const [showReject, setShowReject]     = useState(false);
  const [loading, setLoading]           = useState('');
  const canApprove = ['admin','procurement_manager'].includes(user?.role);

  const handle = async (action, fn) => {
    setLoading(action);
    try { await fn(); } finally { setLoading(''); }
  };

  const total = pr.items?.reduce((s,i)=>s+(parseFloat(i.quantity)||0)*(parseFloat(i.estimated_unit_price)||0),0)||0;

  return (
    <div style={{ position:'fixed', inset:0, zIndex:50, display:'flex', alignItems:'center', justifyContent:'center', padding:16 }} onClick={onClose}>
      <div style={{ position:'absolute', inset:0, background:'rgba(15,23,42,.55)', backdropFilter:'blur(6px)' }}/>
      <div className="fade-up" style={{ position:'relative', width:'100%', maxWidth:560, maxHeight:'90vh', display:'flex', flexDirection:'column', background:'#fff', borderRadius:20, border:'1px solid #e2e8f0', boxShadow:'0 20px 60px rgba(0,0,0,.15)', overflow:'hidden' }} onClick={e=>e.stopPropagation()}>

        <div style={{ height:4, background:'linear-gradient(90deg,#16a34a,#4ade80)', flexShrink:0 }}/>

        {/* Header */}
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'18px 24px', borderBottom:'1px solid #f1f5f9', flexShrink:0 }}>
          <div>
            <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:4 }}>
              <span style={{ fontSize:16, fontWeight:700, color:'#0f172a' }}>{pr.pr_number}</span>
              <span className={badgeCls[pr.status] || 'badge badge-slate'}>{badgeLabel[pr.status] || pr.status}</span>
            </div>
            <p style={{ fontSize:12, color:'#64748b' }}>Purchase Requisition</p>
          </div>
          <button onClick={onClose} style={{ width:32, height:32, borderRadius:8, border:'1px solid #e2e8f0', background:'#f8fafc', display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer', color:'#64748b' }}>
            <X size={15}/>
          </button>
        </div>

        {/* Scrollable body */}
        <div style={{ flex:1, overflowY:'auto', padding:'20px 24px', display:'flex', flexDirection:'column', gap:16 }}>

          {/* Meta grid */}
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>
            {[
              [User,    'Requested By',  pr.requested_by_name||'—'],
              [Hash,    'Department',    pr.department||'—'],
              [Calendar,'Required Date', pr.required_date ? new Date(pr.required_date).toLocaleDateString('en-LK') : '—'],
              [User,    'Approved By',   pr.approved_by_name||'—'],
            ].map(([Icon,label,value])=>(
              <div key={label} style={{ display:'flex', alignItems:'flex-start', gap:10, padding:'12px 14px', background:'#f8fafc', borderRadius:12, border:'1px solid #f1f5f9' }}>
                <Icon size={14} style={{ color:'#94a3b8', marginTop:2, flexShrink:0 }}/>
                <div>
                  <p style={{ fontSize:10, color:'#94a3b8', textTransform:'uppercase', letterSpacing:'0.05em' }}>{label}</p>
                  <p style={{ fontSize:13, fontWeight:500, color:'#0f172a', marginTop:2 }}>{value}</p>
                </div>
              </div>
            ))}
          </div>

          {pr.notes && (
            <div style={{ display:'flex', alignItems:'flex-start', gap:10, padding:'12px 14px', background:'#f8fafc', borderRadius:12, border:'1px solid #f1f5f9' }}>
              <FileText size={14} style={{ color:'#94a3b8', marginTop:2, flexShrink:0 }}/>
              <div>
                <p style={{ fontSize:10, color:'#94a3b8', textTransform:'uppercase', letterSpacing:'0.05em', marginBottom:4 }}>Notes</p>
                <p style={{ fontSize:13, color:'#374151', lineHeight:1.6, whiteSpace:'pre-wrap' }}>{pr.notes}</p>
              </div>
            </div>
          )}

          {/* Items table */}
          <div style={{ border:'1px solid #f1f5f9', borderRadius:12, overflow:'hidden' }}>
            <div style={{ display:'grid', gridTemplateColumns:'3fr 1fr 1fr 1.5fr', gap:12, padding:'10px 16px', background:'#f8fafc', borderBottom:'1px solid #f1f5f9' }}>
              {['Item','Qty','Unit','Est. Price'].map(h=>(
                <span key={h} style={{ fontSize:10, fontWeight:700, textTransform:'uppercase', letterSpacing:'0.05em', color:'#94a3b8' }}>{h}</span>
              ))}
            </div>
            {pr.items?.map((item,i)=>(
              <div key={i} style={{ display:'grid', gridTemplateColumns:'3fr 1fr 1fr 1.5fr', gap:12, padding:'12px 16px', alignItems:'center', borderBottom: i<pr.items.length-1?'1px solid #f8fafc':'none' }}>
                <span style={{ fontSize:13, fontWeight:500, color:'#0f172a' }}>{item.item_name||item.notes||`Item ${i+1}`}</span>
                <span style={{ fontSize:13, color:'#374151' }}>{item.quantity}</span>
                <span style={{ fontSize:13, color:'#64748b' }}>{item.unit||'—'}</span>
                <span style={{ fontSize:13, color:'#374151' }}>
                  {item.estimated_unit_price ? `LKR ${parseFloat(item.estimated_unit_price).toLocaleString('en-LK',{minimumFractionDigits:2})}` : '—'}
                </span>
              </div>
            ))}
            {total > 0 && (
              <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'12px 16px', background:'#f0fdf4', borderTop:'1px solid #bbf7d0' }}>
                <span style={{ fontSize:11, fontWeight:700, textTransform:'uppercase', letterSpacing:'0.05em', color:'#16a34a' }}>Estimated Total</span>
                <span style={{ fontSize:15, fontWeight:800, color:'#0f172a' }}>LKR {total.toLocaleString('en-LK',{minimumFractionDigits:2})}</span>
              </div>
            )}
          </div>

          {/* Reject reason */}
          {showReject && (
            <div style={{ padding:'14px 16px', background:'#fff5f5', border:'1px solid #fecaca', borderRadius:12 }}>
              <p style={{ fontSize:12, fontWeight:600, color:'#dc2626', marginBottom:8 }}>Rejection Reason</p>
              <textarea value={rejectReason} onChange={e=>setRejectReason(e.target.value)} rows={2}
                placeholder="State the reason for rejection..."
                style={{ width:'100%', padding:'10px 12px', borderRadius:10, border:'1px solid #fecaca', fontSize:13, color:'#0f172a', background:'#fff', outline:'none', resize:'none', boxSizing:'border-box' }}
                onFocus={e=>{e.target.style.borderColor='#dc2626'; e.target.style.boxShadow='0 0 0 3px rgba(220,38,38,.1)';}}
                onBlur={e=>{e.target.style.borderColor='#fecaca'; e.target.style.boxShadow='none';}}
              />
            </div>
          )}
        </div>

        {/* Actions */}
        <div style={{ padding:'16px 24px', borderTop:'1px solid #f1f5f9', display:'flex', gap:10, flexShrink:0 }}>
          {pr.status==='pending' && canApprove && !showReject && (
            <>
              <button onClick={()=>setShowReject(true)} className="btn-danger" style={{ flex:1, justifyContent:'center' }}>
                <XCircle size={14}/> Reject
              </button>
              <button onClick={()=>handle('approve',onApprove)} disabled={loading==='approve'} className="btn-primary" style={{ flex:1, justifyContent:'center', opacity:loading==='approve'?0.7:1 }}>
                {loading==='approve' ? <span style={{ width:14, height:14, border:'2px solid rgba(255,255,255,.4)', borderTopColor:'#fff', borderRadius:'50%', display:'inline-block', animation:'spin 1s linear infinite' }}/> : <CheckCircle2 size={14}/>}
                Approve
              </button>
            </>
          )}
          {showReject && (
            <>
              <button onClick={()=>setShowReject(false)} className="btn-secondary" style={{ flex:1 }}>Back</button>
              <button onClick={()=>handle('reject',()=>onReject(rejectReason))} disabled={loading==='reject'} className="btn-danger" style={{ flex:1, justifyContent:'center', opacity:loading==='reject'?0.7:1 }}>
                {loading==='reject' ? <span style={{ width:14, height:14, border:'2px solid rgba(255,255,255,.4)', borderTopColor:'#fff', borderRadius:'50%', display:'inline-block', animation:'spin 1s linear infinite' }}/> : <XCircle size={14}/>}
                Confirm Reject
              </button>
            </>
          )}
          {pr.status==='approved' && (
            <button onClick={onCreatePO} className="btn-primary" style={{ flex:1, justifyContent:'center' }}>
              <ShoppingCart size={14}/> Create Purchase Order
            </button>
          )}
          {['rejected','converted'].includes(pr.status) && (
            <button onClick={onClose} className="btn-secondary" style={{ flex:1 }}>Close</button>
          )}
        </div>
      </div>
    </div>
  );
};

export default PRDetailModal;
