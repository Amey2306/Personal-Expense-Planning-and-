import React, { useState, useEffect } from 'react';
import * as XLSX from 'xlsx';
import { DashboardLayout } from './components/DashboardLayout';
import { ExpensesModule } from './components/ExpensesModule';
import { BudgetModule } from './components/BudgetModule';
import { IncomeModule } from './components/IncomeModule';
import { SimulationModule } from './components/SimulationModule';
import { PlanningModule } from './components/PlanningModule';
import { UploadDropzone } from './components/UploadDropzone';
import { processStatement, StatementData } from './lib/gemini';
import { AlertCircle, Activity, LayoutDashboard, Receipt, Target, TrendingUp, FastForward, Briefcase, Plus, X, Upload, Loader2, Sparkles } from 'lucide-react';
import { cn } from './lib/utils';

const NAV_ITEMS = [
  { id: 'dashboard', label: 'Overview', icon: LayoutDashboard },
  { id: 'income', label: 'Income', icon: TrendingUp },
  { id: 'budget', label: 'Budget/Expense', icon: Target },
  { id: 'simulation', label: 'Simulate', icon: FastForward },
  { id: 'planning', label: 'Plan', icon: Briefcase },
  { id: 'expenses', label: 'Explorer', icon: Receipt },
];

const defaultData: StatementData = {
  transactions: [],
  insights: ["Welcome to FinOS. You can manually enter your targets in the modules below, or upload bank statements to auto-fill."],
  summary: { totalIncome: 0, totalExpense: 0, savingsOpportunities: 0 }
};

