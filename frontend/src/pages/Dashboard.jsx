import { useEffect, useState, useCallback } from 'react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import {
  ShoppingCart, Truck, Package, AlertTriangle, TrendingUp, Clock,
  CheckCircle2, ArrowRight, Plus, FileText, BarChart2, Activity,
  Users, DollarSign, CreditCard, Receipt, ClipboardList,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { getOverviewReport } from '../services/reportsService';
import { getInventoryStats } from '../services/inventoryService';
import { getFinanceStats }   from '../services/financeService';
import { getRequisitionStats } from '../services/procurementService';

/* ── shared helpers ── */
const spendData = [
  { month:'Jan',v:0 },{ month:'Feb',v:0 },{ month:'Mar',v:0 },
  { month:'Apr',v:0 },{ month:'May',v:0 },{ month:'Jun',v:0 },
];
const catData = [
  { name:'Raw Materials',   value:40, color:'#16a34a' },
  { name:'Office Supplies', value:25, color:'#3b82f6' },
  { name:'Equipment',       value:20, color:'#f59e0b' },
  { name:'Services',        value:15, color:'#8b5cf6' },
];

const KPI = ({ label, value, sub, icon: Icon, iconBg, iconColor }) => (
  <div className="stat-card">
    <div style={{ width:48, height:48, borderRadius:12, background:iconBg, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
      <Icon size={22} style={{ color:iconColor }}/>
    </div>
    <div>
      <p style={{ fontSize:28, fontWeight:800, color:'#0f172a', lineHeight:1 }}>{value}</p>
      <p style={{ fontSize:12, color:'#64748b', marginTop:4 }}>{label}</p>
      {sub && <p style={{ fontSize:11, color:'#94a3b8', marginTop:2 }}>{sub}</p>}
    </div>
  </div>
);

const ChartTip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background:'#fff', border:'1px solid #e2e8f0', borderRadius:10, padding:'8px 12px', fontSize:12, boxShadow:'0 4px 12px rgba(0,0,0,.08)' }}>
      <p style={{ color:'#64748b' }}>{label}</p>
      <p style={{ color:'#0f172a', fontWeight:700 }}>LKR {payload[0]?.value?.toLocaleString()}</p>
    </div>
  );
};

const QuickLink = ({ href, icon: Icon, label, sub, bg, c }) => (
  <a href={href} style={{ background:bg, borderRadius:16, padding:'20px', textDecoration:'none', display:'block', transition:'transform .15s, box-shadow .15s' }}
    onMouseEnter={e=>{ e.currentTarget.style.transform='translateY(-2px)'; e.currentTarget.style.boxShadow='0 8px 20px rgba(0,0,0,.08)'; }}
    onMouseLeave={e=>{ e.currentTarget.style.transform='translateY(0)'; e.currentTarget.style.boxShadow='none'; }}>
    <div style={{ width:40, height:40, borderRadius:10, background:'rgba(255,255,255,.7)', display:'flex', alignItems:'center', justifyContent:'center', marginBottom:12 }}>
      <Icon size={20} style={{ color:c }}/>
    </div>
    <p style={{ fontSize:13, fontWeight:700, color:c }}>{label}</p>
    <p style={{ fontSize:11, color:'#94a3b8', marginTop:3 }}>{sub}</p>
  </a>
);

