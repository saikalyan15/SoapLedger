'use client';

import { useState } from 'react';
import { Plus, Pencil, Archive, ArchiveRestore, ChevronRight, ChevronDown, X } from 'lucide-react';
import { createProductAction, updateProductAction, toggleArchiveAction } from '@/lib/actions/products';

export default function ProductView({ products }) {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [isArchivedOpen, setIsArchivedOpen] = useState(false);

  const activeProducts = products.filter(p => p.is_active);
  const archivedProducts = products.filter(p => !p.is_active);

  const groupedProducts = activeProducts.reduce((acc, product) => {
    const base = product.base_type || 'Other';
    if (!acc[base]) acc[base] = [];
    acc[base].push(product);
    return acc;
  }, {});

  const handleEdit = (product) => {
    setEditingProduct(product);
    setIsFormOpen(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleCancel = () => {
    setIsFormOpen(false);
    setEditingProduct(null);
  };

  return (
    <div>
      {/* Page Header */}
      <div className="pt-[8px] flex justify-between items-start">
        <div>
          <h1 className="font-serif text-[36px] text-[#1B4332] font-normal leading-none m-0">
            Product Catalogue
          </h1>
          <p className="font-sans text-[14px] text-[#6B7280] mt-[6px] m-0">
            Manage your soap range
          </p>
        </div>
        <button 
          onClick={() => setIsFormOpen(!isFormOpen)}
          className="bg-[#1B4332] text-[#FFFFFF] font-sans text-[14px] font-semibold px-[24px] py-[12px] rounded-[10px] border-none cursor-pointer flex items-center gap-[8px] tracking-[0.01em] shadow-[0_2px_8px_rgba(27,67,50,0.25)] hover:bg-[#2D6A4F] hover:shadow-[0_4px_12px_rgba(27,67,50,0.3)] hover:-translate-y-[1px] transition-all duration-[200ms] ease-in-out m-0"
        >
          {isFormOpen ? <X size={16} /> : <Plus size={16} />}
          {isFormOpen ? 'Close Form' : 'Add Product'}
        </button>
      </div>

      <div className="mt-[32px] border-b-[2px] border-[#E5E7EB] mb-[32px]"></div>

      {/* Inline Add/Edit Form */}
      {isFormOpen && (
        <div className="bg-[#FAFDF9] border border-[#D8F3DC] rounded-[14px] p-[32px] mb-[32px] shadow-[0_2px_12px_rgba(27,67,50,0.08)]">
          <h2 className="font-serif text-[22px] text-[#1B4332] mb-[24px] mt-0">
            {editingProduct ? 'Edit Product' : 'Add New Product'}
          </h2>
          <form 
            action={async (formData) => {
              if (editingProduct) {
                await updateProductAction(editingProduct.id, formData);
              } else {
                await createProductAction(formData);
              }
              handleCancel();
            }}
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-[20px]">
              <div>
                <label className="font-sans text-[11px] font-semibold uppercase tracking-[0.08em] text-[#6B7280] mb-[6px] block">Product Name</label>
                <input 
                  name="name" 
                  defaultValue={editingProduct?.name}
                  required 
                  className="w-full px-[14px] py-[11px] border border-[#E5E7EB] rounded-[8px] font-sans text-[14px] text-[#1A1A1A] bg-[#FFFFFF] outline-none transition-all duration-[150ms] ease-in-out focus:border-[#1B4332] focus:shadow-[0_0_0_3px_rgba(27,67,50,0.08)]"
                  placeholder="e.g. Lavender Bliss"
                />
              </div>

              <div>
                <label className="font-sans text-[11px] font-semibold uppercase tracking-[0.08em] text-[#6B7280] mb-[6px] block">Base Type</label>
                <input 
                  name="base_type" 
                  defaultValue={editingProduct?.base_type}
                  required 
                  className="w-full px-[14px] py-[11px] border border-[#E5E7EB] rounded-[8px] font-sans text-[14px] text-[#1A1A1A] bg-[#FFFFFF] outline-none transition-all duration-[150ms] ease-in-out focus:border-[#1B4332] focus:shadow-[0_0_0_3px_rgba(27,67,50,0.08)]"
                  placeholder="e.g. Glycerine, Goat Milk"
                />
              </div>

              <div>
                <label className="font-sans text-[11px] font-semibold uppercase tracking-[0.08em] text-[#6B7280] mb-[6px] block">Weight (grams)</label>
                <input 
                  name="weight_grams" 
                  type="number"
                  defaultValue={editingProduct?.weight_grams}
                  className="w-full px-[14px] py-[11px] border border-[#E5E7EB] rounded-[8px] font-sans text-[14px] text-[#1A1A1A] bg-[#FFFFFF] outline-none transition-all duration-[150ms] ease-in-out focus:border-[#1B4332] focus:shadow-[0_0_0_3px_rgba(27,67,50,0.08)]"
                  placeholder="100"
                />
              </div>

              <div>
                <label className="font-sans text-[11px] font-semibold uppercase tracking-[0.08em] text-[#6B7280] mb-[6px] block">Unit Price (₹)</label>
                <input 
                  name="unit_price" 
                  type="number"
                  step="0.01"
                  defaultValue={editingProduct?.unit_price}
                  required 
                  className="w-full px-[14px] py-[11px] border border-[#E5E7EB] rounded-[8px] font-sans text-[14px] text-[#1A1A1A] bg-[#FFFFFF] outline-none transition-all duration-[150ms] ease-in-out focus:border-[#1B4332] focus:shadow-[0_0_0_3px_rgba(27,67,50,0.08)]"
                  placeholder="250"
                />
              </div>

              <div className="flex items-center gap-[10px] md:col-span-2">
                <input 
                  id="is_seasonal"
                  name="is_seasonal" 
                  type="checkbox"
                  defaultChecked={editingProduct?.is_seasonal}
                  className="w-[16px] h-[16px] accent-[#1B4332]"
                />
                <label htmlFor="is_seasonal" className="font-sans text-[14px] text-[#1A1A1A] m-0">Seasonal Product?</label>
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
                {editingProduct ? 'Update Product' : 'Save Product'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Active Product Sections */}
      <div className="space-y-[40px]">
        {Object.entries(groupedProducts).map(([base, items]) => (
          <div key={base}>
            <div className="flex justify-between items-center mb-[12px]">
              <h3 className="font-serif text-[18px] text-[#1B4332] font-normal m-0">{base}</h3>
              <span className="font-sans text-[12px] text-[#6B7280] bg-[#F3F4F6] px-[10px] py-[3px] rounded-[20px] font-medium m-0">
                {items.length} {items.length === 1 ? 'product' : 'products'}
              </span>
            </div>
            <div className="border-b-[1px] border-[#E5E7EB] mb-[16px]"></div>
            
            <div>
              {items.map((product) => (
                <div 
                  key={product.id}
                  className="bg-[#FFFFFF] border border-[#EBEBEB] rounded-[12px] px-[24px] py-[18px] mb-[10px] flex items-center justify-between transition-all duration-[180ms] ease-in-out hover:border-[#D8F3DC] hover:shadow-[0_4px_16px_rgba(0,0,0,0.08)] hover:-translate-y-[1px]"
                >
                  <div>
                    <div className="font-sans text-[15px] font-semibold text-[#1A1A1A] m-0">
                      {product.name}
                    </div>
                    <div className="font-sans text-[13px] text-[#9CA3AF] mt-[4px] m-0">
                      {product.weight_grams ? `${product.weight_grams}g` : '-'}  •  ₹{product.unit_price}
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-[12px]">
                    <div className="flex items-center gap-[8px]">
                      {product.is_seasonal && (
                        <span className="bg-[#FEF3C7] text-[#92400E] font-sans text-[11px] font-bold tracking-[0.06em] px-[12px] py-[4px] rounded-[20px] uppercase m-0">
                          Seasonal
                        </span>
                      )}
                      <span className="bg-[#D8F3DC] text-[#1B4332] font-sans text-[11px] font-bold tracking-[0.06em] px-[12px] py-[4px] rounded-[20px] uppercase m-0">
                        Active
                      </span>
                    </div>
                    
                    <div className="flex items-center gap-[8px]">
                      <button 
                        onClick={() => handleEdit(product)}
                        className="bg-transparent border border-[#1B4332] text-[#1B4332] font-sans text-[12px] font-semibold px-[16px] py-[6px] rounded-[8px] cursor-pointer flex items-center gap-[6px] transition-all duration-[150ms] ease-in-out hover:bg-[#1B4332] hover:text-[#FFFFFF] m-0"
                      >
                        <Pencil size={13} /> Edit
                      </button>
                      <button 
                        onClick={() => toggleArchiveAction(product.id)}
                        className="bg-transparent border border-[#E5E7EB] text-[#6B7280] font-sans text-[12px] font-semibold px-[16px] py-[6px] rounded-[8px] cursor-pointer flex items-center gap-[6px] transition-all duration-[150ms] ease-in-out hover:bg-[#FEE2E2] hover:border-[#DC2626] hover:text-[#DC2626] m-0"
                      >
                        <Archive size={13} /> Archive
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Archived Section */}
      {archivedProducts.length > 0 && (
        <div className="mt-[48px]">
          <div 
            onClick={() => setIsArchivedOpen(!isArchivedOpen)}
            className="flex items-center gap-[10px] font-sans text-[13px] font-semibold text-[#6B7280] cursor-pointer py-[12px] border-t-[1px] border-[#E5E7EB]"
          >
            <div className={`transition-transform duration-200 ${isArchivedOpen ? 'rotate-90' : ''}`}>
              <ChevronRight size={16} />
            </div>
            Archived Products ({archivedProducts.length})
          </div>
          
          {isArchivedOpen && (
            <div className="mt-[16px]">
              {archivedProducts.map((product) => (
                <div 
                  key={product.id}
                  className="bg-[#FAFAFA] border border-[#EBEBEB] rounded-[12px] px-[24px] py-[18px] mb-[10px] flex items-center justify-between opacity-60"
                >
                  <div>
                    <div className="font-sans text-[15px] font-semibold text-[#1A1A1A] m-0">{product.name}</div>
                    <div className="font-sans text-[13px] text-[#9CA3AF] mt-[4px] m-0">{product.base_type}  •  ₹{product.unit_price}</div>
                  </div>
                  <div className="flex items-center gap-[12px]">
                    <button 
                      onClick={() => toggleArchiveAction(product.id)}
                      className="bg-transparent border border-[#D8F3DC] text-[#1B4332] font-sans text-[12px] font-semibold px-[16px] py-[6px] rounded-[8px] cursor-pointer flex items-center gap-[6px] transition-all duration-[150ms] ease-in-out hover:bg-[#D8F3DC] m-0"
                    >
                      <ArchiveRestore size={13} /> Restore
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
