import { useState, useEffect, useCallback } from 'react';
import { Plus, Search, X, RefreshCw, Package, AlertTriangle, Pencil, Trash2, ChevronLeft, ChevronRight, Tag, ArrowUpCircle, BarChart2, CheckCircle2, Layers } from 'lucide-react';
import { getInventoryStats, getLowStockItems, getCategories, createCategory, updateCategory, deleteCategory, getItems, createItem, updateItem, deleteItem, adjustStock } from '../services/inventoryService';
import ItemModal     from '../components/inventory/ItemModal';
import AdjustModal   from '../components/inventory/AdjustModal';
import CategoryModal from '../components/inventory/CategoryModal';

const STOCK_BADGE = (current, reorder) => {
  const c = parseFloat(current), r = parseFloat(reorder);
  if (c === 0)        return { label:'Out of Stock', cls:'badge-red'   };
  if (r > 0 && c <= r)return { label:'Low Stock',    cls:'badge-amber' };
  return                     { label:'In Stock',     cls:'badge-green' };
};

const LIMIT = 10;

const ItemsTab = ({ showToast, categories }) => {
  const [rows, setRows]         = useState([]);
  const [total, setTotal]       = useState(0);
  const [page, setPage]         = useState(1);
  const [search, setSearch]     = useState('');
  const [catFilter, setCat]     = useState('');
  const [stockFilter, setStock] = useState('');
  const [loading, setLoading]   = useState(true);
  const [itemModal, setItemModal]   = useState(false);
  const [editItem, setEditItem]     = useState(null);
  const [adjustItem, setAdjustItem] = useState(null);

  const fetch = useCallback(async () => {
    setLoading(true);
    try { const r = await getItems({ search, category:catFilter, stock:stockFilter, page, limit:LIMIT }); setRows(r.data.data); setTotal(r.data.total); }
    catch { showToast('Failed to load items','error'); }
    finally { setLoading(false); }
  }, [search, catFilter, stockFilter, page]);

  useEffect(() => { fetch(); }, [fetch]);
  useEffect(() => { setPage(1); }, [search, catFilter, stockFilter]);

  const handleSave = async (form) => {
    try {
      if (editItem?.id) { await updateItem(editItem.id, form); showToast('Item updated'); }
      else              { await createItem(form);               showToast('Item added');   }
      setItemModal(false); setEditItem(null); fetch();
    } catch (err) { showToast(err.response?.data?.message||'Error','error'); throw err; }
  };
  const handleAdjust = async (form) => {
    try { await adjustStock(adjustItem.id, form); showToast('Stock adjusted'); setAdjustItem(null); fetch(); }
    catch (err) { showToast(err.response?.data?.message||'Error','error'); throw err; }
  };
  const handleDelete = async (item) => {
    if (!confirm(`Delete "${item.name}"?`)) return;
    try { await deleteItem(item.id); showToast('Item deleted'); fetch(); }
    catch (err) { showToast(err.response?.data?.message||'Cannot delete','error'); }
  };

  const totalPages = Math.ceil(total / LIMIT);

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:16 }}>
      {/* Toolbar */}
      <div style={{ display:'flex', gap:10, alignItems:'center', background:'#fff', padding:'14px 16px', borderRadius:14, border:'1px solid #f1f5f9', boxShadow:'0 1px 3px rgba(0,0,0,.04)' }}>
        <div style={{ position:'relative', flex:1 }}>
          <Search size={14} style={{ position:'absolute', left:11, top:'50%', transform:'translateY(-50%)', color:'#94a3b8' }}/>
          <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search by name or code…" className="input-field" style={{ paddingLeft:34 }}/>
        </div>
        <select value={catFilter} onChange={e=>setCat(e.target.value)} className="input-field" style={{ width:'auto', minWidth:140 }}>
          <option value="">All Categories</option>
          {categories.map(c=><option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
        <div style={{ display:'flex', gap:6 }}>
          {[['','All'],['good','In Stock'],['low','Low'],['out','Out']].map(([v,l])=>(
            <button key={v} onClick={()=>setStock(v)}
              style={{ padding:'8px 12px', borderRadius:8, fontSize:12, fontWeight:500, cursor:'pointer', background:stockFilter===v?'#16a34a':'#f8fafc', color:stockFilter===v?'#fff':'#475569', border:stockFilter===v?'1px solid #16a34a':'1px solid #e2e8f0' }}>
              {l}
            </button>
          ))}
        </div>
        <button onClick={fetch} style={{ width:36, height:36, borderRadius:8, border:'1px solid #e2e8f0', background:'#f8fafc', display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer', color:'#64748b' }}>
          <RefreshCw size={14} className={loading?'animate-spin':''}/>
        </button>
        <button className="btn-primary" onClick={()=>{ setEditItem(null); setItemModal(true); }}><Plus size={14}/> Add Item</button>
      </div>

      <div className="data-table">
        <div className="data-table-header" style={{ display:'grid', gridTemplateColumns:'0.5fr 2fr 1.2fr 0.8fr 1fr 0.8fr 0.8fr 80px', gap:12, padding:'11px 20px' }}>
          {['Code','Item','Category','Unit','Stock','Reorder','Status',''].map(h=>(
            <span key={h} style={{ fontSize:11, fontWeight:700, color:'#94a3b8', textTransform:'uppercase', letterSpacing:'.05em' }}>{h}</span>
          ))}
        </div>
        {loading && Array.from({length:5}).map((_,i)=>(
          <div key={i} className="data-table-row" style={{ display:'grid', gridTemplateColumns:'0.5fr 2fr 1.2fr 0.8fr 1fr 0.8fr 0.8fr 80px', gap:12, padding:'14px 20px', alignItems:'center' }}>
            {[50,130,90,50,60,60,60,40].map((w,j)=><div key={j} className="shimmer" style={{height:13,width:w,borderRadius:6}}/>)}
          </div>
        ))}
        {!loading && rows.length === 0 && (
          <div style={{ padding:'60px 20px', textAlign:'center' }}>
            <div style={{ width:56, height:56, borderRadius:16, background:'#f1f5f9', display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 12px' }}>
              <Package size={26} style={{ color:'#94a3b8' }}/>
            </div>
            <p style={{ fontSize:14, fontWeight:600, color:'#374151' }}>No items found</p>
            <p style={{ fontSize:12, color:'#94a3b8', marginTop:4, marginBottom:16 }}>{search?'Try a different search':'Start adding inventory items'}</p>
            {!search && <button className="btn-primary" onClick={()=>{ setEditItem(null); setItemModal(true); }} style={{ margin:'0 auto' }}><Plus size={14}/> Add First Item</button>}
          </div>
        )}
        {!loading && rows.map(item => {
          const sb = STOCK_BADGE(item.current_stock, item.reorder_level);
          return (
            <div key={item.id} className="data-table-row" style={{ display:'grid', gridTemplateColumns:'0.5fr 2fr 1.2fr 0.8fr 1fr 0.8fr 0.8fr 80px', gap:12, padding:'13px 20px', alignItems:'center' }}>
              <span style={{ fontSize:11, color:'#94a3b8', fontFamily:'monospace' }}>{item.code||'—'}</span>
              <div>
                <p style={{ fontSize:13, fontWeight:600, color:'#0f172a' }}>{item.name}</p>
                {item.description && <p style={{ fontSize:11, color:'#94a3b8', marginTop:1, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', maxWidth:200 }}>{item.description}</p>}
              </div>
              <span style={{ fontSize:12, color:'#374151' }}>{item.category_name||<span style={{color:'#cbd5e1'}}>Uncategorised</span>}</span>
              <span style={{ fontSize:12, color:'#374151' }}>{item.unit}</span>
              <span style={{ fontSize:14, fontWeight:700, color:'#0f172a' }}>{parseFloat(item.current_stock).toLocaleString()}</span>
              <span style={{ fontSize:12, color:'#64748b' }}>{parseFloat(item.reorder_level).toLocaleString()}</span>
              <span className={`badge ${sb.cls}`}>{sb.label}</span>
              <div style={{ display:'flex', gap:6 }}>
                <button onClick={()=>setAdjustItem(item)} title="Adjust Stock" style={{ width:30, height:30, borderRadius:8, border:'1px solid #e2e8f0', background:'#fff', display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer', color:'#64748b' }}
                  onMouseEnter={e=>{ e.currentTarget.style.borderColor='#16a34a'; e.currentTarget.style.color='#16a34a'; }}
                  onMouseLeave={e=>{ e.currentTarget.style.borderColor='#e2e8f0'; e.currentTarget.style.color='#64748b'; }}>
                  <ArrowUpCircle size={12}/>
                </button>
                <button onClick={()=>{ setEditItem(item); setItemModal(true); }} title="Edit" style={{ width:30, height:30, borderRadius:8, border:'1px solid #e2e8f0', background:'#fff', display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer', color:'#64748b' }}
                  onMouseEnter={e=>{ e.currentTarget.style.borderColor='#3b82f6'; e.currentTarget.style.color='#3b82f6'; }}
                  onMouseLeave={e=>{ e.currentTarget.style.borderColor='#e2e8f0'; e.currentTarget.style.color='#64748b'; }}>
                  <Pencil size={12}/>
                </button>
                <button onClick={()=>handleDelete(item)} title="Delete" style={{ width:30, height:30, borderRadius:8, border:'1px solid #e2e8f0', background:'#fff', display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer', color:'#64748b' }}
                  onMouseEnter={e=>{ e.currentTarget.style.borderColor='#dc2626'; e.currentTarget.style.color='#dc2626'; }}
                  onMouseLeave={e=>{ e.currentTarget.style.borderColor='#e2e8f0'; e.currentTarget.style.color='#64748b'; }}>
                  <Trash2 size={12}/>
                </button>
              </div>
            </div>
          );
        })}
        {totalPages > 1 && (
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'12px 20px', borderTop:'1px solid #f1f5f9' }}>
            <p style={{ fontSize:12, color:'#94a3b8' }}>Showing {(page-1)*LIMIT+1}–{Math.min(page*LIMIT,total)} of {total}</p>
            <div style={{ display:'flex', gap:4 }}>
              <button onClick={()=>setPage(p=>p-1)} disabled={page===1} style={{ width:32, height:32, borderRadius:8, border:'1px solid #e2e8f0', background:'#fff', display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer', opacity:page===1?.4:1 }}><ChevronLeft size={14}/></button>
              {Array.from({length:totalPages},(_,i)=>i+1).map(n=>(
                <button key={n} onClick={()=>setPage(n)} style={{ width:32, height:32, borderRadius:8, border:n===page?'1px solid #16a34a':'1px solid #e2e8f0', background:n===page?'#16a34a':'#fff', color:n===page?'#fff':'#374151', fontSize:12, fontWeight:600, cursor:'pointer' }}>{n}</button>
              ))}
              <button onClick={()=>setPage(p=>p+1)} disabled={page===totalPages} style={{ width:32, height:32, borderRadius:8, border:'1px solid #e2e8f0', background:'#fff', display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer', opacity:page===totalPages?.4:1 }}><ChevronRight size={14}/></button>
            </div>
          </div>
        )}
      </div>

      {itemModal  && <ItemModal item={editItem} onClose={()=>{ setItemModal(false); setEditItem(null); }} onSave={handleSave}/>}
      {adjustItem && <AdjustModal item={adjustItem} onClose={()=>setAdjustItem(null)} onSave={handleAdjust}/>}
    </div>
  );
};

const CategoriesTab = ({ categories, reload, showToast }) => {
  const [modal, setModal] = useState(false);
  const [edit, setEdit]   = useState(null);
  const handleSave = async (form) => {
    try {
      if (edit?.id) { await updateCategory(edit.id, form); showToast('Category updated'); }
      else          { await createCategory(form);           showToast('Category created'); }
      setModal(false); setEdit(null); reload();
    } catch (err) { showToast(err.response?.data?.message||'Error','error'); throw err; }
  };
  const handleDelete = async (cat) => {
    if (!confirm(`Delete "${cat.name}"?`)) return;
    try { await deleteCategory(cat.id); showToast('Deleted'); reload(); }
    catch (err) { showToast(err.response?.data?.message||'Cannot delete','error'); }
  };
  return (
    <div style={{ display:'flex', flexDirection:'column', gap:16 }}>
      <div style={{ display:'flex', justifyContent:'flex-end' }}>
        <button className="btn-primary" onClick={()=>{ setEdit(null); setModal(true); }}><Plus size={14}/> New Category</button>
      </div>
      <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:12 }}>
        {categories.length === 0 ? (
          <div style={{ gridColumn:'1/-1', padding:'60px 20px', textAlign:'center', background:'#fff', borderRadius:16, border:'1px solid #f1f5f9' }}>
            <div style={{ width:52, height:52, borderRadius:14, background:'#fef9c3', display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 12px' }}>
              <Tag size={24} style={{ color:'#d97706' }}/>
            </div>
            <p style={{ fontSize:13, color:'#374151', fontWeight:500 }}>No categories yet</p>
            <p style={{ fontSize:12, color:'#94a3b8', marginTop:4 }}>Create categories to organise your inventory items</p>
          </div>
        ) : categories.map(cat => (
          <div key={cat.id} className="stat-card" style={{ background:'#fff', justifyContent:'space-between' }}>
            <div style={{ display:'flex', alignItems:'center', gap:12 }}>
              <div style={{ width:40, height:40, borderRadius:10, background:'#fef9c3', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}><Tag size={18} style={{ color:'#d97706' }}/></div>
              <div>
                <p style={{ fontSize:13, fontWeight:600, color:'#0f172a' }}>{cat.name}</p>
                <p style={{ fontSize:11, color:'#94a3b8', marginTop:2 }}>{cat.item_count} items</p>
              </div>
            </div>
            <div style={{ display:'flex', gap:4 }}>
              <button onClick={()=>{ setEdit(cat); setModal(true); }} style={{ width:28, height:28, borderRadius:7, border:'1px solid #e2e8f0', background:'#fff', display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer', color:'#64748b' }}><Pencil size={12}/></button>
              <button onClick={()=>handleDelete(cat)} style={{ width:28, height:28, borderRadius:7, border:'1px solid #e2e8f0', background:'#fff', display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer', color:'#64748b' }}><Trash2 size={12}/></button>
            </div>
          </div>
        ))}
      </div>
      {modal && <CategoryModal category={edit} onClose={()=>{ setModal(false); setEdit(null); }} onSave={handleSave}/>}
    </div>
  );
};

const LowStockTab = ({ showToast }) => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    setLoading(true);
    getLowStockItems().then(r=>{ setItems(r.data.data); setLoading(false); }).catch(()=>setLoading(false));
  }, []);
  return (
    <div className="section-card">
      <div className="section-header">
        <div style={{ display:'flex', alignItems:'center', gap:8 }}>
          <AlertTriangle size={15} style={{ color:'#d97706' }}/>
          <p style={{ fontSize:14, fontWeight:600, color:'#0f172a' }}>Low Stock Alerts</p>
        </div>
        <span className="badge badge-amber">{items.length} items</span>
      </div>
      {loading ? (
        <div style={{ padding:'20px', display:'flex', flexDirection:'column', gap:8 }}>
          {Array.from({length:4}).map((_,i)=><div key={i} className="shimmer" style={{height:48, borderRadius:10}}/>)}
        </div>
      ) : items.length === 0 ? (
        <div style={{ padding:'60px 20px', textAlign:'center' }}>
          <div style={{ width:52, height:52, borderRadius:14, background:'#f0fdf4', display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 12px' }}>
            <CheckCircle2 size={24} style={{ color:'#16a34a' }}/>
          </div>
          <p style={{ fontSize:13, fontWeight:500, color:'#15803d' }}>All stock levels are healthy</p>
          <p style={{ fontSize:12, color:'#94a3b8', marginTop:4 }}>No items at or below reorder level</p>
        </div>
      ) : (
        <div style={{ padding:'12px 16px', display:'flex', flexDirection:'column', gap:6 }}>
          {items.map(item => {
            const pct = item.reorder_level > 0 ? Math.min(100, (parseFloat(item.current_stock)/parseFloat(item.reorder_level))*100) : 0;
            return (
              <div key={item.id} style={{ display:'flex', alignItems:'center', gap:14, padding:'12px 16px', background:'#fffbeb', border:'1px solid #fde68a', borderRadius:12 }}>
                <AlertTriangle size={16} style={{ color: parseFloat(item.current_stock)===0?'#dc2626':'#d97706', flexShrink:0 }}/>
                <div style={{ flex:1, minWidth:0 }}>
                  <p style={{ fontSize:13, fontWeight:600, color:'#0f172a' }}>{item.name}</p>
                  <div style={{ display:'flex', alignItems:'center', gap:10, marginTop:4 }}>
                    <div style={{ flex:1, height:5, background:'#fde68a', borderRadius:99, overflow:'hidden' }}>
                      <div style={{ height:'100%', width:`${pct}%`, background: pct===0?'#dc2626':'#f59e0b', borderRadius:99 }}/>
                    </div>
                    <span style={{ fontSize:11, color:'#92400e', flexShrink:0 }}>{item.current_stock} / {item.reorder_level} {item.unit}</span>
                  </div>
                </div>
                {parseFloat(item.current_stock)===0 ? <span className="badge badge-red">Out of Stock</span> : <span className="badge badge-amber">Low Stock</span>}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

const Inventory = () => {
  const [tab, setTab]       = useState('items');
  const [stats, setStats]   = useState(null);
  const [cats, setCats]     = useState([]);
  const [toast, setToast]   = useState(null);
  const showToast = (msg, type='success') => { setToast({msg,type}); setTimeout(()=>setToast(null),3500); };
  const loadBase = useCallback(async () => {
    try { const [s,c] = await Promise.all([getInventoryStats(), getCategories()]); setStats(s.data.data); setCats(c.data.data); } catch {}
  }, []);
  useEffect(() => { loadBase(); }, [loadBase]);

  const kpis = [
    { label:'Total Items',  value:stats?.total_items,   bg:'#eff6ff', ic:'#2563eb', icon:Package      },
    { label:'Total Units',  value:stats ? parseFloat(stats.total_units).toLocaleString() : '—', bg:'#f0fdf4', ic:'#16a34a', icon:BarChart2 },
    { label:'Categories',   value:stats?.categories,    bg:'#fef9c3', ic:'#d97706', icon:Layers       },
    { label:'Low Stock',    value:stats?.low_stock,     bg:'#fef2f2', ic:'#dc2626', icon:AlertTriangle },
  ];
  const tabs = [['items','Items'],['categories','Categories'],['lowstock','Low Stock Alerts']];

  return (
    <div className="page" style={{ display:'flex', flexDirection:'column', gap:24 }}>
      {toast && (
        <div style={{ position:'fixed', top:20, right:20, zIndex:9999, padding:'12px 18px', borderRadius:12, fontSize:13, fontWeight:500, boxShadow:'0 8px 24px rgba(0,0,0,.12)', background:toast.type==='error'?'#fef2f2':'#f0fdf4', color:toast.type==='error'?'#dc2626':'#15803d', border:`1px solid ${toast.type==='error'?'#fecaca':'#bbf7d0'}` }}>
          {toast.type==='error'?<X size={13}/>:<CheckCircle2 size={13}/>} {toast.msg}
        </div>
      )}
      <div>
        <h1 style={{ fontSize:22, fontWeight:800, color:'#0f172a' }}>Inventory Management</h1>
        <p style={{ fontSize:13, color:'#64748b', marginTop:3 }}>Track stock levels, movements and alerts</p>
      </div>
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
      <div style={{ display:'flex', gap:4, background:'#fff', padding:'6px', borderRadius:12, border:'1px solid #f1f5f9', width:'fit-content', boxShadow:'0 1px 3px rgba(0,0,0,.04)' }}>
        {tabs.map(([id,label]) => (
          <button key={id} onClick={()=>setTab(id)}
            style={{ padding:'8px 18px', borderRadius:8, fontSize:13, fontWeight:500, cursor:'pointer', transition:'all .15s', background:tab===id?'#16a34a':'transparent', color:tab===id?'#fff':'#64748b', border:'none' }}>
            {label}
            {id==='lowstock' && stats?.low_stock > 0 && <span style={{ marginLeft:6, background:'#dc2626', color:'#fff', borderRadius:'50%', padding:'1px 6px', fontSize:10 }}>{stats.low_stock}</span>}
          </button>
        ))}
      </div>
      {tab==='items'      && <ItemsTab showToast={showToast} categories={cats}/>}
      {tab==='categories' && <CategoriesTab categories={cats} reload={loadBase} showToast={showToast}/>}
      {tab==='lowstock'   && <LowStockTab showToast={showToast}/>}
    </div>
  );
};

export default Inventory;
