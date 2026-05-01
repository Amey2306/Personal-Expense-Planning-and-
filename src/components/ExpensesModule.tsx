import React, { useState } from "react";
import { StatementData } from "../lib/gemini";
import { Card } from "./ui/Card";
import { Search, Filter, ArrowDownRight, ArrowUpRight } from "lucide-react";

const formatCurrency = (val: number) => 
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(val);

export function ExpensesModule({ data }: { data: StatementData }) {
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<"all" | "income" | "expense">("all");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [dateFilter, setDateFilter] = useState<string>("all");

  const uniqueCategories = Array.from(new Set(data.transactions.map(tx => tx.category))).sort();
  const uniqueDates = Array.from(new Set(data.transactions.map(tx => tx.date))).sort();

  const filteredTransactions = data.transactions.filter(tx => {
    const matchesSearch = tx.merchant.toLowerCase().includes(search.toLowerCase()) || 
                          tx.category.toLowerCase().includes(search.toLowerCase());
    const matchesType = typeFilter === "all" || tx.type === typeFilter;
    const matchesCategory = categoryFilter === "all" || tx.category === categoryFilter;
    const matchesDate = dateFilter === "all" || tx.date === dateFilter;
    return matchesSearch && matchesType && matchesCategory && matchesDate;
  });

  return (
    <div className="space-y-4 sm:space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-2 sm:mb-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">Transactions</h1>
          <p className="text-gray-500 text-xs sm:text-sm italic">Detailed view of all your income and expenses.</p>
        </div>
      </div>

      <Card className="flex flex-col overflow-hidden">
        <div className="p-4 border-b border-white/5 flex flex-col gap-4 bg-[#1a1a1ae6]">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
            <div className="relative w-full sm:w-96">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
              <input 
                type="text" 
                placeholder="Search merchants or categories..." 
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full bg-[#141414] border border-white/10 rounded-lg pl-10 pr-4 py-2 text-sm text-white focus:outline-none focus:border-blue-500 transition-colors"
              />
            </div>
            
            <div className="grid grid-cols-2 sm:flex sm:flex-wrap items-center gap-2 w-full sm:w-auto">
              <Filter className="w-4 h-4 text-gray-500 hidden sm:block" />
              
              <select 
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
                className="bg-[#141414] border border-white/10 rounded-lg px-3 py-2 text-xs sm:text-sm text-gray-300 focus:outline-none focus:border-blue-500 w-full sm:w-auto sm:max-w-[140px]"
              >
                <option value="all">All Dates</option>
                {uniqueDates.map(date => (
                  <option key={date} value={date}>{date}</option>
                ))}
              </select>

              <select 
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="bg-[#141414] border border-white/10 rounded-lg px-3 py-2 text-xs sm:text-sm text-gray-300 focus:outline-none focus:border-blue-500 w-full sm:w-auto sm:max-w-[160px]"
              >
                <option value="all">All Categories</option>
                {uniqueCategories.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>

              <select 
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value as any)}
                className="bg-[#141414] border border-white/10 rounded-lg px-3 py-2 text-xs sm:text-sm text-gray-300 focus:outline-none focus:border-blue-500 col-span-2 sm:col-span-1 w-full sm:w-auto sm:max-w-[140px]"
              >
                <option value="all">All Types</option>
                <option value="expense">Expenses</option>
                <option value="income">Income</option>
              </select>
            </div>
          </div>
        </div>
        
        <div className="hidden sm:block overflow-x-auto">
          <table className="w-full text-sm text-left text-gray-400">
            <thead className="text-xs text-gray-500 uppercase bg-[#1a1a1a] border-b border-white/5">
              <tr>
                <th scope="col" className="px-6 py-3 font-medium">Date</th>
                <th scope="col" className="px-6 py-3 font-medium">Merchant</th>
                <th scope="col" className="px-6 py-3 font-medium">Category</th>
                <th scope="col" className="px-6 py-3 font-medium">Type</th>
                <th scope="col" className="px-6 py-3 font-medium text-right">Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {filteredTransactions.map((tx, idx) => (
                <tr key={idx} className="hover:bg-white/[0.02] transition-colors cursor-default">
                  <td className="px-6 py-4 whitespace-nowrap text-gray-400">{tx.date}</td>
                  <td className="px-6 py-4 font-medium text-white italic">{tx.merchant}</td>
                  <td className="px-6 py-4">
                    <span className="px-2.5 py-1 bg-white/[0.05] text-gray-300 rounded text-xs font-medium border border-white/5">
                      {tx.category}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-1.5">
                      {tx.type === 'income' ? (
                        <ArrowDownRight className="w-4 h-4 text-emerald-500" />
                      ) : (
                        <ArrowUpRight className="w-4 h-4 text-rose-500" />
                      )}
                      <span className="capitalize text-gray-300">{tx.type}</span>
                    </div>
                  </td>
                  <td className={`px-6 py-4 text-right font-medium ${tx.type === 'expense' ? 'text-white' : 'text-emerald-400'}`}>
                    {tx.type === 'expense' ? '-' : '+'}{formatCurrency(tx.amount)}
                  </td>
                </tr>
              ))}
              {filteredTransactions.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-gray-500">
                    No transactions found matching your criteria.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Mobile List View */}
        <div className="block sm:hidden divide-y divide-white/5">
          {filteredTransactions.map((tx, idx) => (
            <div key={idx} className="p-4 flex justify-between items-center hover:bg-white/[0.02] transition-colors cursor-default">
              <div className="flex-1 overflow-hidden pr-3">
                <div className="text-sm font-medium text-white italic truncate">{tx.merchant}</div>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-xs text-gray-400 whitespace-nowrap">{tx.date}</span>
                  <span className="px-2 py-0.5 bg-white/[0.05] text-gray-300 rounded text-[10px] uppercase font-medium border border-white/5 truncate">
                    {tx.category}
                  </span>
                  {tx.type === 'income' ? (
                    <ArrowDownRight className="w-3 h-3 text-emerald-500 flex-shrink-0" />
                  ) : (
                    <ArrowUpRight className="w-3 h-3 text-rose-500 flex-shrink-0" />
                  )}
                </div>
              </div>
              <div className={`text-right font-medium text-sm whitespace-nowrap ${tx.type === 'expense' ? 'text-white' : 'text-emerald-400'}`}>
                {tx.type === 'expense' ? '-' : '+'}{formatCurrency(tx.amount)}
              </div>
            </div>
          ))}
          {filteredTransactions.length === 0 && (
            <div className="p-8 text-center text-gray-500 text-sm">
              No transactions found matching your criteria.
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}
