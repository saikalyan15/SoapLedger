'use client';

import { useState } from 'react';
import { Plus, Trash2, X, Receipt, Calendar, NotebookPen } from 'lucide-react';
import { createExpenseAction, deleteExpenseAction } from '@/lib/actions/expenses';

export default function ExpensesView({ expenses, summary }) {
  const [isFormOpen, setIsFormOpen] = useState(false);

  const kpis = [
    { label: 'This Month', value: summary?.month_total || 0 },
    { label: 'This Year', value: summary?.year_total || 0 },
    { label: 'All Time', value: summary?.all_time_total || 0 },
  ];

  const handleCancel = () => {
    setIsFormOpen(false);
  };

  return (
    <div>
      {/* Page Header */}
      <div className="pt-[8px] flex justify-between items-start">
        <div>
          <h1 className="font-serif text-[36px] text-[#1B4332] font-normal leading-none m-0">
            Expenses
          </h1>
          <p className="font-sans text-[14px] text-[#6B7280] mt-[6px] m-0">
            Track your operating costs
          </p>
        </div>
        <button 
          onClick={() => setIsFormOpen(!isFormOpen)}
          className="bg-[#1B4332] text-[#FFFFFF] font-sans text-[14px] font-semibold px-[24px] py-[12px] rounded-[10px] border-none cursor-pointer flex items-center gap-[8px] tracking-[0.01em] shadow-[0_2px_8px_rgba(27,67,50,0.25)] hover:bg-[#2D6A4F] hover:shadow-[0_4px_12px_rgba(27,67,50,0.3)] hover:-translate-y-[1px] transition-all duration-[200ms] ease-in-out m-0"
        >
          {isFormOpen ? <X size={16} /> : <Plus size={16} />}
          {isFormOpen ? 'Close Form' : 'Add Expense'}
        </button>
      </div>

      <div className="mt-[32px] border-b-[2px] border-[#E5E7EB] mb-[32px]"></div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-[24px] mb-[40px]">
        {kpis.map((kpi) => (
          <div key={kpi.label} className="bg-[#FFFFFF] border border-[#EBEBEB] rounded-[12px] p-[24px] shadow-[0_1px_4px_rgba(0,0,0,0.06)] hover:shadow-[0_4px_12px_rgba(0,0,0,0.08)] transition-shadow">
            <div className="font-serif text-[32px] text-[#1B4332] leading-none m-0">
              ₹{parseFloat(kpi.value).toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
            </div>
            <div className="font-sans text-[12px] font-semibold uppercase tracking-[0.08em] text-[#6B7280] mt-[12px] m-0">
              Total {kpi.label}
            </div>
          </div>
        ))}
      </div>

      {/* Inline Add Form */}
      {isFormOpen && (
        <div className="bg-[#FAFDF9] border border-[#D8F3DC] rounded-[14px] p-[32px] mb-[32px] shadow-[0_2px_12px_rgba(27,67,50,0.08)]">
          <h2 className="font-serif text-[22px] text-[#1B4332] mb-[24px] mt-0">
            Log New Expense
          </h2>
          <form 
            action={async (fd) => {
              await createExpenseAction(fd);
              handleCancel();
            }}
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-[20px]">
              <div className="md:col-span-2">
                <label className="font-sans text-[11px] font-semibold uppercase tracking-[0.08em] text-[#6B7280] mb-[6px] block">Description</label>
                <input 
                  name="description" 
                  required 
                  className="w-full px-[14px] py-[11px] border border-[#E5E7EB] rounded-[8px] font-sans text-[14px] text-[#1A1A1A] bg-[#FFFFFF] outline-none transition-all duration-[150ms] ease-in-out focus:border-[#1B4332] focus:shadow-[0_0_0_3px_rgba(27,67,50,0.08)]"
                  placeholder="e.g. 1kg Glycerine base, Brown paper rolls"
                />
              </div>

              <div>
                <label className="font-sans text-[11px] font-semibold uppercase tracking-[0.08em] text-[#6B7280] mb-[6px] block">Amount (₹)</label>
                <input 
                  name="amount" 
                  type="number"
                  step="0.01"
                  required 
                  className="w-full px-[14px] py-[11px] border border-[#E5E7EB] rounded-[8px] font-sans text-[14px] text-[#1A1A1A] bg-[#FFFFFF] outline-none transition-all duration-[150ms] ease-in-out focus:border-[#1B4332] focus:shadow-[0_0_0_3px_rgba(27,67,50,0.08)]"
                  placeholder="0.00"
                />
              </div>

              <div>
                <label className="font-sans text-[11px] font-semibold uppercase tracking-[0.08em] text-[#6B7280] mb-[6px] block">Date</label>
                <input 
                  name="expense_date" 
                  type="date"
                  defaultValue={new Date().toISOString().split('T')[0]}
                  required 
                  className="w-full px-[14px] py-[11px] border border-[#E5E7EB] rounded-[8px] font-sans text-[14px] text-[#1A1A1A] bg-[#FFFFFF] outline-none transition-all duration-[150ms] ease-in-out focus:border-[#1B4332] focus:shadow-[0_0_0_3px_rgba(27,67,50,0.08)]"
                />
              </div>

              <div className="md:col-span-2">
                <label className="font-sans text-[11px] font-semibold uppercase tracking-[0.08em] text-[#6B7280] mb-[6px] block">Notes</label>
                <input 
                  name="notes" 
                  className="w-full px-[14px] py-[11px] border border-[#E5E7EB] rounded-[8px] font-sans text-[14px] text-[#1A1A1A] bg-[#FFFFFF] outline-none transition-all duration-[150ms] ease-in-out focus:border-[#1B4332] focus:shadow-[0_0_0_3px_rgba(27,67,50,0.08)]"
                  placeholder="Optional details..."
                />
              </div>
            </div>

            <div className="mt-[24px] flex gap-[12px] justify-end">
              <button 
                type="button"
                onClick={handleCancel}
                className="bg-transparent border border-[#E5E7EB] text-[#6B7280] font-sans text-[14px] font-semibold px-[24px] py-[12px] rounded-[10px] cursor-pointer hover:bg-[#F9FAFB] m-0"
              >
                Cancel
              </button>
              <button 
                type="submit"
                className="bg-[#1B4332] text-[#FFFFFF] font-sans text-[14px] font-semibold px-[24px] py-[12px] rounded-[10px] border-none cursor-pointer flex items-center gap-[8px] tracking-[0.01em] shadow-[0_2px_8px_rgba(27,67,50,0.25)] hover:bg-[#2D6A4F] hover:shadow-[0_4px_12px_rgba(27,67,50,0.3)] hover:-translate-y-[1px] transition-all duration-[200ms] ease-in-out m-0"
              >
                Save Expense
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Expenses List */}
      {expenses.length === 0 ? (
        <div className="text-center py-[80px] border border-dashed border-[#E5E7EB] rounded-[14px] bg-[#FFFFFF]/50">
           <Receipt className="w-[48px] h-[48px] text-[#6B7280] mx-auto mb-[16px] opacity-30" />
           <p className="font-serif text-[22px] text-[#1B4332] mb-[8px] mt-0">No expenses tracked yet</p>
           <p className="font-sans text-[14px] text-[#6B7280] max-w-[300px] mx-auto m-0">Log your business expenses to understand your profitability.</p>
        </div>
      ) : (
        <div className="space-y-[10px]">
          {expenses.map((item) => (
            <div 
              key={item.id}
              className="bg-[#FFFFFF] border border-[#EBEBEB] rounded-[12px] px-[24px] py-[18px] flex items-center justify-between transition-all duration-[180ms] ease-in-out hover:border-[#D8F3DC] hover:shadow-[0_4px_16px_rgba(0,0,0,0.08)] hover:-translate-y-[1px]"
            >
              <div className="flex items-center gap-[24px]">
                <div className="text-center min-w-[60px] pr-[24px] border-r border-[#E5E7EB]">
                  <div className="font-sans text-[11px] font-bold uppercase tracking-wider text-[#6B7280] m-0">
                    {new Date(item.expense_date).toLocaleDateString('en-IN', { month: 'short' })}
                  </div>
                  <div className="font-serif text-[20px] text-[#1B4332] leading-none mt-[4px] m-0">
                    {new Date(item.expense_date).toLocaleDateString('en-IN', { day: '2-digit' })}
                  </div>
                </div>
                
                <div>
                  <div className="font-sans text-[15px] font-semibold text-[#1A1A1A] m-0">
                    {item.description}
                  </div>
                  {item.notes && (
                    <div className="font-sans text-[13px] text-[#9CA3AF] mt-[4px] m-0 max-w-[400px] truncate">
                      {item.notes}
                    </div>
                  )}
                </div>
              </div>
              
              <div className="flex items-center gap-[24px]">
                <div className="text-right">
                  <div className="font-sans text-[11px] font-bold uppercase tracking-wider text-[#6B7280] m-0">Amount</div>
                  <div className="font-sans text-[16px] font-bold text-[#1B4332] mt-[2px] m-0">₹{parseFloat(item.amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</div>
                </div>
                
                <div className="flex items-center gap-[8px]">
                  <button 
                    onClick={() => deleteExpenseAction(item.id)}
                    className="bg-transparent border border-[#E5E7EB] text-[#6B7280] font-sans text-[12px] font-semibold px-[16px] py-[6px] rounded-[8px] cursor-pointer flex items-center gap-[6px] transition-all duration-[150ms] ease-in-out hover:bg-[#FEE2E2] hover:border-[#DC2626] hover:text-[#DC2626] m-0"
                  >
                    <Trash2 size={13} /> Delete
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
