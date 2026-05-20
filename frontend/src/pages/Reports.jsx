import { useState, useEffect, useCallback } from 'react';
import { AreaChart, Area, BarChart, Bar, LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import { BarChart2, TrendingUp, Package, Users, DollarSign, RefreshCw, Calendar, Download, AlertTriangle, CheckCircle2, ShoppingCart, FileText, CreditCard, Truck } from 'lucide-react';
import { getOverviewReport, getProcurementReport, getInventoryReport, getHRReport, getFinanceReport } from '../services/reportsService';

const MONTHS = ['','Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
const COLORS  = ['#16a34a','#3b82f6','#f59e0b','#8b5cf6','#dc2626','#0891b2','#f97316','#0ea5e9'];
const fmtLKR  = (v) => `LKR ${parseFloat(v||0).toLocaleString('en-LK',{maximumFractionDigits:0})}`;
const fmtK    = (v) => { const n=parseFloat(v||0); return n>=1e6?`${(n/1e6).toFixed(1)}M`:n>=1000?`${(n/1000).toFixed(0)}K`:n.toFixed(0); };
const pct     = (a,b) => b>0?Math.round((a/b)*100):0;

const ChartTip = ({ active, payload, label }) => {
  if (!active||!payload?.length) return null;
  return <div style={{ background:'#fff', border:'1px solid #e2e8f0', borderRadius:10, padding:'8px 12px', fontSize:12, boxShadow:'0 4px 12px rgba(0,0,0,.08)' }}><p style={{ color:'#64748b', marginBottom:4 }}>{label}</p>{payload.map((p,i)=><p key={i} style={{ color:p.color, fontWeight:600 }}>{p.name}: {fmtK(p.value)}</p>)}</div>;
};
const SChartCard = ({ title, sub, children, action }) => (
  <div className="section-card">
    <div className="section-header"><div><p style={{ fontSize:14, fontWeight:600, color:'#0f172a' }}>{title}</p>{sub&&<p style={{ fontSize:11, color:'#94a3b8', marginTop:2 }}>{sub}</p>}</div>{action}</div>
    <div style={{ padding:'20px' }}>{children}</div>
  </div>
);
const Empty = ({ msg='No data for this period' }) => (
  <div style={{ height:140, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', color:'#94a3b8' }}>
    <BarChart2 size={28} style={{ marginBottom:8, opacity:.3 }}/><p style={{ fontSize:12 }}>{msg}</p>
  </div>
);
const DatePicker = ({ from, to, onChange }) => (
  <div style={{ display:'flex', alignItems:'center', gap:8 }}>
    <Calendar size={14} style={{ color:'#64748b' }}/>
    <input type="date" value={from} onChange={e=>onChange(e.target.value,to)} className="input-field" style={{ width:'auto', padding:'7px 10px', fontSize:12 }}/>
    <span style={{ fontSize:12, color:'#94a3b8' }}>to</span>
    <input type="date" value={to} onChange={e=>onChange(from,e.target.value)} className="input-field" style={{ width:'auto', padding:'7px 10px', fontSize:12 }}/>
  </div>
);
const KpiCard = ({ label, value, sub, icon:Icon, bg, iconColor }) => (
  <div className="stat-card" style={{ background:'#fff' }}>
    <div style={{ width:44, height:44, borderRadius:12, background:bg, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}><Icon size={20} style={{ color: iconColor }}/></div>
    <div><p style={{ fontSize:20, fontWeight:800, color:'#0f172a', lineHeight:1 }}>{value??'—'}</p><p style={{ fontSize:11, color:'#64748b', marginTop:3 }}>{label}</p>{sub&&<p style={{ fontSize:10, color:'#94a3b8', marginTop:1 }}>{sub}</p>}</div>
  </div>
);

const defaultRange = () => {
  const now = new Date();
  return [new Date(now.getFullYear(),0,1).toISOString().split('T')[0], now.toISOString().split('T')[0]];
};

const useReport = (fetchFn) => {
  const [df,dt] = defaultRange();
  const [from, setFrom] = useState(df); const [to, setTo] = useState(dt);
  const [data, setData] = useState(null); const [loading, setLoading] = useState(true);
  const fetch = useCallback(async () => {
    setLoading(true);
    try { const r = await fetchFn(from,to); setData(r.data.data); } catch {} finally { setLoading(false); }
  }, [from, to]);
  useEffect(() => { fetch(); }, [fetch]);
  return { from, to, setFrom, setTo, data, loading, fetch };
};

const OverviewTab = () => {
  const { from, to, setFrom, setTo, data:d, loading, fetch } = useReport(getOverviewReport);
  const Toolbar = () => (
    <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:20 }}>
      <DatePicker from={from} to={to} onChange={(f,t)=>{ setFrom(f); setTo(t); }}/>
      <button onClick={fetch} style={{ width:34, height:34, borderRadius:8, border:'1px solid #e2e8f0', background:'#fff', display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer', color:'#64748b' }}><RefreshCw size={13} className={loading?'animate-spin':''}/></button>
    </div>
  );
  if (loading) return <><Toolbar/><div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:14 }}>{Array.from({length:8}).map((_,i)=><div key={i} className="shimmer" style={{height:100,borderRadius:14}}/>)}</div></>;
  if (!d) return null;
  const kpis = [
    { label:'Active Suppliers', value:d.suppliers?.active,           sub:`${d.suppliers?.total} total`,        icon:Truck,       bg:'#dbeafe', iconColor:'#2563eb' },
    { label:'Active Employees', value:d.employees?.active,           sub:`${d.employees?.total} total`,        icon:Users,       bg:'#fce7f3', iconColor:'#db2777' },
    { label:'Items in Stock',   value:d.inventory?.total_items,      sub:`${d.inventory?.low_stock} low`,      icon:Package,     bg:'#dcfce7', iconColor:'#16a34a' },
    { label:'Open PRs',         value:d.procurement?.pending_pr,     sub:`${d.procurement?.total_pr} total`,   icon:FileText,    bg:'#fef9c3', iconColor:'#d97706' },
    { label:'PO Value',         value:fmtLKR(d.procurement?.po_value),sub:`${d.procurement?.total_po} orders`,icon:ShoppingCart, bg:'#f5f3ff', iconColor:'#7c3aed' },
    { label:'Total Invoiced',   value:fmtLKR(d.finance?.total_invoiced), sub:'in period',                     icon:FileText,    bg:'#fdf2f8', iconColor:'#db2777' },
    { label:'Total Payments',   value:fmtLKR(d.finance?.total_payments), sub:'paid out',                      icon:CreditCard,  bg:'#dcfce7', iconColor:'#16a34a' },
    { label:'Payroll Cost',     value:fmtLKR(d.payroll?.gross_total), sub:`${d.payroll?.payslips} payslips`,  icon:DollarSign,  bg:'#ede9fe', iconColor:'#7c3aed' },
  ];
  return (
    <div style={{ display:'flex', flexDirection:'column', gap:20 }}>
      <Toolbar/>
      <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:14 }}>
        {kpis.map(k=><KpiCard key={k.label} {...k}/>)}
      </div>
      <SChartCard title="System Health" sub="Current status across all modules">
        <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:12 }}>
          {[
            { label:'Stock Health',    ok:parseInt(d.inventory?.out_of_stock)===0, detail:`${d.inventory?.out_of_stock} out of stock` },
            { label:'Pending Invoices',ok:parseFloat(d.finance?.pending_invoiced)===0, detail:`LKR ${fmtK(d.finance?.pending_invoiced)} outstanding` },
            { label:'Supplier Status', ok:parseInt(d.suppliers?.blacklisted)===0, detail:`${d.suppliers?.blacklisted} blacklisted` },
          ].map(({ label, ok, detail }) => (
            <div key={label} style={{ background: ok?'#f0fdf4':'#fffbeb', border:`1px solid ${ok?'#bbf7d0':'#fde68a'}`, borderRadius:12, padding:'16px', display:'flex', alignItems:'center', gap:12 }}>
              {ok ? <CheckCircle2 size={20} style={{ color:'#16a34a', flexShrink:0 }}/> : <AlertTriangle size={20} style={{ color:'#d97706', flexShrink:0 }}/>}
              <div><p style={{ fontSize:13, fontWeight:600, color:'#0f172a' }}>{label}</p><p style={{ fontSize:11, color:'#64748b', marginTop:2 }}>{detail}</p></div>
            </div>
          ))}
        </div>
      </SChartCard>
    </div>
  );
};

