import React from 'react';
import { useNavigate } from 'react-router-dom';

export default function Dashboard() {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem('user') || '{}');

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-transparent flex flex-col">
      {/* Main Content Area */}
      <main className="flex-1 p-6 max-w-7xl w-full mx-auto space-y-6">
        <div>
          <h2 className="text-lg font-semibold text-slate-800">Financial Overview</h2>
          <p className="text-sm text-slate-500">Real-time status of school accounts and collections</p>
        </div>

        {/* Metric Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
            <p className="text-xs font-medium uppercase tracking-wider text-slate-400">Total Fees Collected</p>
            <p className="text-2xl font-bold text-emerald-600 mt-2">$48,250</p>
            <span className="text-xs text-emerald-600 font-medium">+12% this month</span>
          </div>

          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
            <p className="text-xs font-medium uppercase tracking-wider text-slate-400">Outstanding Balance</p>
            <p className="text-2xl font-bold text-amber-600 mt-2">$14,120</p>
            <span className="text-xs text-slate-400 font-medium">32 pending invoices</span>
          </div>

          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
            <p className="text-xs font-medium uppercase tracking-wider text-slate-400">Enrolled Students</p>
            <p className="text-2xl font-bold text-blue-600 mt-2">1,240</p>
            <span className="text-xs text-slate-400 font-medium">Across all grades</span>
          </div>

          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
            <p className="text-xs font-medium uppercase tracking-wider text-slate-400">Monthly Expenses</p>
            <p className="text-2xl font-bold text-slate-800 mt-2">$18,400</p>
            <span className="text-xs text-slate-400 font-medium">Salaries & operations</span>
          </div>
        </div>

        {/* Quick Action Area */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
          <h3 className="text-md font-semibold text-slate-800 mb-3">Quick Accounting Actions</h3>
          <div className="flex flex-wrap gap-3">
            <button className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors">
              + Collect Student Fee
            </button>
            <button className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-sm font-medium transition-colors">
              Generate Invoice
            </button>
            <button className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-sm font-medium transition-colors">
              View Ledger
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}