import { useState, useEffect, useCallback } from 'react';
import {
  Plus, Search, RefreshCw, ChevronLeft, ChevronRight,
  X, Package, ShoppingCart, CheckCircle2, Clock,
  ArrowRight, Eye, Trash2, FileText, TrendingUp,
} from 'lucide-react';
import {
  getRequisitions, getRequisitionStats, createRequisition,
  approveRequisition, rejectRequisition, deleteRequisition, getRequisition,
  getPurchaseOrders, getPOStats, createPurchaseOrder,
} from '../services/procurementService';
import PRModal from '../components/procurement/PRModal';
import POModal from '../components/procurement/POModal';
import PRDetailModal from '../components/procurement/PRDetailModal';

/* ── status badge ── */
const badgeCls = {
  pending:   'badge badge-amber',
  approved:  'badge badge-green',
  rejected:  'badge badge-red',
  converted: 'badge badge-violet',
  draft:     'badge badge-slate',
  sent:      'badge badge-blue',
  partial:   'badge badge-amber',
  received:  'badge badge-green',
  cancelled: 'badge badge-red',
};
const statusLabel = {
  pending:'Pending', approved:'Approved', rejected:'Rejected',
  converted:'Converted', draft:'Draft', sent:'Sent',
  partial:'Partial', received:'Received', cancelled:'Cancelled',
};

const StatusBadge = ({ status }) => (
  <span className={badgeCls[status] || 'badge badge-slate'}>
    {statusLabel[status] || status}
  </span>
);

