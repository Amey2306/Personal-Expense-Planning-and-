import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/Card';
import { Target, Plus, Trash2, Edit2, CheckCircle2 } from 'lucide-react';
import { StatementData } from '../lib/gemini';

const formatCurrency = (val: number) => 
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(val);

export function GoalsModule({ data }: { data: StatementData }) {
  const [goals, setGoals] = useState<{id: string; name: string; target: number; current: number; deadline: string}[]>([
    { id: '1', name: 'Emergency Fund', target: 500000, current: 150000, deadline: '2027-12-31' },
    { id: '2', name: 'New Car Downpayment', target: 300000, current: 50000, deadline: '2026-06-30' },
  ]);

  const [editingId, setEditingId] = useState<string | null>(null);

  const handleAddGoal = () => {
    const newGoal = {
      id: Math.random().toString(36).substr(2, 9),
      name: 'New Goal',
      target: 100000,
      current: 0,
      deadline: new Date(new Date().setFullYear(new Date().getFullYear() + 1)).toISOString().split('T')[0]
    };
    setGoals([...goals, newGoal]);
    setEditingId(newGoal.id);
  };

  const updateGoal = (id: string, field: keyof typeof goals[0], value: any) => {
    setGoals(goals.map(g => g.id === id ? { ...g, [field]: value } : g));
  };

  const deleteGoal = (id: string) => {
    setGoals(goals.filter(g => g.id !== id));
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex justify-between items-start mb-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">Financial Goals</h1>
          <p className="text-gray-500 text-xs sm:text-sm italic">Track and manage your savings goals.</p>
        </div>
        <button 
          onClick={handleAddGoal}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors"
        >
          <Plus className="w-4 h-4" /> Add Goal
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {goals.map(goal => {
          const progress = Math.min(100, Math.max(0, (goal.current / goal.target) * 100));
          const isEditing = editingId === goal.id;

          return (
            <Card key={goal.id} className="border-white/5 relative group flex flex-col">
              <CardContent className="p-6 flex-1 flex flex-col">
                <button 
                  onClick={() => deleteGoal(goal.id)}
                  className="absolute top-4 right-4 text-gray-500 hover:text-red-400 opacity-0 md:group-hover:opacity-100 transition-opacity"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
                
                {isEditing ? (
                  <div className="space-y-4 flex-1">
                    <div>
                      <label className="text-[10px] text-gray-500 uppercase tracking-wide block mb-1">Goal Name</label>
                      <input 
                        type="text" 
                        value={goal.name}
                        onChange={(e) => updateGoal(goal.id, 'name', e.target.value)}
                        className="w-full bg-[#141414] border border-white/10 rounded px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
                      />
                    </div>
                    <div className="flex gap-4">
                      <div className="flex-1">
                        <label className="text-[10px] text-gray-500 uppercase tracking-wide block mb-1">Target Amount (₹)</label>
                        <input 
                          type="number" 
                          value={goal.target}
                          onChange={(e) => updateGoal(goal.id, 'target', Number(e.target.value))}
                          className="w-full bg-[#141414] border border-white/10 rounded px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
                        />
                      </div>
                      <div className="flex-1">
                        <label className="text-[10px] text-gray-500 uppercase tracking-wide block mb-1">Current Saved (₹)</label>
                        <input 
                          type="number" 
                          value={goal.current}
                          onChange={(e) => updateGoal(goal.id, 'current', Number(e.target.value))}
                          className="w-full bg-[#141414] border border-white/10 rounded px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="text-[10px] text-gray-500 uppercase tracking-wide block mb-1">Target Date</label>
                      <input 
                        type="date" 
                        value={goal.deadline}
                        onChange={(e) => updateGoal(goal.id, 'deadline', e.target.value)}
                        className="w-full bg-[#141414] border border-white/10 rounded px-3 py-2 text-sm text-gray-300 focus:outline-none focus:border-blue-500 [color-scheme:dark]"
                      />
                    </div>
                    <button 
                      onClick={() => setEditingId(null)}
                      className="w-full mt-2 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg text-sm flex justify-center items-center gap-2 transition-colors"
                    >
                      <CheckCircle2 className="w-4 h-4" /> Save
                    </button>
                  </div>
                ) : (
                  <div className="flex-1 flex flex-col cursor-pointer" onDoubleClick={() => setEditingId(goal.id)}>
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-10 h-10 rounded-full bg-blue-500/10 flex items-center justify-center text-blue-400">
                        <Target className="w-5 h-5" />
                      </div>
                      <div>
                        <h3 className="text-lg font-medium text-white">{goal.name}</h3>
                        <p className="text-xs text-gray-400">Target: {new Date(goal.deadline).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}</p>
                      </div>
                      <button 
                        onClick={() => setEditingId(goal.id)}
                        className="ml-auto text-gray-500 hover:text-white mt-1 opacity-0 md:group-hover:opacity-100 transition-opacity"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                    </div>

                    <div className="flex-1 flex flex-col justify-end">
                      <div className="flex justify-between items-end mb-2">
                        <div>
                          <p className="text-2xl font-light text-white">{formatCurrency(goal.current)}</p>
                          <p className="text-xs text-gray-500">of {formatCurrency(goal.target)}</p>
                        </div>
                        <span className="text-lg font-medium text-blue-400">{progress.toFixed(0)}%</span>
                      </div>
                      <div className="w-full bg-white/5 rounded-full h-2.5 overflow-hidden">
                        <div 
                          className="bg-blue-500 h-2.5 rounded-full transition-all duration-500" 
                          style={{ width: `${progress}%` }}
                        ></div>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
        {goals.length === 0 && (
          <div className="col-span-full p-12 text-center border border-dashed border-white/10 rounded-xl">
             <Target className="w-8 h-8 text-gray-600 mx-auto mb-3" />
             <h3 className="text-gray-300 font-medium mb-1">No goals set</h3>
             <p className="text-sm text-gray-500 mb-4">Create your first financial goal to start tracking progress.</p>
             <button 
                onClick={handleAddGoal}
                className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg text-sm font-medium transition-colors"
             >
                <Plus className="w-4 h-4" /> Create Goal
             </button>
          </div>
        )}
      </div>
    </div>
  );
}