const ProcurementTab = () => {
  const { from, to, setFrom, setTo, data, loading, fetch } = useReport(getProcurementReport);
  const pieData = data?.pr_by_status?.map(r => ({ name:r.status, value:parseInt(r.count), color:{pending:'#f59e0b',approved:'#16a34a',rejected:'#dc2626',converted:'#3b82f6'}[r.status]||'#94a3b8' })) || [];
  return (
    <div style={{ display:'flex', flexDirection:'column', gap:20 }}>
      <div style={{ display:'flex', gap:10, alignItems:'center' }}>
        <DatePicker from={from} to={to} onChange={(f,t)=>{ setFrom(f); setTo(t); }}/>
        <button onClick={fetch} style={{ width:34, height:34, borderRadius:8, border:'1px solid #e2e8f0', background:'#fff', display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer', color:'#64748b' }}><RefreshCw size={13} className={loading?'animate-spin':''}/></button>
      </div>
      {loading ? <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16 }}>{Array.from({length:4}).map((_,i)=><div key={i} className="shimmer" style={{height:220,borderRadius:16}}/>)}</div> : (
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16 }}>
          <SChartCard title="Monthly PO Value" sub="Total purchase order value (LKR)">
            {data?.po_monthly?.length > 0 ? (
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={data.po_monthly} margin={{ top:0, right:0, left:-15, bottom:0 }}>
                  <XAxis dataKey="label" tick={{ fill:'#94a3b8', fontSize:10 }} axisLine={false} tickLine={false}/>
                  <YAxis tick={{ fill:'#94a3b8', fontSize:10 }} axisLine={false} tickLine={false} tickFormatter={fmtK}/>
                  <Tooltip content={<ChartTip/>}/>
                  <Bar dataKey="value" name="PO Value" fill="#16a34a" radius={[4,4,0,0]}/>
                </BarChart>
              </ResponsiveContainer>
            ) : <Empty/>}
          </SChartCard>
          <SChartCard title="Requisition Status" sub="Breakdown by approval status">
            {pieData.length > 0 ? (
              <div style={{ display:'flex', alignItems:'center', gap:20 }}>
                <ResponsiveContainer width="45%" height={180}><PieChart><Pie data={pieData} cx="50%" cy="50%" innerRadius={48} outerRadius={70} dataKey="value" paddingAngle={3} stroke="none">{pieData.map((d,i)=><Cell key={i} fill={d.color}/>)}</Pie><Tooltip formatter={v=>[v,'Count']} contentStyle={{ background:'#fff', border:'1px solid #e2e8f0', borderRadius:10, fontSize:11 }}/></PieChart></ResponsiveContainer>
                <div style={{ flex:1, display:'flex', flexDirection:'column', gap:8 }}>
                  {pieData.map(d=>(
                    <div key={d.name} style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'8px 12px', background:'#f8fafc', borderRadius:8 }}>
                      <div style={{ display:'flex', alignItems:'center', gap:8 }}><span style={{ width:10, height:10, borderRadius:'50%', background:d.color, display:'block' }}/><span style={{ fontSize:12, color:'#374151', textTransform:'capitalize' }}>{d.name}</span></div>
                      <span style={{ fontSize:13, fontWeight:700, color:'#0f172a' }}>{d.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            ) : <Empty/>}
          </SChartCard>
          <SChartCard title="Top Suppliers by Spend" sub="Ranked by total PO value">
            {data?.top_suppliers?.length > 0 ? (
              <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
                {data.top_suppliers.map((s,i)=>{
                  const max = parseFloat(data.top_suppliers[0]?.total_value||1);
                  return (
                    <div key={s.name} style={{ display:'flex', alignItems:'center', gap:10 }}>
                      <span style={{ fontSize:12, color:'#94a3b8', width:18, flexShrink:0 }}>{i+1}</span>
                      <div style={{ flex:1 }}>
                        <div style={{ display:'flex', justifyContent:'space-between', marginBottom:4 }}>
                          <span style={{ fontSize:12, fontWeight:500, color:'#374151' }}>{s.name}</span>
                          <span style={{ fontSize:12, color:'#64748b' }}>{fmtLKR(s.total_value)}</span>
                        </div>
                        <div style={{ height:5, background:'#f1f5f9', borderRadius:99, overflow:'hidden' }}>
                          <div style={{ height:'100%', width:`${pct(s.total_value,max)}%`, background:COLORS[i%COLORS.length], borderRadius:99 }}/>
                        </div>
                      </div>
                      <span style={{ fontSize:10, color:'#94a3b8', flexShrink:0 }}>{s.orders} orders</span>
                    </div>
                  );
                })}
              </div>
            ) : <Empty msg="No purchase orders in this period"/>}
          </SChartCard>
          <SChartCard title="PRs by Department" sub="Number of requisitions per department">
            {data?.pr_by_dept?.length > 0 ? (
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={data.pr_by_dept} layout="vertical" margin={{ top:0, right:20, left:10, bottom:0 }}>
                  <XAxis type="number" tick={{ fill:'#94a3b8', fontSize:10 }} axisLine={false} tickLine={false}/>
                  <YAxis type="category" dataKey="dept" tick={{ fill:'#64748b', fontSize:10 }} axisLine={false} tickLine={false} width={90}/>
                  <Tooltip formatter={v=>[v,'PRs']} contentStyle={{ background:'#fff', border:'1px solid #e2e8f0', borderRadius:10, fontSize:11 }}/>
                  <Bar dataKey="count" name="PRs" fill="#f59e0b" radius={[0,4,4,0]}/>
                </BarChart>
              </ResponsiveContainer>
            ) : <Empty/>}
          </SChartCard>
        </div>
      )}
    </div>
  );
};