/* ── KPI card ── */
const KPI = ({ label, value, sub, icon: Icon, iconBg, iconColor }) => (
  <div className="stat-card">
    <div style={{ width:48, height:48, borderRadius:12, background:iconBg, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
      <Icon size={22} style={{ color:iconColor }}/>
    </div>
    <div>
      <p style={{ fontSize:28, fontWeight:800, color:'#0f172a', lineHeight:1 }}>{value ?? '—'}</p>
      <p style={{ fontSize:12, color:'#64748b', marginTop:4 }}>{label}</p>
      {sub && <p style={{ fontSize:11, color:'#94a3b8', marginTop:2 }}>{sub}</p>}
    </div>
  </div>
);

/* ── filter pill ── */
const Pill = ({ label, active, onClick }) => (
  <button onClick={onClick}
    style={{
      padding:'7px 14px', borderRadius:10, fontSize:12, fontWeight:600, cursor:'pointer', border:'1px solid',
      background: active ? '#dcfce7' : '#f8fafc',
      color:       active ? '#15803d' : '#64748b',
      borderColor: active ? '#bbf7d0' : '#e2e8f0',
    }}
    onMouseEnter={e => { if (!active) { e.currentTarget.style.background='#f1f5f9'; }}}
    onMouseLeave={e => { if (!active) { e.currentTarget.style.background='#f8fafc'; }}}>
    {label}
  </button>
);

const LIMIT = 8;

/* ════════════ PR Tab ════════════ */
const PRTab = ({ showToast }) => {
  const [rows, setRows]       = useState([]);
  const [stats, setStats]     = useState(null);
  const [total, setTotal]     = useState(0);
  const [page, setPage]       = useState(1);
  const [search, setSearch]   = useState('');
  const [filter, setFilter]   = useState('');
  const [loading, setLoading] = useState(true);

  const [prModal, setPRModal]   = useState(false);
  const [detailPR, setDetailPR] = useState(null);
  const [poFromPR, setPOFromPR] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [rRes, sRes] = await Promise.all([
        getRequisitions({ search, status: filter, page, limit: LIMIT }),
        getRequisitionStats(),
      ]);
      setRows(rRes.data.data);
      setTotal(rRes.data.total);
      setStats(sRes.data.data);
    } catch { showToast('Failed to load requisitions', 'error'); }
    finally { setLoading(false); }
  }, [search, filter, page]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => { setPage(1); }, [search, filter]);

  const handleCreate = async (form) => {
    try {
      await createRequisition(form);
      showToast('Purchase requisition submitted');
      setPRModal(false);
      load();
    } catch (err) { showToast(err.response?.data?.message || 'Failed to create', 'error'); throw err; }
  };

  const openDetail = async (pr) => {
    const res = await getRequisition(pr.id);
    setDetailPR(res.data.data);
  };

  const handleApprove = async () => {
    await approveRequisition(detailPR.id);
    showToast('Requisition approved');
    setDetailPR(null);
    load();
  };

  const handleReject = async (reason) => {
    await rejectRequisition(detailPR.id, reason);
    showToast('Requisition rejected');
    setDetailPR(null);
    load();
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this requisition?')) return;
    try {
      await deleteRequisition(id);
      showToast('Requisition deleted');
      load();
    } catch (err) { showToast(err.response?.data?.message || 'Cannot delete', 'error'); }
  };

  const totalPages = Math.ceil(total / LIMIT);

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:16 }}>

      {/* KPI row */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:16 }}>
        <KPI label="Total PRs"  value={stats?.total}     sub="All requisitions"   icon={FileText}     iconBg="#ede9fe" iconColor="#7c3aed"/>
        <KPI label="Pending"    value={stats?.pending}   sub="Awaiting approval"  icon={Clock}        iconBg="#fef9c3" iconColor="#d97706"/>
        <KPI label="Approved"   value={stats?.approved}  sub="Ready to order"     icon={CheckCircle2} iconBg="#dcfce7" iconColor="#16a34a"/>
        <KPI label="Converted"  value={stats?.converted} sub="Turned into PO"     icon={ShoppingCart} iconBg="#dbeafe" iconColor="#2563eb"/>
      </div>

      {/* Toolbar */}
      <div className="section-card" style={{ padding:'14px 16px', display:'flex', alignItems:'center', gap:10, flexWrap:'wrap' }}>
        <div style={{ position:'relative', flex:1, minWidth:200 }}>
          <Search size={13} style={{ position:'absolute', left:12, top:'50%', transform:'translateY(-50%)', color:'#94a3b8' }}/>
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search by PR number, department..."
            className="input-field" style={{ paddingLeft:36 }}
          />
          {search && (
            <button onClick={() => setSearch('')}
              style={{ position:'absolute', right:10, top:'50%', transform:'translateY(-50%)', background:'none', border:'none', cursor:'pointer', color:'#94a3b8' }}>
              <X size={13}/>
            </button>
          )}
        </div>
        <div style={{ display:'flex', gap:6 }}>
          {[['','All'],['pending','Pending'],['approved','Approved'],['rejected','Rejected']].map(([v,l]) => (
            <Pill key={v} label={l} active={filter===v} onClick={() => setFilter(v)}/>
          ))}
        </div>
        <button onClick={load}
          style={{ width:36, height:36, borderRadius:10, border:'1px solid #e2e8f0', background:'#f8fafc', display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer', color:'#64748b' }}
          onMouseEnter={e => e.currentTarget.style.background='#f1f5f9'}
          onMouseLeave={e => e.currentTarget.style.background='#f8fafc'}>
          <RefreshCw size={14} style={{ animation: loading ? 'spin 1s linear infinite' : 'none' }}/>
        </button>
        <button className="btn-primary" onClick={() => setPRModal(true)}>
          <Plus size={14}/> New PR
        </button>
      </div>

      {/* Table */}
      <div className="data-table">
        <div className="data-table-header" style={{ display:'grid', gridTemplateColumns:'1.2fr 1.5fr 1fr 0.8fr 0.8fr 0.8fr 0.4fr', gap:16, padding:'10px 20px' }}>
          {['PR Number','Requested By','Department','Items','Required Date','Status',''].map(h => (
            <span key={h} style={{ fontSize:11, fontWeight:700, textTransform:'uppercase', letterSpacing:'0.05em', color:'#94a3b8' }}>{h}</span>
          ))}
        </div>

        {loading ? (
          Array.from({length:5}).map((_,i) => (
            <div key={i} className="data-table-row" style={{ display:'grid', gridTemplateColumns:'1.2fr 1.5fr 1fr 0.8fr 0.8fr 0.8fr 0.4fr', gap:16, padding:'14px 20px', alignItems:'center' }}>
              {[80,110,80,40,80,60,20].map((w,j) => <div key={j} className="shimmer" style={{ height:14, width:w, borderRadius:6 }}/>)}
            </div>
          ))
        ) : rows.length === 0 ? (
          <div style={{ padding:'56px 20px', textAlign:'center' }}>
            <div style={{ width:52, height:52, borderRadius:14, background:'#f1f5f9', display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 12px' }}>
              <FileText size={24} style={{ color:'#94a3b8' }}/>
            </div>
            <p style={{ fontSize:13, fontWeight:500, color:'#374151' }}>No requisitions found</p>
            <p style={{ fontSize:12, color:'#94a3b8', marginTop:4, marginBottom:16 }}>
              {search ? 'Try a different search' : 'Create your first purchase requisition'}
            </p>
            {!search && (
              <button className="btn-primary" onClick={() => setPRModal(true)} style={{ margin:'0 auto' }}>
                <Plus size={14}/> New Requisition
              </button>
            )}
          </div>
        ) : rows.map((pr, idx) => (
          <div key={pr.id} className="data-table-row" style={{ display:'grid', gridTemplateColumns:'1.2fr 1.5fr 1fr 0.8fr 0.8fr 0.8fr 0.4fr', gap:16, padding:'14px 20px', alignItems:'center' }}>
            <button onClick={() => openDetail(pr)} style={{ background:'none', border:'none', cursor:'pointer', textAlign:'left', padding:0 }}>
              <p style={{ fontSize:13, fontWeight:600, color:'#16a34a' }}>{pr.pr_number}</p>
              <p style={{ fontSize:11, color:'#94a3b8', marginTop:2 }}>{new Date(pr.created_at).toLocaleDateString('en-LK')}</p>
            </button>
            <span style={{ fontSize:13, color:'#374151' }}>{pr.requested_by_name || '—'}</span>
            <span style={{ fontSize:13, color:'#64748b' }}>{pr.department || '—'}</span>
            <span style={{ fontSize:13, fontWeight:600, color:'#0f172a' }}>{pr.item_count}</span>
            <span style={{ fontSize:13, color:'#64748b' }}>{pr.required_date ? new Date(pr.required_date).toLocaleDateString('en-LK') : '—'}</span>
            <StatusBadge status={pr.status}/>
            <div style={{ display:'flex', gap:4 }}>
              <button onClick={() => openDetail(pr)} title="View"
                style={{ width:28, height:28, borderRadius:8, border:'1px solid #e2e8f0', background:'#f8fafc', display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer', color:'#64748b' }}
                onMouseEnter={e => { e.currentTarget.style.color='#16a34a'; e.currentTarget.style.borderColor='#bbf7d0'; }}
                onMouseLeave={e => { e.currentTarget.style.color='#64748b'; e.currentTarget.style.borderColor='#e2e8f0'; }}>
                <Eye size={12}/>
              </button>
              {['pending','rejected'].includes(pr.status) && (
                <button onClick={() => handleDelete(pr.id)} title="Delete"
                  style={{ width:28, height:28, borderRadius:8, border:'1px solid #e2e8f0', background:'#f8fafc', display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer', color:'#64748b' }}
                  onMouseEnter={e => { e.currentTarget.style.color='#dc2626'; e.currentTarget.style.borderColor='#fecaca'; }}
                  onMouseLeave={e => { e.currentTarget.style.color='#64748b'; e.currentTarget.style.borderColor='#e2e8f0'; }}>
                  <Trash2 size={12}/>
                </button>
              )}
            </div>
          </div>
        ))}

        {totalPages > 1 && (
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'12px 20px', borderTop:'1px solid #f1f5f9' }}>
            <p style={{ fontSize:12, color:'#64748b' }}>Showing {(page-1)*LIMIT+1}–{Math.min(page*LIMIT,total)} of {total}</p>
            <div style={{ display:'flex', gap:4 }}>
              <button onClick={() => setPage(p=>p-1)} disabled={page===1}
                style={{ width:32, height:32, borderRadius:8, border:'1px solid #e2e8f0', background:'#f8fafc', display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer', color:'#64748b', opacity:page===1?0.4:1 }}>
                <ChevronLeft size={14}/>
              </button>
              {Array.from({length:totalPages},(_,i)=>i+1).map(n => (
                <button key={n} onClick={() => setPage(n)}
                  style={{ width:32, height:32, borderRadius:8, border:'1px solid', fontSize:12, fontWeight:600, cursor:'pointer',
                    background: n===page ? '#dcfce7' : '#f8fafc',
                    color:       n===page ? '#15803d' : '#64748b',
                    borderColor: n===page ? '#bbf7d0' : '#e2e8f0' }}>
                  {n}
                </button>
              ))}
              <button onClick={() => setPage(p=>p+1)} disabled={page===totalPages}
                style={{ width:32, height:32, borderRadius:8, border:'1px solid #e2e8f0', background:'#f8fafc', display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer', color:'#64748b', opacity:page===totalPages?0.4:1 }}>
                <ChevronRight size={14}/>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Modals */}
      {prModal && <PRModal onClose={() => setPRModal(false)} onSave={handleCreate}/>}
      {detailPR && (
        <PRDetailModal
          pr={detailPR}
          onClose={() => setDetailPR(null)}
          onApprove={handleApprove}
          onReject={handleReject}
          onCreatePO={() => { setPOFromPR(detailPR); setDetailPR(null); }}
        />
      )}
      {poFromPR && (
        <POModal pr={poFromPR} onClose={() => setPOFromPR(null)}
          onSave={async (form) => {
            await createPurchaseOrder(form);
            showToast('Purchase order created');
            setPOFromPR(null);
            load();
          }}
        />
      )}
    </div>
  );
};

/* ════════════ PO Tab ════════════ */
const POTab = ({ showToast }) => {
  const [rows, setRows]       = useState([]);
  const [stats, setStats]     = useState(null);
  const [total, setTotal]     = useState(0);
  const [page, setPage]       = useState(1);
  const [search, setSearch]   = useState('');
  const [filter, setFilter]   = useState('');
  const [loading, setLoading] = useState(true);
  const [poModal, setPOModal] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [rRes, sRes] = await Promise.all([
        getPurchaseOrders({ search, status: filter, page, limit: LIMIT }),
        getPOStats(),
      ]);
      setRows(rRes.data.data);
      setTotal(rRes.data.total);
      setStats(sRes.data.data);
    } catch { showToast('Failed to load purchase orders', 'error'); }
    finally { setLoading(false); }
  }, [search, filter, page]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => { setPage(1); }, [search, filter]);

  const totalPages = Math.ceil(total / LIMIT);

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:16 }}>

      {/* KPI row */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:16 }}>
        <KPI label="Total Orders" value={stats?.total}    sub="All purchase orders" icon={ShoppingCart} iconBg="#dbeafe" iconColor="#2563eb"/>
        <KPI label="Sent"         value={stats?.sent}     sub="Awaiting delivery"   icon={ArrowRight}   iconBg="#ede9fe" iconColor="#7c3aed"/>
        <KPI label="Received"     value={stats?.received} sub="Goods received"      icon={CheckCircle2} iconBg="#dcfce7" iconColor="#16a34a"/>
        <KPI
          label="Total Value"
          value={stats?.total_value ? `LKR ${parseFloat(stats.total_value).toLocaleString('en-LK',{maximumFractionDigits:0})}` : 'LKR 0'}
          sub="Procurement spend"
          icon={TrendingUp}
          iconBg="#fef9c3" iconColor="#d97706"
        />
      </div>

      {/* Toolbar */}
      <div className="section-card" style={{ padding:'14px 16px', display:'flex', alignItems:'center', gap:10, flexWrap:'wrap' }}>
        <div style={{ position:'relative', flex:1, minWidth:200 }}>
          <Search size={13} style={{ position:'absolute', left:12, top:'50%', transform:'translateY(-50%)', color:'#94a3b8' }}/>
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search by PO number or supplier..."
            className="input-field" style={{ paddingLeft:36 }}
          />
          {search && (
            <button onClick={() => setSearch('')}
              style={{ position:'absolute', right:10, top:'50%', transform:'translateY(-50%)', background:'none', border:'none', cursor:'pointer', color:'#94a3b8' }}>
              <X size={13}/>
            </button>
          )}
        </div>
        <div style={{ display:'flex', gap:6 }}>
          {[['','All'],['sent','Sent'],['received','Received'],['cancelled','Cancelled']].map(([v,l]) => (
            <Pill key={v} label={l} active={filter===v} onClick={() => setFilter(v)}/>
          ))}
        </div>
        <button onClick={load}
          style={{ width:36, height:36, borderRadius:10, border:'1px solid #e2e8f0', background:'#f8fafc', display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer', color:'#64748b' }}
          onMouseEnter={e => e.currentTarget.style.background='#f1f5f9'}
          onMouseLeave={e => e.currentTarget.style.background='#f8fafc'}>
          <RefreshCw size={14} style={{ animation: loading ? 'spin 1s linear infinite' : 'none' }}/>
        </button>
        <button className="btn-primary" onClick={() => setPOModal(true)}>
          <Plus size={14}/> New PO
        </button>
      </div>

      {/* Table */}
      <div className="data-table">
        <div className="data-table-header" style={{ display:'grid', gridTemplateColumns:'1.2fr 2fr 1.2fr 0.8fr 1.2fr 0.8fr', gap:16, padding:'10px 20px' }}>
          {['PO Number','Supplier','From PR','Items','Total','Status'].map(h => (
            <span key={h} style={{ fontSize:11, fontWeight:700, textTransform:'uppercase', letterSpacing:'0.05em', color:'#94a3b8' }}>{h}</span>
          ))}
        </div>

        {loading ? (
          Array.from({length:5}).map((_,i) => (
            <div key={i} className="data-table-row" style={{ display:'grid', gridTemplateColumns:'1.2fr 2fr 1.2fr 0.8fr 1.2fr 0.8fr', gap:16, padding:'14px 20px', alignItems:'center' }}>
              {[80,130,80,40,90,60].map((w,j) => <div key={j} className="shimmer" style={{ height:14, width:w, borderRadius:6 }}/>)}
            </div>
          ))
        ) : rows.length === 0 ? (
          <div style={{ padding:'56px 20px', textAlign:'center' }}>
            <div style={{ width:52, height:52, borderRadius:14, background:'#f1f5f9', display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 12px' }}>
              <ShoppingCart size={24} style={{ color:'#94a3b8' }}/>
            </div>
            <p style={{ fontSize:13, fontWeight:500, color:'#374151' }}>No purchase orders yet</p>
            <p style={{ fontSize:12, color:'#94a3b8', marginTop:4, marginBottom:16 }}>Approve a requisition first, or create a direct PO</p>
            <button className="btn-primary" onClick={() => setPOModal(true)} style={{ margin:'0 auto' }}>
              <Plus size={14}/> New Purchase Order
            </button>
          </div>
        ) : rows.map((po) => (
          <div key={po.id} className="data-table-row" style={{ display:'grid', gridTemplateColumns:'1.2fr 2fr 1.2fr 0.8fr 1.2fr 0.8fr', gap:16, padding:'14px 20px', alignItems:'center' }}>
            <div>
              <p style={{ fontSize:13, fontWeight:600, color:'#16a34a' }}>{po.po_number}</p>
              <p style={{ fontSize:11, color:'#94a3b8', marginTop:2 }}>{new Date(po.created_at).toLocaleDateString('en-LK')}</p>
            </div>
            <div>
              <p style={{ fontSize:13, fontWeight:500, color:'#0f172a' }}>{po.supplier_name}</p>
              {po.supplier_contact && <p style={{ fontSize:11, color:'#64748b', marginTop:2 }}>{po.supplier_contact}</p>}
            </div>
            <span style={{ fontSize:13, color:'#64748b' }}>{po.pr_number || <span style={{ color:'#94a3b8', fontStyle:'italic' }}>Direct</span>}</span>
            <span style={{ fontSize:13, fontWeight:600, color:'#0f172a' }}>{po.item_count}</span>
            <span style={{ fontSize:13, fontWeight:700, color:'#0f172a' }}>
              LKR {parseFloat(po.total_amount).toLocaleString('en-LK', { minimumFractionDigits:2 })}
            </span>
            <StatusBadge status={po.status}/>
          </div>
        ))}

        {totalPages > 1 && (
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'12px 20px', borderTop:'1px solid #f1f5f9' }}>
            <p style={{ fontSize:12, color:'#64748b' }}>Showing {(page-1)*LIMIT+1}–{Math.min(page*LIMIT,total)} of {total}</p>
            <div style={{ display:'flex', gap:4 }}>
              <button onClick={() => setPage(p=>p-1)} disabled={page===1}
                style={{ width:32, height:32, borderRadius:8, border:'1px solid #e2e8f0', background:'#f8fafc', display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer', color:'#64748b', opacity:page===1?0.4:1 }}>
                <ChevronLeft size={14}/>
              </button>
              {Array.from({length:totalPages},(_,i)=>i+1).map(n => (
                <button key={n} onClick={() => setPage(n)}
                  style={{ width:32, height:32, borderRadius:8, border:'1px solid', fontSize:12, fontWeight:600, cursor:'pointer',
                    background: n===page ? '#dcfce7' : '#f8fafc',
                    color:       n===page ? '#15803d' : '#64748b',
                    borderColor: n===page ? '#bbf7d0' : '#e2e8f0' }}>
                  {n}
                </button>
              ))}
              <button onClick={() => setPage(p=>p+1)} disabled={page===totalPages}
                style={{ width:32, height:32, borderRadius:8, border:'1px solid #e2e8f0', background:'#f8fafc', display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer', color:'#64748b', opacity:page===totalPages?0.4:1 }}>
                <ChevronRight size={14}/>
              </button>
            </div>
          </div>
        )}
      </div>

      {poModal && (
        <POModal onClose={() => setPOModal(false)}
          onSave={async (form) => {
            await createPurchaseOrder(form);
            showToast('Purchase order created');
            setPOModal(false);
            load();
          }}
        />
      )}
    </div>
  );
};

/* ════════════ Main Page ════════════ */
const Procurement = () => {
  const [tab, setTab]     = useState('pr');
  const [toast, setToast] = useState(null);

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  const pipeline = [
    { icon: FileText,     label: 'Requisition',   sub: 'Request raised',   bg:'#f5f3ff', border:'#ddd6fe', c:'#7c3aed' },
    { icon: CheckCircle2, label: 'Approval',       sub: 'Manager approves', bg:'#fefce8', border:'#fde68a', c:'#d97706' },
    { icon: ShoppingCart, label: 'Purchase Order', sub: 'Sent to supplier', bg:'#eff6ff', border:'#bfdbfe', c:'#1d4ed8' },
    { icon: Package,      label: 'GRN',            sub: 'Goods received',   bg:'#f0fdf4', border:'#bbf7d0', c:'#15803d' },
  ];

  return (
    <div className="page" style={{ display:'flex', flexDirection:'column', gap:24 }}>

      {/* Toast */}
      {toast && (
        <div className="fade-up" style={{
          position:'fixed', top:20, right:20, zIndex:50,
          display:'flex', alignItems:'center', gap:10,
          padding:'12px 16px', borderRadius:12, fontSize:13, fontWeight:500,
          background: toast.type==='error' ? '#fee2e2' : '#dcfce7',
          border: `1px solid ${toast.type==='error' ? '#fecaca' : '#bbf7d0'}`,
          color: toast.type==='error' ? '#dc2626' : '#15803d',
          boxShadow:'0 4px 20px rgba(0,0,0,.1)',
        }}>
          {toast.type==='error' ? <X size={13}/> : <CheckCircle2 size={13}/>} {toast.msg}
        </div>
      )}

      {/* Page header */}
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
        <div>
          <h1 style={{ fontSize:22, fontWeight:800, color:'#0f172a' }}>Procurement</h1>
          <p style={{ fontSize:13, color:'#64748b', marginTop:2 }}>Manage purchase requisitions and orders</p>
        </div>
      </div>

      {/* Pipeline banner */}
      <div className="section-card">
        <div className="section-header">
          <div style={{ display:'flex', alignItems:'center', gap:8 }}>
            <div style={{ width:32, height:32, borderRadius:8, background:'#dcfce7', display:'flex', alignItems:'center', justifyContent:'center' }}>
              <ShoppingCart size={14} style={{ color:'#16a34a' }}/>
            </div>
            <div>
              <p style={{ fontSize:14, fontWeight:600, color:'#0f172a' }}>Procurement Flow</p>
              <p style={{ fontSize:11, color:'#94a3b8' }}>Step-by-step purchase process</p>
            </div>
          </div>
        </div>
        <div style={{ padding:'20px', display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:12 }}>
          {pipeline.map(({ icon: Icon, label, sub, bg, border, c }, i) => (
            <div key={label} style={{ display:'flex', alignItems:'center', gap:8 }}>
              <div style={{ background:bg, border:`1px solid ${border}`, borderRadius:12, padding:'16px', flex:1, display:'flex', alignItems:'center', gap:12 }}>
                <div style={{ width:36, height:36, borderRadius:10, background:'#fff', border:`1px solid ${border}`, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                  <Icon size={16} style={{ color:c }}/>
                </div>
                <div>
                  <p style={{ fontSize:12, fontWeight:700, color:c }}>{label}</p>
                  <p style={{ fontSize:11, color:'#94a3b8', marginTop:2 }}>{sub}</p>
                </div>
              </div>
              {i < pipeline.length - 1 && (
                <ArrowRight size={14} style={{ color:'#cbd5e1', flexShrink:0 }}/>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display:'flex', gap:4, padding:4, background:'#fff', border:'1px solid #f1f5f9', borderRadius:14, width:'fit-content', boxShadow:'0 1px 3px rgba(0,0,0,.04)' }}>
        {[['pr','Purchase Requisitions'],['po','Purchase Orders']].map(([id,label]) => (
          <button key={id} onClick={() => setTab(id)}
            style={{
              padding:'9px 20px', borderRadius:10, fontSize:13, fontWeight:600, cursor:'pointer', border:'1px solid',
              background:   tab===id ? '#dcfce7' : 'transparent',
              color:        tab===id ? '#15803d' : '#64748b',
              borderColor:  tab===id ? '#bbf7d0' : 'transparent',
            }}>
            {label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {tab === 'pr' ? <PRTab showToast={showToast}/> : <POTab showToast={showToast}/>}
    </div>
  );
};

export default Procurement;
