import { useState, useEffect, useCallback } from 'react';
import { Plus, Search, X, RefreshCw, UserCog, Pencil, Trash2, ChevronLeft, ChevronRight, CheckCircle2, Shield, KeyRound } from 'lucide-react';
import { getUserStats, getUsers, createUser, updateUser, resetPassword, deleteUser } from '../services/usersService';
import UserModal from '../components/users/UserModal';

const LIMIT = 12;

const ROLE_META = {
  admin:               { label:'Administrator',       cls:'badge badge-red'    },
  procurement_manager: { label:'Procurement Mgr',     cls:'badge badge-blue'   },
  store_keeper:        { label:'Store Keeper',         cls:'badge badge-violet' },
  finance_officer:     { label:'Finance Officer',      cls:'badge badge-amber'  },
  employee:            { label:'Employee',             cls:'badge badge-slate'  },
};

const Avatar = ({ name }) => (
  <div style={{ width:34, height:34, borderRadius:'50%', background:'#0f172a', display:'flex', alignItems:'center', justifyContent:'center', color:'#fff', fontSize:13, fontWeight:700, flexShrink:0 }}>
    {name?.charAt(0).toUpperCase()}
  </div>
);

const Users = () => {
  const [rows, setRows]     = useState([]);
  const [stats, setStats]   = useState(null);
  const [total, setTotal]   = useState(0);
  const [page, setPage]     = useState(1);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [toast, setToast]   = useState(null);
  const [modal, setModal]   = useState(false);
  const [editUser, setEditUser] = useState(null);
  const [resetTarget, setResetTarget] = useState(null);
  const [resetPw, setResetPw] = useState('');
  const [delTarget, setDelTarget] = useState(null);

  const showToast = (msg, type='success') => { setToast({ msg, type }); setTimeout(() => setToast(null), 3500); };

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [r, s] = await Promise.all([
        getUsers({ search, role:roleFilter, page, limit:LIMIT }),
        getUserStats(),
      ]);
      setRows(r.data.data);
      setTotal(r.data.total);
      setStats(s.data.data);
    } catch { showToast('Failed to load users', 'error'); }
    finally { setLoading(false); }
  }, [search, roleFilter, page]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => { setPage(1); }, [search, roleFilter]);

  const handleSave = async (form) => {
    try {
      if (editUser?.id) await updateUser(editUser.id, form);
      else              await createUser(form);
      showToast(editUser?.id ? 'User updated' : 'User created');
      setModal(false);
      setEditUser(null);
      load();
    } catch (err) { showToast(err.response?.data?.message || 'Failed to save', 'error'); throw err; }
  };

  const handleResetPw = async () => {
    if (!resetPw || resetPw.length < 6) { showToast('Password must be at least 6 characters', 'error'); return; }
    try {
      await resetPassword(resetTarget.id, { password: resetPw });
      showToast('Password reset successfully');
      setResetTarget(null);
      setResetPw('');
    } catch (err) { showToast(err.response?.data?.message || 'Failed to reset', 'error'); }
  };

  const handleDelete = async () => {
    try {
      await deleteUser(delTarget.id);
      showToast('User deleted');
      setDelTarget(null);
      load();
    } catch (err) { showToast(err.response?.data?.message || 'Cannot delete', 'error'); }
  };

  const totalPages = Math.ceil(total / LIMIT);

  const kpis = [
    { label:'Total Users',  value:stats?.total,      bg:'#eff6ff', ic:'#2563eb' },
    { label:'Active',       value:stats?.active,     bg:'#dcfce7', ic:'#16a34a' },
    { label:'Inactive',     value:stats?.inactive,   bg:'#f1f5f9', ic:'#64748b' },
    { label:'Admins',       value:stats?.admins,     bg:'#fee2e2', ic:'#dc2626' },
  ];

  return (
    <div className="page" style={{ display:'flex', flexDirection:'column', gap:24 }}>

      {/* Toast */}
      {toast && (
        <div className="fade-up" style={{ position:'fixed', top:20, right:20, zIndex:9999, padding:'12px 16px', borderRadius:12, fontSize:13, fontWeight:500, boxShadow:'0 8px 24px rgba(0,0,0,.12)', display:'flex', alignItems:'center', gap:8, background:toast.type==='error'?'#fef2f2':'#f0fdf4', color:toast.type==='error'?'#dc2626':'#15803d', border:`1px solid ${toast.type==='error'?'#fecaca':'#bbf7d0'}` }}>
          {toast.type==='error' ? <X size={13}/> : <CheckCircle2 size={13}/>} {toast.msg}
        </div>
      )}

      {/* Header */}
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
        <div>
          <h1 style={{ fontSize:22, fontWeight:800, color:'#0f172a' }}>User Management</h1>
          <p style={{ fontSize:13, color:'#64748b', marginTop:3 }}>Manage system users and their access roles</p>
        </div>
        <button className="btn-primary" onClick={() => { setEditUser(null); setModal(true); }}>
          <Plus size={15}/> Create User
        </button>
      </div>

      {/* KPI cards */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:16 }}>
        {kpis.map(({ label, value, bg, ic }) => (
          <div key={label} className="stat-card" style={{ background:'#fff' }}>
            <div style={{ width:46, height:46, borderRadius:12, background:bg, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
              <UserCog size={20} style={{ color:ic }}/>
            </div>
            <div>
              <p style={{ fontSize:26, fontWeight:800, color:'#0f172a', lineHeight:1 }}>{value ?? '—'}</p>
              <p style={{ fontSize:12, color:'#64748b', marginTop:4 }}>{label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Role breakdown */}
      <div className="section-card">
        <div className="section-header">
          <div style={{ display:'flex', alignItems:'center', gap:8 }}>
            <div style={{ width:32, height:32, borderRadius:8, background:'#f1f5f9', display:'flex', alignItems:'center', justifyContent:'center' }}>
              <Shield size={14} style={{ color:'#0f172a' }}/>
            </div>
            <p style={{ fontSize:14, fontWeight:600, color:'#0f172a' }}>Users by Role</p>
          </div>
        </div>
        <div style={{ padding:'16px 20px', display:'grid', gridTemplateColumns:'repeat(5,1fr)', gap:10 }}>
          {[
            ['admin',               'Administrator',    stats?.admins,      '#fee2e2','#dc2626'],
            ['procurement_manager', 'Procurement Mgr',  stats?.procurement, '#dbeafe','#2563eb'],
            ['store_keeper',        'Store Keeper',      stats?.store,       '#ede9fe','#7c3aed'],
            ['finance_officer',     'Finance Officer',   stats?.finance,     '#fef9c3','#d97706'],
            ['employee',            'Employee',          stats?.employees,   '#f1f5f9','#64748b'],
          ].map(([role, label, count, bg, c]) => (
            <button key={role} onClick={() => setRoleFilter(roleFilter === role ? '' : role)}
              style={{ padding:'14px', borderRadius:12, border:`1px solid ${roleFilter===role ? c+'60' : '#e2e8f0'}`, background:roleFilter===role ? bg : '#f8fafc', cursor:'pointer', textAlign:'center', transition:'all .15s' }}>
              <p style={{ fontSize:22, fontWeight:800, color:c }}>{count ?? '—'}</p>
              <p style={{ fontSize:11, color:'#64748b', marginTop:4, fontWeight:500 }}>{label}</p>
            </button>
          ))}
        </div>
      </div>

      {/* Search toolbar */}
      <div style={{ display:'flex', gap:10, alignItems:'center', background:'#fff', padding:'14px 16px', borderRadius:14, border:'1px solid #f1f5f9', boxShadow:'0 1px 3px rgba(0,0,0,.04)' }}>
        <div style={{ position:'relative', flex:1 }}>
          <Search size={14} style={{ position:'absolute', left:11, top:'50%', transform:'translateY(-50%)', color:'#94a3b8' }}/>
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by name or email…"
            className="input-field" style={{ paddingLeft:34 }}/>
          {search && <button onClick={() => setSearch('')} style={{ position:'absolute', right:10, top:'50%', transform:'translateY(-50%)', background:'none', border:'none', cursor:'pointer', color:'#94a3b8', display:'flex' }}><X size={14}/></button>}
        </div>
        {roleFilter && (
          <button onClick={() => setRoleFilter('')} className="btn-secondary" style={{ padding:'8px 12px', fontSize:12 }}>
            <X size={12}/> Clear filter
          </button>
        )}
        <button onClick={load} style={{ width:36, height:36, borderRadius:8, border:'1px solid #e2e8f0', background:'#f8fafc', display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer', color:'#64748b' }}
          onMouseEnter={e => e.currentTarget.style.background='#f1f5f9'} onMouseLeave={e => e.currentTarget.style.background='#f8fafc'}>
          <RefreshCw size={14}/>
        </button>
      </div>

      {/* Table */}
      <div className="data-table">
        <div className="data-table-header" style={{ display:'grid', gridTemplateColumns:'2fr 2fr 1.2fr 0.8fr 100px', gap:12, padding:'11px 20px' }}>
          {['User','Email','Role','Status','Actions'].map(h => (
            <span key={h} style={{ fontSize:11, fontWeight:700, textTransform:'uppercase', letterSpacing:'.05em', color:'#94a3b8' }}>{h}</span>
          ))}
        </div>

        {loading ? (
          Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="data-table-row" style={{ display:'grid', gridTemplateColumns:'2fr 2fr 1.2fr 0.8fr 100px', gap:12, padding:'14px 20px', alignItems:'center' }}>
              {[140, 160, 90, 60, 60].map((w, j) => <div key={j} className="shimmer" style={{ height:13, width:w, borderRadius:6 }}/>)}
            </div>
          ))
        ) : rows.length === 0 ? (
          <div style={{ padding:'60px 20px', textAlign:'center' }}>
            <div style={{ width:56, height:56, borderRadius:16, background:'#f1f5f9', display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 12px' }}>
              <UserCog size={26} style={{ color:'#94a3b8' }}/>
            </div>
            <p style={{ fontSize:14, fontWeight:600, color:'#374151' }}>No users found</p>
            <p style={{ fontSize:12, color:'#94a3b8', marginTop:4, marginBottom:16 }}>{search ? 'Try a different search' : 'Create your first user'}</p>
            {!search && <button className="btn-primary" onClick={() => { setEditUser(null); setModal(true); }} style={{ margin:'0 auto' }}><Plus size={14}/> Create User</button>}
          </div>
        ) : rows.map(u => (
          <div key={u.id} className="data-table-row" style={{ display:'grid', gridTemplateColumns:'2fr 2fr 1.2fr 0.8fr 100px', gap:12, padding:'13px 20px', alignItems:'center' }}>
            <div style={{ display:'flex', alignItems:'center', gap:10 }}>
              <Avatar name={u.name}/>
              <div>
                <p style={{ fontSize:13, fontWeight:600, color:'#0f172a' }}>{u.name}</p>
                <p style={{ fontSize:11, color:'#94a3b8', marginTop:1 }}>ID #{u.id}</p>
              </div>
            </div>
            <span style={{ fontSize:13, color:'#374151' }}>{u.email}</span>
            <span className={ROLE_META[u.role]?.cls || 'badge badge-slate'}>{ROLE_META[u.role]?.label || u.role}</span>
            <span className={u.is_active ? 'badge badge-green' : 'badge badge-slate'}>{u.is_active ? 'Active' : 'Inactive'}</span>
            <div style={{ display:'flex', gap:4 }}>
              <button title="Edit" onClick={() => { setEditUser(u); setModal(true); }}
                style={{ width:30, height:30, borderRadius:8, border:'1px solid #e2e8f0', background:'#f8fafc', display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer', color:'#64748b' }}
                onMouseEnter={e => { e.currentTarget.style.color='#16a34a'; e.currentTarget.style.borderColor='#bbf7d0'; }}
                onMouseLeave={e => { e.currentTarget.style.color='#64748b'; e.currentTarget.style.borderColor='#e2e8f0'; }}>
                <Pencil size={12}/>
              </button>
              <button title="Reset password" onClick={() => { setResetTarget(u); setResetPw(''); }}
                style={{ width:30, height:30, borderRadius:8, border:'1px solid #e2e8f0', background:'#f8fafc', display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer', color:'#64748b' }}
                onMouseEnter={e => { e.currentTarget.style.color='#d97706'; e.currentTarget.style.borderColor='#fde68a'; }}
                onMouseLeave={e => { e.currentTarget.style.color='#64748b'; e.currentTarget.style.borderColor='#e2e8f0'; }}>
                <KeyRound size={12}/>
              </button>
              <button title="Delete" onClick={() => setDelTarget(u)}
                style={{ width:30, height:30, borderRadius:8, border:'1px solid #e2e8f0', background:'#f8fafc', display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer', color:'#64748b' }}
                onMouseEnter={e => { e.currentTarget.style.color='#dc2626'; e.currentTarget.style.borderColor='#fecaca'; }}
                onMouseLeave={e => { e.currentTarget.style.color='#64748b'; e.currentTarget.style.borderColor='#e2e8f0'; }}>
                <Trash2 size={12}/>
              </button>
            </div>
          </div>
        ))}

        {totalPages > 1 && (
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'12px 20px', borderTop:'1px solid #f1f5f9' }}>
            <p style={{ fontSize:12, color:'#64748b' }}>Showing {(page-1)*LIMIT+1}–{Math.min(page*LIMIT,total)} of {total}</p>
            <div style={{ display:'flex', gap:4 }}>
              <button onClick={() => setPage(p => p-1)} disabled={page===1}
                style={{ width:32, height:32, borderRadius:8, border:'1px solid #e2e8f0', background:'#f8fafc', display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer', color:'#64748b', opacity:page===1?0.4:1 }}>
                <ChevronLeft size={14}/>
              </button>
              {Array.from({ length:totalPages }, (_, i) => i+1).map(n => (
                <button key={n} onClick={() => setPage(n)}
                  style={{ width:32, height:32, borderRadius:8, border:'1px solid', fontSize:12, fontWeight:600, cursor:'pointer', background:n===page?'#dcfce7':'#f8fafc', color:n===page?'#15803d':'#64748b', borderColor:n===page?'#bbf7d0':'#e2e8f0' }}>
                  {n}
                </button>
              ))}
              <button onClick={() => setPage(p => p+1)} disabled={page===totalPages}
                style={{ width:32, height:32, borderRadius:8, border:'1px solid #e2e8f0', background:'#f8fafc', display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer', color:'#64748b', opacity:page===totalPages?0.4:1 }}>
                <ChevronRight size={14}/>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Create / Edit Modal */}
      {modal && <UserModal user={editUser} onClose={() => { setModal(false); setEditUser(null); }} onSave={handleSave}/>}

      {/* Reset Password Modal */}
      {resetTarget && (
        <div style={{ position:'fixed', inset:0, zIndex:50, display:'flex', alignItems:'center', justifyContent:'center', padding:16 }} onClick={() => setResetTarget(null)}>
          <div style={{ position:'absolute', inset:0, background:'rgba(15,23,42,.55)', backdropFilter:'blur(6px)' }}/>
          <div className="fade-up" style={{ position:'relative', width:'100%', maxWidth:400, background:'#fff', borderRadius:20, border:'1px solid #e2e8f0', boxShadow:'0 20px 60px rgba(0,0,0,.15)', overflow:'hidden' }} onClick={e => e.stopPropagation()}>
            <div style={{ height:4, background:'linear-gradient(90deg,#d97706,#f59e0b)' }}/>
            <div style={{ padding:'24px' }}>
              <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:20 }}>
                <div style={{ width:38, height:38, borderRadius:10, background:'#fef9c3', display:'flex', alignItems:'center', justifyContent:'center' }}>
                  <KeyRound size={18} style={{ color:'#d97706' }}/>
                </div>
                <div>
                  <h2 style={{ fontSize:15, fontWeight:700, color:'#0f172a' }}>Reset Password</h2>
                  <p style={{ fontSize:12, color:'#64748b', marginTop:2 }}>{resetTarget.name}</p>
                </div>
              </div>
              <label style={{ display:'block', fontSize:11, fontWeight:700, textTransform:'uppercase', letterSpacing:'0.06em', color:'#94a3b8', marginBottom:6 }}>New Password</label>
              <input type="password" value={resetPw} onChange={e => setResetPw(e.target.value)} placeholder="Min. 6 characters"
                style={{ width:'100%', padding:'10px 12px', borderRadius:10, border:'1px solid #e2e8f0', fontSize:13, color:'#0f172a', background:'#f8fafc', outline:'none', boxSizing:'border-box', marginBottom:16 }}
                onFocus={e => { e.target.style.borderColor='#d97706'; e.target.style.boxShadow='0 0 0 3px rgba(217,119,6,.1)'; }}
                onBlur={e => { e.target.style.borderColor='#e2e8f0'; e.target.style.boxShadow='none'; }}
              />
              <div style={{ display:'flex', gap:10 }}>
                <button onClick={() => setResetTarget(null)} className="btn-secondary" style={{ flex:1 }}>Cancel</button>
                <button onClick={handleResetPw}
                  style={{ flex:1, display:'flex', alignItems:'center', justifyContent:'center', gap:8, padding:'10px 18px', borderRadius:10, border:'none', fontSize:13, fontWeight:600, cursor:'pointer', color:'#fff', background:'#d97706' }}>
                  <KeyRound size={14}/> Reset Password
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirm */}
      {delTarget && (
        <div style={{ position:'fixed', inset:0, zIndex:50, display:'flex', alignItems:'center', justifyContent:'center', padding:16 }} onClick={() => setDelTarget(null)}>
          <div style={{ position:'absolute', inset:0, background:'rgba(15,23,42,.55)', backdropFilter:'blur(6px)' }}/>
          <div className="fade-up" style={{ position:'relative', width:'100%', maxWidth:400, background:'#fff', borderRadius:20, border:'1px solid #fecaca', boxShadow:'0 20px 60px rgba(0,0,0,.15)', overflow:'hidden' }} onClick={e => e.stopPropagation()}>
            <div style={{ height:4, background:'linear-gradient(90deg,#dc2626,#f87171)' }}/>
            <div style={{ padding:'24px', textAlign:'center' }}>
              <div style={{ width:52, height:52, borderRadius:14, background:'#fee2e2', border:'2px solid #fecaca', display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 14px' }}>
                <Trash2 size={22} style={{ color:'#dc2626' }}/>
              </div>
              <h2 style={{ fontSize:16, fontWeight:700, color:'#0f172a', marginBottom:8 }}>Delete User?</h2>
              <p style={{ fontSize:13, color:'#64748b', lineHeight:1.6, marginBottom:20 }}>
                You're about to delete <strong style={{ color:'#0f172a' }}>{delTarget.name}</strong>. This cannot be undone.
              </p>
              <div style={{ display:'flex', gap:10 }}>
                <button onClick={() => setDelTarget(null)} className="btn-secondary" style={{ flex:1 }}>Cancel</button>
                <button onClick={handleDelete} className="btn-danger" style={{ flex:1, justifyContent:'center' }}>
                  <Trash2 size={14}/> Delete
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Users;
