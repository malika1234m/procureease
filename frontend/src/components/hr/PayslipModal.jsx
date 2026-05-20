import { X, Printer } from 'lucide-react';

const MONTHS = ['','January','February','March','April','May','June','July','August','September','October','November','December'];

const Row = ({ label, value, bold, color, borderTop }) => (
  <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'8px 0', borderTop: borderTop ? '1px solid #e2e8f0' : 'none', marginTop: borderTop ? 6 : 0 }}>
    <span style={{ fontSize:13, color: bold ? '#0f172a' : '#64748b', fontWeight: bold ? 700 : 400 }}>{label}</span>
    <span style={{ fontSize:13, fontWeight:600, color: color || (bold ? '#0f172a' : '#374151') }}>
      LKR {parseFloat(value||0).toLocaleString('en-LK',{minimumFractionDigits:2})}
    </span>
  </div>
);

const PayslipModal = ({ payslip, onClose }) => {
  if (!payslip) return null;

  const handlePrint = () => {
    const content = document.getElementById('payslip-print');
    const w = window.open('','_blank');
    w.document.write(`<html><head><title>Payslip</title>
      <style>body{font-family:sans-serif;padding:20px;color:#000}
      .row{display:flex;justify-content:space-between;padding:6px 0;border-bottom:1px solid #eee}
      .bold{font-weight:bold}.total{font-size:1.1em;font-weight:bold;border-top:2px solid #000;padding-top:8px}
      h2,h3{margin:0}table{width:100%}</style></head><body>${content.innerHTML}</body></html>`);
    w.document.close(); w.print();
  };

  return (
    <div style={{ position:'fixed', inset:0, zIndex:50, display:'flex', alignItems:'center', justifyContent:'center', padding:16 }} onClick={onClose}>
      <div style={{ position:'absolute', inset:0, background:'rgba(15,23,42,.55)', backdropFilter:'blur(6px)' }}/>
      <div className="fade-up" style={{ position:'relative', width:'100%', maxWidth:460, maxHeight:'90vh', display:'flex', flexDirection:'column', background:'#fff', borderRadius:20, border:'1px solid #e2e8f0', boxShadow:'0 20px 60px rgba(0,0,0,.15)', overflow:'hidden' }} onClick={e=>e.stopPropagation()}>

        <div style={{ height:4, background:'linear-gradient(90deg,#16a34a,#4ade80)', flexShrink:0 }}/>

        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'18px 24px', borderBottom:'1px solid #f1f5f9', flexShrink:0 }}>
          <h2 style={{ fontSize:16, fontWeight:700, color:'#0f172a' }}>Payslip</h2>
          <div style={{ display:'flex', alignItems:'center', gap:8 }}>
            <button onClick={handlePrint} className="btn-secondary" style={{ padding:'7px 12px', fontSize:12 }}>
              <Printer size={13}/> Print
            </button>
            <button onClick={onClose} style={{ width:32, height:32, borderRadius:8, border:'1px solid #e2e8f0', background:'#f8fafc', display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer', color:'#64748b' }}>
              <X size={15}/>
            </button>
          </div>
        </div>

        <div style={{ flex:1, overflowY:'auto', padding:'20px 24px' }} id="payslip-print">
          {/* Company header */}
          <div style={{ background:'#f0fdf4', border:'1px solid #bbf7d0', borderRadius:12, padding:'14px 16px', marginBottom:16 }}>
            <p style={{ fontSize:11, fontWeight:700, color:'#16a34a', textTransform:'uppercase', letterSpacing:'0.08em' }}>ProcureEase ERP</p>
            <p style={{ fontSize:16, fontWeight:700, color:'#0f172a', marginTop:2 }}>Salary Payslip</p>
            <p style={{ fontSize:13, color:'#64748b', marginTop:2 }}>{MONTHS[payslip.month]} {payslip.year}</p>
          </div>

          {/* Employee info */}
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8, marginBottom:16 }}>
            {[
              ['Employee',    payslip.employee_name],
              ['Employee #',  payslip.emp_number],
              ['Department',  payslip.department||'—'],
              ['Designation', payslip.designation||'—'],
              ['NIC',         payslip.nic||'—'],
              ['Payslip #',   payslip.payroll_number],
            ].map(([l,v])=>(
              <div key={l} style={{ background:'#f8fafc', borderRadius:10, padding:'10px 12px', border:'1px solid #f1f5f9' }}>
                <p style={{ fontSize:10, color:'#94a3b8', textTransform:'uppercase', letterSpacing:'0.05em' }}>{l}</p>
                <p style={{ fontSize:13, fontWeight:500, color:'#0f172a', marginTop:2 }}>{v}</p>
              </div>
            ))}
          </div>

          {/* Earnings */}
          <div style={{ background:'#f0fdf4', border:'1px solid #bbf7d0', borderRadius:12, padding:'14px 16px', marginBottom:10 }}>
            <p style={{ fontSize:11, fontWeight:700, textTransform:'uppercase', letterSpacing:'0.06em', color:'#16a34a', marginBottom:8 }}>Earnings</p>
            <Row label="Basic Salary"  value={payslip.basic_salary}/>
            <Row label="Allowances"    value={payslip.allowances}/>
            {parseFloat(payslip.overtime)>0 && <Row label="Overtime" value={payslip.overtime}/>}
            <Row label="Gross Salary"  value={payslip.gross_salary} bold borderTop/>
          </div>

          {/* Deductions */}
          <div style={{ background:'#fff5f5', border:'1px solid #fecaca', borderRadius:12, padding:'14px 16px', marginBottom:10 }}>
            <p style={{ fontSize:11, fontWeight:700, textTransform:'uppercase', letterSpacing:'0.06em', color:'#dc2626', marginBottom:8 }}>Deductions</p>
            <Row label="EPF (Employee 8%)" value={payslip.epf_employee} color="#dc2626"/>
            {parseFloat(payslip.other_deductions)>0 && <Row label="Other Deductions" value={payslip.other_deductions} color="#dc2626"/>}
          </div>

          {/* Employer contributions */}
          <div style={{ background:'#ede9fe', border:'1px solid #ddd6fe', borderRadius:12, padding:'14px 16px', marginBottom:10 }}>
            <p style={{ fontSize:11, fontWeight:700, textTransform:'uppercase', letterSpacing:'0.06em', color:'#7c3aed', marginBottom:8 }}>Employer Contributions</p>
            <Row label="EPF (Employer 12%)" value={payslip.epf_employer} color="#7c3aed"/>
            <Row label="ETF (Employer 3%)"  value={payslip.etf_employer} color="#7c3aed"/>
          </div>

          {/* Net pay */}
          <div style={{ background:'linear-gradient(135deg,#0f172a,#1e293b)', borderRadius:12, padding:'16px 20px', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
            <p style={{ fontSize:14, fontWeight:700, color:'#fff' }}>Net Pay</p>
            <p style={{ fontSize:22, fontWeight:800, color:'#4ade80' }}>
              LKR {parseFloat(payslip.net_salary).toLocaleString('en-LK',{minimumFractionDigits:2})}
            </p>
          </div>

          {payslip.notes && (
            <p style={{ fontSize:12, color:'#64748b', marginTop:12, textAlign:'center', fontStyle:'italic' }}>Note: {payslip.notes}</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default PayslipModal;
