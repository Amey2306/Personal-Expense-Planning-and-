import React, { useState, useMemo } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from './ui/Card';
import { Calendar, Plus, Trash2, TrendingUp, DollarSign, Activity } from 'lucide-react';
import { StatementData } from '../lib/gemini';
import { ResponsiveContainer, ComposedChart, Line, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend } from 'recharts';

const formatCurrency = (val: number) => 
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(val);

interface LifeEvent {
  id: string;
  name: string;
  year: number;
  cost: number;
}

export function YearlyPlannerModule({ data }: { data: StatementData }) {
  const currentYear = new Date().getFullYear();
  const [yearsToPlan, setYearsToPlan] = useState(20);
  
  const [baseIncome, setBaseIncome] = useState(1500000);
  const [incomeGrowth, setIncomeGrowth] = useState(5);
  
  const [baseExpense, setBaseExpense] = useState(600000);
  const [expenseInflation, setExpenseInflation] = useState(6);
  
  const [investmentReturn, setInvestmentReturn] = useState(12);
  const [startingPortfolio, setStartingPortfolio] = useState(500000);

  const [events, setEvents] = useState<LifeEvent[]>([
    { id: '1', name: 'Sister Wedding', year: currentYear + 2, cost: 500000 },
    { id: '2', name: 'Mom & Dad Insurance', year: currentYear + 1, cost: 100000 },
    { id: '3', name: 'Car Upgrade', year: currentYear + 5, cost: 800000 }
  ]);

  const handleAddEvent = () => {
    setEvents([...events, {
      id: Math.random().toString(36).substr(2, 9),
      name: 'New Event',
      year: currentYear + 1,
      cost: 50000
    }]);
  };

  const updateEvent = (id: string, field: keyof LifeEvent, value: any) => {
    setEvents(events.map(e => e.id === id ? { ...e, [field]: value } : e));
  };

  const removeEvent = (id: string) => {
    setEvents(events.filter(e => e.id !== id));
  };

  const projection = useMemo(() => {
    const proj = [];
    let currentPortfolio = startingPortfolio;
    
    let currentAnnualIncome = baseIncome;
    let currentAnnualExpense = baseExpense;

    for (let yr = 0; yr < yearsToPlan; yr++) {
      const yearStr = currentYear + yr;
      
      // Calculate growth and inflation from year 2 onwards
      if (yr > 0) {
        currentAnnualIncome *= (1 + incomeGrowth / 100);
        currentAnnualExpense *= (1 + expenseInflation / 100);
      }

      // Sum up event costs for this year
      const yearEvents = events.filter(e => e.year === yearStr);
      const eventsCost = yearEvents.reduce((sum, e) => sum + e.cost, 0);

      const netSavings = currentAnnualIncome - currentAnnualExpense - eventsCost;
      
      // Calculate portfolio growth
      // Add savings at the end of the year (simplification)
      currentPortfolio = currentPortfolio * (1 + investmentReturn / 100) + netSavings;

      proj.push({
        year: yearStr,
        Income: Math.round(currentAnnualIncome),
        Expenses: Math.round(currentAnnualExpense),
        'Event Costs': eventsCost,
        Savings: Math.round(netSavings),
        Portfolio: Math.round(Math.max(0, currentPortfolio)),
        events: yearEvents
      });
    }

    return proj;
  }, [baseIncome, incomeGrowth, baseExpense, expenseInflation, investmentReturn, startingPortfolio, yearsToPlan, events, currentYear]);

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">Timeline & Milestones</h1>
          <p className="text-gray-500 text-xs sm:text-sm italic">Plan for major life events and see your long-term compounding.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Settings Column */}
        <div className="space-y-6">
          <Card className="border-white/5">
            <CardHeader className="pb-4">
              <CardTitle className="text-white flex items-center gap-2 text-base">
                <Activity className="w-5 h-5 text-blue-500"/> Baseline Economics
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-gray-500 block mb-1">Starting Portfolio</label>
                  <input type="number" value={startingPortfolio} onChange={e => setStartingPortfolio(Number(e.target.value))} className="w-full bg-[#141414] border border-white/10 rounded px-2 py-1.5 text-sm text-white focus:outline-none focus:border-blue-500"/>
                </div>
                <div>
                  <label className="text-xs text-gray-500 block mb-1">Return Rate (%)</label>
                  <input type="number" value={investmentReturn} onChange={e => setInvestmentReturn(Number(e.target.value))} className="w-full bg-[#141414] border border-white/10 rounded px-2 py-1.5 text-sm text-white focus:outline-none focus:border-blue-500"/>
                </div>
              </div>
              <div className="pt-2 border-t border-white/5 space-y-3">
                <div className="flex justify-between items-center gap-4">
                  <div className="flex-1">
                    <label className="text-xs text-emerald-500/80 block mb-1">Base Annual Income</label>
                    <input type="number" value={baseIncome} onChange={e => setBaseIncome(Number(e.target.value))} className="w-full bg-[#141414] border border-white/10 rounded px-2 py-1.5 text-sm text-white focus:outline-none focus:border-emerald-500"/>
                  </div>
                  <div className="w-20">
                    <label className="text-[10px] text-gray-500 block mb-1">Growth %</label>
                    <input type="number" value={incomeGrowth} onChange={e => setIncomeGrowth(Number(e.target.value))} className="w-full bg-[#141414] border border-white/10 rounded px-2 py-1.5 text-sm text-white focus:outline-none focus:border-emerald-500"/>
                  </div>
                </div>
                <div className="flex justify-between items-center gap-4">
                  <div className="flex-1">
                    <label className="text-xs text-rose-500/80 block mb-1">Base Annual Expense</label>
                    <input type="number" value={baseExpense} onChange={e => setBaseExpense(Number(e.target.value))} className="w-full bg-[#141414] border border-white/10 rounded px-2 py-1.5 text-sm text-white focus:outline-none focus:border-rose-500"/>
                  </div>
                  <div className="w-20">
                    <label className="text-[10px] text-gray-500 block mb-1">Infl %</label>
                    <input type="number" value={expenseInflation} onChange={e => setExpenseInflation(Number(e.target.value))} className="w-full bg-[#141414] border border-white/10 rounded px-2 py-1.5 text-sm text-white focus:outline-none focus:border-rose-500"/>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-white/5 flex flex-col h-[400px]">
             <CardHeader className="flex flex-row justify-between items-center pb-2">
               <CardTitle className="text-white flex items-center gap-2 text-base">
                 <Calendar className="w-5 h-5 text-amber-500"/> Life Events
               </CardTitle>
               <button onClick={handleAddEvent} className="p-1 hover:bg-white/10 rounded-md transition-colors text-gray-400 hover:text-white">
                 <Plus className="w-4 h-4" />
               </button>
             </CardHeader>
             <CardContent className="flex-1 overflow-y-auto custom-scrollbar pr-2 space-y-3">
               {events.sort((a,b) => a.year - b.year).map(ev => (
                 <div key={ev.id} className="bg-[#1a1a1a] p-3 rounded-lg border border-white/5 group relative">
                   <button onClick={() => removeEvent(ev.id)} className="absolute -top-2 -right-2 bg-red-500/10 border border-red-500/20 text-red-400 p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
                     <Trash2 className="w-3 h-3" />
                   </button>
                   <input 
                     type="text" 
                     value={ev.name} 
                     onChange={e => updateEvent(ev.id, 'name', e.target.value)}
                     className="w-full bg-transparent border-b border-white/10 focus:border-amber-500 px-1 py-1 mb-2 text-sm text-white focus:outline-none font-medium"
                   />
                   <div className="flex gap-2">
                     <div className="w-24">
                       <label className="text-[10px] text-gray-500 block mb-1">Year</label>
                       <input type="number" value={ev.year} onChange={e => updateEvent(ev.id, 'year', Number(e.target.value))} className="w-full bg-[#141414] border border-white/10 rounded px-2 py-1 text-xs text-white focus:outline-none focus:border-amber-500"/>
                     </div>
                     <div className="flex-1">
                       <label className="text-[10px] text-gray-500 block mb-1">Cost (₹)</label>
                       <input type="number" value={ev.cost} onChange={e => updateEvent(ev.id, 'cost', Number(e.target.value))} className="w-full bg-[#141414] border border-white/10 rounded px-2 py-1 text-xs text-white focus:outline-none focus:border-amber-500"/>
                     </div>
                   </div>
                 </div>
               ))}
               {events.length === 0 && (
                 <div className="text-center p-4 text-sm text-gray-500 border border-dashed border-white/10 rounded">
                   No massive events planned. Add some to see impact.
                 </div>
               )}
             </CardContent>
          </Card>
        </div>

        {/* Chart & Data Column */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="border-white/5">
            <CardHeader className="flex flex-row justify-between items-center pb-2">
               <CardTitle className="text-white flex items-center gap-2 text-base">
                 <TrendingUp className="w-5 h-5 text-blue-500"/> Cashflow & Wealth Projection
               </CardTitle>
               <div className="flex items-center gap-2">
                 <span className="text-xs text-gray-500">Plan Horizon:</span>
                 <select 
                   value={yearsToPlan} 
                   onChange={e => setYearsToPlan(Number(e.target.value))}
                   className="bg-[#141414] border border-white/10 text-xs text-white rounded px-2 py-1 focus:outline-none"
                 >
                   <option value={10}>10 Years</option>
                   <option value={20}>20 Years</option>
                   <option value={30}>30 Years</option>
                   <option value={40}>40 Years</option>
                 </select>
               </div>
            </CardHeader>
            <CardContent>
              <div className="h-[350px] w-full mt-4">
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart data={projection} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
                    <XAxis 
                      dataKey="year" 
                      stroke="#9CA3AF" 
                      fontSize={11} 
                      tickLine={false} 
                      axisLine={false} 
                    />
                    <YAxis 
                      yAxisId="left"
                      tickFormatter={(v) => `₹${(v/100000).toFixed(1)}L`} 
                      stroke="#9CA3AF" 
                      fontSize={11} 
                      tickLine={false} 
                      axisLine={false}
                      width={50}
                    />
                    <YAxis 
                      yAxisId="right"
                      orientation="right"
                      tickFormatter={(v) => `₹${(v/10000000).toFixed(1)}Cr`} 
                      stroke="#3b82f6" 
                      fontSize={11} 
                      tickLine={false} 
                      axisLine={false}
                      width={50}
                    />
                    <RechartsTooltip 
                      formatter={(value: number, name: string) => [formatCurrency(value), name]}
                      labelFormatter={(label) => `Year: ${label}`}
                      contentStyle={{ backgroundColor: '#141414', borderColor: 'rgba(255,255,255,0.05)', color: '#fff', borderRadius: '8px' }}
                      itemStyle={{ color: '#fff' }}
                      labelStyle={{ color: '#9CA3AF', marginBottom: '8px' }}
                    />
                    <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '20px' }} />
                    
                    <Bar yAxisId="left" dataKey="Income" fill="#10b981" opacity={0.6} radius={[4,4,0,0]} />
                    <Bar yAxisId="left" dataKey="Expenses" fill="#f43f5e" opacity={0.6} radius={[4,4,0,0]} stackId="a" />
                    <Bar yAxisId="left" dataKey="Event Costs" fill="#f59e0b" opacity={0.8} radius={[4,4,0,0]} stackId="a" />
                    
                    <Line yAxisId="right" type="monotone" dataKey="Portfolio" stroke="#3b82f6" strokeWidth={3} dot={false} activeDot={{ r: 6 }} />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          <Card className="border-white/5">
            <CardHeader className="pb-2">
              <CardTitle className="text-white flex items-center gap-2 text-base">
                Data Review
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm whitespace-nowrap">
                  <thead>
                    <tr className="border-b border-white/5 text-gray-500">
                      <th className="px-4 py-3 font-medium">Year</th>
                      <th className="px-4 py-3 font-medium text-emerald-400">Income</th>
                      <th className="px-4 py-3 font-medium text-rose-400">Regular Exp</th>
                      <th className="px-4 py-3 font-medium text-amber-400">Event Cost</th>
                      <th className="px-4 py-3 font-medium text-gray-300">Savings Added</th>
                      <th className="px-4 py-3 font-medium text-blue-400 text-right">End Portfolio</th>
                    </tr>
                  </thead>
                  <tbody>
                    {projection.map((p, idx) => (
                      <tr key={idx} className="border-b border-white/5 hover:bg-white/[0.02] transition-colors">
                        <td className="px-4 py-3 font-medium text-gray-300 flex items-center gap-2">
                          {p.year}
                          {p.events.length > 0 && (
                            <span className="flex gap-1" title={p.events.map((e: any) => e.name).join(', ')}>
                              <Calendar className="w-3 h-3 text-amber-500" />
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3">{formatCurrency(p.Income)}</td>
                        <td className="px-4 py-3">{formatCurrency(p.Expenses)}</td>
                        <td className="px-4 py-3 text-amber-400">{p['Event Costs'] > 0 ? formatCurrency(p['Event Costs']) : '-'}</td>
                        <td className={`px-4 py-3 font-medium ${p.Savings >= 0 ? 'text-emerald-400/80' : 'text-red-400'}`}>
                          {p.Savings > 0 ? '+' : ''}{formatCurrency(p.Savings)}
                        </td>
                        <td className="px-4 py-3 text-right font-bold text-blue-400">{formatCurrency(p.Portfolio)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
