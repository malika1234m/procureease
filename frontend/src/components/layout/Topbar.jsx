import { useLocation } from 'react-router-dom';
import { Bell, Search, Settings, ChevronRight } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const pages = {
  '/dashboard':  { title:'Dashboard',    crumb:['Home','Dashboard']               },
  '/suppliers':  { title:'Suppliers',    crumb:['Home','Procurement','Suppliers']  },
  '/procurement':{ title:'Procurement',  crumb:['Home','Procurement']             },
  '/inventory':  { title:'Inventory',    crumb:['Home','Inventory']               },
  '/hr':         { title:'HR & Payroll', crumb:['Home','Administration','HR']     },
  '/finance':    { title:'Finance',      crumb:['Home','Administration','Finance'] },
  '/reports':    { title:'Reports',      crumb:['Home','Reports']                 },
  '/users':      { title:'Users',        crumb:['Home','Administration','Users']   },
};

const Topbar = () => {
  const { pathname } = useLocation();
  const { user } = useAuth();
  const page = pages[pathname] || { title:'', crumb:['Home'] };

  return (
    <header style={{ height:56, background:'#fff', borderBottom:'1px solid #f1f5f9', display:'flex', alignItems:'center', justifyContent:'space-between', padding:'0 24px', flexShrink:0, boxShadow:'0 1px 3px rgba(0,0,0,.04)' }}>

      {/* Breadcrumb */}
      <div style={{ display:'flex', alignItems:'center', gap:6 }}>
        {page.crumb.map((c,i) => (
          <div key={c} style={{ display:'flex', alignItems:'center', gap:6 }}>
            {i > 0 && <ChevronRight size={12} style={{ color:'#cbd5e1' }}/>}
            <span style={{ fontSize:13, color: i === page.crumb.length-1 ? '#0f172a' : '#94a3b8', fontWeight: i === page.crumb.length-1 ? 600 : 400 }}>{c}</span>
          </div>
        ))}
      </div>

      {/* Right side */}
      <div style={{ display:'flex', alignItems:'center', gap:8 }}>
        <div style={{ position:'relative', display:'flex', alignItems:'center' }}>
          <Search size={13} style={{ position:'absolute', left:10, color:'#94a3b8' }}/>
          <input placeholder="Search..." type="text"
            style={{ paddingLeft:32, paddingRight:14, paddingTop:7, paddingBottom:7, borderRadius:10, border:'1px solid #e2e8f0', fontSize:12, color:'#374151', background:'#f8fafc', outline:'none', width:160 }}
            onFocus={e=>{ e.target.style.borderColor='#16a34a'; e.target.style.boxShadow='0 0 0 3px rgba(22,163,74,.1)'; }}
            onBlur={e=>{ e.target.style.borderColor='#e2e8f0'; e.target.style.boxShadow='none'; }}/>
        </div>

        <button style={{ width:34, height:34, borderRadius:10, border:'1px solid #e2e8f0', background:'#f8fafc', display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer', color:'#64748b' }}
          onMouseEnter={e=>{ e.currentTarget.style.background='#f1f5f9'; }}
          onMouseLeave={e=>{ e.currentTarget.style.background='#f8fafc'; }}>
          <Settings size={14}/>
        </button>

        <div style={{ position:'relative' }}>
          <button style={{ width:34, height:34, borderRadius:10, border:'1px solid #e2e8f0', background:'#f8fafc', display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer', color:'#64748b' }}
            onMouseEnter={e=>{ e.currentTarget.style.background='#f1f5f9'; }}
            onMouseLeave={e=>{ e.currentTarget.style.background='#f8fafc'; }}>
            <Bell size={14}/>
          </button>
          <span style={{ position:'absolute', top:6, right:6, width:7, height:7, borderRadius:'50%', background:'#16a34a', border:'2px solid #fff' }} className="pulse-dot"/>
        </div>

        <div style={{ width:1, height:20, background:'#e2e8f0', margin:'0 4px' }}/>

        <div style={{ display:'flex', alignItems:'center', gap:9 }}>
          <div style={{ width:32, height:32, borderRadius:'50%', background:'#16a34a', display:'flex', alignItems:'center', justifyContent:'center', color:'#fff', fontSize:12, fontWeight:700 }}>
            {user?.name?.charAt(0).toUpperCase()}
          </div>
          <div>
            <p style={{ fontSize:13, fontWeight:600, color:'#374151', lineHeight:1.2 }}>{user?.name}</p>
            <p style={{ fontSize:10, color:'#94a3b8', textTransform:'capitalize', marginTop:1 }}>{user?.role?.replace(/_/g,' ')}</p>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Topbar;
