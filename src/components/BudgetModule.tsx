import React, { useState, useMemo } from "react";
import { StatementData } from "../lib/gemini";
import { Card, CardHeader, CardTitle, CardContent } from "./ui/Card";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Cell } from "recharts";
import { Target, AlertTriangle, Plus, Trash2, Edit2, Check } from "lucide-react";

const formatCurrency = (val: number) => 
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(val);

export function BudgetModule({ data }: { data: StatementData }) {
  // Aggregate actual spend by category
  const categorySpend = useMemo(() => {
    const expenses = data.transactions.filter(t => t.type === 'expense');
    const map = new Map<string, number>();
    expenses.forEach(t => {
      map.set(t.category, (map.get(t.category) || 0) + t.amount);
    });
    return map;
  }, [data.transactions]);

  const [budgetCategories, setBudgetCategories] = useState<{id: string; name: string; budget: number}[]>(() => {
    const fromData = Array.from(categorySpend.entries()).map(([name, amount]) => ({
      id: Math.random().toString(36).substr(2, 9),
      name,
      budget: Math.max(Math.round((amount * 0.9) / 100) * 100, 100)
    }));

    if (fromData.length === 0) {
      return [
        { id: '1', name: 'Home Loan EMI', budget: 35000 },
        { id: '2', name: 'Personal Loan EMI', budget: 15233 },
        { id: '3', name: 'TV & Speaker EMI', budget: 4500 },
        { id: '4', name: 'Home Expenses', budget: 30000 },
        { id: '5', name: 'Daily Travel (Train/Auto)', budget: 5000 },
        { id: '6', name: 'Personal (Lunch/Dinner/Smoke)', budget: 12000 },
      ];
    }
    return fromData;
  });

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");

  const handleAddCategory = () => {
    setBudgetCategories(prev => [{
      id: Math.random().toString(36).substring(2, 9),
      name: 'New Category',
      budget: 0
    }, ...prev]);
  };

  const handleRemoveCategory = (id: string) => {
    setBudgetCategories(prev => prev.filter(c => c.id !== id));
  };

  const handleBudgetChange = (id: string, value: string) => {
    const num = parseInt(value.replace(/[^0-9]/g, ''), 10);
    setBudgetCategories(prev => prev.map(c => c.id === id ? { ...c, budget: isNaN(num) ? 0 : num } : c));
  };

  const handleSaveEdit = (id: string) => {
    if (editName.trim()) {
      setBudgetCategories(prev => prev.map(c => c.id === id ? { ...c, name: editName.trim() } : c));
    }
    setEditingId(null);
  };

  const chartData = useMemo(() => {
     const dataList: any[] = [];
     const processed = new Set<string>();

     budgetCategories.forEach(cat => {
         dataList.push({
             id: cat.id,
             name: cat.name,
             budget: cat.budget,
             actual: categorySpend.get(cat.name) || 0
         });
         processed.add(cat.name);
     });

     // Append unbudgeted expenses
     categorySpend.forEach((amount, name) => {
         if (!processed.has(name)) {
             dataList.push({
                 id: 'unbudgeted-' + name,
                 name: name,
                 budget: 0,
                 actual: amount
             });
         }
     });

     return dataList.sort((a, b) => b.budget - a.budget);
  }, [categorySpend, budgetCategories]);

  const totalBudget = budgetCategories.reduce((acc, curr) => acc + curr.budget, 0);

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Budget & Planning</h1>
          <p className="text-gray-500 text-sm italic">Set category budgets and monitor your spending.</p>
        </div>
        <div className="bg-[#141414] border border-white/5 rounded-xl px-4 py-2 flex items-center gap-4">
          <div className="text-sm">
            <p className="text-gray-500">Total Budget</p>
            <p className="text-lg font-bold text-white">{formatCurrency(totalBudget)}</p>
          </div>
          <div className="w-px h-8 bg-white/10"></div>
          <div className="text-sm">
            <p className="text-gray-500">Target Savings</p>
            <p className="text-lg font-bold text-emerald-400">
               {formatCurrency(Math.max(0, data.summary.totalIncome - totalBudget))}
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="col-span-1 lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Target className="w-5 h-5 text-gray-500"/> Budget vs Actual Spend
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
                    <Bar dataKey="budget" name="Budget Limit" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="actual" name="Actual Spend" fill="#f43f5e" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex h-full items-center justify-center text-sm text-gray-500">
                  No expense data to visualize.
                </div>
              )}
          </CardContent>
        </Card>

        <Card className="col-span-1 border-white/5 flex flex-col h-[525px]">
          <CardHeader className="flex flex-row justify-between items-center">
             <CardTitle className="text-white">Adjust Budgets</CardTitle>
             <button 
                onClick={handleAddCategory}
                className="p-1.5 hover:bg-white/10 rounded-md transition-colors text-gray-400 hover:text-white"
             >
                <Plus className="w-4 h-4" />
             </button>
          </CardHeader>
          <div className="flex-1 overflow-y-auto px-6 pb-6 space-y-4 custom-scrollbar">
            {chartData.map((item) => {
              const variance = item.budget - item.actual;
              const isOver = variance < 0;
              const percentUsed = item.budget > 0 ? (item.actual / item.budget) * 100 : 0;
              
              return (
                <div key={item.id} className="bg-[#1a1a1a] p-4 rounded-xl border border-white/5 flex flex-col gap-3 group relative">
                  {item.id.toString().startsWith('unbudgeted-') ? (
                     <div className="flex justify-between items-center">
                        <span className="font-medium text-sm text-gray-400 italic">{item.name} (Unbudgeted)</span>
                        <AlertTriangle className="w-4 h-4 text-amber-500 opacity-50" />
                     </div>
                  ) : (
                     <>
                        <button 
                          onClick={() => handleRemoveCategory(item.id)}
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
                          {isOver && <AlertTriangle className="w-4 h-4 text-amber-500" />}
                        </div>
                        
                        <div>
                          <label className="text-xs text-gray-500 mb-1 block">Budget Limit (₹)</label>
                          <div className="relative">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">₹</span>
                            <input 
                              type="text" 
                              value={item.budget.toString()}
                              onChange={(e) => handleBudgetChange(item.id, e.target.value)}
                              className="w-full bg-[#141414] border border-white/10 rounded-lg pl-8 pr-3 py-1.5 text-sm text-white focus:outline-none focus:border-blue-500 transition-colors"
                            />
                          </div>
                        </div>
                     </>
                  )}

                  <div>
                     <div className="flex justify-between text-xs mb-1.5">
                        <span className="text-gray-400">Actual: {formatCurrency(item.actual)}</span>
                        <span className={isOver ? 'text-amber-500' : 'text-emerald-400'}>
                          {item.budget > 0 ? (isOver ? '-' : '+') : ''}{item.budget > 0 ? formatCurrency(Math.abs(variance)) : ''}
                        </span>
                     </div>
                     {item.budget > 0 && (
                       <div className="h-1.5 w-full bg-white/10 rounded-full overflow-hidden">
                         <div 
                           className={`h-full rounded-full transition-all ${isOver ? 'bg-amber-500' : 'bg-blue-500'}`} 
                           style={{ width: `${Math.min(percentUsed, 100)}%` }}
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
