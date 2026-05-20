import { useState, useEffect, useCallback } from 'react';
import { Plus, Search, Truck, RefreshCw, Pencil, Trash2, ChevronLeft, ChevronRight, Star, Phone, Mail, MapPin, X, CheckCircle2, PauseCircle, Ban } from 'lucide-react';
import { getSuppliers, getSupplierStats, createSupplier, updateSupplier, deleteSupplier } from '../services/supplierService';
import SupplierModal from '../components/suppliers/SupplierModal';
import DeleteModal   from '../components/suppliers/DeleteModal';

const STATUS = {
  active:      { label:'Active',      cls:'badge-green'  },
  inactive:    { label:'Inactive',    cls:'badge-slate'  },
  blacklisted: { label:'Blacklisted', cls:'badge-red'    },
};
const StatusBadge = ({ status }) => {
  const s = STATUS[status] || STATUS.active;
  return <span className={`badge ${s.cls}`}>{s.label}</span>;
};
const avatarColors = ['#2563eb','#16a34a','#d97706','#7c3aed','#dc2626','#0891b2'];
const Avatar = ({ name }) => {
  const c = avatarColors[(name?.charCodeAt(0)||0) % avatarColors.length];
  return (
    <div style={{ width:36, height:36, borderRadius:10, background:c, display:'flex', alignItems:'center', justifyContent:'center', color:'#fff', fontWeight:700, fontSize:13, flexShrink:0 }}>
      {name?.charAt(0).toUpperCase()}
    </div>
  );
};

const LIMIT = 10;

