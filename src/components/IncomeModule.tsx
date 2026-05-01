import React, { useState, useMemo } from "react";
import { StatementData } from "../lib/gemini";
import { Card, CardHeader, CardTitle, CardContent } from "./ui/Card";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Cell } from "recharts";
import { TrendingUp, AlertCircle, Plus, Trash2, Edit2, Check } from "lucide-react";

const formatCurrency = (val: number) => 
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(val);

export function IncomeModule({ data }: { data: StatementData }) {
  const sourceIncome = useMemo(() => {
    const incomes = data.transactions.filter(t => t.type === 'income');
    const map = new Map<string, number>();
    incomes.forEach(t => {
      map.set(t.category, (map.get(t.category) || 0) + t.amount);
    });
    return map;
  }, [data.transactions]);

  const [incomeSources, setIncomeSources] = useState<{id: string; name: string; target: number}[]>(() => {
    const fromData = Array.from(sourceIncome.entries()).map(([name, amount]) => ({
      id: Math.random().toString(36).substr(2, 9),
      name,
      target: Math.max(Math.round((amount) / 100) * 100, 100)
    }));

    if (fromData.length === 0) {
      return [
        { id: '1', name: 'Primary Salary', target: 200000 },
        { id: '2', name: 'Real Estate Business', target: 50000 },
        { id: '3', name: 'Tech / Consulting', target: 30000 },
      ];
    }
    return fromData;
  });

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");

  const handleAddSource = () => {
    setIncomeSources(prev => [{
      id: Math.random().toString(36).substring(2, 9),
      name: 'New Income Source',
      target: 0
    }, ...prev]);
  };

  const handleRemoveSource = (id: string) => {
    setIncomeSources(prev => prev.filter(s => s.id !== id));
  };

  const handleTargetChange = (id: string, value: string) => {
    const num = parseInt(value.replace(/[^0-9]/g, ''), 10);
    setIncomeSources(prev => prev.map(s => s.id === id ? { ...s, target: isNaN(num) ? 0 : num } : s));
  };

  const handleSaveEdit = (id: string) => {
    if (editName.trim()) {
      setIncomeSources(prev => prev.map(s => s.id === id ? { ...s, name: editName.trim() } : s));
    }
    setEditingId(null);
  };

  const chartData = useMemo(() => {
     const dataList: any[] = [];
     const processed = new Set<string>();

     incomeSources.forEach(s => {
         dataList.push({
             id: s.id,
             name: s.name,
             target: s.target,
             actual: sourceIncome.get(s.name) || 0
         });
         processed.add(s.name);
     });

     sourceIncome.forEach((amount, name) => {
         if (!processed.has(name)) {
             dataList.push({
                 id: 'unplanned-' + name,
                 name: name,
                 target: 0,
                 actual: amount
             });
         }
     });

     return dataList.sort((a, b) => b.target - a.target);
  }, [sourceIncome, incomeSources]);

  const totalTarget = incomeSources.reduce((acc, curr) => acc + curr.target, 0);

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Income & Benchmarks</h1>
          <p className="text-gray-500 text-sm italic">Set target benchmarks for your salary and other income sources.</p>
        </div>
        <div className="bg-[#141414] border border-white/5 rounded-xl px-4 py-2 flex items-center gap-4">
          <div className="text-sm">
            <p className="text-gray-500">Total Benchmark target</p>
            <p className="text-lg font-bold text-white">{formatCurrency(totalTarget)}</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="col-span-1 lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-gray-500"/> Target vs Actual Income
            </CardTitle>
          </CardHeader>
          <CardContent className="h-[450px]">
             {chartData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 50 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)"/>
                    <XAxis 
                      dataKey="name" 
                      stroke="#9CA3AF" 
                      fontSize={11} 
                      tickLine={false} 
                      axisLine={false} 
                      angle={-45} 
                      textAnchor="end"
                      height={60}
                    />
                    <YAxis 
                      tickFormatter={(v) => `₹${v}`} 
                      stroke="#9CA3AF" 
                      fontSize={11} 
                      tickLine={false} 
                      axisLine={false} 
                    />
                    <RechartsTooltip 
                      cursor={{fill: 'rgba(255,255,255,0.02)'}}
                      formatter={(value: number) => formatCurrency(value)}
                      contentStyle={{ backgroundColor: '#141414', borderColor: 'rgba(255,255,255,0.05)', color: '#fff', borderRadius: '8px' }}
                      itemStyle={{ color: '#fff' }}
                    />
                    <Bar dataKey="target" name="Benchmark Target" fill="#10b981" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="actual" name="Actual Income" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex h-full items-center justify-center text-sm text-gray-500">
                  No income data to visualize.
                </div>
              )}
          </CardContent>
        </Card>

        <Card className="col-span-1 border-white/5 flex flex-col h-[525px]">
          <CardHeader className="flex flex-row justify-between items-center">
             <CardTitle className="text-white">Adjust Benchmarks</CardTitle>
             <button 
                onClick={handleAddSource}
                className="p-1.5 hover:bg-white/10 rounded-md transition-colors text-gray-400 hover:text-white"
             >
                <Plus className="w-4 h-4" />
             </button>
          </CardHeader>
          <div className="flex-1 overflow-y-auto px-6 pb-6 space-y-4 custom-scrollbar">
            {chartData.map((item) => {
              const variance = item.actual - item.target; // Positive is good for income
              const isUnder = variance < 0;
              const percentAchieved = item.target > 0 ? (item.actual / item.target) * 100 : 0;
              
              return (
                <div key={item.id} className="bg-[#1a1a1a] p-4 rounded-xl border border-white/5 flex flex-col gap-3 group relative">
                  {item.id.toString().startsWith('unplanned-') ? (
                     <div className="flex justify-between items-center">
                        <span className="font-medium text-sm text-gray-400 italic">{item.name} (Unplanned)</span>
                     </div>
                  ) : (
                     <>
                        <button 
                          onClick={() => handleRemoveSource(item.id)}
                          className="absolute -top-2 -right-2 bg-red-500/10 border border-red-500/20 text-red-400 p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>

                        <div className="flex justify-between items-center pr-3">
                          {editingId === item.id ? (
                             <div className="flex items-center gap-2 flex-1">
                               <input 
                                 type="text" 
                                 value={editName}
                                 onChange={(e) => setEditName(e.target.value)}
                                 className="flex-1 bg-[#141414] border border-blue-500/50 rounded px-2 py-1 text-sm text-white focus:outline-none"
                                 autoFocus
                               />
                               <button onClick={() => handleSaveEdit(item.id)} className="text-emerald-500 hover:text-emerald-400">
                                 <Check className="w-4 h-4" />
                               </button>
                             </div>
                          ) : (
                             <div className="flex items-center gap-2">
                               <span className="font-medium text-sm text-gray-200">{item.name}</span>
                               <button 
                                 onClick={() => { setEditingId(item.id); setEditName(item.name); }}
                                 className="opacity-0 group-hover:opacity-100 transition-opacity text-gray-500 hover:text-gray-300"
                               >
                                 <Edit2 className="w-3 h-3" />
                               </button>
                             </div>
                          )}
                          {isUnder && <AlertCircle className="w-4 h-4 text-amber-500" />}
                        </div>
                        
                        <div>
                          <label className="text-xs text-gray-500 mb-1 block">Target Benchmark (₹)</label>
                          <div className="relative">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">₹</span>
                            <input 
                              type="text" 
                              value={item.target.toString()}
                              onChange={(e) => handleTargetChange(item.id, e.target.value)}
                              className="w-full bg-[#141414] border border-white/10 rounded-lg pl-8 pr-3 py-1.5 text-sm text-white focus:outline-none focus:border-emerald-500 transition-colors"
                            />
                          </div>
                        </div>
                     </>
                  )}

                  <div>
                     <div className="flex justify-between text-xs mb-1.5">
                        <span className="text-gray-400">Actual: {formatCurrency(item.actual)}</span>
                        <span className={isUnder ? 'text-amber-500' : 'text-emerald-400'}>
                          {item.target > 0 ? (isUnder ? '-' : '+') : ''}{item.target > 0 ? formatCurrency(Math.abs(variance)) : ''}
                        </span>
                     </div>
                     {item.target > 0 && (
                       <div className="h-1.5 w-full bg-white/10 rounded-full overflow-hidden">
                         <div 
                           className={`h-full rounded-full transition-all ${isUnder ? 'bg-amber-500' : 'bg-emerald-500'}`} 
                           style={{ width: `${Math.min(percentAchieved, 100)}%` }}
                         />
                       </div>
                     )}
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      </div>
    </div>
  );
}