const WelcomeBanner = ({ user, greeting }) => (
  <div style={{ background:'linear-gradient(135deg,#0f172a 0%,#1e293b 60%,#052e16 100%)', borderRadius:20, padding:'28px 32px', display:'flex', alignItems:'center', justifyContent:'space-between', position:'relative', overflow:'hidden' }}>
    <div style={{ position:'absolute', right:-40, top:-40, width:200, height:200, background:'#16a34a', borderRadius:'50%', opacity:.08 }}/>
    <div style={{ position:'absolute', right:80, bottom:-60, width:140, height:140, background:'#4ade80', borderRadius:'50%', opacity:.06 }}/>
    <div style={{ position:'relative', zIndex:1 }}>
      <p style={{ color:'#94a3b8', fontSize:13 }}>{greeting},</p>
      <h1 style={{ color:'#fff', fontSize:22, fontWeight:800, marginTop:2 }}>{user?.name}</h1>
      <p style={{ color:'#64748b', fontSize:13, marginTop:6 }}>
        {new Date().toLocaleDateString('en-US', { weekday:'long', month:'long', day:'numeric', year:'numeric' })}
      </p>
    </div>
    <div style={{ position:'relative', zIndex:1, textAlign:'right' }}>
      <span style={{ display:'inline-flex', alignItems:'center', gap:8, background:'rgba(74,222,128,.1)', border:'1px solid rgba(74,222,128,.2)', borderRadius:99, padding:'8px 16px' }}>
        <span style={{ width:7, height:7, borderRadius:'50%', background:'#4ade80', display:'block' }} className="pulse-dot"/>
        <span style={{ fontSize:12, fontWeight:600, color:'#4ade80', textTransform:'capitalize' }}>
          {user?.role?.replace(/_/g,' ')}
        </span>
      </span>
    </div>
  </div>
);

