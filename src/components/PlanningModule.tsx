import React, { useState, useMemo } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "./ui/Card";
import { Calculator, Home, Briefcase, IndianRupee, Clock, CalendarDays } from "lucide-react";
import { cn } from "../lib/utils";

const formatCurrency = (val: number) => 
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(val);

export function PlanningModule() {
  const [activeTab, setActiveTab] = useState<'salary' | 'loan'>('salary');

  // Salary Planning State
  const [currentGross, setCurrentGross] = useState(2000000); // 20 LPA
  const [incrementSteps, setIncrementSteps] = useState([1.10, 1.15, 1.20, 1.25, 1.30]);
  const [taxRate, setTaxRate] = useState(20); // 20% tax / deductions roughly (Net 80%)
  const [annualDeductions, setAnnualDeductions] = useState(150000); // Flat annual deductions

  // Loan EMIs State
  const [loanAmount, setLoanAmount] = useState(4000000);
  const [interestRate, setInterestRate] = useState(9.0);
  const [tenureYears, setTenureYears] = useState(15);

  // Salary Projections Calculation
  const salaryProjections = useMemo(() => {
    return incrementSteps.map(multiplier => {
      const gross = currentGross * multiplier;
      const perMonthGross = gross / 12;
      const netYearlyAfterTaxes = (gross * (1 - taxRate / 100)) - annualDeductions;
      const netMonthly = netYearlyAfterTaxes / 12;
      const incrementValue = (gross - currentGross) / 12;
      
      return {
        multiplier,
        gross,
        perMonthGross,
        netYearlyAfterTaxes: Math.max(0, netYearlyAfterTaxes),
        netMonthly: Math.max(0, netMonthly),
        incrementValue,
      };
    });
  }, [currentGross, incrementSteps, taxRate, annualDeductions]);

  // Loan Amortization Calculation
  const loanSchedule = useMemo(() => {
    let balance = loanAmount;
    const monthlyRate = (interestRate / 100) / 12;
    const totalMonths = tenureYears * 12;
    
    let emi = 0;
    if (monthlyRate === 0) {
      emi = balance / totalMonths;
    } else {
      emi = balance * monthlyRate * Math.pow(1 + monthlyRate, totalMonths) / (Math.pow(1 + monthlyRate, totalMonths) - 1);
    }

    const schedule = [];
    let totalInterest = 0;

    for (let month = 1; month <= totalMonths; month++) {
      const interestForMonth = balance * monthlyRate;
      const principalForMonth = emi - interestForMonth;
      balance -= principalForMonth;
      totalInterest += interestForMonth;

      // Only store yearly snapshots or first few months to prevent massive lag
      if (month <= 12 || month % 12 === 0 || month === totalMonths) {
        schedule.push({
          month,
          emi,
          principal: principalForMonth,
          interest: interestForMonth,
          balance: Math.max(0, balance)
        });
      }
    }

    return {
      emi: Math.round(emi),
      totalInterest: Math.round(totalInterest),
      totalPayment: Math.round(loanAmount + totalInterest),
      schedule
    };
  }, [loanAmount, interestRate, tenureYears]);

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Advanced Planning Tools</h1>
          <p className="text-gray-500 text-sm italic">Simulate salary growth, hourly rates, and loan amortizations.</p>
        </div>
        <div className="flex bg-[#141414] border border-white/5 rounded-lg p-1">
          <button 
             onClick={() => setActiveTab('salary')}
             className={cn("px-4 py-1.5 text-sm font-medium rounded-md transition-colors", activeTab === 'salary' ? 'bg-blue-600 text-white' : 'text-gray-400 hover:text-white')}
          >
            Salary & Taxes
          </button>
          <button 
             onClick={() => setActiveTab('loan')}
             className={cn("px-4 py-1.5 text-sm font-medium rounded-md transition-colors", activeTab === 'loan' ? 'bg-blue-600 text-white' : 'text-gray-400 hover:text-white')}
          >
            Loan EMI
          </button>
        </div>
      </div>

      {activeTab === 'salary' && (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          <Card className="col-span-1 border-white/5 flex flex-col">
            <CardHeader>
               <CardTitle className="text-white flex items-center gap-2">
                 <Briefcase className="w-5 h-5 text-gray-500"/> Current Setup
               </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
               <div>
                  <label className="text-xs text-gray-500 mb-1 block">Current Gross (Yearly)</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">₹</span>
                    <input 
                      type="number" 
                      value={currentGross}
                      onChange={(e) => setCurrentGross(Number(e.target.value))}
                      className="w-full bg-[#141414] border border-white/10 rounded-lg pl-8 pr-3 py-1.5 text-sm text-white focus:outline-none focus:border-blue-500 transition-colors"
                    />
                  </div>
               </div>
               <div className="pt-4 border-t border-white/5 space-y-4">
                 <h4 className="text-sm font-medium text-blue-400 flex items-center gap-2">
                   <Calculator className="w-4 h-4" /> Tax & Deductions Simulation
                 </h4>
                 <div>
                    <label className="text-xs text-gray-500 mb-1 block">Effective Tax Rate (%)</label>
                    <div className="relative">
                      <input 
                        type="number" 
                        value={taxRate}
                        onChange={(e) => setTaxRate(Number(e.target.value))}
                        className="w-full bg-[#141414] border border-white/10 rounded-lg px-3 py-1.5 text-sm text-white focus:outline-none focus:border-blue-500 transition-colors"
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">%</span>
                    </div>
                 </div>
                 <div>
                    <label className="text-xs text-gray-500 mb-1 block">Other Annual Deductions (Flat)</label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">₹</span>
                      <input 
                        type="number" 
                        value={annualDeductions}
                        onChange={(e) => setAnnualDeductions(Number(e.target.value))}
                        className="w-full bg-[#141414] border border-white/10 rounded-lg pl-8 pr-3 py-1.5 text-sm text-white focus:outline-none focus:border-blue-500 transition-colors"
                      />
                    </div>
                 </div>
               </div>
               <div className="pt-4 border-t border-white/5 mt-4">
                  <h4 className="text-sm font-medium text-white mb-3">Hourly Rate Breakdown</h4>
                  <div className="space-y-2 text-sm text-gray-400">
                     <div className="flex justify-between">
                       <span>Per Month Gross</span>
                       <span className="text-white">{formatCurrency(currentGross / 12)}</span>
                     </div>
                     <div className="flex justify-between text-emerald-400/80">
                       <span>Per Month Net</span>
                       <span>{formatCurrency(((currentGross * (1 - taxRate / 100)) - annualDeductions) / 12)}</span>
                     </div>
                     <div className="flex justify-between">
                       <span>Per Day (approx 22 days)</span>
                       <span className="text-white">{formatCurrency((currentGross / 12) / 22)}</span>
                     </div>
                     <div className="flex justify-between">
                       <span>Per Hour (9 hrs/day)</span>
                       <span className="text-emerald-400 font-medium">{formatCurrency((currentGross / 12) / 22 / 9)} x hr</span>
                     </div>
                  </div>
               </div>
            </CardContent>
          </Card>

          <Card className="col-span-1 lg:col-span-3 border-white/5">
             <CardHeader>
                <CardTitle className="text-white">Growth Projections</CardTitle>
             </CardHeader>
             <div className="overflow-x-auto pb-4 custom-scrollbar">
                <table className="w-full text-sm text-left text-gray-400">
                  <thead className="text-xs text-gray-500 uppercase bg-[#1a1a1a] border-y border-white/5">
                    <tr>
                      <th className="px-4 py-3 font-medium">Increment %</th>
                      <th className="px-4 py-3 font-medium">Gross Yearly</th>
                      <th className="px-4 py-3 font-medium text-emerald-400">Net Yearly</th>
                      <th className="px-4 py-3 font-medium">Gross Monthly</th>
                      <th className="px-4 py-3 font-medium text-emerald-400">Net Monthly (Take Home)</th>
                      <th className="px-4 py-3 font-medium text-blue-400">Monthly Increment +</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {salaryProjections.map((proj, idx) => (
                       <tr key={idx} className="hover:bg-white/[0.02] transition-colors cursor-default">
                         <td className="px-4 py-4 font-medium text-white">{(proj.multiplier * 100).toFixed(0)}%</td>
                         <td className="px-4 py-4">{formatCurrency(proj.gross)}</td>
                         <td className="px-4 py-4 font-bold text-emerald-400">{formatCurrency(proj.netYearlyAfterTaxes)}</td>
                         <td className="px-4 py-4">{formatCurrency(proj.perMonthGross)}</td>
                         <td className="px-4 py-4 font-bold text-emerald-400">{formatCurrency(proj.netMonthly)}</td>
                         <td className="px-4 py-4 text-blue-400">{proj.incrementValue > 0 ? '+' : ''}{formatCurrency(proj.incrementValue)}</td>
                       </tr>
                    ))}
                  </tbody>
                </table>
             </div>
          </Card>
        </div>
      )}

      {activeTab === 'loan' && (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
           <Card className="col-span-1 border-white/5">
             <CardHeader>
               <CardTitle className="text-white flex items-center gap-2">
                 <Home className="w-5 h-5 text-gray-500"/> Loan Setup
               </CardTitle>
             </CardHeader>
             <CardContent className="space-y-4">
                <div>
                  <label className="text-xs text-gray-500 mb-1 block">Loan Amount</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">₹</span>
                    <input 
                      type="number" 
                      value={loanAmount}
                      onChange={(e) => setLoanAmount(Number(e.target.value))}
                      className="w-full bg-[#141414] border border-white/10 rounded-lg pl-8 pr-3 py-1.5 text-sm text-white focus:outline-none focus:border-blue-500"
                    />
                  </div>
                </div>
                <div>
                  <label className="text-xs text-gray-500 mb-1 block">Interest Rate (%)</label>
                  <input 
                    type="number" 
                    step="0.1"
                    value={interestRate}
                    onChange={(e) => setInterestRate(Number(e.target.value))}
                    className="w-full bg-[#141414] border border-white/10 rounded-lg px-3 py-1.5 text-sm text-white focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="text-xs text-gray-500 mb-1 block">Tenure (Years)</label>
                  <input 
                    type="number" 
                    value={tenureYears}
                    onChange={(e) => setTenureYears(Number(e.target.value))}
                    className="w-full bg-[#141414] border border-white/10 rounded-lg px-3 py-1.5 text-sm text-white focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div className="pt-6 border-t border-white/5 space-y-4">
                   <div className="bg-blue-900/20 border border-blue-500/20 p-4 rounded-xl text-center">
                     <p className="text-xs text-blue-400 uppercase tracking-widest mb-1">Monthly EMI</p>
                     <p className="text-2xl font-bold text-white">{formatCurrency(loanSchedule.emi)}</p>
                   </div>
                   <div className="flex justify-between text-xs text-gray-400">
                     <span>Total Interest</span>
                     <span className="text-rose-400">{formatCurrency(loanSchedule.totalInterest)}</span>
                   </div>
                   <div className="flex justify-between text-xs text-gray-400">
                     <span>Total Payment</span>
                     <span className="text-white">{formatCurrency(loanSchedule.totalPayment)}</span>
                   </div>
                </div>
             </CardContent>
           </Card>

           <Card className="col-span-1 lg:col-span-3 border-white/5">
             <CardHeader>
               <CardTitle className="text-white">Amortization Schedule (Summary)</CardTitle>
             </CardHeader>
             <div className="overflow-x-auto pb-4 custom-scrollbar h-[500px]">
                <table className="w-full text-sm text-left text-gray-400">
                  <thead className="text-xs text-gray-500 uppercase bg-[#1a1a1a] border-y border-white/5 sticky top-0">
                    <tr>
                      <th className="px-4 py-3 font-medium">Month</th>
                      <th className="px-4 py-3 font-medium text-right">EMI</th>
                      <th className="px-4 py-3 font-medium text-right text-emerald-400">Principal</th>
                      <th className="px-4 py-3 font-medium text-right text-rose-400">Interest</th>
                      <th className="px-4 py-3 font-medium text-right text-white">Balance</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {loanSchedule.schedule.map((row, idx) => (
                       <tr key={idx} className="hover:bg-white/[0.02] transition-colors cursor-default">
                         <td className="px-4 py-3">{row.month}</td>
                         <td className="px-4 py-3 text-right">{formatCurrency(row.emi)}</td>
                         <td className="px-4 py-3 text-right text-emerald-400/80">{formatCurrency(row.principal)}</td>
                         <td className="px-4 py-3 text-right text-rose-400/80">{formatCurrency(row.interest)}</td>
                         <td className="px-4 py-3 text-right font-medium text-white">{formatCurrency(row.balance)}</td>
                       </tr>
                    ))}
                  </tbody>
                </table>
             </div>
           </Card>
        </div>
      )}
    </div>
  );
}
