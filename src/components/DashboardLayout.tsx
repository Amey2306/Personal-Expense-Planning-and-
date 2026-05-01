import { StatementData, Transaction } from "../lib/gemini";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/Card";
import { PieChart, Pie, Cell, Tooltip as RechartsTooltip, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid } from "recharts";
import { ArrowDownRight, ArrowUpRight, Lightbulb, PiggyBank, Receipt, Wallet } from "lucide-react";
import React, { useMemo } from "react";

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#6366f1', '#14b8a6', '#f43f5e'];

const formatCurrency = (val: number) => 
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(val);

export function DashboardLayout({ data }: { data: StatementData }) {
  const { summary, insights, transactions } = data;

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

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex justify-between items-start mb-8">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Dashboard Overview</h1>
          <p className="text-gray-500 text-sm italic">Summary of your uploaded statement.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
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

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="col-span-1 lg:col-span-1">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <PieChartIcon className="w-5 h-5 text-gray-500"/> Expenses by Category
            </CardTitle>
          </CardHeader>
          <CardContent className="h-[300px]">
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
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Lightbulb className="w-5 h-5 text-blue-400"/> Where You Can Save Money
            </CardTitle>
          </CardHeader>
          <CardContent>
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

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <BarChartIcon className="w-5 h-5 text-gray-500"/> Top Merchants
            </CardTitle>
          </CardHeader>
          <CardContent className="h-[350px]">
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
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Receipt className="w-5 h-5 text-gray-500"/> Recent Transactions
            </CardTitle>
          </CardHeader>
          <div className="overflow-x-auto">
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
                {transactions.slice(0, 8).map((tx, idx) => (
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
              </tbody>
            </table>
          </div>
          {transactions.length > 8 && (
            <div className="px-6 py-4 border-t border-white/5 text-center text-sm text-gray-500">
              Showing 8 of {transactions.length} transactions
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
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-4">
          <p className="text-sm font-medium text-gray-400 uppercase tracking-wide">{title}</p>
          <div className="w-8 h-8 rounded mt-1 bg-white/[0.05] flex items-center justify-center border border-white/5">
            {icon}
          </div>
        </div>
        <h4 className={`text-3xl font-light tracking-tight ${highlight ? "text-blue-400" : "text-white"}`}>
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
