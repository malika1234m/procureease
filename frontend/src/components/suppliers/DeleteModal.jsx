import { AlertTriangle, Trash2, X, Loader2 } from 'lucide-react';
import { useState } from 'react';

const DeleteModal = ({ supplier, onClose, onConfirm }) => {
  const [loading, setLoading] = useState(false);

  const handleConfirm = async () => {
    setLoading(true);
    try { await onConfirm(); } finally { setLoading(false); }
  };

  return (
    <div style={{ position:'fixed', inset:0, zIndex:50, display:'flex', alignItems:'center', justifyContent:'center', padding:16 }} onClick={onClose}>
      <div style={{ position:'absolute', inset:0, background:'rgba(15,23,42,.55)', backdropFilter:'blur(6px)' }}/>
      <div className="fade-up" style={{ position:'relative', width:'100%', maxWidth:400, background:'#fff', borderRadius:20, border:'1px solid #fecaca', boxShadow:'0 20px 60px rgba(0,0,0,.15)', overflow:'hidden' }} onClick={e=>e.stopPropagation()}>

        <div style={{ height:4, background:'linear-gradient(90deg,#dc2626,#f87171)' }}/>

        <div style={{ padding:'28px 24px 24px', textAlign:'center' }}>
          <div style={{ width:56, height:56, borderRadius:16, background:'#fee2e2', border:'2px solid #fecaca', display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 16px' }}>
            <AlertTriangle size={26} style={{ color:'#dc2626' }}/>
          </div>
          <h2 style={{ fontSize:17, fontWeight:700, color:'#0f172a', marginBottom:8 }}>Delete Supplier?</h2>
          <p style={{ fontSize:13, color:'#64748b', lineHeight:1.6 }}>
            You're about to delete <strong style={{ color:'#0f172a' }}>"{supplier?.name}"</strong>.
            This action cannot be undone.
          </p>

          <div style={{ display:'flex', gap:10, marginTop:24 }}>
            <button onClick={onClose} className="btn-secondary" style={{ flex:1 }}>Cancel</button>
            <button onClick={handleConfirm} disabled={loading} className="btn-danger" style={{ flex:1, justifyContent:'center', opacity:loading?0.7:1 }}>
              {loading ? <Loader2 size={14} style={{ animation:'spin 1s linear infinite' }}/> : <Trash2 size={14}/>}
              {loading ? 'Deleting...' : 'Delete'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DeleteModal;
