import React, { useState, useMemo } from "react";
import { StatementData } from "../lib/gemini";
import { Card, CardHeader, CardTitle, CardContent } from "./ui/Card";
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend } from "recharts";
import { FastForward, Plus, Trash2, TrendingUp, Wallet, AlertTriangle } from "lucide-react";

const formatCurrency = (val: number) => 
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(val);

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#14b8a6', '#f43f5e'];

export function SimulationModule({ data }: { data: StatementData }) {
  const [incomes, setIncomes] = useState(() => {
    // initialize from statement data if available, or default
    return data.summary.totalIncome > 0 
      ? [{ id: '1', name: 'Salary', amount: data.summary.totalIncome }]
      : [{ id: '1', name: 'Salary', amount: 100000 }];
  });

  const [expenses, setExpenses] = useState(() => {
    return data.summary.totalExpense > 0
      ? [{ id: '1', name: 'Home Expenses', amount: data.summary.totalExpense }]
      : [{ id: '1', name: 'Home Expenses', amount: 60000 }];
  });

  const [months, setMonths] = useState(6);

  const [allocations, setAllocations] = useState([
    { id: '1', name: 'Equity (Mutual Funds)', rate: 12, percent: 50 },
    { id: '2', name: 'Fixed Deposits', rate: 6.5, percent: 30 },
    { id: '3', name: 'Gold', rate: 8, percent: 20 },
  ]);

  const handleAddIncome = () => setIncomes(prev => [...prev, { id: Math.random().toString(36).substr(2, 9), name: 'New Income', amount: 0 }]);
  const handleRemoveIncome = (id: string) => setIncomes(prev => prev.filter(i => i.id !== id));
  const updateIncome = (id: string, field: string, value: string) => {
    setIncomes(prev => prev.map(i => {
      if (i.id === id) {
        if (field === 'name') return { ...i, name: value };
        const num = parseInt(value, 10);
        return { ...i, amount: isNaN(num) ? 0 : num };
      }
      return i;
    }));
  };

  const handleAddExpense = () => setExpenses(prev => [...prev, { id: Math.random().toString(36).substr(2, 9), name: 'New Expense', amount: 0 }]);
  const handleRemoveExpense = (id: string) => setExpenses(prev => prev.filter(e => e.id !== id));
  const updateExpense = (id: string, field: string, value: string) => {
    setExpenses(prev => prev.map(e => {
      if (e.id === id) {
        if (field === 'name') return { ...e, name: value };
        const num = parseInt(value, 10);
        return { ...e, amount: isNaN(num) ? 0 : num };
      }
      return e;
    }));
  };

  const handleAddAllocation = () => {
    setAllocations(prev => [
      ...prev,
      { id: Math.random().toString(36).substr(2, 9), name: 'New Investment', rate: 5, percent: 0 }
    ]);
  };

  const handleRemoveAllocation = (id: string) => {
    setAllocations(prev => prev.filter(a => a.id !== id));
  };

  const updateAllocation = (id: string, field: string, value: string) => {
    setAllocations(prev => prev.map(a => {
      if (a.id === id) {
        if (field === 'name') return { ...a, name: value };
        const num = parseFloat(value);
        return { ...a, [field]: isNaN(num) ? 0 : num };
      }
      return a;
    }));
  };

  const totalIncome = incomes.reduce((acc, curr) => acc + curr.amount, 0);
  const totalExpense = expenses.reduce((acc, curr) => acc + curr.amount, 0);
  const monthlySavings = totalIncome - totalExpense;
  const totalPercent = allocations.reduce((acc, curr) => acc + curr.percent, 0);
  const unallocatedPercent = Math.max(0, 100 - totalPercent);

  const projectionData = useMemo(() => {
    if (monthlySavings <= 0) return [];

    const projection = [];
    let balances = allocations.map(() => 0);
    let unallocatedBalance = 0;

    for (let m = 1; m <= months; m++) {
      const monthData: any = { month: `M${m}` };
      let monthTotal = 0;

      allocations.forEach((alloc, idx) => {
        const monthlyRate = (alloc.rate / 100) / 12;
        const addedAmount = monthlySavings * (alloc.percent / 100);
        balances[idx] = balances[idx] * (1 + monthlyRate) + addedAmount;
        monthData[alloc.name] = Math.round(balances[idx]);
        monthTotal += balances[idx];
      });

      const unallocatedAdded = monthlySavings * (unallocatedPercent / 100);
      unallocatedBalance += unallocatedAdded;
      if (unallocatedPercent > 0) {
        monthData['Unallocated (Cash)'] = Math.round(unallocatedBalance);
        monthTotal += unallocatedBalance;
      }

      monthData.total = Math.round(monthTotal);
      projection.push(monthData);
    }
    return projection;
  }, [monthlySavings, allocations, months, unallocatedPercent]);

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Future Simulation</h1>
          <p className="text-gray-500 text-sm italic">Forecast your savings and investment growth.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1 space-y-6">
          {/* Base Configuration */}
          <Card className="border-white/5">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Wallet className="w-5 h-5 text-gray-500"/> Cash Flow Settings
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
                {/* INCOMES */}
                <div>
                   <div className="flex justify-between items-center mb-2">
                     <span className="text-sm font-medium text-emerald-400">Monthly Incomes</span>
                     <button onClick={handleAddIncome} className="p-1 hover:bg-white/10 rounded-md transition-colors text-gray-400 hover:text-white">
                       <Plus className="w-3.5 h-3.5" />
                     </button>
                   </div>
                   <div className="space-y-2 max-h-48 overflow-y-auto custom-scrollbar pr-1">
                      {incomes.map(inc => (
                         <div key={inc.id} className="flex items-center gap-2 group">
                             <input type="text" value={inc.name} onChange={(e) => updateIncome(inc.id, 'name', e.target.value)} className="w-[45%] bg-[#141414] border border-white/10 rounded px-2 py-1.5 text-xs text-white focus:outline-none focus:border-emerald-500" placeholder="Source"/>
                             <div className="relative flex-1">
                               <span className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-500 text-xs">₹</span>
                               <input type="number" value={inc.amount} onChange={(e) => updateIncome(inc.id, 'amount', e.target.value)} className="w-full bg-[#141414] border border-white/10 rounded pl-5 pr-2 py-1.5 text-xs text-white focus:outline-none focus:border-emerald-500"/>
                             </div>
                             <button onClick={() => handleRemoveIncome(inc.id)} className="text-red-400 opacity-0 group-hover:opacity-100 p-1">
                                <Trash2 className="w-3.5 h-3.5"/>
                             </button>
                         </div>
                      ))}
                   </div>
                   <div className="flex justify-between mt-2 pt-2 border-t border-white/5">
                     <span className="text-xs text-gray-400">Total Income</span>
                     <span className="text-sm font-bold text-emerald-400">{formatCurrency(totalIncome)}</span>
                   </div>
                </div>

                {/* EXPENSES */}
                <div>
                   <div className="flex justify-between items-center mb-2">
                     <span className="text-sm font-medium text-rose-400">Monthly Expenses</span>
                     <button onClick={handleAddExpense} className="p-1 hover:bg-white/10 rounded-md transition-colors text-gray-400 hover:text-white">
                       <Plus className="w-3.5 h-3.5" />
                     </button>
                   </div>
                   <div className="space-y-2 max-h-48 overflow-y-auto custom-scrollbar pr-1">
                      {expenses.map(exp => (
                         <div key={exp.id} className="flex items-center gap-2 group">
                             <input type="text" value={exp.name} onChange={(e) => updateExpense(exp.id, 'name', e.target.value)} className="w-[45%] bg-[#141414] border border-white/10 rounded px-2 py-1.5 text-xs text-white focus:outline-none focus:border-rose-500" placeholder="Expense"/>
                             <div className="relative flex-1">
                               <span className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-500 text-xs">₹</span>
                               <input type="number" value={exp.amount} onChange={(e) => updateExpense(exp.id, 'amount', e.target.value)} className="w-full bg-[#141414] border border-white/10 rounded pl-5 pr-2 py-1.5 text-xs text-white focus:outline-none focus:border-rose-500"/>
                             </div>
                             <button onClick={() => handleRemoveExpense(exp.id)} className="text-red-400 opacity-0 group-hover:opacity-100 p-1">
                                <Trash2 className="w-3.5 h-3.5"/>
                             </button>
                         </div>
                      ))}
                   </div>
                   <div className="flex justify-between mt-2 pt-2 border-t border-white/5">
                     <span className="text-xs text-gray-400">Total Expense</span>
                     <span className="text-sm font-bold text-rose-400">{formatCurrency(totalExpense)}</span>
                   </div>
                </div>

              <div className="pt-4 border-t border-white/5">
                <div className="flex justify-between items-center mb-1">
                  <span className="text-sm text-gray-400">Available to Invest / mo</span>
                  <span className={`font-bold ${monthlySavings > 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                    {formatCurrency(monthlySavings)}
                  </span>
                </div>
                {monthlySavings <= 0 && (
                  <p className="text-xs text-amber-500 mt-2 flex items-center gap-1">
                    <AlertTriangle className="w-3 h-3"/> Expenses must be lower than income.
                  </p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Investment Allocations */}
          <Card className="border-white/5">
            <CardHeader className="flex flex-row justify-between items-center">
              <CardTitle className="text-white flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-gray-500"/> Portfolio Allocation
              </CardTitle>
              <button onClick={handleAddAllocation} className="p-1.5 hover:bg-white/10 rounded-md transition-colors text-gray-400 hover:text-white">
                <Plus className="w-4 h-4" />
              </button>
            </CardHeader>
            <CardContent className="space-y-4">
              {allocations.map((alloc) => (
                <div key={alloc.id} className="bg-[#1a1a1a] p-3 rounded-xl border border-white/5 relative group">
                  <button onClick={() => handleRemoveAllocation(alloc.id)} className="absolute -top-2 -right-2 bg-red-500/10 border border-red-500/20 text-red-400 p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
                    <Trash2 className="w-3 h-3" />
                  </button>
                  <input
                    type="text"
                    value={alloc.name}
                    onChange={(e) => updateAllocation(alloc.id, 'name', e.target.value)}
                    className="w-full bg-transparent border-b border-white/10 focus:border-blue-500 px-1 py-1 mb-3 text-sm text-white focus:outline-none"
                    placeholder="Investment Name"
                  />
                  <div className="flex gap-3">
                    <div className="flex-1">
                      <label className="text-[10px] text-gray-500 uppercase tracking-wide block mb-1">Return (%)</label>
                      <input
                        type="number"
                        value={alloc.rate}
                        onChange={(e) => updateAllocation(alloc.id, 'rate', e.target.value)}
                        className="w-full bg-[#141414] border border-white/10 rounded px-2 py-1 text-xs text-white focus:outline-none focus:border-blue-500"
                      />
                    </div>
                    <div className="flex-1">
                      <label className="text-[10px] text-gray-500 uppercase tracking-wide block mb-1">Alloc (%)</label>
                      <input
                        type="number"
                        value={alloc.percent}
                        onChange={(e) => updateAllocation(alloc.id, 'percent', e.target.value)}
                        className="w-full bg-[#141414] border border-white/10 rounded px-2 py-1 text-xs text-white focus:outline-none focus:border-blue-500"
                      />
                    </div>
                  </div>
                </div>
              ))}
              
              <div className="pt-2">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-gray-400">Total Allocated:</span>
                  <span className={totalPercent > 100 ? 'text-red-400' : 'text-gray-200'}>{totalPercent}%</span>
                </div>
                {totalPercent > 100 && (
                  <p className="text-[10px] text-red-400 mt-1">Allocation exceeds 100%. Please adjust.</p>
                )}
                {unallocatedPercent > 0 && totalPercent <= 100 && (
                  <div className="flex justify-between items-center text-xs mt-1 text-gray-500">
                    <span>Unallocated (Cash):</span>
                    <span>{unallocatedPercent.toFixed(1)}%</span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="col-span-1 lg:col-span-2 space-y-6">
          <Card className="border-white/5 h-full flex flex-col">
            <CardHeader className="flex flex-row justify-between items-center">
              <CardTitle className="text-white flex items-center gap-2">
                <FastForward className="w-5 h-5 text-gray-500"/> Projection ({months} Months)
              </CardTitle>
              <div className="flex items-center gap-3">
                <span className="text-xs text-gray-500">Timeline:</span>
                <input 
                  type="range" 
                  min="1" 
                  max="60" 
                  value={months} 
                  onChange={(e) => setMonths(Number(e.target.value))}
                  className="w-24 accent-blue-500"
                />
                <span className="text-xs font-medium text-white w-8">{months}m</span>
              </div>
            </CardHeader>
            <CardContent className="flex-1 min-h-[400px]">
              {monthlySavings > 0 && totalPercent <= 100 ? (
                <>
                  <div className="mb-6 flex gap-6">
                    <div>
                      <p className="text-xs text-gray-500">Projected Total Value</p>
                      <p className="text-2xl font-bold text-white">
                        {projectionData.length > 0 ? formatCurrency(projectionData[projectionData.length - 1].total) : '₹0'}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Total Invested Principal</p>
                      <p className="text-xl font-semibold text-gray-300">
                        {formatCurrency(monthlySavings * months)}
                      </p>
                    </div>
                  </div>
                  <ResponsiveContainer width="100%" height="80%">
                    <AreaChart data={projectionData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
                      <XAxis dataKey="month" stroke="#9CA3AF" fontSize={11} tickLine={false} axisLine={false} />
                      <YAxis 
                        tickFormatter={(v) => `₹${v/1000}k`} 
                        stroke="#9CA3AF" 
                        fontSize={11} 
                        tickLine={false} 
                        axisLine={false} 
                        width={60}
                      />
                      <RechartsTooltip 
                        formatter={(value: number) => formatCurrency(value)}
                        contentStyle={{ backgroundColor: '#141414', borderColor: 'rgba(255,255,255,0.05)', color: '#fff', borderRadius: '8px' }}
                        itemStyle={{ color: '#fff' }}
                        labelStyle={{ color: '#9CA3AF', marginBottom: '8px' }}
                      />
                      <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '20px' }} />
                      
                      {allocations.map((alloc, i) => (
                        <Area 
                          key={alloc.id} 
                          type="monotone" 
                          dataKey={alloc.name} 
                          stackId="1" 
                          stroke={COLORS[i % COLORS.length]} 
                          fill={COLORS[i % COLORS.length]} 
                          fillOpacity={0.6} 
                        />
                      ))}
                      {unallocatedPercent > 0 && (
                        <Area 
                          type="monotone" 
                          dataKey="Unallocated (Cash)" 
                          stackId="1" 
                          stroke="#64748b" 
                          fill="#64748b" 
                          fillOpacity={0.6} 
                        />
                      )}
                    </AreaChart>
                  </ResponsiveContainer>
                </>
              ) : (
                <div className="flex h-full items-center justify-center text-sm text-gray-500 text-center px-4">
                  {monthlySavings <= 0 
                    ? "Increase income or decrease expenses to simulate investments."
                    : "Fix your allocation to be 100% or less to see the projection."}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