const Suppliers = () => {
  const [rows, setRows]     = useState([]);
  const [stats, setStats]   = useState(null);
  const [total, setTotal]   = useState(0);
  const [page, setPage]     = useState(1);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [toast, setToast]   = useState(null);
  const [modal, setModal]   = useState(false);
  const [editTarget, setEdit]   = useState(null);
  const [delTarget, setDel]     = useState(null);

  const showToast = (msg, type='success') => { setToast({msg,type}); setTimeout(()=>setToast(null),3000); };

  const fetch = useCallback(async () => {
    setLoading(true);
    try {
      const [r, s] = await Promise.all([
        getSuppliers({ search, status:filter, page, limit:LIMIT }),
        getSupplierStats(),
      ]);
      setRows(r.data.data); setTotal(r.data.total); setStats(s.data.data);
    } catch { showToast('Failed to load suppliers','error'); }
    finally { setLoading(false); }
  }, [search, filter, page]);

  useEffect(() => { fetch(); }, [fetch]);
  useEffect(() => { setPage(1); }, [search, filter]);

  const handleSave = async (form) => {
    try {
      if (editTarget?.id) { await updateSupplier(editTarget.id, form); showToast('Supplier updated'); }
      else                { await createSupplier(form);                showToast('Supplier added');   }
      setModal(false); setEdit(null); fetch();
    } catch (err) { showToast(err.response?.data?.message||'Error','error'); throw err; }
  };
  const handleDelete = async () => {
    try { await deleteSupplier(delTarget.id); showToast('Supplier deleted'); setDel(null); fetch(); }
    catch (err) { showToast(err.response?.data?.message||'Cannot delete','error'); throw err; }
  };

  const totalPages = Math.ceil(total / LIMIT);

  const kpis = [
    { label:'Total Suppliers', value:stats?.total,       bg:'#eff6ff', ic:'#2563eb', icon:Truck        },
    { label:'Active',          value:stats?.active,      bg:'#f0fdf4', ic:'#16a34a', icon:CheckCircle2  },
    { label:'Inactive',        value:stats?.inactive,    bg:'#f8fafc', ic:'#64748b', icon:PauseCircle   },
    { label:'Blacklisted',     value:stats?.blacklisted, bg:'#fef2f2', ic:'#dc2626', icon:Ban           },
  ];

  return (
    <div className="page" style={{ display:'flex', flexDirection:'column', gap:24 }}>

      {/* Toast */}
      {toast && (
        <div style={{ position:'fixed', top:20, right:20, zIndex:9999, padding:'12px 18px', borderRadius:12, fontSize:13, fontWeight:500, boxShadow:'0 8px 24px rgba(0,0,0,.12)', background: toast.type==='error'?'#fef2f2':'#f0fdf4', color: toast.type==='error'?'#dc2626':'#15803d', border:`1px solid ${toast.type==='error'?'#fecaca':'#bbf7d0'}` }}>
          {toast.type==='error'?<X size={13}/>:<CheckCircle2 size={13}/>} {toast.msg}
        </div>
      )}

      {/* Header */}
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
        <div>
          <h1 style={{ fontSize:22, fontWeight:800, color:'#0f172a' }}>Supplier Directory</h1>
          <p style={{ fontSize:13, color:'#64748b', marginTop:3 }}>{total} supplier{total!==1?'s':''} registered</p>
        </div>
        <button className="btn-primary" onClick={()=>{ setEdit(null); setModal(true); }}>
          <Plus size={15}/> Add Supplier
        </button>
      </div>

      {/* KPI cards */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:16 }}>
        {kpis.map(({ label, value, bg, ic, icon:Icon }) => (
          <div key={label} className="stat-card" style={{ background:'#fff' }}>
            <div style={{ width:46, height:46, borderRadius:12, background:bg, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}><Icon size={20} style={{ color:ic }}/></div>
            <div>
              <p style={{ fontSize:26, fontWeight:800, color:'#0f172a', lineHeight:1 }}>{value ?? '—'}</p>
              <p style={{ fontSize:12, color:'#64748b', marginTop:4 }}>{label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Search + filter */}
      <div style={{ display:'flex', gap:10, alignItems:'center', background:'#fff', padding:'14px 16px', borderRadius:14, border:'1px solid #f1f5f9', boxShadow:'0 1px 3px rgba(0,0,0,.04)' }}>
        <div style={{ position:'relative', flex:1 }}>
          <Search size={14} style={{ position:'absolute', left:11, top:'50%', transform:'translateY(-50%)', color:'#94a3b8' }}/>
          <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search by name, email or contact person…"
            className="input-field" style={{ paddingLeft:34, paddingRight: search?34:14 }}/>
          {search && <button onClick={()=>setSearch('')} style={{ position:'absolute', right:10, top:'50%', transform:'translateY(-50%)', background:'none', border:'none', cursor:'pointer', color:'#94a3b8', display:'flex' }}><X size={14}/></button>}
        </div>
        <div style={{ display:'flex', gap:6 }}>
          {[['','All'],['active','Active'],['inactive','Inactive'],['blacklisted','Blacklisted']].map(([v,l])=>(
            <button key={v} onClick={()=>setFilter(v)}
              style={{ padding:'8px 14px', borderRadius:8, fontSize:12, fontWeight:500, cursor:'pointer', transition:'all .15s', background: filter===v?'#16a34a':'#f8fafc', color: filter===v?'#fff':'#475569', border: filter===v?'1px solid #16a34a':'1px solid #e2e8f0' }}>
              {l}
            </button>
          ))}
        </div>
        <button onClick={fetch} style={{ width:36, height:36, borderRadius:8, border:'1px solid #e2e8f0', background:'#f8fafc', display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer', color:'#64748b' }}>
          <RefreshCw size={14} className={loading?'animate-spin':''}/>
        </button>
      </div>

      {/* Table */}
      <div className="data-table">
        {/* Header row */}
        <div className="data-table-header" style={{ display:'grid', gridTemplateColumns:'2fr 1.5fr 1fr 1fr 0.8fr 80px', gap:12, padding:'11px 20px' }}>
          {['Supplier','Contact','Payment Terms','Rating','Status',''].map(h=>(
            <span key={h} style={{ fontSize:11, fontWeight:700, color:'#94a3b8', textTransform:'uppercase', letterSpacing:'.05em' }}>{h}</span>
          ))}
        </div>

        {/* Loading skeletons */}
        {loading && Array.from({length:5}).map((_,i)=>(
          <div key={i} className="data-table-row" style={{ display:'grid', gridTemplateColumns:'2fr 1.5fr 1fr 1fr 0.8fr 80px', gap:12, padding:'14px 20px', alignItems:'center' }}>
            {[150,110,70,70,60,40].map((w,j)=><div key={j} className="shimmer" style={{height:14,width:w,borderRadius:6}}/>)}
          </div>
        ))}

        {/* Empty state */}
        {!loading && rows.length === 0 && (
          <div style={{ padding:'60px 20px', textAlign:'center' }}>
            <div style={{ width:56, height:56, borderRadius:16, background:'#f1f5f9', display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 12px' }}>
              <Truck size={26} style={{ color:'#94a3b8' }}/>
            </div>
            <p style={{ fontSize:14, fontWeight:600, color:'#374151' }}>No suppliers found</p>
            <p style={{ fontSize:12, color:'#94a3b8', marginTop:4, marginBottom:16 }}>{search?'Try a different search term':'Add your first supplier to get started'}</p>
            {!search && <button className="btn-primary" onClick={()=>{ setEdit(null); setModal(true); }} style={{ margin:'0 auto' }}><Plus size={14}/> Add First Supplier</button>}
          </div>
        )}

        {/* Data rows */}
        {!loading && rows.map(s => (
          <div key={s.id} className="data-table-row" style={{ display:'grid', gridTemplateColumns:'2fr 1.5fr 1fr 1fr 0.8fr 80px', gap:12, padding:'14px 20px', alignItems:'center' }}>
            <div style={{ display:'flex', alignItems:'center', gap:10, minWidth:0 }}>
              <Avatar name={s.name}/>
              <div style={{ minWidth:0 }}>
                <p style={{ fontSize:13, fontWeight:600, color:'#0f172a', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{s.name}</p>
                {s.address && <p style={{ fontSize:11, color:'#94a3b8', display:'flex', alignItems:'center', gap:3, marginTop:2 }}><MapPin size={9}/>{s.address}</p>}
              </div>
            </div>
            <div>
              {s.contact_person && <p style={{ fontSize:12, fontWeight:500, color:'#374151' }}>{s.contact_person}</p>}
              {s.email   && <p style={{ fontSize:11, color:'#94a3b8', display:'flex', alignItems:'center', gap:3, marginTop:2 }}><Mail size={9}/>{s.email}</p>}
              {s.phone   && <p style={{ fontSize:11, color:'#94a3b8', display:'flex', alignItems:'center', gap:3, marginTop:1 }}><Phone size={9}/>{s.phone}</p>}
            </div>
            <p style={{ fontSize:12, color:'#374151' }}>Net {s.payment_terms} days</p>
            <div style={{ display:'flex', alignItems:'center', gap:4 }}>
              {[1,2,3,4,5].map(n=><Star key={n} size={12} style={{ color: n<=s.rating?'#f59e0b':'#e2e8f0', fill: n<=s.rating?'#f59e0b':'#e2e8f0' }}/>)}
              <span style={{ fontSize:11, color:'#94a3b8', marginLeft:2 }}>{Number(s.rating).toFixed(1)}</span>
            </div>
            <StatusBadge status={s.status}/>
            <div style={{ display:'flex', gap:6, justifyContent:'flex-end' }}>
              <button onClick={()=>{ setEdit(s); setModal(true); }} style={{ width:30, height:30, borderRadius:8, border:'1px solid #e2e8f0', background:'#fff', display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer', color:'#64748b' }} title="Edit"
                onMouseEnter={e=>{ e.currentTarget.style.borderColor='#16a34a'; e.currentTarget.style.color='#16a34a'; }}
                onMouseLeave={e=>{ e.currentTarget.style.borderColor='#e2e8f0'; e.currentTarget.style.color='#64748b'; }}>
                <Pencil size={13}/>
              </button>
              <button onClick={()=>setDel(s)} style={{ width:30, height:30, borderRadius:8, border:'1px solid #e2e8f0', background:'#fff', display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer', color:'#64748b' }} title="Delete"
                onMouseEnter={e=>{ e.currentTarget.style.borderColor='#dc2626'; e.currentTarget.style.color='#dc2626'; }}
                onMouseLeave={e=>{ e.currentTarget.style.borderColor='#e2e8f0'; e.currentTarget.style.color='#64748b'; }}>
                <Trash2 size={13}/>
              </button>
            </div>
          </div>
        ))}

        {/* Pagination */}
        {totalPages > 1 && (
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'12px 20px', borderTop:'1px solid #f1f5f9' }}>
            <p style={{ fontSize:12, color:'#94a3b8' }}>Showing {(page-1)*LIMIT+1}–{Math.min(page*LIMIT,total)} of {total}</p>
            <div style={{ display:'flex', gap:4 }}>
              <button onClick={()=>setPage(p=>p-1)} disabled={page===1} style={{ width:32, height:32, borderRadius:8, border:'1px solid #e2e8f0', background:'#fff', display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer', opacity:page===1?.4:1 }}><ChevronLeft size={14}/></button>
              {Array.from({length:totalPages},(_,i)=>i+1).map(n=>(
                <button key={n} onClick={()=>setPage(n)} style={{ width:32, height:32, borderRadius:8, border: n===page?'1px solid #16a34a':'1px solid #e2e8f0', background: n===page?'#16a34a':'#fff', color: n===page?'#fff':'#374151', fontSize:12, fontWeight:600, cursor:'pointer' }}>{n}</button>
              ))}
              <button onClick={()=>setPage(p=>p+1)} disabled={page===totalPages} style={{ width:32, height:32, borderRadius:8, border:'1px solid #e2e8f0', background:'#fff', display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer', opacity:page===totalPages?.4:1 }}><ChevronRight size={14}/></button>
            </div>
          </div>
        )}
      </div>

      {modal  && <SupplierModal supplier={editTarget} onClose={()=>{ setModal(false); setEdit(null); }} onSave={handleSave}/>}
      {delTarget && <DeleteModal supplier={delTarget} onClose={()=>setDel(null)} onConfirm={handleDelete}/>}
    </div>
  );
};

export default Suppliers;