const InventoryTab = () => {
  const { from, to, setFrom, setTo, data, loading, fetch } = useReport(getInventoryReport);
  return (
    <div style={{ display:'flex', flexDirection:'column', gap:20 }}>
      <div style={{ display:'flex', gap:10, alignItems:'center' }}>
        <DatePicker from={from} to={to} onChange={(f,t)=>{ setFrom(f); setTo(t); }}/>
        <button onClick={fetch} style={{ width:34, height:34, borderRadius:8, border:'1px solid #e2e8f0', background:'#fff', display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer', color:'#64748b' }}><RefreshCw size={13} className={loading?'animate-spin':''}/></button>
      </div>
      {loading ? <div style={{ display:'grid', gridTemplateColumns:'1fr 2fr', gap:16 }}>{Array.from({length:3}).map((_,i)=><div key={i} className="shimmer" style={{height:240,borderRadius:16}}/>)}</div> : (
        <div style={{ display:'flex', flexDirection:'column', gap:16 }}>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 2fr', gap:16 }}>
            <SChartCard title="Stock Status" sub="Current item health">
              {data?.stock_levels && (
                <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
                  {[['In Stock', parseInt(data.stock_levels.in_stock||0), '#16a34a', '#dcfce7'],
                    ['Low Stock', parseInt(data.stock_levels.low_stock||0), '#d97706', '#fef9c3'],
                    ['Out of Stock', parseInt(data.stock_levels.out_of_stock||0), '#dc2626', '#fee2e2']
                  ].map(([l,v,c,bg]) => (
                    <div key={l} style={{ display:'flex', alignItems:'center', gap:12, padding:'12px 14px', background:bg, borderRadius:10 }}>
                      <div style={{ width:36, height:36, borderRadius:10, background:c, display:'flex', alignItems:'center', justifyContent:'center', color:'#fff', fontSize:14, fontWeight:700, flexShrink:0 }}>{v}</div>
                      <span style={{ fontSize:13, fontWeight:500, color:'#374151' }}>{l}</span>
                    </div>
                  ))}
                </div>
              )}
            </SChartCard>
            <SChartCard title="Stock Movements" sub="In vs Out over time">
              {data?.movements?.length > 0 ? (
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={data.movements} margin={{ top:0, right:0, left:-15, bottom:0 }}>
                    <XAxis dataKey="label" tick={{ fill:'#94a3b8', fontSize:10 }} axisLine={false} tickLine={false}/>
                    <YAxis tick={{ fill:'#94a3b8', fontSize:10 }} axisLine={false} tickLine={false} tickFormatter={fmtK}/>
                    <Tooltip content={<ChartTip/>}/>
                    <Bar dataKey="stock_in" name="In" fill="#16a34a" radius={[3,3,0,0]}/>
                    <Bar dataKey="stock_out" name="Out" fill="#dc2626" radius={[3,3,0,0]}/>
                    <Legend wrapperStyle={{ fontSize:11, paddingTop:8 }}/>
                  </BarChart>
                </ResponsiveContainer>
              ) : <Empty/>}
            </SChartCard>
          </div>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16 }}>
            <SChartCard title="Items by Category">
              {data?.by_category?.length > 0 ? (
                <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
                  {data.by_category.map((c,i)=>{
                    const max = parseInt(data.by_category[0]?.item_count||1);
                    return (
                      <div key={c.name} style={{ display:'flex', alignItems:'center', gap:10 }}>
                        <span style={{ fontSize:12, fontWeight:500, color:'#374151', width:90, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', flexShrink:0 }}>{c.name}</span>
                        <div style={{ flex:1, height:6, background:'#f1f5f9', borderRadius:99, overflow:'hidden' }}>
                          <div style={{ height:'100%', width:`${pct(c.item_count,max)}%`, background:COLORS[i%COLORS.length], borderRadius:99 }}/>
                        </div>
                        <span style={{ fontSize:11, color:'#64748b', width:50, textAlign:'right', flexShrink:0 }}>{c.item_count} items</span>
                      </div>
                    );
                  })}
                </div>
              ) : <Empty msg="No categories configured"/>}
            </SChartCard>
            <SChartCard title="Low Stock Alert" action={data?.low_stock?.length>0?<span className="badge badge-amber">{data.low_stock.length}</span>:null}>
              {data?.low_stock?.length > 0 ? (
                <div style={{ display:'flex', flexDirection:'column', gap:8, maxHeight:200, overflowY:'auto' }}>
                  {data.low_stock.map((item,i)=>{
                    const lvl = item.reorder_level>0 ? pct(item.current_stock, item.reorder_level) : 100;
                    return (
                      <div key={i} style={{ display:'flex', alignItems:'center', gap:10, padding:'10px 12px', background:'#fffbeb', border:'1px solid #fde68a', borderRadius:10 }}>
                        <AlertTriangle size={13} style={{ color: parseFloat(item.current_stock)===0?'#dc2626':'#d97706', flexShrink:0 }}/>
                        <div style={{ flex:1, minWidth:0 }}>
                          <p style={{ fontSize:12, fontWeight:600, color:'#0f172a', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{item.name}</p>
                          <div style={{ display:'flex', gap:8, alignItems:'center', marginTop:3 }}>
                            <div style={{ flex:1, height:4, background:'#fde68a', borderRadius:99, overflow:'hidden' }}><div style={{ height:'100%', width:`${lvl}%`, background: lvl===0?'#dc2626':'#f59e0b', borderRadius:99 }}/></div>
                            <span style={{ fontSize:10, color:'#92400e', flexShrink:0 }}>{item.current_stock}/{item.reorder_level} {item.unit}</span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : <div style={{ textAlign:'center', padding:'30px 0' }}><CheckCircle2 size={32} style={{ color:'#16a34a', margin:'0 auto 8px' }}/><p style={{ fontSize:12, color:'#16a34a' }}>All stock levels healthy</p></div>}
            </SChartCard>
          </div>
        </div>
      )}
    </div>
  );
};

const HRTab = () => {
  const { from, to, setFrom, setTo, data, loading, fetch } = useReport(getHRReport);
  const ATT_C = { present:'#16a34a', absent:'#dc2626', half_day:'#d97706', late:'#f97316', leave:'#7c3aed' };
  return (
    <div style={{ display:'flex', flexDirection:'column', gap:20 }}>
      <div style={{ display:'flex', gap:10, alignItems:'center' }}>
        <DatePicker from={from} to={to} onChange={(f,t)=>{ setFrom(f); setTo(t); }}/>
        <button onClick={fetch} style={{ width:34, height:34, borderRadius:8, border:'1px solid #e2e8f0', background:'#fff', display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer', color:'#64748b' }}><RefreshCw size={13} className={loading?'animate-spin':''}/></button>
      </div>
      {loading ? <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16 }}>{Array.from({length:4}).map((_,i)=><div key={i} className="shimmer" style={{height:220,borderRadius:16}}/>)}</div> : (
        <div style={{ display:'flex', flexDirection:'column', gap:16 }}>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:14 }}>
            {[['Total',data?.headcount?.total,'#eff6ff'],['Active',data?.headcount?.active,'#f0fdf4'],['Inactive',data?.headcount?.inactive,'#f8fafc'],['Terminated',data?.headcount?.terminated,'#fef2f2']].map(([l,v,bg])=>(
              <div key={l} style={{ background:bg, borderRadius:14, padding:'18px', textAlign:'center', border:'1px solid #f1f5f9' }}>
                <p style={{ fontSize:28, fontWeight:800, color:'#0f172a' }}>{v??'—'}</p>
                <p style={{ fontSize:12, color:'#64748b', marginTop:4 }}>{l} Employees</p>
              </div>
            ))}
          </div>
          <div style={{ display:'grid', gridTemplateColumns:'2fr 1fr', gap:16 }}>
            <SChartCard title="Monthly Payroll Trend" sub="Gross, Net and Employer cost (LKR)">
              {data?.payroll_trend?.length > 0 ? (
                <ResponsiveContainer width="100%" height={200}>
                  <LineChart data={data.payroll_trend.map(r=>({...r,label:`${MONTHS[r.month]} ${r.year}`}))} margin={{ top:5, right:10, left:-15, bottom:0 }}>
                    <XAxis dataKey="label" tick={{ fill:'#94a3b8', fontSize:10 }} axisLine={false} tickLine={false}/>
                    <YAxis tick={{ fill:'#94a3b8', fontSize:10 }} axisLine={false} tickLine={false} tickFormatter={fmtK}/>
                    <Tooltip content={<ChartTip/>}/>
                    <Line type="monotone" dataKey="gross" name="Gross" stroke="#dc2626" strokeWidth={2} dot={false}/>
                    <Line type="monotone" dataKey="net" name="Net" stroke="#16a34a" strokeWidth={2} dot={false}/>
                    <Line type="monotone" dataKey="employer_cost" name="Employer Cost" stroke="#3b82f6" strokeWidth={1.5} strokeDasharray="4 2" dot={false}/>
                    <Legend wrapperStyle={{ fontSize:11, paddingTop:8 }}/>
                  </LineChart>
                </ResponsiveContainer>
              ) : <Empty msg="No payroll data in this period"/>}
            </SChartCard>
            <SChartCard title="Attendance Summary">
              {data?.attendance?.length > 0 ? (
                <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
                  {data.attendance.map(a => {
                    const total = data.attendance.reduce((s,r)=>s+parseInt(r.count),0)||1;
                    return (
                      <div key={a.status} style={{ display:'flex', alignItems:'center', gap:10 }}>
                        <span style={{ width:60, fontSize:11, color:'#374151', textTransform:'capitalize', flexShrink:0 }}>{a.status.replace('_',' ')}</span>
                        <div style={{ flex:1, height:6, background:'#f1f5f9', borderRadius:99, overflow:'hidden' }}>
                          <div style={{ height:'100%', width:`${pct(a.count,total)}%`, background:ATT_C[a.status]||'#94a3b8', borderRadius:99 }}/>
                        </div>
                        <span style={{ fontSize:12, fontWeight:700, color:'#0f172a', width:28, textAlign:'right' }}>{a.count}</span>
                      </div>
                    );
                  })}
                </div>
              ) : <Empty msg="No attendance records"/>}
            </SChartCard>
          </div>
          <SChartCard title="Headcount by Department">
            {data?.by_department?.length > 0 ? (
              <ResponsiveContainer width="100%" height={180}>
                <BarChart data={data.by_department} layout="vertical" margin={{ top:0, right:30, left:10, bottom:0 }}>
                  <XAxis type="number" tick={{ fill:'#94a3b8', fontSize:10 }} axisLine={false} tickLine={false}/>
                  <YAxis type="category" dataKey="dept" tick={{ fill:'#64748b', fontSize:10 }} axisLine={false} tickLine={false} width={100}/>
                  <Tooltip formatter={v=>[v,'Employees']} contentStyle={{ background:'#fff', border:'1px solid #e2e8f0', borderRadius:10, fontSize:11 }}/>
                  <Bar dataKey="count" name="Employees" fill="#3b82f6" radius={[0,4,4,0]}/>
                </BarChart>
              </ResponsiveContainer>
            ) : <Empty/>}
          </SChartCard>
        </div>
      )}
    </div>
  );
};

const FinanceTab = () => {
  const { from, to, setFrom, setTo, data, loading, fetch } = useReport(getFinanceReport);
  const exportCSV = (rows, filename) => {
    if (!rows?.length) return;
    const headers = Object.keys(rows[0]);
    const csv = [headers.join(','), ...rows.map(r=>headers.map(h=>`"${r[h]??''}"`).join(','))].join('\n');
    const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([csv],{type:'text/csv'})); a.download = `${filename}.csv`; a.click();
  };
  return (
    <div style={{ display:'flex', flexDirection:'column', gap:20 }}>
      <div style={{ display:'flex', alignItems:'center', gap:10 }}>
        <DatePicker from={from} to={to} onChange={(f,t)=>{ setFrom(f); setTo(t); }}/>
        <button onClick={fetch} style={{ width:34, height:34, borderRadius:8, border:'1px solid #e2e8f0', background:'#fff', display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer', color:'#64748b' }}><RefreshCw size={13} className={loading?'animate-spin':''}/></button>
        <button onClick={()=>exportCSV(data?.top_vendors,'vendor-spend')} className="btn-secondary" style={{ fontSize:12 }}><Download size={12}/> Export</button>
      </div>
      {loading ? <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16 }}>{Array.from({length:4}).map((_,i)=><div key={i} className="shimmer" style={{height:220,borderRadius:16}}/>)}</div> : (
        <div style={{ display:'flex', flexDirection:'column', gap:16 }}>
          {data && (
            <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:14 }}>
              {[['Total Invoiced',fmtLKR(data.summary?.total_invoiced),'#f5f3ff'],['Total Paid',fmtLKR(data.summary?.total_paid),'#f0fdf4'],['Outstanding',fmtLKR(data.summary?.total_pending),'#fef9c3'],['Overdue',data.summary?.overdue_count||0,'#fef2f2']].map(([l,v,bg])=>(
                <div key={l} style={{ background:bg, borderRadius:14, padding:'18px', border:'1px solid #f1f5f9' }}>
                  <p style={{ fontSize:20, fontWeight:800, color:'#0f172a', lineHeight:1 }}>{v}</p>
                  <p style={{ fontSize:12, color:'#64748b', marginTop:5 }}>{l}</p>
                </div>
              ))}
            </div>
          )}
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16 }}>
            <SChartCard title="Invoiced vs Paid" sub="Monthly comparison (LKR)">
              {data?.invoice_monthly?.length > 0 ? (
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={data.invoice_monthly} margin={{ top:0, right:0, left:-15, bottom:0 }}>
                    <XAxis dataKey="label" tick={{ fill:'#94a3b8', fontSize:10 }} axisLine={false} tickLine={false}/>
                    <YAxis tick={{ fill:'#94a3b8', fontSize:10 }} axisLine={false} tickLine={false} tickFormatter={fmtK}/>
                    <Tooltip content={<ChartTip/>}/>
                    <Bar dataKey="invoiced" name="Invoiced" fill="#8b5cf6" radius={[3,3,0,0]}/>
                    <Bar dataKey="paid" name="Paid" fill="#16a34a" radius={[3,3,0,0]}/>
                    <Legend wrapperStyle={{ fontSize:11, paddingTop:8 }}/>
                  </BarChart>
                </ResponsiveContainer>
              ) : <Empty/>}
            </SChartCard>
            <SChartCard title="Expenses by Category">
              {data?.expense_by_category?.length > 0 ? (
                <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
                  {data.expense_by_category.map((c,i)=>{
                    const max = parseFloat(data.expense_by_category[0]?.total||1);
                    return (
                      <div key={c.category} style={{ display:'flex', alignItems:'center', gap:10 }}>
                        <span style={{ width:80, fontSize:11, color:'#374151', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', flexShrink:0 }}>{c.category}</span>
                        <div style={{ flex:1, height:6, background:'#f1f5f9', borderRadius:99, overflow:'hidden' }}><div style={{ height:'100%', width:`${pct(c.total,max)}%`, background:COLORS[i%COLORS.length], borderRadius:99 }}/></div>
                        <span style={{ fontSize:11, color:'#374151', fontWeight:600, width:60, textAlign:'right', flexShrink:0 }}>{fmtLKR(c.total)}</span>
                      </div>
                    );
                  })}
                </div>
              ) : <Empty msg="No approved expenses"/>}
            </SChartCard>
            <SChartCard title="Top Vendors by Invoice">
              {data?.top_vendors?.length > 0 ? (
                <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
                  {data.top_vendors.map((v,i)=>(
                    <div key={v.supplier} style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'10px 12px', background:'#f8fafc', borderRadius:10 }}>
                      <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                        <span style={{ width:22, height:22, borderRadius:6, background:COLORS[i%COLORS.length], display:'flex', alignItems:'center', justifyContent:'center', color:'#fff', fontSize:10, fontWeight:700, flexShrink:0 }}>{i+1}</span>
                        <span style={{ fontSize:12, fontWeight:500, color:'#374151' }}>{v.supplier}</span>
                      </div>
                      <div style={{ textAlign:'right' }}>
                        <p style={{ fontSize:12, fontWeight:700, color:'#0f172a' }}>{fmtLKR(v.total_value)}</p>
                        <p style={{ fontSize:10, color:'#94a3b8' }}>{v.invoices} invoices</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : <Empty msg="No invoices in this period"/>}
            </SChartCard>
            <SChartCard title="Overdue Invoices" action={data?.overdue_invoices?.length>0?<span className="badge badge-red">{data.overdue_invoices.length}</span>:null}>
              {data?.overdue_invoices?.length > 0 ? (
                <div style={{ display:'flex', flexDirection:'column', gap:6, maxHeight:200, overflowY:'auto' }}>
                  {data.overdue_invoices.map((inv,i)=>(
                    <div key={i} style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'10px 12px', background:'#fef2f2', border:'1px solid #fecaca', borderRadius:10 }}>
                      <div><p style={{ fontSize:12, fontWeight:600, color:'#0f172a' }}>{inv.invoice_number}</p><p style={{ fontSize:10, color:'#64748b' }}>{inv.supplier} · {inv.days_overdue} days overdue</p></div>
                      <span style={{ fontSize:12, fontWeight:700, color:'#dc2626' }}>{fmtLKR(inv.total_amount)}</span>
                    </div>
                  ))}
                </div>
              ) : <div style={{ textAlign:'center', padding:'30px 0' }}><CheckCircle2 size={32} style={{ color:'#16a34a', margin:'0 auto 8px' }}/><p style={{ fontSize:12, color:'#16a34a' }}>No overdue invoices</p></div>}
            </SChartCard>
          </div>
        </div>
      )}
    </div>
  );
};

const Reports = () => {
  const [tab, setTab] = useState('overview');
  const tabs = [['overview','Overview'],['procurement','Procurement'],['inventory','Inventory'],['hr','HR & Payroll'],['finance','Finance']];
  return (
    <div className="page" style={{ display:'flex', flexDirection:'column', gap:24 }}>
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
        <div>
          <h1 style={{ fontSize:22, fontWeight:800, color:'#0f172a' }}>Reports & Analytics</h1>
          <p style={{ fontSize:13, color:'#64748b', marginTop:3 }}>Business intelligence across all modules</p>
        </div>
        <span className="badge badge-green"><span style={{ width:6, height:6, borderRadius:'50%', background:'#16a34a', display:'inline-block', marginRight:4 }} className="pulse-dot"/>Live Data</span>
      </div>
      <div style={{ display:'flex', gap:4, background:'#fff', padding:'6px', borderRadius:12, border:'1px solid #f1f5f9', flexWrap:'wrap', boxShadow:'0 1px 3px rgba(0,0,0,.04)' }}>
        {tabs.map(([id,label])=>(
          <button key={id} onClick={()=>setTab(id)} style={{ padding:'8px 18px', borderRadius:8, fontSize:13, fontWeight:500, cursor:'pointer', background:tab===id?'#16a34a':'transparent', color:tab===id?'#fff':'#64748b', border:'none' }}>{label}</button>
        ))}
      </div>
      {tab==='overview'    && <OverviewTab/>}
      {tab==='procurement' && <ProcurementTab/>}
      {tab==='inventory'   && <InventoryTab/>}
      {tab==='hr'          && <HRTab/>}
      {tab==='finance'     && <FinanceTab/>}
    </div>
  );
};

export default Reports;