export default function App() {
  const [data, setData] = useState<StatementData>(defaultData);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [activeSection, setActiveSection] = useState('dashboard');

  useEffect(() => {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          setActiveSection(entry.target.id);
        }
      });
    }, { rootMargin: '-30% 0px -60% 0px' });

    NAV_ITEMS.forEach(item => {
      const el = document.getElementById(item.id);
      if (el) observer.observe(el);
    });

    return () => observer.disconnect();
  }, []);

  const scrollToSection = (id: string) => {
    const el = document.getElementById(id);
    if (el) {
      const y = el.getBoundingClientRect().top + window.scrollY - 110;
      window.scrollTo({ top: y, behavior: 'smooth' });
    }
  };

  const processFile = async (file: File): Promise<StatementData> => {
    if (file.name.match(/\.(csv|xlsx|xls)$/i)) {
      const buffer = await file.arrayBuffer();
      const workbook = XLSX.read(buffer);
      const sheetName = workbook.SheetNames[0];
      const textData = XLSX.utils.sheet_to_csv(workbook.Sheets[sheetName]);
      return await processStatement(null, "", textData);
    } else if (file.name.match(/\.(pdf|jpe?g|png)$/i)) {
      const base64Data = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => {
            const result = reader.result?.toString() || '';
            const split = result.split(',');
            resolve(split.length > 1 ? split[1] : split[0]);
        };
        reader.onerror = reject;
      });
      return await processStatement(base64Data, file.type || "application/pdf", null);
    } else {
      throw new Error("Unsupported file type. Please upload a PDF, Excel, or CSV.");
    }
  };

  const mergeData = (prev: StatementData, next: StatementData): StatementData => {
    const isPrevDefault = prev.transactions.length === 0;
    if (isPrevDefault) return next;
    
    return {
      transactions: [...prev.transactions, ...next.transactions],
      insights: Array.from(new Set([...prev.insights, ...next.insights])),
      summary: {
        totalIncome: prev.summary.totalIncome + next.summary.totalIncome,
        totalExpense: prev.summary.totalExpense + next.summary.totalExpense,
        savingsOpportunities: prev.summary.savingsOpportunities + next.summary.savingsOpportunities,
      }
    };
  };

  const handleFilesSelect = async (files: File[]) => {
    setIsLoading(true);
    setError(null);
    try {
      let combinedData: StatementData = data;
      for (const file of files) {
         const result = await processFile(file);
         combinedData = mergeData(combinedData, result);
      }
      setData(combinedData);
      setIsUploadModalOpen(false);
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : "An unknown error occurred while processing.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#050505] text-gray-100 font-sans selection:bg-emerald-500/30">
      <header className="sticky top-0 z-40 bg-black/80 backdrop-blur-xl border-b border-white/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-16">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-500 to-blue-600 flex items-center justify-center shadow-lg shadow-emerald-500/20">
                        <Activity className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <h1 className="font-bold text-xl tracking-tight text-white leading-none">FinOS</h1>
                      <span className="text-[10px] text-gray-400 uppercase tracking-widest font-medium">Wealth OS</span>
                    </div>
                </div>
                <button 
                    onClick={() => setIsUploadModalOpen(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-full text-sm font-medium transition-all shadow-sm shadow-white/5"
                >
                    <Upload className="w-4 h-4" /> <span className="hidden sm:inline">Add Data</span>
                </button>
            </div>
        </div>
        
        <div className="border-t border-white/5 bg-black/40">
           <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center">
               <div className="flex overflow-x-auto hide-scrollbar py-2.5 gap-2 snap-x w-full">
                   {NAV_ITEMS.map((item) => {
                       const isActive = activeSection === item.id;
                       return (
                           <button
                               key={item.id}
                               onClick={() => scrollToSection(item.id)}
                               className={cn(
                                   "snap-start whitespace-nowrap flex items-center gap-2 px-4 py-1.5 rounded-full text-sm font-medium transition-all duration-300",
                                   isActive ? "bg-white text-black shadow-md" : "text-gray-400 hover:text-white hover:bg-white/10"
                               )}
                           >
                               <item.icon className="w-4 h-4" />
                               {item.label}
                           </button>
                       )
                   })}
               </div>
           </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-16 pb-32">
        <section id="dashboard" className="scroll-mt-32">
           {data.transactions.length === 0 && (
               <div className="mb-8 p-8 sm:p-12 bg-gradient-to-br from-[#0a0a0a] via-[#111111] to-[#0a0a0a] border border-white/10 rounded-3xl flex flex-col items-center text-center relative overflow-hidden group">
                   <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(52,211,153,0.05),transparent_60%)] group-hover:bg-[radial-gradient(circle_at_50%_0%,rgba(52,211,153,0.1),transparent_60%)] transition-colors duration-700"></div>
                   
                   <div className="w-16 h-16 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center mb-6 relative z-10">
                       <Sparkles className="w-8 h-8 text-emerald-400" />
                   </div>
                   
                   <h2 className="text-3xl sm:text-4xl font-extrabold text-white mb-4 tracking-tight relative z-10">Your Financial OS</h2>
                   <p className="text-gray-400 max-w-xl mb-10 text-sm sm:text-base leading-relaxed relative z-10">
                       Scroll down to plan manually with your own custom estimates, or securely upload your bank statements to let FinOS instantly analyze, categorize, and project your financial future.
                   </p>
                   
                   <div className="flex flex-col sm:flex-row items-center gap-4 relative z-10">
                      <button 
                          onClick={() => setIsUploadModalOpen(true)}
                          className="px-8 py-3.5 bg-white text-black font-semibold rounded-full hover:scale-[1.02] active:scale-[0.98] transition-all shadow-[0_0_40px_rgba(255,255,255,0.15)] hover:shadow-[0_0_50px_rgba(255,255,255,0.25)] flex items-center gap-2"
                      >
                          <Upload className="w-5 h-5" />
                          Upload & AI Analyze
                      </button>
                      <button 
                          onClick={() => scrollToSection('income')}
                          className="px-8 py-3.5 bg-transparent border border-white/20 text-white font-semibold rounded-full hover:bg-white/5 transition-all flex items-center gap-2"
                      >
                          Start Manually
                      </button>
                   </div>
               </div>
           )}
           <DashboardLayout data={data} />
        </section>
        
        <section id="income" className="scroll-mt-32">
            <IncomeModule data={data} />
        </section>

        <section id="budget" className="scroll-mt-32">
            <BudgetModule data={data} />
        </section>

        <section id="simulation" className="scroll-mt-32">
            <SimulationModule data={data} />
        </section>

        <section id="planning" className="scroll-mt-32">
            <PlanningModule />
        </section>

        <section id="expenses" className="scroll-mt-32 pt-8 border-t border-white/5">
            <ExpensesModule data={data} />
        </section>
      </main>
      
      {isUploadModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
            <div className="bg-[#0a0a0a] border border-white/10 rounded-2xl w-full max-w-xl overflow-hidden shadow-2xl relative flex flex-col transform animate-in zoom-in-95 duration-200">
                <div className="flex justify-between items-center p-5 border-b border-white/5 bg-white/[0.02]">
                    <h3 className="text-lg font-bold text-white flex items-center gap-2">
                        <Upload className="w-5 h-5 text-emerald-500" />
                        AI Analysis Upload
                    </h3>
                    <button onClick={() => !isLoading && setIsUploadModalOpen(false)} className="p-2 text-gray-400 hover:text-white rounded-full hover:bg-white/10 transition-colors">
                        <X className="w-5 h-5" />
                    </button>
                </div>
                <div className="p-6 relative">
                    {isLoading && (
                        <div className="absolute inset-0 z-10 bg-[#0a0a0a]/90 backdrop-blur-sm flex flex-col items-center justify-center rounded-b-2xl animate-in fade-in">
                            <Loader2 className="w-10 h-10 text-emerald-500 animate-spin mb-4" />
                            <h4 className="text-white font-medium mb-1">AI is actively processing...</h4>
                            <p className="text-sm text-gray-400 text-center max-w-xs">
                                Extracting transactions and calculating projections. This usually takes 10-15 seconds.
                            </p>
                        </div>
                    )}
                    <UploadDropzone onFilesSelect={handleFilesSelect} isLoading={isLoading} />
                    {error && (
                        <div className="mt-4 p-4 rounded-xl bg-red-900/20 border border-red-500/20 flex items-start gap-3 animate-in slide-in-from-bottom-2">
                            <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                            <div className="text-sm text-red-200">
                                <h4 className="font-semibold mb-1 text-red-400">Analysis Error</h4>
                                <p className="text-red-300">{error}</p>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
      )}
    </div>
  );
}