/* ══════════════════════════════════════
   ADMIN / PROCUREMENT MANAGER dashboard
══════════════════════════════════════ */
const AdminDashboard = ({ user, greeting }) => {
  const today = new Date().toISOString().split('T')[0];
  const jan1  = new Date(new Date().getFullYear(),0,1).toISOString().split('T')[0];
  const [data, setData]       = useState(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try { const r = await getOverviewReport(jan1, today); setData(r.data.data); }
    catch {} finally { setLoading(false); }
  }, []);
  useEffect(() => { load(); }, [load]);

  const d = data;
  return (
  <div style={{ display:'flex', flexDirection:'column', gap:24 }}>
    <WelcomeBanner user={user} greeting={greeting}/>

    <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:16 }}>
      <KPI label="Total Suppliers"   value={loading ? '…' : d?.suppliers?.total ?? 0}              sub={`${d?.suppliers?.active ?? 0} active`}                                    icon={Truck}         iconBg="#dbeafe" iconColor="#2563eb"/>
      <KPI label="Open Orders"       value={loading ? '…' : d?.procurement?.total_po ?? 0}          sub={`${d?.procurement?.pending_pr ?? 0} pending PRs`}                         icon={ShoppingCart}  iconBg="#dcfce7" iconColor="#16a34a"/>
      <KPI label="Pending Approvals" value={loading ? '…' : d?.procurement?.pending_pr ?? 0}        sub={d?.procurement?.pending_pr > 0 ? 'Needs attention' : 'All caught up'}     icon={Clock}         iconBg="#fef9c3" iconColor="#d97706"/>
      <KPI label="Low Stock Alerts"  value={loading ? '…' : d?.inventory?.low_stock ?? 0}           sub={d?.inventory?.low_stock > 0 ? 'Reorder needed' : 'Inventory healthy'}     icon={AlertTriangle} iconBg="#fee2e2" iconColor="#dc2626"/>
    </div>

    <div className="section-card">
      <div className="section-header">
        <div style={{ display:'flex', alignItems:'center', gap:8 }}>
          <div style={{ width:32, height:32, borderRadius:8, background:'#dcfce7', display:'flex', alignItems:'center', justifyContent:'center' }}>
            <ShoppingCart size={14} style={{ color:'#16a34a' }}/>
          </div>
          <div>
            <p style={{ fontSize:14, fontWeight:600, color:'#0f172a' }}>Procurement Pipeline</p>
            <p style={{ fontSize:11, color:'#94a3b8' }}>Current flow status</p>
          </div>
        </div>
        <a href="/procurement" style={{ fontSize:12, color:'#16a34a', fontWeight:600, display:'flex', alignItems:'center', gap:4, textDecoration:'none' }}>View all <ArrowRight size={12}/></a>
      </div>
      <div style={{ padding:'20px', display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:12 }}>
        {[
          { icon:FileText,     label:'Requisitions',    value: d?.procurement?.total_pr  ?? 0, sub:'Requests raised',   bg:'#f0fdf4', border:'#bbf7d0', c:'#15803d' },
          { icon:CheckCircle2, label:'Approvals',       value: d?.procurement?.pending_pr ?? 0, sub:'Awaiting review',   bg:'#fefce8', border:'#fde68a', c:'#d97706' },
          { icon:ShoppingCart, label:'Purchase Orders', value: d?.procurement?.total_po  ?? 0, sub:'Sent to suppliers', bg:'#eff6ff', border:'#bfdbfe', c:'#1d4ed8' },
          { icon:Package,      label:'GRN',             value: 0,                              sub:'Goods received',    bg:'#f5f3ff', border:'#ddd6fe', c:'#7c3aed' },
        ].map(({ icon:Icon, label, value, sub, bg, border, c }) => (
          <div key={label} style={{ background:bg, border:`1px solid ${border}`, borderRadius:12, padding:'16px', display:'flex', alignItems:'center', gap:12 }}>
            <div style={{ width:40, height:40, borderRadius:10, background:'rgba(255,255,255,.7)', border:`1px solid ${border}`, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
              <Icon size={18} style={{ color:c }}/>
            </div>
            <div>
              <p style={{ fontSize:22, fontWeight:800, color:'#0f172a', lineHeight:1 }}>{loading ? '…' : value}</p>
              <p style={{ fontSize:12, fontWeight:600, color:c, marginTop:2 }}>{label}</p>
              <p style={{ fontSize:11, color:'#94a3b8', marginTop:1 }}>{sub}</p>
            </div>
          </div>
        ))}
      </div>
    </div>

    <div style={{ display:'grid', gridTemplateColumns:'2fr 1fr', gap:16 }}>
      <div className="section-card">
        <div className="section-header">
          <div>
            <p style={{ fontSize:14, fontWeight:600, color:'#0f172a' }}>Monthly Spend</p>
            <p style={{ fontSize:11, color:'#94a3b8' }}>Total procurement spending (LKR)</p>
          </div>
          <span style={{ fontSize:18, fontWeight:800, color:'#0f172a' }}>LKR {d?.procurement?.po_value ? parseFloat(d.procurement.po_value).toLocaleString('en-LK',{maximumFractionDigits:0}) : 0}</span>
        </div>
        <div style={{ padding:'20px' }}>
          <ResponsiveContainer width="100%" height={180}>
            <AreaChart data={spendData} margin={{ top:0, right:0, left:-25, bottom:0 }}>
              <defs>
                <linearGradient id="g" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#16a34a" stopOpacity={0.15}/>
                  <stop offset="100%" stopColor="#16a34a" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <XAxis dataKey="month" tick={{ fill:'#94a3b8', fontSize:11 }} axisLine={false} tickLine={false}/>
              <YAxis tick={{ fill:'#94a3b8', fontSize:11 }} axisLine={false} tickLine={false}/>
              <Tooltip content={<ChartTip/>}/>
              <Area type="monotone" dataKey="v" stroke="#16a34a" strokeWidth={2} fill="url(#g)"/>
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
      <div className="section-card">
        <div className="section-header">
          <div>
            <p style={{ fontSize:14, fontWeight:600, color:'#0f172a' }}>Spend by Category</p>
            <p style={{ fontSize:11, color:'#94a3b8' }}>Expected distribution</p>
          </div>
        </div>
        <div style={{ padding:'20px' }}>
          <ResponsiveContainer width="100%" height={130}>
            <PieChart>
              <Pie data={catData} cx="50%" cy="50%" innerRadius={38} outerRadius={55} dataKey="value" paddingAngle={3} stroke="none">
                {catData.map(({ color },i)=><Cell key={i} fill={color}/>)}
              </Pie>
              <Tooltip formatter={v=>`${v}%`} contentStyle={{ background:'#fff', border:'1px solid #e2e8f0', borderRadius:10, fontSize:11 }}/>
            </PieChart>
          </ResponsiveContainer>
          <div style={{ display:'flex', flexDirection:'column', gap:6, marginTop:8 }}>
            {catData.map(({ name, value, color }) => (
              <div key={name} style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
                <div style={{ display:'flex', alignItems:'center', gap:6 }}>
                  <span style={{ width:8, height:8, borderRadius:'50%', background:color, display:'block' }}/>
                  <span style={{ fontSize:11, color:'#64748b' }}>{name}</span>
                </div>
                <span style={{ fontSize:11, fontWeight:600, color:'#374151' }}>{value}%</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>

    <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16 }}>
      <div className="section-card">
        <div className="section-header">
          <div style={{ display:'flex', alignItems:'center', gap:8 }}>
            <TrendingUp size={14} style={{ color:'#16a34a' }}/>
            <p style={{ fontSize:14, fontWeight:600, color:'#0f172a' }}>Recent Activity</p>
          </div>
        </div>
        <div style={{ padding:'48px 20px', textAlign:'center' }}>
          <div style={{ width:52, height:52, borderRadius:14, background:'#f1f5f9', display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 12px' }}>
            <Activity size={24} style={{ color:'#94a3b8' }}/>
          </div>
          <p style={{ fontSize:13, fontWeight:500, color:'#374151' }}>No activity yet</p>
          <p style={{ fontSize:12, color:'#94a3b8', marginTop:4 }}>Start by adding a supplier or creating a purchase request.</p>
        </div>
      </div>
      <div className="section-card">
        <div className="section-header">
          <div style={{ display:'flex', alignItems:'center', gap:8 }}>
            <CheckCircle2 size={14} style={{ color:'#16a34a' }}/>
            <p style={{ fontSize:14, fontWeight:600, color:'#0f172a' }}>System Status</p>
          </div>
        </div>
        <div style={{ padding:'12px 16px', display:'flex', flexDirection:'column', gap:6 }}>
          {[
            { label:'API Server',      detail:'Port 8000'      },
            { label:'PostgreSQL',      detail:'procureease db' },
            { label:'Authentication',  detail:'JWT active'     },
            { label:'All 8 modules',   detail:'Live'           },
          ].map(({ label, detail }) => (
            <div key={label} style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'9px 12px', background:'#f8fafc', borderRadius:10 }}>
              <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                <span style={{ width:7, height:7, borderRadius:'50%', background:'#22c55e', display:'block' }} className="pulse-dot"/>
                <p style={{ fontSize:12, color:'#374151', fontWeight:500 }}>{label} <span style={{ color:'#94a3b8', fontWeight:400 }}>· {detail}</span></p>
              </div>
              <span className="badge badge-green">Active</span>
            </div>
          ))}
        </div>
        <div style={{ padding:'0 16px 16px' }}>
          <div style={{ background:'#f0fdf4', border:'1px solid #bbf7d0', borderRadius:12, padding:'14px 16px' }}>
            <div style={{ display:'flex', justifyContent:'space-between', marginBottom:6 }}>
              <p style={{ fontSize:12, fontWeight:600, color:'#15803d' }}>Build Progress</p>
              <p style={{ fontSize:12, fontWeight:700, color:'#16a34a', display:'flex', alignItems:'center', gap:4 }}><CheckCircle2 size={13}/> 100%</p>
            </div>
            <div style={{ height:6, background:'#dcfce7', borderRadius:99, overflow:'hidden' }}>
              <div style={{ height:'100%', width:'100%', background:'#16a34a', borderRadius:99 }}/>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:12 }}>
      <QuickLink href="/suppliers"   icon={Truck}       label="Suppliers"   sub="Manage vendor list"        bg="#eff6ff" c="#1d4ed8"/>
      <QuickLink href="/procurement" icon={ShoppingCart} label="Procurement" sub="Raise purchase requests"   bg="#f0fdf4" c="#15803d"/>
      <QuickLink href="/inventory"   icon={Package}     label="Inventory"   sub="Check stock levels"        bg="#f5f3ff" c="#7c3aed"/>
      <QuickLink href="/reports"     icon={BarChart2}   label="Reports"     sub="View analytics & insights" bg="#fff7ed" c="#c2410c"/>
    </div>
  </div>
  );
};

