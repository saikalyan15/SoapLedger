'use client';

import { useState, useMemo } from 'react';
import { Plus, Trash2, X, FlaskConical, Calendar, NotebookPen } from 'lucide-react';
import { createRawMaterialAction, deleteRawMaterialAction } from '@/lib/actions/rawMaterials';

export default function RawMaterialsView({ materials }) {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [formData, setFormData] = useState({
    quantity: 0,
    unit_cost: 0
  });

  const totalCost = useMemo(() => {
    return (formData.quantity * formData.unit_cost).toFixed(2);
  }, [formData.quantity, formData.unit_cost]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    if (name === 'quantity' || name === 'unit_cost') {
      setFormData(prev => ({ ...prev, [name]: parseFloat(value) || 0 }));
    }
  };

  const handleCancel = () => {
    setIsFormOpen(false);
    setFormData({ quantity: 0, unit_cost: 0 });
  };

  return (
    <div>
      {/* Page Header */}
      <div className="pt-[8px] flex justify-between items-start">
        <div>
          <h1 className="font-serif text-[36px] text-[#1B4332] font-normal leading-none m-0">
            Raw Materials
          </h1>
          <p className="font-sans text-[14px] text-[#6B7280] mt-[6px] m-0">
            Track your procurement and material costs
          </p>
        </div>
        <button 
          onClick={() => setIsFormOpen(!isFormOpen)}
          className="bg-[#1B4332] text-[#FFFFFF] font-sans text-[14px] font-semibold px-[24px] py-[12px] rounded-[10px] border-none cursor-pointer flex items-center gap-[8px] tracking-[0.01em] shadow-[0_2px_8px_rgba(27,67,50,0.25)] hover:bg-[#2D6A4F] hover:shadow-[0_4px_12px_rgba(27,67,50,0.3)] hover:-translate-y-[1px] transition-all duration-[200ms] ease-in-out m-0"
        >
          {isFormOpen ? <X size={16} /> : <Plus size={16} />}
          {isFormOpen ? 'Close Form' : 'Log Purchase'}
        </button>
      </div>

      <div className="mt-[32px] border-b-[2px] border-[#E5E7EB] mb-[32px]"></div>

      {/* Inline Add Form */}
      {isFormOpen && (
        <div className="bg-[#FAFDF9] border border-[#D8F3DC] rounded-[14px] p-[32px] mb-[32px] shadow-[0_2px_12px_rgba(27,67,50,0.08)]">
          <h2 className="font-serif text-[22px] text-[#1B4332] mb-[24px] mt-0">
            Log New Purchase
          </h2>
          <form 
            action={async (fd) => {
              await createRawMaterialAction(fd);
              handleCancel();
            }}
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-[20px]">
              <div>
                <label className="font-sans text-[11px] font-semibold uppercase tracking-[0.08em] text-[#6B7280] mb-[6px] block">Material Name</label>
                <input 
                  name="name" 
                  required 
                  className="w-full px-[14px] py-[11px] border border-[#E5E7EB] rounded-[8px] font-sans text-[14px] text-[#1A1A1A] bg-[#FFFFFF] outline-none transition-all duration-[150ms] ease-in-out focus:border-[#1B4332] focus:shadow-[0_0_0_3px_rgba(27,67,50,0.08)]"
                  placeholder="e.g. Glycerine Base"
                />
              </div>

              <div>
                <label className="font-sans text-[11px] font-semibold uppercase tracking-[0.08em] text-[#6B7280] mb-[6px] block">Category</label>
                <input 
                  name="category" 
                  required 
                  className="w-full px-[14px] py-[11px] border border-[#E5E7EB] rounded-[8px] font-sans text-[14px] text-[#1A1A1A] bg-[#FFFFFF] outline-none transition-all duration-[150ms] ease-in-out focus:border-[#1B4332] focus:shadow-[0_0_0_3px_rgba(27,67,50,0.08)]"
                  placeholder="Soap Base, Fragrance, etc."
                />
              </div>

              <div>
                <label className="font-sans text-[11px] font-semibold uppercase tracking-[0.08em] text-[#6B7280] mb-[6px] block">Quantity</label>
                <input 
                  name="quantity" 
                  type="number"
                  step="0.01"
                  required 
                  onChange={handleInputChange}
                  className="w-full px-[14px] py-[11px] border border-[#E5E7EB] rounded-[8px] font-sans text-[14px] text-[#1A1A1A] bg-[#FFFFFF] outline-none transition-all duration-[150ms] ease-in-out focus:border-[#1B4332] focus:shadow-[0_0_0_3px_rgba(27,67,50,0.08)]"
                  placeholder="0.00"
                />
              </div>

              <div>
                <label className="font-sans text-[11px] font-semibold uppercase tracking-[0.08em] text-[#6B7280] mb-[6px] block">Unit</label>
                <select 
                  name="unit" 
                  required 
                  className="w-full px-[14px] py-[11px] border border-[#E5E7EB] rounded-[8px] font-sans text-[14px] text-[#1A1A1A] bg-[#FFFFFF] outline-none transition-all duration-[150ms] ease-in-out focus:border-[#1B4332] focus:shadow-[0_0_0_3px_rgba(27,67,50,0.08)] appearance-none"
                >
                  <option value="kg">kg</option>
                  <option value="g">g</option>
                  <option value="ml">ml</option>
                  <option value="pieces">pieces</option>
                </select>
              </div>

              <div>
                <label className="font-sans text-[11px] font-semibold uppercase tracking-[0.08em] text-[#6B7280] mb-[6px] block">Unit Cost (₹)</label>
                <input 
                  name="unit_cost" 
                  type="number"
                  step="0.01"
                  required 
                  onChange={handleInputChange}
                  className="w-full px-[14px] py-[11px] border border-[#E5E7EB] rounded-[8px] font-sans text-[14px] text-[#1A1A1A] bg-[#FFFFFF] outline-none transition-all duration-[150ms] ease-in-out focus:border-[#1B4332] focus:shadow-[0_0_0_3px_rgba(27,67,50,0.08)]"
                  placeholder="0.00"
                />
              </div>

              <div>
                <label className="font-sans text-[11px] font-semibold uppercase tracking-[0.08em] text-[#6B7280] mb-[6px] block">Procured On</label>
                <input 
                  name="procured_on" 
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

              <div className="md:col-span-2">
                <label className="font-sans text-[11px] font-semibold uppercase tracking-[0.08em] text-[#6B7280] mb-[6px] block">Total Cost (Auto)</label>
                <div className="w-full px-[14px] py-[11px] border border-[#D8F3DC] rounded-[8px] font-sans font-bold text-[14px] text-[#1B4332] bg-[#F0FDF4]">
                  ₹{totalCost}
                </div>
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
                Log Purchase
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Materials List */}
      {materials.length === 0 ? (
        <div className="text-center py-[80px] border border-dashed border-[#E5E7EB] rounded-[14px] bg-[#FFFFFF]/50">
           <FlaskConical className="w-[48px] h-[48px] text-[#6B7280] mx-auto mb-[16px] opacity-30" />
           <p className="font-serif text-[22px] text-[#1B4332] mb-[8px] mt-0">No procurement logs yet</p>
           <p className="font-sans text-[14px] text-[#6B7280] max-w-[300px] mx-auto m-0">Start logging your material purchases to track costs.</p>
        </div>
      ) : (
        <div className="space-y-[10px]">
          {materials.map((item) => (
            <div 
              key={item.id}
              className="bg-[#FFFFFF] border border-[#EBEBEB] rounded-[12px] px-[24px] py-[18px] flex items-center justify-between transition-all duration-[180ms] ease-in-out hover:border-[#D8F3DC] hover:shadow-[0_4px_16px_rgba(0,0,0,0.08)] hover:-translate-y-[1px]"
            >
              <div className="flex items-center gap-[24px]">
                <div className="text-center min-w-[60px] pr-[24px] border-r border-[#E5E7EB]">
                  <div className="font-sans text-[11px] font-bold uppercase tracking-wider text-[#6B7280] m-0">
                    {new Date(item.procured_on).toLocaleDateString('en-IN', { month: 'short' })}
                  </div>
                  <div className="font-serif text-[20px] text-[#1B4332] leading-none mt-[4px] m-0">
                    {new Date(item.procured_on).toLocaleDateString('en-IN', { day: '2-digit' })}
                  </div>
                </div>
                
                <div>
                  <div className="font-sans text-[15px] font-semibold text-[#1A1A1A] m-0">
                    {item.name}
                  </div>
                  <div className="flex items-center gap-[8px] mt-[4px]">
                    <span className="bg-[#F3F4F6] text-[#6B7280] font-sans text-[10px] font-bold tracking-[0.06em] px-[8px] py-[2px] rounded-[20px] uppercase m-0">
                      {item.category}
                    </span>
                    <div className="font-sans text-[13px] text-[#9CA3AF] m-0">
                      {item.quantity}{item.unit}  •  ₹{parseFloat(item.unit_cost).toFixed(2)} / {item.unit}
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="flex items-center gap-[24px]">
                <div className="text-right">
                  <div className="font-sans text-[11px] font-bold uppercase tracking-wider text-[#6B7280] m-0">Total Cost</div>
                  <div className="font-sans text-[16px] font-bold text-[#1B4332] mt-[2px] m-0">₹{parseFloat(item.total_cost).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</div>
                </div>
                
                <div className="flex items-center gap-[8px]">
                  {item.notes && (
                    <div className="relative group cursor-help">
                       <NotebookPen size={16} className="text-[#6B7280] opacity-40 hover:opacity-100 transition-opacity" />
                       <div className="absolute bottom-full right-0 mb-[8px] w-[200px] bg-[#FFFFFF] border border-[#E5E7EB] p-[12px] rounded-[8px] shadow-[0_4px_12px_rgba(0,0,0,0.1)] opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all text-[12px] font-sans text-[#6B7280] z-10">
                         {item.notes}
                       </div>
                    </div>
                  )}
                  <button 
                    onClick={() => deleteRawMaterialAction(item.id)}
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
