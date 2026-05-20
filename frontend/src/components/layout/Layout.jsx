import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Topbar from './Topbar';

/* Fixed sidebar + scrollable main — no overflow conflicts */
const Layout = () => (
  <div style={{ display:'flex', height:'100vh', overflow:'hidden', background:'#f8fafc' }}>
    <Sidebar />
    <div style={{ flex:1, display:'flex', flexDirection:'column', overflow:'hidden', minWidth:0 }}>
      <Topbar />
      <main style={{ flex:1, overflowY:'auto', background:'#f8fafc' }}>
        <Outlet />
      </main>
    </div>
  </div>
);

export default Layout;
