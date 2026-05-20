import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  LayoutDashboard, Truck, ShoppingCart, Package,
  Users, FileText, BarChart2, LogOut, ChevronRight, UserCog,
} from 'lucide-react';

const groups = [
  {
    label: 'Overview',
    items: [{ label: 'Dashboard', icon: LayoutDashboard, to: '/dashboard' }],
  },
  {
    label: 'Procurement',
    items: [
      { label: 'Suppliers',   icon: Truck,        to: '/suppliers',   roles: ['admin','procurement_manager'] },
      { label: 'Procurement', icon: ShoppingCart, to: '/procurement', roles: ['admin','procurement_manager','employee'] },
      { label: 'Inventory',   icon: Package,      to: '/inventory',   roles: ['admin','procurement_manager','store_keeper'] },
    ],
  },
  {
    label: 'Administration',
    items: [
      { label: 'HR & Payroll', icon: Users,    to: '/hr',      roles: ['admin'] },
      { label: 'Finance',      icon: FileText, to: '/finance', roles: ['admin','finance_officer'] },
      { label: 'Reports',      icon: BarChart2,to: '/reports', roles: ['admin','procurement_manager','finance_officer'] },
      { label: 'Users',        icon: UserCog,  to: '/users',   roles: ['admin'] },
    ],
  },
];

const roleLabel = {
  admin: 'Administrator', procurement_manager: 'Procurement Mgr',
  store_keeper: 'Store Keeper', finance_officer: 'Finance Officer', employee: 'Employee',
};

const Sidebar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  return (
    <aside style={{
      width: 240, flexShrink: 0, display: 'flex', flexDirection: 'column',
      height: '100vh', background: '#0f172a', overflow: 'hidden',
    }}>
      {/* Logo */}
      <div style={{ padding: '20px', borderBottom: '1px solid #1e293b', display: 'flex', alignItems: 'center', gap: 10 }}>
        <div style={{ width: 34, height: 34, background: '#16a34a', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round">
            <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/>
            <polyline points="9 22 9 12 15 12 15 22"/>
          </svg>
        </div>
        <div>
          <p style={{ color: '#fff', fontWeight: 700, fontSize: 15, lineHeight: 1 }}>
            Procure<span style={{ color: '#4ade80' }}>Ease</span>
          </p>
          <p style={{ color: '#475569', fontSize: 10, marginTop: 3 }}>ERP Platform</p>
        </div>
      </div>

      {/* User card */}
      <div style={{ padding: '12px 16px', borderBottom: '1px solid #1e293b' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, background: '#1e293b', borderRadius: 12, padding: '10px 12px' }}>
          <div style={{ width: 34, height: 34, background: '#16a34a', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 700, fontSize: 13, flexShrink: 0 }}>
            {user?.name?.charAt(0).toUpperCase()}
          </div>
          <div style={{ minWidth: 0, flex: 1 }}>
            <p style={{ color: '#f1f5f9', fontSize: 13, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user?.name}</p>
            <p style={{ color: '#64748b', fontSize: 10, marginTop: 2 }}>{roleLabel[user?.role] || 'Employee'}</p>
          </div>
          <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#4ade80', flexShrink: 0 }} className="pulse-dot"/>
        </div>
      </div>

      {/* Navigation */}
      <nav style={{ flex: 1, padding: '16px 12px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 20 }}>
        {groups.map(({ label, items }) => {
          const visible = items.filter(({ roles }) => !roles || roles.includes(user?.role));
          if (!visible.length) return null;
          return (
          <div key={label}>
            <p style={{ color: '#475569', fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', paddingLeft: 12, marginBottom: 4 }}>
              {label}
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              {visible.map(({ label: l, icon: Icon, to }) => (
                <NavLink key={to} to={to} style={{ textDecoration: 'none' }}
                  className={({ isActive }) => isActive ? 'nav-item nav-active' : 'nav-item nav-inactive'}>
                  {({ isActive }) => (
                    <>
                      <Icon size={16} style={{ color: isActive ? '#fff' : '#64748b', flexShrink: 0 }} />
                      <span style={{ flex: 1, fontSize: 13, fontWeight: 500, color: isActive ? '#fff' : '#94a3b8' }}>{l}</span>
                      {!isActive && <ChevronRight size={12} style={{ color: '#475569', opacity: 0 }} className="nav-chevron"/>}
                    </>
                  )}
                </NavLink>
              ))}
            </div>
          </div>
          );
        })}
      </nav>

      {/* Sign out */}
      <div style={{ padding: '12px', borderTop: '1px solid #1e293b' }}>
        <button onClick={() => { logout(); navigate('/login'); }}
          style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', borderRadius: 10, background: 'transparent', border: 'none', cursor: 'pointer', color: '#64748b', fontSize: 13, fontWeight: 500, transition: 'all .15s' }}
          onMouseEnter={e => { e.currentTarget.style.background = '#1e293b'; e.currentTarget.style.color = '#f87171'; }}
          onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#64748b'; }}>
          <LogOut size={15}/>
          Sign out
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
