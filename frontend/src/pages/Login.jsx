import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Eye, EyeOff, Loader2, ShieldCheck, CheckCircle2, Truck, Package, BarChart2, Users } from 'lucide-react';

const features = [
  { icon: Truck,      text: 'Supplier & procurement management' },
  { icon: Package,    text: 'Real-time inventory tracking'       },
  { icon: Users,      text: 'HR, payroll & EPF/ETF calculations' },
  { icon: BarChart2,  text: 'Finance reports & analytics'        },
];

const Login = () => {
  const [form, setForm]       = useState({ email: '', password: '' });
  const [showPw, setShowPw]   = useState(false);
  const [error, setError]     = useState('');
  const [loading, setLoading] = useState(false);
  const { login }  = useAuth();
  const navigate   = useNavigate();

  const onChange = (e) => { setForm({ ...form, [e.target.name]: e.target.value }); setError(''); };

  const onSubmit = async (e) => {
    e.preventDefault();
    if (!form.email || !form.password) { setError('All fields are required.'); return; }
    setLoading(true);
    try { await login(form.email, form.password); navigate('/dashboard'); }
    catch (err) { setError(err.response?.data?.message || 'Invalid email or password.'); }
    finally { setLoading(false); }
  };

  const fill = e => { e.target.style.borderColor = '#16a34a'; e.target.style.boxShadow = '0 0 0 3px rgba(22,163,74,.1)'; };
  const unfill = e => { e.target.style.borderColor = '#e2e8f0'; e.target.style.boxShadow = 'none'; };

  return (
    <div style={{ display:'flex', minHeight:'100vh', fontFamily:"'Inter',system-ui,sans-serif" }}>

      {/* ── Left panel ── */}
      <div style={{
        flex:1, display:'flex', flexDirection:'column', justifyContent:'space-between',
        padding:'48px 56px', background:'linear-gradient(160deg,#0f172a 0%,#1e293b 55%,#052e16 100%)',
        position:'relative', overflow:'hidden',
      }}>
        {/* Decorative circles */}
        <div style={{ position:'absolute', top:-80, right:-80, width:320, height:320, borderRadius:'50%', background:'#16a34a', opacity:.06, pointerEvents:'none' }}/>
        <div style={{ position:'absolute', bottom:-100, left:-60, width:260, height:260, borderRadius:'50%', background:'#4ade80', opacity:.05, pointerEvents:'none' }}/>
        <div style={{ position:'absolute', top:'40%', right:40, width:160, height:160, borderRadius:'50%', background:'#16a34a', opacity:.04, pointerEvents:'none' }}/>

        {/* Logo */}
        <div style={{ position:'relative', zIndex:1 }}>
          <div style={{ display:'flex', alignItems:'center', gap:12 }}>
            <div style={{ width:44, height:44, background:'#16a34a', borderRadius:12, display:'flex', alignItems:'center', justifyContent:'center', boxShadow:'0 8px 24px rgba(22,163,74,.35)' }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round">
                <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/>
                <polyline points="9 22 9 12 15 12 15 22"/>
              </svg>
            </div>
            <span style={{ fontSize:22, fontWeight:800, color:'#fff', letterSpacing:'-0.3px' }}>
              Procure<span style={{ color:'#4ade80' }}>Ease</span>
            </span>
          </div>
        </div>

        {/* Centre content */}
        <div style={{ position:'relative', zIndex:1 }}>
          <div style={{ display:'inline-flex', alignItems:'center', gap:8, background:'rgba(74,222,128,.1)', border:'1px solid rgba(74,222,128,.2)', borderRadius:99, padding:'6px 14px', marginBottom:24 }}>
            <span style={{ width:7, height:7, borderRadius:'50%', background:'#4ade80', display:'block' }} className="pulse-dot"/>
            <span style={{ fontSize:12, fontWeight:600, color:'#4ade80' }}>ERP Platform · Sri Lanka</span>
          </div>
          <h1 style={{ fontSize:38, fontWeight:800, color:'#fff', lineHeight:1.15, letterSpacing:'-0.5px', marginBottom:16 }}>
            Smarter procurement<br/>
            <span style={{ color:'#4ade80' }}>starts here.</span>
          </h1>
          <p style={{ fontSize:15, color:'#64748b', lineHeight:1.7, maxWidth:380, marginBottom:40 }}>
            A complete ERP system built for Sri Lankan SMEs — manage procurement, inventory, HR and finance from one place.
          </p>
          <div style={{ display:'flex', flexDirection:'column', gap:16 }}>
            {features.map(({ icon:Icon, text }) => (
              <div key={text} style={{ display:'flex', alignItems:'center', gap:14 }}>
                <div style={{ width:36, height:36, borderRadius:10, background:'rgba(22,163,74,.15)', border:'1px solid rgba(22,163,74,.25)', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                  <Icon size={16} style={{ color:'#4ade80' }}/>
                </div>
                <span style={{ fontSize:14, color:'#94a3b8' }}>{text}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div style={{ position:'relative', zIndex:1 }}>
          <p style={{ fontSize:12, color:'#334155' }}>ProcureEase ERP &copy; {new Date().getFullYear()} · Built for Sri Lankan SMEs</p>
        </div>
      </div>

      {/* ── Right panel ── */}
      <div style={{ width:520, display:'flex', alignItems:'center', justifyContent:'center', background:'#f8fafc', padding:'48px 56px' }}>
        <div style={{ width:'100%', maxWidth:400 }}>

          {/* Heading */}
          <div style={{ marginBottom:36 }}>
            <h2 style={{ fontSize:26, fontWeight:800, color:'#0f172a', letterSpacing:'-0.3px' }}>Sign in</h2>
            <p style={{ fontSize:14, color:'#64748b', marginTop:6 }}>Enter your credentials to access your workspace</p>
          </div>

          {/* Error */}
          {error && (
            <div style={{ display:'flex', alignItems:'center', gap:10, background:'#fef2f2', border:'1px solid #fecaca', borderRadius:12, padding:'12px 16px', marginBottom:20 }}>
              <svg width="16" height="16" fill="#dc2626" viewBox="0 0 20 20" style={{ flexShrink:0 }}>
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd"/>
              </svg>
              <span style={{ fontSize:13, color:'#dc2626' }}>{error}</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={onSubmit} style={{ display:'flex', flexDirection:'column', gap:20 }}>
            <div>
              <label style={{ display:'block', fontSize:13, fontWeight:600, color:'#374151', marginBottom:8 }}>Email address</label>
              <input type="email" name="email" value={form.email} onChange={onChange}
                placeholder="admin@procureease.com"
                style={{ width:'100%', padding:'12px 16px', borderRadius:12, border:'1px solid #e2e8f0', fontSize:14, color:'#0f172a', background:'#fff', outline:'none', boxSizing:'border-box', transition:'border-color .15s, box-shadow .15s' }}
                onFocus={fill} onBlur={unfill}
              />
            </div>

            <div>
              <label style={{ display:'block', fontSize:13, fontWeight:600, color:'#374151', marginBottom:8 }}>Password</label>
              <div style={{ position:'relative' }}>
                <input type={showPw ? 'text' : 'password'} name="password" value={form.password} onChange={onChange}
                  placeholder="••••••••"
                  style={{ width:'100%', padding:'12px 48px 12px 16px', borderRadius:12, border:'1px solid #e2e8f0', fontSize:14, color:'#0f172a', background:'#fff', outline:'none', boxSizing:'border-box', transition:'border-color .15s, box-shadow .15s' }}
                  onFocus={fill} onBlur={unfill}
                />
                <button type="button" onClick={() => setShowPw(!showPw)}
                  style={{ position:'absolute', right:14, top:'50%', transform:'translateY(-50%)', background:'none', border:'none', cursor:'pointer', color:'#94a3b8', display:'flex', padding:0 }}
                  onMouseEnter={e => e.currentTarget.style.color='#64748b'}
                  onMouseLeave={e => e.currentTarget.style.color='#94a3b8'}>
                  {showPw ? <EyeOff size={17}/> : <Eye size={17}/>}
                </button>
              </div>
            </div>

            <button type="submit" disabled={loading}
              style={{
                width:'100%', padding:'13px', borderRadius:12, border:'none', fontSize:14, fontWeight:700,
                color:'#fff', cursor:loading?'not-allowed':'pointer',
                background: loading ? '#86efac' : '#16a34a',
                display:'flex', alignItems:'center', justifyContent:'center', gap:8,
                boxShadow: loading ? 'none' : '0 4px 16px rgba(22,163,74,.35)',
                transition:'background .15s, box-shadow .15s',
              }}
              onMouseEnter={e => { if (!loading) { e.currentTarget.style.background='#15803d'; e.currentTarget.style.boxShadow='0 6px 20px rgba(22,163,74,.4)'; }}}
              onMouseLeave={e => { if (!loading) { e.currentTarget.style.background='#16a34a'; e.currentTarget.style.boxShadow='0 4px 16px rgba(22,163,74,.35)'; }}}>
              {loading && <Loader2 size={16} style={{ animation:'spin 1s linear infinite' }}/>}
              {loading ? 'Signing in…' : 'Sign in to ProcureEase'}
            </button>
          </form>

          {/* Security */}
          <div style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:6, marginTop:20 }}>
            <ShieldCheck size={13} style={{ color:'#16a34a' }}/>
            <span style={{ fontSize:12, color:'#94a3b8' }}>Secured with JWT authentication</span>
          </div>

          {/* Demo credentials */}
          <div style={{ marginTop:32, borderRadius:14, border:'1px solid #e2e8f0', overflow:'hidden', background:'#fff' }}>
            <div style={{ background:'#f8fafc', padding:'10px 16px', borderBottom:'1px solid #f1f5f9', display:'flex', alignItems:'center', gap:8 }}>
              <CheckCircle2 size={13} style={{ color:'#16a34a' }}/>
              <span style={{ fontSize:11, fontWeight:700, color:'#64748b', textTransform:'uppercase', letterSpacing:'0.07em' }}>Demo accounts (password: password)</span>
            </div>
            <div style={{ padding:'10px 16px', display:'flex', flexDirection:'column', gap:6 }}>
              {[
                ['admin@procureease.com',       'Administrator'],
                ['procurement@procureease.com', 'Procurement Mgr'],
                ['store@procureease.com',       'Store Keeper'],
                ['finance@procureease.com',     'Finance Officer'],
                ['employee@procureease.com',    'Employee'],
              ].map(([email, role]) => (
                <button key={email} type="button"
                  onClick={() => { setForm({ email, password:'password' }); setError(''); }}
                  style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'8px 10px', borderRadius:8, border:'1px solid #f1f5f9', background:'#f8fafc', cursor:'pointer', transition:'background .15s' }}
                  onMouseEnter={e => e.currentTarget.style.background='#f1f5f9'}
                  onMouseLeave={e => e.currentTarget.style.background='#f8fafc'}>
                  <code style={{ fontSize:11, color:'#374151', fontFamily:'monospace' }}>{email}</code>
                  <span style={{ fontSize:10, color:'#94a3b8', fontWeight:500 }}>{role}</span>
                </button>
              ))}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default Login;
