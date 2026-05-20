import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Wrench } from 'lucide-react';

const steps = [
  { n:1,  label:'Project Setup',        done:true  },
  { n:2,  label:'Database & Schema',    done:true  },
  { n:3,  label:'Auth & UI',            done:true  },
  { n:4,  label:'Supplier Management',  done:true  },
  { n:5,  label:'Procurement Flow',     done:true  },
  { n:6,  label:'Inventory Module',     done:true  },
  { n:7,  label:'HR & Payroll',         done:true  },
  { n:8,  label:'Finance Module',       done:true  },
  { n:9,  label:'Reports & Analytics',  done:true  },
  { n:10, label:'Deployment',           done:true  },
];

const ComingSoon = ({ title }) => {
  const navigate = useNavigate();
  const done = steps.filter(s => s.done).length;
  const pct  = Math.round((done / steps.length) * 100);

  return (
    <div className="p-6 max-w-3xl mx-auto fade-up">
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="h-1 bg-green-600"/>

        <div className="p-10 flex flex-col items-center text-center">
          <div className="w-16 h-16 bg-green-50 rounded-2xl flex items-center justify-center mb-5 border-2 border-dashed border-green-200">
            <Wrench size={28} className="text-green-600 opacity-60"/>
          </div>

          <span className="tag bg-amber-50 text-amber-700 border border-amber-100 mb-4">
            <span className="pulse-dot w-1.5 h-1.5 rounded-full bg-amber-500 inline-block"/> In Development
          </span>

          <h1 className="text-2xl font-bold text-slate-900">{title}</h1>
          <p className="text-slate-500 text-sm mt-2 max-w-sm">
            This module is being built step by step. Full functionality coming soon.
          </p>

          <button onClick={() => navigate('/dashboard')}
            className="flex items-center gap-2 mt-7 px-5 py-2.5 rounded-xl text-white text-sm font-semibold bg-green-600 hover:bg-green-700 transition-colors">
            <ArrowLeft size={15}/> Back to Dashboard
          </button>
        </div>

        {/* Roadmap */}
        <div className="px-8 pb-8">
          <div className="bg-slate-50 rounded-xl p-5 border border-slate-100">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-slate-900 text-sm font-semibold">Build Roadmap</h3>
              <span className="text-xs font-bold text-green-600">{pct}% Complete</span>
            </div>
            <div className="h-1.5 rounded-full mb-5 overflow-hidden bg-slate-200">
              <div className="h-full rounded-full transition-all bg-green-500" style={{ width:`${pct}%` }}/>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
              {steps.map(({ n, label, done }) => (
                <div key={n} className={`flex flex-col items-center text-center p-2 rounded-xl border ${
                  done ? 'bg-green-50 border-green-100' : 'bg-white border-slate-100'}`}>
                  <span className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold mb-1 ${
                    done ? 'bg-green-600 text-white' : 'bg-slate-200 text-slate-500'}`}>
                    {done ? '✓' : n}
                  </span>
                  <p className={`text-[10px] leading-tight ${done ? 'text-green-600' : 'text-slate-400'}`}>{label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ComingSoon;