/* ══════════════════
   STORE KEEPER dashboard
══════════════════ */
const StoreKeeperDashboard = ({ user, greeting }) => {
  const [data, setData]       = useState(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    getInventoryStats().then(r => setData(r.data.data)).catch(()=>{}).finally(()=>setLoading(false));
  }, []);
  const d = data;
  return (
  <div style={{ display:'flex', flexDirection:'column', gap:24 }}>
    <WelcomeBanner user={user} greeting={greeting}/>

    <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:16 }}>
      <KPI label="Items in Stock"   value={loading ? '…' : d?.total_items    ?? 0} sub="Total SKUs"       icon={Package}       iconBg="#eff6ff" iconColor="#2563eb"/>
      <KPI label="Total Units"      value={loading ? '…' : d?.total_units ? parseFloat(d.total_units).toLocaleString() : 0} sub="Across all items" icon={BarChart2} iconBg="#dcfce7" iconColor="#16a34a"/>
      <KPI label="Low Stock Alerts" value={loading ? '…' : d?.low_stock      ?? 0} sub="Need reordering"  icon={AlertTriangle} iconBg="#fef9c3" iconColor="#d97706"/>
      <KPI label="Out of Stock"     value={loading ? '…' : d?.out_of_stock   ?? 0} sub="Urgent attention" icon={AlertTriangle} iconBg="#fee2e2" iconColor="#dc2626"/>
    </div>

    <div style={{ background:'#fffbeb', border:'1px solid #fde68a', borderRadius:14, padding:'14px 20px', display:'flex', alignItems:'center', gap:12 }}>
      <AlertTriangle size={18} style={{ color:'#d97706', flexShrink:0 }}/>
      <div>
        <p style={{ fontSize:13, fontWeight:600, color:'#92400e' }}>Stock Management Workspace</p>
        <p style={{ fontSize:12, color:'#78350f' }}>Use the Inventory module to manage items, adjust stock levels, and process goods received notes (GRN).</p>
      </div>
    </div>

    <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16 }}>
      <div className="section-card">
        <div className="section-header">
          <div style={{ display:'flex', alignItems:'center', gap:8 }}>
            <Package size={14} style={{ color:'#16a34a' }}/>
            <p style={{ fontSize:14, fontWeight:600, color:'#0f172a' }}>Stock Actions</p>
          </div>
        </div>
        <div style={{ padding:'16px', display:'flex', flexDirection:'column', gap:10 }}>
          {[
            { href:'/inventory', icon:Package,    label:'Manage Inventory',   sub:'View all items and stock levels',  bg:'#eff6ff', c:'#2563eb' },
            { href:'/inventory', icon:ArrowRight, label:'Adjust Stock',        sub:'Stock in / stock out / adjustment', bg:'#f0fdf4', c:'#15803d' },
            { href:'/inventory', icon:ClipboardList, label:'Low Stock Alerts', sub:'Items below reorder level',        bg:'#fef9c3', c:'#d97706' },
          ].map(({ href, icon:Icon, label, sub, bg, c }) => (
            <a key={label} href={href} style={{ display:'flex', alignItems:'center', gap:14, padding:'14px', background:bg, borderRadius:12, textDecoration:'none', transition:'opacity .15s' }}
              onMouseEnter={e => e.currentTarget.style.opacity='.85'} onMouseLeave={e => e.currentTarget.style.opacity='1'}>
              <div style={{ width:38, height:38, borderRadius:10, background:'rgba(255,255,255,.7)', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                <Icon size={16} style={{ color:c }}/>
              </div>
              <div>
                <p style={{ fontSize:13, fontWeight:600, color:c }}>{label}</p>
                <p style={{ fontSize:11, color:'#64748b', marginTop:2 }}>{sub}</p>
              </div>
              <ArrowRight size={14} style={{ color:c, marginLeft:'auto' }}/>
            </a>
          ))}
        </div>
      </div>

      <div className="section-card">
        <div className="section-header">
          <div style={{ display:'flex', alignItems:'center', gap:8 }}>
            <Activity size={14} style={{ color:'#16a34a' }}/>
            <p style={{ fontSize:14, fontWeight:600, color:'#0f172a' }}>Quick Stats</p>
          </div>
        </div>
        <div style={{ padding:'16px', display:'flex', flexDirection:'column', gap:8 }}>
          {[
            ['Total items tracked',     loading ? '…' : d?.total_items    ?? 0, '#2563eb'],
            ['Stock movements (30d)',   loading ? '…' : d?.movements_30d  ?? 0, '#16a34a'],
            ['Categories configured',  loading ? '…' : d?.categories      ?? 0, '#d97706'],
            ['Low stock items',         loading ? '…' : d?.low_stock       ?? 0, '#7c3aed'],
          ].map(([l, v, c]) => (
            <div key={l} style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'10px 14px', background:'#f8fafc', borderRadius:10 }}>
              <span style={{ fontSize:13, color:'#374151' }}>{l}</span>
              <span style={{ fontSize:14, fontWeight:700, color:c }}>{v}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  </div>
  );
};

/* ══════════════════
   FINANCE OFFICER dashboard
══════════════════ */
const FinanceDashboard = ({ user, greeting }) => {
  const fmt = (v) => `LKR ${parseFloat(v||0).toLocaleString('en-LK',{maximumFractionDigits:0})}`;
  const [data, setData]       = useState(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    getFinanceStats().then(r => setData(r.data.data)).catch(()=>{}).finally(()=>setLoading(false));
  }, []);
  const d = data;
  return (
  <div style={{ display:'flex', flexDirection:'column', gap:24 }}>
    <WelcomeBanner user={user} greeting={greeting}/>

    <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:16 }}>
      <KPI label="Total Invoiced"  value={loading ? '…' : fmt(d?.invoices?.total_value)}   sub="All time"         icon={FileText}    iconBg="#ede9fe" iconColor="#7c3aed"/>
      <KPI label="Outstanding"     value={loading ? '…' : fmt(d?.invoices?.pending_value)} sub="Pending invoices" icon={Clock}       iconBg="#fef9c3" iconColor="#d97706"/>
      <KPI label="Total Paid"      value={loading ? '…' : fmt(d?.payments?.total_paid)}    sub="Payments made"    icon={CheckCircle2} iconBg="#dcfce7" iconColor="#16a34a"/>
      <KPI label="Total Expenses"  value={loading ? '…' : fmt(d?.expenses?.total_amount)}  sub="All recorded"     icon={Receipt}     iconBg="#fff7ed" iconColor="#c2410c"/>
    </div>

    <div style={{ background:'#f0fdf4', border:'1px solid #bbf7d0', borderRadius:14, padding:'14px 20px', display:'flex', alignItems:'center', gap:12 }}>
      <CheckCircle2 size={18} style={{ color:'#16a34a', flexShrink:0 }}/>
      <div>
        <p style={{ fontSize:13, fontWeight:600, color:'#15803d' }}>Finance Workspace</p>
        <p style={{ fontSize:12, color:'#166534' }}>Manage supplier invoices, record payments, and track company expenses from the Finance module.</p>
      </div>
    </div>

    <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16 }}>
      <div className="section-card">
        <div className="section-header">
          <div style={{ display:'flex', alignItems:'center', gap:8 }}>
            <CreditCard size={14} style={{ color:'#16a34a' }}/>
            <p style={{ fontSize:14, fontWeight:600, color:'#0f172a' }}>Finance Actions</p>
          </div>
        </div>
        <div style={{ padding:'16px', display:'flex', flexDirection:'column', gap:10 }}>
          {[
            { href:'/finance', icon:FileText,  label:'Invoices',          sub:'View and approve supplier invoices', bg:'#f5f3ff', c:'#7c3aed' },
            { href:'/finance', icon:CreditCard,label:'Record Payment',    sub:'Pay approved invoices',             bg:'#f0fdf4', c:'#15803d' },
            { href:'/finance', icon:Receipt,   label:'Log Expense',       sub:'Record company expenses',           bg:'#fff7ed', c:'#c2410c' },
          ].map(({ href, icon:Icon, label, sub, bg, c }) => (
            <a key={label} href={href} style={{ display:'flex', alignItems:'center', gap:14, padding:'14px', background:bg, borderRadius:12, textDecoration:'none', transition:'opacity .15s' }}
              onMouseEnter={e => e.currentTarget.style.opacity='.85'} onMouseLeave={e => e.currentTarget.style.opacity='1'}>
              <div style={{ width:38, height:38, borderRadius:10, background:'rgba(255,255,255,.7)', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                <Icon size={16} style={{ color:c }}/>
              </div>
              <div>
                <p style={{ fontSize:13, fontWeight:600, color:c }}>{label}</p>
                <p style={{ fontSize:11, color:'#64748b', marginTop:2 }}>{sub}</p>
              </div>
              <ArrowRight size={14} style={{ color:c, marginLeft:'auto' }}/>
            </a>
          ))}
        </div>
      </div>

      <div className="section-card">
        <div className="section-header">
          <div style={{ display:'flex', alignItems:'center', gap:8 }}>
            <DollarSign size={14} style={{ color:'#16a34a' }}/>
            <p style={{ fontSize:14, fontWeight:600, color:'#0f172a' }}>Financial Summary</p>
          </div>
        </div>
        <div style={{ padding:'16px', display:'flex', flexDirection:'column', gap:8 }}>
          {[
            ['Invoices pending approval', loading ? '…' : d?.invoices?.pending    ?? 0,                          '#d97706'],
            ['Overdue invoices',          loading ? '…' : d?.overdue_count         ?? 0,                          '#dc2626'],
            ['Payments this month',       loading ? '…' : fmt(d?.monthly_payments),                               '#16a34a'],
            ['Expenses this month',       loading ? '…' : fmt(d?.monthly_expenses),                               '#c2410c'],
          ].map(([l, v, c]) => (
            <div key={l} style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'10px 14px', background:'#f8fafc', borderRadius:10 }}>
              <span style={{ fontSize:13, color:'#374151' }}>{l}</span>
              <span style={{ fontSize:13, fontWeight:700, color:c }}>{v}</span>
            </div>
          ))}
        </div>
      </div>
    </div>

    <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
      <QuickLink href="/finance" icon={FileText}  label="Finance" sub="Invoices, payments & expenses" bg="#f5f3ff" c="#7c3aed"/>
      <QuickLink href="/reports" icon={BarChart2} label="Reports" sub="Financial analytics"           bg="#fff7ed" c="#c2410c"/>
    </div>
  </div>
  );
};

