import { StatementData, Transaction } from "../lib/gemini";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/Card";
import { PieChart, Pie, Cell, Tooltip as RechartsTooltip, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid } from "recharts";
import { ArrowDownRight, ArrowUpRight, Lightbulb, PiggyBank, Receipt, Wallet, Filter } from "lucide-react";
import React, { useMemo, useState } from "react";

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#6366f1', '#14b8a6', '#f43f5e'];

const formatCurrency = (val: number) => 
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(val);

export function DashboardLayout({ data }: { data: StatementData }) {
  const { summary, insights, transactions } = data;

  const [txTypeFilter, setTxTypeFilter] = useState<"all" | "income" | "expense">("all");
  const [txCategoryFilter, setTxCategoryFilter] = useState<string>("all");
  const [txDateFilter, setTxDateFilter] = useState<string>("all");

  // Aggregate by Category
  const categoryData = useMemo(() => {
    const expenses = transactions.filter(t => t.type === 'expense');
    const map = new Map<string, number>();
    expenses.forEach(t => {
      map.set(t.category, (map.get(t.category) || 0) + t.amount);
    });
    return Array.from(map.entries())
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);
  }, [transactions]);

  // Aggregate by Merchant for Bar Chart (Top 5)
  const merchantData = useMemo(() => {
    const expenses = transactions.filter(t => t.type === 'expense');
    const map = new Map<string, number>();
    expenses.forEach(t => {
      map.set(t.merchant, (map.get(t.merchant) || 0) + t.amount);
    });
    return Array.from(map.entries())
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 10);
  }, [transactions]);

  const uniqueCategories = useMemo(() => Array.from(new Set(transactions.map(tx => tx.category))).sort(), [transactions]);
  const uniqueDates = useMemo(() => Array.from(new Set(transactions.map(tx => tx.date))).sort(), [transactions]);

  const filteredTransactions = useMemo(() => {
    return transactions.filter(tx => {
      const matchesType = txTypeFilter === "all" || tx.type === txTypeFilter;
      const matchesCategory = txCategoryFilter === "all" || tx.category === txCategoryFilter;
      const matchesDate = txDateFilter === "all" || tx.date === txDateFilter;
      return matchesType && matchesCategory && matchesDate;
    });
  }, [transactions, txTypeFilter, txCategoryFilter, txDateFilter]);

  return (
    <div className="space-y-4 sm:space-y-6 animate-in fade-in duration-500">
      <div className="flex justify-between items-start mb-4 sm:mb-8">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">Dashboard Overview</h1>
          <p className="text-gray-500 text-xs sm:text-sm italic">Summary of your uploaded statement.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard 
          title="Total Income" 
          amount={summary.totalIncome} 
          icon={<ArrowDownRight className="w-4 h-4 text-emerald-500" />} 
        />
        <StatCard 
          title="Total Expenses" 
          amount={summary.totalExpense} 
          icon={<ArrowUpRight className="w-4 h-4 text-rose-500" />} 
        />
        <StatCard 
          title="Net Cash Flow" 
          amount={summary.totalIncome - summary.totalExpense} 
          icon={<Wallet className="w-4 h-4 text-blue-500" />} 
        />
        <StatCard 
          title="Savings Opportunity" 
          amount={summary.savingsOpportunities} 
          icon={<PiggyBank className="w-4 h-4 text-indigo-500" />} 
          highlight
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
        <Card className="col-span-1 lg:col-span-1">
          <CardHeader className="p-4 sm:p-6 pb-2 sm:pb-2">
            <CardTitle className="text-sm sm:text-base text-white flex items-center gap-2">
              <PieChartIcon className="w-4 h-4 sm:w-5 sm:h-5 text-gray-500"/> Expenses by Category
            </CardTitle>
          </CardHeader>
          <CardContent className="h-[250px] sm:h-[300px] p-4 sm:p-6 pt-0 sm:pt-0">
             {categoryData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={categoryData}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={2}
                      stroke="rgba(20,20,20,1)"
                    >
                      {categoryData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <RechartsTooltip 
                      formatter={(value: number) => formatCurrency(value)} 
                      contentStyle={{ backgroundColor: '#141414', borderColor: 'rgba(255,255,255,0.05)', color: '#fff' }}
                      itemStyle={{ color: '#fff' }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex h-full items-center justify-center text-sm text-gray-500">
                  No expense data available.
                </div>
              )}
          </CardContent>
        </Card>

        <Card className="col-span-1 lg:col-span-2 border border-blue-500/20 bg-blue-900/10 shadow-sm">
          <CardHeader className="p-4 sm:p-6 pb-2 sm:pb-2">
            <CardTitle className="text-sm sm:text-base text-white flex items-center gap-2">
              <Lightbulb className="w-4 h-4 sm:w-5 sm:h-5 text-blue-400"/> Where You Can Save Money
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 sm:p-6 pt-0 sm:pt-0">
            <ul className="space-y-4">
              {insights.map((insight, idx) => (
                <li key={idx} className="flex gap-3 text-gray-300">
                  <div className="mt-1 flex-shrink-0 w-6 h-6 rounded-full bg-blue-900/30 flex items-center justify-center text-blue-400 text-sm font-medium border border-blue-500/20">
                    {idx + 1}
                  </div>
                  <p className="leading-relaxed">{insight}</p>
                </li>
              ))}
              {insights.length === 0 && (
                <p className="text-gray-500 text-sm">Upload more data to see saving insights.</p>
              )}
            </ul>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        <Card>
          <CardHeader className="p-4 sm:p-6 pb-2 sm:pb-2">
            <CardTitle className="text-sm sm:text-base text-white flex items-center gap-2">
              <BarChartIcon className="w-4 h-4 sm:w-5 sm:h-5 text-gray-500"/> Top Merchants
            </CardTitle>
          </CardHeader>
          <CardContent className="h-[250px] sm:h-[350px] p-4 sm:p-6 pt-0 sm:pt-0">
            {merchantData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={merchantData} layout="vertical" margin={{ top: 5, right: 30, left: 40, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="rgba(255,255,255,0.05)"/>
                  <XAxis type="number" tickFormatter={(v) => `₹${v}`} stroke="#9CA3AF" fontSize={12} tickLine={false} axisLine={false}/>
                  <YAxis dataKey="name" type="category" stroke="#9CA3AF" fontSize={12} tickLine={false} axisLine={false} />
                  <RechartsTooltip 
                    cursor={{fill: 'rgba(255,255,255,0.02)'}} 
                    formatter={(value: number) => formatCurrency(value)}
                    contentStyle={{ backgroundColor: '#141414', borderColor: 'rgba(255,255,255,0.05)', color: '#fff' }}
                    itemStyle={{ color: '#fff' }}
                  />
                  <Bar dataKey="value" fill="#3b82f6" radius={[0, 4, 4, 0]} barSize={20} />
                </BarChart>
              </ResponsiveContainer>
             ) : (
                <div className="flex h-full items-center justify-center text-sm text-gray-500">
                  No merchant data available.
                </div>
              )}
          </CardContent>
        </Card>

        <Card className="flex flex-col">
          <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 p-4 sm:p-6">
            <CardTitle className="text-sm sm:text-base text-white flex items-center gap-2">
              <Receipt className="w-4 h-4 sm:w-5 sm:h-5 text-gray-500"/> Recent Transactions
            </CardTitle>
            <div className="grid grid-cols-2 sm:flex sm:flex-wrap items-center gap-2 w-full sm:w-auto">
              <Filter className="w-4 h-4 text-gray-500 hidden sm:block" />
              
              <select 
                value={txDateFilter}
                onChange={(e) => setTxDateFilter(e.target.value)}
                className="bg-[#141414] border border-white/10 rounded-lg px-2 py-2 sm:py-1.5 text-xs text-gray-300 focus:outline-none focus:border-blue-500 w-full sm:w-auto sm:max-w-[120px]"
              >
                <option value="all">All Dates</option>
                {uniqueDates.map(date => (
                  <option key={date} value={date}>{date}</option>
                ))}
              </select>

              <select 
                value={txCategoryFilter}
                onChange={(e) => setTxCategoryFilter(e.target.value)}
                className="bg-[#141414] border border-white/10 rounded-lg px-2 py-2 sm:py-1.5 text-xs text-gray-300 focus:outline-none focus:border-blue-500 w-full sm:w-auto sm:max-w-[140px]"
              >
                <option value="all">Categories</option>
                {uniqueCategories.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>

              <select 
                value={txTypeFilter}
                onChange={(e) => setTxTypeFilter(e.target.value as any)}
                className="bg-[#141414] border border-white/10 rounded-lg px-2 py-2 sm:py-1.5 text-xs text-gray-300 focus:outline-none focus:border-blue-500 col-span-2 sm:col-span-1 w-full sm:w-auto sm:max-w-[100px]"
              >
                <option value="all">Types</option>
                <option value="expense">Expenses</option>
                <option value="income">Income</option>
              </select>
            </div>
          </CardHeader>

          {/* Desktop Table View */}
          <div className="hidden sm:block overflow-x-auto">
            <table className="w-full text-sm text-left text-gray-400">
              <thead className="text-xs text-gray-500 uppercase bg-[#1a1a1a] border-y border-white/5">
                <tr>
                  <th scope="col" className="px-6 py-3 font-medium">Date</th>
                  <th scope="col" className="px-6 py-3 font-medium">Merchant</th>
                  <th scope="col" className="px-6 py-3 font-medium">Category</th>
                  <th scope="col" className="px-6 py-3 font-medium text-right">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {filteredTransactions.slice(0, 8).map((tx, idx) => (
                  <tr key={idx} className="hover:bg-white/[0.02] transition-colors cursor-default">
                    <td className="px-6 py-4 whitespace-nowrap text-gray-400">{tx.date}</td>
                    <td className="px-6 py-4 font-medium text-white italic">{tx.merchant}</td>
                    <td className="px-6 py-4">
                      <span className="px-2.5 py-1 bg-white/[0.05] text-gray-300 rounded text-xs font-medium border border-white/5">
                        {tx.category}
                      </span>
                    </td>
                    <td className={`px-6 py-4 text-right font-medium ${tx.type === 'expense' ? 'text-white' : 'text-emerald-400'}`}>
                      {tx.type === 'expense' ? '-' : '+'}{formatCurrency(tx.amount)}
                    </td>
                  </tr>
                ))}
                {filteredTransactions.length === 0 && (
                  <tr>
                     <td colSpan={4} className="px-6 py-8 text-center text-gray-500 text-sm">
                        No transactions found for the selected filters.
                     </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Mobile List View */}
          <div className="block sm:hidden divide-y divide-white/5 border-t border-white/5">
            {filteredTransactions.slice(0, 8).map((tx, idx) => (
              <div key={idx} className="p-4 flex justify-between items-center hover:bg-white/[0.02] transition-colors cursor-default">
                <div className="flex-1 overflow-hidden pr-3">
                  <div className="text-sm font-medium text-white italic truncate">{tx.merchant}</div>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-xs text-gray-400 whitespace-nowrap">{tx.date}</span>
                    <span className="px-2 py-0.5 bg-white/[0.05] text-gray-300 rounded text-[10px] uppercase font-medium border border-white/5 truncate">
                      {tx.category}
                    </span>
                  </div>
                </div>
                <div className={`text-right font-medium text-sm whitespace-nowrap ${tx.type === 'expense' ? 'text-white' : 'text-emerald-400'}`}>
                  {tx.type === 'expense' ? '-' : '+'}{formatCurrency(tx.amount)}
                </div>
              </div>
            ))}
            {filteredTransactions.length === 0 && (
              <div className="p-8 text-center text-gray-500 text-sm">
                No transactions found for the selected filters.
              </div>
            )}
          </div>
          {filteredTransactions.length > 8 && (
            <div className="px-6 py-4 border-t border-white/5 text-center text-sm text-gray-500">
              Showing 8 of {filteredTransactions.length} transactions
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}

function StatCard({ title, amount, icon, highlight = false }: { title: string, amount: number, icon: React.ReactNode, highlight?: boolean }) {
  return (
    <Card className={highlight ? "border-blue-500/20 bg-blue-900/10" : ""}>
      <CardContent className="p-4 sm:p-6">
        <div className="flex items-center justify-between mb-3 sm:mb-4">
          <p className="text-xs sm:text-sm font-medium text-gray-400 uppercase tracking-wide">{title}</p>
          <div className="w-7 h-7 sm:w-8 sm:h-8 rounded mt-1 bg-white/[0.05] flex items-center justify-center border border-white/5">
            {icon}
          </div>
        </div>
        <h4 className={`text-2xl sm:text-3xl font-light tracking-tight ${highlight ? "text-blue-400" : "text-white"}`}>
          {formatCurrency(amount)}
        </h4>
      </CardContent>
    </Card>
  );
}

function PieChartIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21.21 15.89A10 10 0 1 1 8 2.83" />
      <path d="M22 12A10 10 0 0 0 12 2v10z" />
    </svg>
  )
}

function BarChartIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="12" x2="12" y1="20" y2="10" />
      <line x1="18" x2="18" y1="20" y2="4" />
      <line x1="6" x2="6" y1="20" y2="16" />
    </svg>
  )
}
