import React, { useState, useMemo } from "react";
import { StatementData } from "../lib/gemini";
import { Card, CardHeader, CardTitle, CardContent } from "./ui/Card";
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend } from "recharts";
import { FastForward, Plus, Trash2, TrendingUp, Wallet, AlertTriangle, ArrowDownRight, ArrowUpRight, Save, Layers } from "lucide-react";

const formatCurrency = (val: number) => 
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(val);

interface IncomeStream {
  id: string;
  name: string;
  amount: number;
  growth: number;
}

interface Scenario {
  id: string;
  name: string;
  incomes: IncomeStream[];
  expenseInflation: number;
  useManualSavings: boolean;
  manualSavings: number;
  totalIncome: number;
  totalExpense: number;
}

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#14b8a6', '#f43f5e'];

export function SimulationModule({ data }: { data: StatementData }) {
  const [incomes, setIncomes] = useState<IncomeStream[]>(() => {
    // initialize from statement data if available, or default
    return data.summary.totalIncome > 0 
      ? [{ id: '1', name: 'Salary', amount: data.summary.totalIncome, growth: 5 }]
      : [{ id: '1', name: 'Salary', amount: 100000, growth: 5 }];
  });

  const [expenses, setExpenses] = useState(() => {
    return data.summary.totalExpense > 0
      ? [{ id: '1', name: 'Home Expenses', amount: data.summary.totalExpense }]
      : [{ id: '1', name: 'Home Expenses', amount: 60000 }];
  });

  const [months, setMonths] = useState(120);
  const [useManualSavings, setUseManualSavings] = useState(false);
  const [manualSavings, setManualSavings] = useState(25000);
  const [expenseInflation, setExpenseInflation] = useState(6);

  const [scenarios, setScenarios] = useState<Scenario[]>([]);
  const [compareScenarios, setCompareScenarios] = useState(false);

  const [allocations, setAllocations] = useState([
    { id: '1', name: 'Stocks (Equity)', rate: 12, percent: 50 },
    { id: '2', name: 'Bonds (Fixed Income)', rate: 6.5, percent: 30 },
    { id: '3', name: 'Real Estate', rate: 8, percent: 20 },
  ]);

  const handleAddIncome = () => setIncomes(prev => [...prev, { id: Math.random().toString(36).substr(2, 9), name: 'New Income', amount: 0, growth: 5 }]);
  const handleRemoveIncome = (id: string) => setIncomes(prev => prev.filter(i => i.id !== id));
  const updateIncome = (id: string, field: keyof IncomeStream, value: string) => {
    setIncomes(prev => prev.map(i => {
      if (i.id === id) {
        if (field === 'name') return { ...i, name: value };
        const num = parseFloat(value);
        return { ...i, [field]: isNaN(num) ? 0 : num };
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
  const calculatedSavings = totalIncome - totalExpense;
  const monthlySavings = useManualSavings ? manualSavings : calculatedSavings;
  const totalPercent = allocations.reduce((acc, curr) => acc + curr.percent, 0);
  const unallocatedPercent = Math.max(0, 100 - totalPercent);

  const projectionData = useMemo(() => {
    const projection = [];
    
    // Copy incomes to track their individual growth
    let currentIncomes = incomes.map(inc => ({ ...inc }));
    let currentMonthlyExpense = totalExpense;

    // Track state for each scenario
    const scenStates = scenarios.map(s => ({
      ...s,
      currentIncomes: s.incomes.map(inc => ({ ...inc })),
      currentExpense: s.totalExpense,
    }));

    for (let m = 1; m <= months; m++) {
      if (m > 1 && m % 12 === 1) { // Apply annual growth at the start of each new year
        currentIncomes.forEach(inc => {
          inc.amount *= (1 + inc.growth / 100);
        });
        currentMonthlyExpense *= (1 + expenseInflation / 100);

        scenStates.forEach(s => {
          s.currentIncomes.forEach(inc => {
            inc.amount *= (1 + inc.growth / 100);
          });
          s.currentExpense *= (1 + s.expenseInflation / 100);
        });
      }
      
      let currentMonthlyIncome = currentIncomes.reduce((acc, curr) => acc + curr.amount, 0);

      let currentSavings = currentMonthlyIncome - currentMonthlyExpense;
      if(useManualSavings) currentSavings = manualSavings;

      const dataPoint: any = {
        month: months > 36 && m % 12 === 0 ? `Y${m/12}` : (months <= 36 ? `M${m}` : `M${m}`),
        displayTimeline: months > 36 ? (m % 12 === 0 ? `Y${m/12}` : '') : `M${m}`,
        displayMonth: `Month ${m}`,
        Income: Math.round(currentMonthlyIncome),
        Spends: Math.round(currentMonthlyExpense),
        Savings: Math.max(0, Math.round(currentSavings)),
      };

      if (compareScenarios) {
        scenStates.forEach((s, idx) => {
          let sInc = s.currentIncomes.reduce((acc, curr) => acc + curr.amount, 0);
          let sSav = sInc - s.currentExpense;
          if (s.useManualSavings) sSav = s.manualSavings;
          dataPoint[`${s.name} Savings`] = Math.max(0, Math.round(sSav));
        });
      }

      projection.push(dataPoint);
    }
    
    return projection;
  }, [incomes, totalExpense, useManualSavings, manualSavings, months, expenseInflation, scenarios, compareScenarios]);

  const handleSaveScenario = () => {
    const newScen: Scenario = {
      id: Math.random().toString(36).substr(2, 9),
      name: `Scenario ${scenarios.length + 1}`,
      incomes,
      expenseInflation,
      useManualSavings,
      manualSavings,
      totalIncome,
      totalExpense
    };
    setScenarios([...scenarios, newScen]);
  };

  const removeScenario = (id: string) => {
    setScenarios(scenarios.filter(s => s.id !== id));
    if (scenarios.length <= 1) setCompareScenarios(false);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Future Simulation</h1>
          <p className="text-gray-500 text-sm italic">Forecast your savings and investment growth.</p>
        </div>
      </div>

      <div className="space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Income Column */}
          <Card className="border-white/5 flex flex-col h-[600px]">
            <CardHeader className="pb-4">
              <CardTitle className="text-white flex items-center justify-between text-base">
                <div className="flex items-center gap-2">
                  <ArrowDownRight className="w-5 h-5 text-emerald-500"/> Incomes
                </div>
                <button onClick={handleAddIncome} className="p-1 hover:bg-white/10 rounded-md transition-colors text-gray-400 hover:text-white">
                  <Plus className="w-4 h-4" />
                </button>
              </CardTitle>
            </CardHeader>
            <CardContent className="flex-1 flex flex-col overflow-hidden">
               <div className="space-y-3 flex-1 overflow-y-auto custom-scrollbar pr-2 pb-4">
                   {incomes.map(inc => (
                     <div key={inc.id} className="flex items-center gap-2 group">
                         <input type="text" value={inc.name} onChange={(e) => updateIncome(inc.id, 'name', e.target.value)} className="w-[35%] bg-[#141414] border border-white/10 rounded px-2 py-2 text-xs text-white focus:outline-none focus:border-emerald-500" placeholder="Source"/>
                         <div className="relative flex-1">
                           <span className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-500 text-xs">₹</span>
                           <input type="number" value={inc.amount} onChange={(e) => updateIncome(inc.id, 'amount', e.target.value)} className="w-full bg-[#141414] border border-white/10 rounded pl-6 pr-2 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"/>
                         </div>
                         <div className="relative w-[20%]">
                           <input type="number" value={inc.growth} onChange={(e) => updateIncome(inc.id, 'growth', e.target.value)} className="w-full bg-[#141414] border border-white/10 rounded px-2 py-2 text-xs text-white focus:outline-none focus:border-emerald-500" placeholder="Growth"/>
                           <span className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 text-[10px]">%</span>
                         </div>
                         <button onClick={() => handleRemoveIncome(inc.id)} className="text-red-400 opacity-0 group-hover:opacity-100 p-1">
                            <Trash2 className="w-4 h-4"/>
                         </button>
                     </div>
                  ))}
               </div>
               <div className="mt-4 pt-4 border-t border-white/5 bg-[#141414] p-3 rounded-lg border border-white/5 space-y-3">
                 <div className="flex justify-between items-center">
                   <span className="text-sm font-medium text-gray-400">Total Income</span>
                   <span className="text-base font-bold text-emerald-400">{formatCurrency(totalIncome)}</span>
                 </div>
               </div>
            </CardContent>
          </Card>

          {/* Expenses Column */}
          <Card className="border-white/5 flex flex-col h-[600px]">
            <CardHeader className="pb-4">
              <CardTitle className="text-white flex items-center justify-between text-base">
                <div className="flex items-center gap-2">
                  <ArrowUpRight className="w-5 h-5 text-rose-500"/> Expenses
                </div>
                <button onClick={handleAddExpense} className="p-1 hover:bg-white/10 rounded-md transition-colors text-gray-400 hover:text-white">
                  <Plus className="w-4 h-4" />
                </button>
              </CardTitle>
            </CardHeader>
            <CardContent className="flex-1 flex flex-col overflow-hidden">
               <div className="space-y-3 flex-1 overflow-y-auto custom-scrollbar pr-2 pb-4">
                  {expenses.map(exp => (
                     <div key={exp.id} className="flex items-center gap-2 group">
                         <input type="text" value={exp.name} onChange={(e) => updateExpense(exp.id, 'name', e.target.value)} className="w-[45%] bg-[#141414] border border-white/10 rounded px-2 py-2 text-xs text-white focus:outline-none focus:border-rose-500" placeholder="Expense"/>
                         <div className="relative flex-1">
                           <span className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-500 text-xs">₹</span>
                           <input type="number" value={exp.amount} onChange={(e) => updateExpense(exp.id, 'amount', e.target.value)} className="w-full bg-[#141414] border border-white/10 rounded pl-6 pr-2 py-2 text-xs text-white focus:outline-none focus:border-rose-500"/>
                         </div>
                         <button onClick={() => handleRemoveExpense(exp.id)} className="text-red-400 opacity-0 group-hover:opacity-100 p-1">
                            <Trash2 className="w-4 h-4"/>
                         </button>
                     </div>
                  ))}
               </div>
               <div className="mt-4 pt-4 border-t border-white/5 bg-[#141414] p-3 rounded-lg border border-white/5 space-y-3">
                 <div className="flex justify-between items-center text-xs text-gray-400">
                   <span>Annual Inflation (%)</span>
                   <input type="number" value={expenseInflation} onChange={(e) => setExpenseInflation(Number(e.target.value))} className="w-16 bg-[#1a1a1a] border border-white/10 rounded px-2 py-1 text-right text-white focus:outline-none focus:border-rose-500"/>
                 </div>
                 <div className="flex justify-between items-center">
                   <span className="text-sm font-medium text-gray-400">Total Expense</span>
                   <span className="text-base font-bold text-rose-400">{formatCurrency(totalExpense)}</span>
                 </div>
               </div>
            </CardContent>
          </Card>

          {/* Investment Portfolio Column */}
          <Card className="border-white/5 flex flex-col h-[600px]">
            <CardHeader className="pb-4">
              <CardTitle className="text-white flex items-center justify-between text-base">
                <div className="flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-blue-500"/> Portfolio
                </div>
                <button onClick={handleAddAllocation} className="p-1 hover:bg-white/10 rounded-md transition-colors text-gray-400 hover:text-white">
                  <Plus className="w-4 h-4" />
                </button>
              </CardTitle>
            </CardHeader>
            <CardContent className="flex-1 flex flex-col overflow-hidden">
              <div className="space-y-4 flex-1 overflow-y-auto custom-scrollbar pr-2 pb-4">
                {allocations.map((alloc) => (
                  <div key={alloc.id} className="bg-[#1a1a1a] p-4 rounded-xl border border-white/5 relative group">
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
                    <div className="flex gap-4">
                      <div className="flex-1">
                        <label className="text-[10px] text-gray-500 uppercase tracking-wide block mb-1">Return (%)</label>
                        <input
                          type="number"
                          value={alloc.rate}
                          onChange={(e) => updateAllocation(alloc.id, 'rate', e.target.value)}
                          className="w-full bg-[#141414] border border-white/10 rounded px-2 py-1.5 text-xs text-white focus:outline-none focus:border-blue-500"
                        />
                      </div>
                      <div className="flex-1">
                        <label className="text-[10px] text-gray-500 uppercase tracking-wide block mb-1">Alloc (%)</label>
                        <input
                          type="number"
                          value={alloc.percent}
                          onChange={(e) => updateAllocation(alloc.id, 'percent', e.target.value)}
                          className="w-full bg-[#141414] border border-white/10 rounded px-2 py-1.5 text-xs text-white focus:outline-none focus:border-blue-500"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-4 border-t border-white/5 pt-4">
                <div className="bg-white/[0.02] p-3 rounded-lg border border-white/5 mb-3">
                  <div className="flex justify-between items-center mb-3">
                    <span className="text-sm font-medium text-blue-400">Monthly Savings</span>
                    <label className="flex items-center gap-2 text-xs text-gray-400 cursor-pointer">
                      <input type="checkbox" checked={useManualSavings} onChange={(e) => setUseManualSavings(e.target.checked)} className="accent-blue-500" />
                      Manual Amount
                    </label>
                  </div>
                  {useManualSavings ? (
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm">₹</span>
                      <input type="number" value={manualSavings} onChange={(e) => setManualSavings(Number(e.target.value))} className="w-full bg-[#141414] border border-blue-500/30 rounded-md pl-7 pr-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500"/>
                    </div>
                  ) : (
                    <>
                      <div className="flex justify-between items-center">
                        <span className="text-xs text-gray-400">Available to Invest</span>
                        <span className={`text-sm font-bold ${calculatedSavings > 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                          {formatCurrency(calculatedSavings)}
                        </span>
                      </div>
                      {calculatedSavings <= 0 && (
                        <p className="text-[10px] text-amber-500 mt-1 flex items-center gap-1">
                          <AlertTriangle className="w-3 h-3"/> Expenses must be lower than income.
                        </p>
                      )}
                    </>
                  )}
                </div>

                <div className="flex justify-between items-center text-xs px-1">
                  <span className="text-gray-400">Total Allocated:</span>
                  <span className={totalPercent > 100 ? 'text-red-400 font-bold' : 'text-gray-200 font-bold'}>{totalPercent}%</span>
                </div>
                {totalPercent > 100 && (
                  <p className="text-[10px] text-red-400 mt-1 px-1">Exceeds 100%. Please adjust.</p>
                )}
                {unallocatedPercent > 0 && totalPercent <= 100 && (
                  <div className="flex justify-between items-center text-xs mt-1 text-gray-500 px-1">
                    <span>Unallocated (Cash):</span>
                    <span>{unallocatedPercent.toFixed(1)}%</span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        <div>
          <Card className="border-white/5 w-full flex flex-col">
            <CardHeader className="flex flex-row justify-between items-center pb-2">
              <CardTitle className="text-white flex items-center gap-2">
                <FastForward className="w-5 h-5 text-gray-500"/> Projection
              </CardTitle>
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-500 mr-2">Timeline:</span>
                <div className="flex gap-1 bg-white/5 p-1 rounded-lg">
                  {[1, 3, 5, 10, 20].map(y => (
                    <button 
                      key={y}
                      onClick={() => setMonths(y * 12)}
                      className={`px-3 py-1 text-xs rounded-md transition-colors ${months === y * 12 ? 'bg-blue-600 text-white font-medium' : 'text-gray-400 hover:text-white hover:bg-white/10'}`}
                    >
                      {y}Y
                    </button>
                  ))}
                </div>
              </div>
            </CardHeader>
            <CardContent className="flex-1 min-h-[400px] pt-4">
               <div className="mb-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
                 <div className="flex gap-6">
                   <div>
                     <p className="text-xs text-gray-500">Projected Monthly Income (End)</p>
                     <p className="text-2xl font-bold text-emerald-400">
                       {projectionData.length > 0 ? formatCurrency(projectionData[projectionData.length - 1].Income) : '₹0'}
                     </p>
                   </div>
                   <div>
                     <p className="text-xs text-gray-500">Projected Monthly Spends (End)</p>
                     <p className="text-xl font-semibold text-rose-400">
                       {projectionData.length > 0 ? formatCurrency(projectionData[projectionData.length - 1].Spends) : '₹0'}
                     </p>
                   </div>
                   <div>
                     <p className="text-xs text-gray-500">Projected Monthly Savings (End)</p>
                     <p className="text-xl font-semibold text-blue-400">
                       {projectionData.length > 0 ? formatCurrency(projectionData[projectionData.length - 1].Savings) : '₹0'}
                     </p>
                   </div>
                 </div>

                 <div className="flex flex-col items-end gap-2">
                   <button 
                     onClick={handleSaveScenario}
                     className="px-3 py-1.5 flex items-center gap-2 bg-blue-600/20 text-blue-400 hover:bg-blue-600/30 rounded-lg text-xs font-medium transition-colors"
                   >
                     <Save className="w-3.5 h-3.5" /> Save Current as Scenario
                   </button>
                   {scenarios.length > 0 && (
                     <div className="flex items-center gap-2">
                       <label className="flex items-center gap-2 text-xs text-gray-400 cursor-pointer">
                         <input type="checkbox" checked={compareScenarios} onChange={(e) => setCompareScenarios(e.target.checked)} className="accent-blue-500" />
                         Compare Saved ({scenarios.length})
                       </label>
                     </div>
                   )}
                 </div>
               </div>

               {scenarios.length > 0 && compareScenarios && (
                 <div className="mb-4 p-3 bg-white/5 border border-white/5 rounded-xl flex flex-wrap gap-2">
                   {scenarios.map((scen, idx) => (
                     <div key={scen.id} className="flex items-center gap-2 bg-[#141414] px-3 py-1.5 rounded-lg border border-white/5 group">
                       <div className="w-2 h-2 rounded-full" style={{ backgroundColor: COLORS[idx % COLORS.length] }}></div>
                       <div className="flex flex-col">
                         <span className="text-xs font-medium text-white">{scen.name}</span>
                         <span className="text-[10px] text-gray-500">Streams: {scen.incomes.length} | Infl: {scen.expenseInflation}%</span>
                       </div>
                       <button onClick={() => removeScenario(scen.id)} className="ml-2 text-gray-500 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity">
                         <Trash2 className="w-3 h-3" />
                       </button>
                     </div>
                   ))}
                 </div>
               )}

               <div className="h-[350px] w-full mt-4">
                 <ResponsiveContainer width="100%" height="100%">
                   <LineChart data={projectionData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                     <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
                     <XAxis 
                       dataKey="displayTimeline" 
                       stroke="#9CA3AF" 
                       fontSize={11} 
                       tickLine={false} 
                       axisLine={false} 
                       interval="preserveStartEnd"
                     />
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
                       labelFormatter={(_, payload) => payload?.[0]?.payload?.displayMonth || 'Timeline'}
                       contentStyle={{ backgroundColor: '#141414', borderColor: 'rgba(255,255,255,0.05)', color: '#fff', borderRadius: '8px' }}
                       itemStyle={{ color: '#fff' }}
                       labelStyle={{ color: '#9CA3AF', marginBottom: '8px' }}
                     />
                     <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '20px' }} />
                     
                     <Line type="monotone" dataKey="Income" stroke="#10b981" strokeWidth={3} dot={false} activeDot={{ r: 6 }} hide={compareScenarios} />
                     <Line type="monotone" dataKey="Spends" stroke="#f43f5e" strokeWidth={3} dot={false} activeDot={{ r: 6 }} hide={compareScenarios} />
                     <Line type="monotone" dataKey="Savings" name={compareScenarios ? "Current Savings" : "Savings"} stroke="#3b82f6" strokeWidth={3} dot={false} activeDot={{ r: 6 }} />
                     
                     {compareScenarios && scenarios.map((scen, idx) => (
                       <Line 
                         key={scen.id} 
                         type="monotone" 
                         dataKey={`${scen.name} Savings`} 
                         stroke={COLORS[idx % COLORS.length]} 
                         strokeWidth={2} 
                         strokeDasharray="5 5"
                         dot={false} 
                         activeDot={{ r: 4 }} 
                       />
                     ))}
                   </LineChart>
                 </ResponsiveContainer>
               </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