/* ══════════════════
   EMPLOYEE dashboard
══════════════════ */
const EmployeeDashboard = ({ user, greeting }) => {
  const [data, setData]       = useState(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    getRequisitionStats().then(r => setData(r.data.data)).catch(()=>{}).finally(()=>setLoading(false));
  }, []);
  const d = data;
  return (
  <div style={{ display:'flex', flexDirection:'column', gap:24 }}>
    <WelcomeBanner user={user} greeting={greeting}/>

    <div style={{ background:'#f0fdf4', border:'1px solid #bbf7d0', borderRadius:16, padding:'20px 24px', display:'flex', alignItems:'center', gap:16 }}>
      <div style={{ width:48, height:48, borderRadius:12, background:'#dcfce7', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
        <ClipboardList size={22} style={{ color:'#16a34a' }}/>
      </div>
      <div>
        <p style={{ fontSize:15, fontWeight:700, color:'#0f172a' }}>Welcome to ProcureEase</p>
        <p style={{ fontSize:13, color:'#64748b', marginTop:4 }}>
          You can submit purchase requisitions for your department. Your requests will be reviewed by the procurement team.
        </p>
      </div>
      <a href="/procurement" className="btn-primary" style={{ flexShrink:0, marginLeft:'auto' }}>
        <Plus size={14}/> New Request
      </a>
    </div>

    <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:16 }}>
      <KPI label="My Requisitions" value={loading ? '…' : d?.total    ?? 0} sub="Total raised"      icon={ClipboardList} iconBg="#eff6ff" iconColor="#2563eb"/>
      <KPI label="Pending"         value={loading ? '…' : d?.pending  ?? 0} sub="Awaiting approval" icon={Clock}         iconBg="#fef9c3" iconColor="#d97706"/>
      <KPI label="Approved"        value={loading ? '…' : d?.approved ?? 0} sub="Ready to order"    icon={CheckCircle2}  iconBg="#dcfce7" iconColor="#16a34a"/>
    </div>

    <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16 }}>
      <div className="section-card">
        <div className="section-header">
          <div style={{ display:'flex', alignItems:'center', gap:8 }}>
            <FileText size={14} style={{ color:'#16a34a' }}/>
            <p style={{ fontSize:14, fontWeight:600, color:'#0f172a' }}>How to raise a PR</p>
          </div>
        </div>
        <div style={{ padding:'16px', display:'flex', flexDirection:'column', gap:8 }}>
          {[
            ['1', 'Go to Procurement in the sidebar',         '#2563eb', '#eff6ff'],
            ['2', 'Click "New PR" to open the form',          '#16a34a', '#f0fdf4'],
            ['3', 'Add items with quantities & descriptions',  '#d97706', '#fef9c3'],
            ['4', 'Submit — the manager will review it',       '#7c3aed', '#f5f3ff'],
          ].map(([step, text, c, bg]) => (
            <div key={step} style={{ display:'flex', alignItems:'center', gap:12, padding:'12px 14px', background:bg, borderRadius:10 }}>
              <div style={{ width:28, height:28, borderRadius:8, background:c, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0, color:'#fff', fontSize:12, fontWeight:700 }}>{step}</div>
              <span style={{ fontSize:13, color:'#374151' }}>{text}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="section-card">
        <div className="section-header">
          <div style={{ display:'flex', alignItems:'center', gap:8 }}>
            <Activity size={14} style={{ color:'#16a34a' }}/>
            <p style={{ fontSize:14, fontWeight:600, color:'#0f172a' }}>PR Status Guide</p>
          </div>
        </div>
        <div style={{ padding:'16px', display:'flex', flexDirection:'column', gap:8 }}>
          {[
            ['Pending',   'Submitted, waiting for manager review', 'badge-amber'],
            ['Approved',  'Approved — a purchase order will be raised', 'badge-green'],
            ['Rejected',  'Not approved — check the notes for reason', 'badge-red'],
            ['Converted', 'A PO has been created from your PR',   'badge-violet'],
          ].map(([status, desc, cls]) => (
            <div key={status} style={{ display:'flex', alignItems:'center', gap:12, padding:'10px 14px', background:'#f8fafc', borderRadius:10 }}>
              <span className={`badge ${cls}`} style={{ flexShrink:0 }}>{status}</span>
              <span style={{ fontSize:12, color:'#64748b' }}>{desc}</span>
            </div>
          ))}
        </div>
      </div>
    </div>

    <div>
      <QuickLink href="/procurement" icon={ClipboardList} label="Go to Procurement" sub="Create and track your purchase requests" bg="#f0fdf4" c="#15803d"/>
    </div>
  </div>
  );
};

/* ══════════════════
   Main switcher
══════════════════ */
const Dashboard = () => {
  const { user } = useAuth();
  const hour     = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';

  if (!user) return null;

  switch (user.role) {
    case 'store_keeper':
      return <div className="page"><StoreKeeperDashboard user={user} greeting={greeting}/></div>;
    case 'finance_officer':
      return <div className="page"><FinanceDashboard user={user} greeting={greeting}/></div>;
    case 'employee':
      return <div className="page"><EmployeeDashboard user={user} greeting={greeting}/></div>;
    default:
      return <div className="page"><AdminDashboard user={user} greeting={greeting}/></div>;
  }
};

export default Dashboard;
