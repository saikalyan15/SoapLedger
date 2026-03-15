'use client';

import {
  createProductAction,
  toggleArchiveAction,
  updateProductAction,
  deleteProductAction,
} from '@/lib/actions/products';
import {
  Archive,
  ArchiveRestore,
  ChevronRight,
  Pencil,
  Plus,
  X,
  Link as LinkIcon,
  Image as ImageIcon,
  Tag,
  Trash2,
} from 'lucide-react';
import { useEffect, useState } from 'react';

export default function ProductView({ products }) {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [isArchivedOpen, setIsArchivedOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [formData, setFormData] = useState({
    ingredients: '',
  });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const activeProducts = products.filter((p) => p.is_active);
  const archivedProducts = products.filter((p) => !p.is_active);

  const groupedProducts = activeProducts.reduce((acc, product) => {
    const base = product.base_type || 'Other';
    if (!acc[base]) acc[base] = [];
    acc[base].push(product);
    return acc;
  }, {});

  const handleEdit = (product) => {
    setEditingProduct(product);
    setFormData({
      ingredients: product.ingredients || '',
    });
    setIsFormOpen(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleCancel = () => {
    setIsFormOpen(false);
    setEditingProduct(null);
    setFormData({
      ingredients: '',
    });
  };

  return (
    <div className="page-content" style={{ padding: isMobile ? '16px' : '0' }}>
      <div className="pt-[8px] flex justify-between items-start">
        <div>
          <h1 className="font-serif text-[28px] md:text-[36px] text-[#1B4332] font-normal leading-none m-0">
            Products
          </h1>
          <p className="font-sans text-[14px] text-[#6B7280] mt-[6px] m-0">
            Manage your soap range
          </p>
        </div>
        <button
          onClick={() => setIsFormOpen(!isFormOpen)}
          className="bg-[#1B4332] text-[#FFFFFF] font-sans text-[14px] font-semibold px-[16px] md:px-[24px] py-[10px] md:py-[12px] rounded-[10px] border-none cursor-pointer flex items-center gap-[8px] tracking-[0.01em] shadow-[0_2px_8px_rgba(27,67,50,0.25)] m-0"
        >
          {isFormOpen ? <X size={16} /> : <Plus size={16} />}
          {isFormOpen ? 'Close' : isMobile ? 'Add' : 'Add Product'}
        </button>
      </div>

      <div className="mt-[24px] md:mt-[32px] border-b-[2px] border-[#E5E7EB] mb-[24px] md:mb-[32px]"></div>

      {isFormOpen && (
        <div className="bg-[#FAFDF9] border border-[#D8F3DC] rounded-[14px] p-[20px] md:p-[32px] mb-[32px] shadow-[0_2px_12px_rgba(27,67,50,0.08)]">
          <h2 className="font-serif text-[20px] md:text-[22px] text-[#1B4332] mb-[20px] md:mb-[24px] mt-0">
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
            <div className="grid grid-cols-1 md:grid-cols-2 gap-[16px] md:gap-[20px]">
              {/* Basic Info */}
              <div>
                <label className="font-sans text-[11px] font-semibold uppercase tracking-[0.08em] text-[#6B7280] mb-[6px] block">
                  Product Name
                </label>
                <input
                  name="name"
                  defaultValue={editingProduct?.name}
                  required
                  className="w-full px-[14px] py-[11px] border border-[#E5E7EB] rounded-[8px] font-sans text-[16px] md:text-[14px] text-[#1A1A1A] bg-[#FFFFFF] outline-none"
                  placeholder="e.g. Lavender Bliss"
                />
              </div>

              <div>
                <label className="font-sans text-[11px] font-semibold uppercase tracking-[0.08em] text-[#6B7280] mb-[6px] block">
                  Slug (URL)
                </label>
                <input
                  name="slug"
                  defaultValue={editingProduct?.slug}
                  className="w-full px-[14px] py-[11px] border border-[#E5E7EB] rounded-[8px] font-sans text-[16px] md:text-[14px] text-[#1A1A1A] bg-[#FFFFFF] outline-none"
                  placeholder="lavender-bliss"
                />
              </div>

              <div>
                <label className="font-sans text-[11px] font-semibold uppercase tracking-[0.08em] text-[#6B7280] mb-[6px] block">
                  Base Type
                </label>
                <input
                  name="base_type"
                  defaultValue={editingProduct?.base_type}
                  required
                  className="w-full px-[14px] py-[11px] border border-[#E5E7EB] rounded-[8px] font-sans text-[16px] md:text-[14px] text-[#1A1A1A] bg-[#FFFFFF] outline-none"
                  placeholder="e.g. Glycerine"
                />
              </div>

              <div>
                <label className="font-sans text-[11px] font-semibold uppercase tracking-[0.08em] text-[#6B7280] mb-[6px] block">
                  Website Category
                </label>
                <input
                  name="category"
                  defaultValue={editingProduct?.category}
                  className="w-full px-[14px] py-[11px] border border-[#E5E7EB] rounded-[8px] font-sans text-[16px] md:text-[14px] text-[#1A1A1A] bg-[#FFFFFF] outline-none"
                  placeholder="e.g. Floral Collection"
                />
              </div>

              {/* Pricing and Weight */}
              <div>
                <label className="font-sans text-[11px] font-semibold uppercase tracking-[0.08em] text-[#6B7280] mb-[6px] block">
                  Unit Price (₹)
                </label>
                <input
                  name="unit_price"
                  type="number"
                  step="0.01"
                  defaultValue={editingProduct?.unit_price}
                  required
                  className="w-full px-[14px] py-[11px] border border-[#E5E7EB] rounded-[8px] font-sans text-[16px] md:text-[14px] text-[#1A1A1A] bg-[#FFFFFF] outline-none"
                  placeholder="250"
                />
              </div>

              <div>
                <label className="font-sans text-[11px] font-semibold uppercase tracking-[0.08em] text-[#6B7280] mb-[6px] block">
                  Price Range (for variants)
                </label>
                <input
                  name="price_range"
                  defaultValue={editingProduct?.price_range}
                  className="w-full px-[14px] py-[11px] border border-[#E5E7EB] rounded-[8px] font-sans text-[16px] md:text-[14px] text-[#1A1A1A] bg-[#FFFFFF] outline-none"
                  placeholder="e.g. ₹250 - ₹500"
                />
              </div>

              {/* Descriptions & Images */}
              <div style={{ gridColumn: '1 / -1' }}>
                <label className="font-sans text-[11px] font-semibold uppercase tracking-[0.08em] text-[#6B7280] mb-[6px] block">
                  Short Description
                </label>
                <textarea
                  name="short_description"
                  defaultValue={editingProduct?.short_description}
                  rows={2}
                  className="w-full px-[14px] py-[11px] border border-[#E5E7EB] rounded-[8px] font-sans text-[14px] text-[#1A1A1A] bg-[#FFFFFF] outline-none resize-vertical"
                  placeholder="Briefly describe this soap for the website catalogue..."
                />
              </div>

              <div style={{ gridColumn: '1 / -1' }}>
                <label className="font-sans text-[11px] font-semibold uppercase tracking-[0.08em] text-[#6B7280] mb-[6px] block">
                  ADDITIONAL INGREDIENTS
                </label>
                <textarea
                  name="ingredients"
                  value={formData.ingredients || ''}
                  onChange={handleChange}
                  rows={2}
                  className="w-full px-[14px] py-[11px] border border-[#E5E7EB] rounded-[8px] font-sans text-[14px] text-[#1A1A1A] bg-[#FFFFFF] outline-none resize-vertical"
                  placeholder="e.g. Neem Extract, Tulsi Extract, Essential Oils"
                />
              </div>

              <div style={{ gridColumn: '1 / -1' }}>
                <label className="font-sans text-[11px] font-semibold uppercase tracking-[0.08em] text-[#6B7280] mb-[6px] block">
                  Image URL
                </label>
                <input
                  name="image_url"
                  defaultValue={editingProduct?.image_url}
                  className="w-full px-[14px] py-[11px] border border-[#E5E7EB] rounded-[8px] font-sans text-[16px] md:text-[14px] text-[#1A1A1A] bg-[#FFFFFF] outline-none"
                  placeholder="https://healingsoil.in/images/products/lavender.jpg"
                />
              </div>

              <div>
                <label className="font-sans text-[11px] font-semibold uppercase tracking-[0.08em] text-[#6B7280] mb-[6px] block">
                  Weight (g)
                </label>
                <input
                  name="weight_grams"
                  type="number"
                  defaultValue={editingProduct?.weight_grams}
                  className="w-full px-[14px] py-[11px] border border-[#E5E7EB] rounded-[8px] font-sans text-[16px] md:text-[14px] text-[#1A1A1A] bg-[#FFFFFF] outline-none"
                  placeholder="100"
                />
              </div>

              {/* Status Toggles */}
              <div className="flex flex-wrap gap-[20px] md:col-span-2 mt-[8px]">
                <div className="flex items-center gap-[10px]">
                  <input
                    id="in_stock"
                    name="in_stock"
                    type="checkbox"
                    defaultChecked={editingProduct ? editingProduct.in_stock : true}
                    className="w-[18px] h-[18px] accent-[#1B4332]"
                  />
                  <label htmlFor="in_stock" className="font-sans text-[14px] text-[#1A1A1A]">
                    In Stock
                  </label>
                </div>

                <div className="flex items-center gap-[10px]">
                  <input
                    id="is_featured"
                    name="is_featured"
                    type="checkbox"
                    defaultChecked={editingProduct?.is_featured}
                    className="w-[18px] h-[18px] accent-[#1B4332]"
                  />
                  <label htmlFor="is_featured" className="font-sans text-[14px] text-[#1A1A1A]">
                    Featured on Website
                  </label>
                </div>

                <div className="flex items-center gap-[10px]">
                  <input
                    id="is_seasonal"
                    name="is_seasonal"
                    type="checkbox"
                    defaultChecked={editingProduct?.is_seasonal}
                    className="w-[18px] h-[18px] accent-[#1B4332]"
                  />
                  <label htmlFor="is_seasonal" className="font-sans text-[14px] text-[#1A1A1A]">
                    Seasonal Product
                  </label>
                </div>
              </div>
            </div>

            <div className="mt-[24px] flex flex-col md:flex-row gap-[12px] md:justify-end">
              <button
                type="submit"
                className="bg-[#1B4332] text-[#FFFFFF] font-sans text-[14px] font-semibold px-[24px] py-[12px] rounded-[10px] border-none cursor-pointer flex items-center gap-[8px] tracking-[0.01em] shadow-[0_2px_8px_rgba(27,67,50,0.25)] justify-center"
              >
                {editingProduct ? 'Update Product' : 'Save Product'}
              </button>
              <button
                type="button"
                onClick={handleCancel}
                className="bg-transparent border border-[#E5E7EB] text-[#6B7280] font-sans text-[14px] font-semibold px-[24px] py-[12px] rounded-[10px] cursor-pointer hover:bg-[#F9FAFB] m-0 order-first md:order-none"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="space-y-[32px] md:space-y-[40px]">
        {Object.entries(groupedProducts).map(([base, items]) => (
          <div key={base}>
            <div className="flex justify-between items-center mb-[12px]">
              <h3 className="font-serif text-[18px] text-[#1B4332] font-normal m-0">
                {base}
              </h3>
              <span className="font-sans text-[12px] text-[#6B7280] bg-[#F3F4F6] px-[10px] py-[3px] rounded-[20px] font-medium m-0">
                {items.length} {items.length === 1 ? 'item' : 'items'}
              </span>
            </div>
            <div className="border-b-[1px] border-[#E5E7EB] mb-[16px]"></div>

            <div className="space-y-[10px]">
              {items.map((product) => (
                <div
                  key={product.id}
                  className="bg-[#FFFFFF] border border-[#EBEBEB] rounded-[12px] px-[16px] md:px-[24px] py-[14px] md:py-[18px] flex flex-col md:flex-row md:items-center justify-between transition-all duration-[180ms] hover:border-[#D8F3DC] product-card"
                >
                  <div className="mb-[12px] md:mb-0">
                    <div className="flex items-center gap-2">
                      <div className="font-sans text-[15px] font-semibold text-[#1A1A1A] m-0">
                        {product.name}
                      </div>
                      {product.is_featured && (
                        <span className="bg-[#EEF2FF] text-[#4338CA] px-[6px] py-[1px] rounded text-[10px] font-bold uppercase">
                          Featured
                        </span>
                      )}
                    </div>
                    <div className="font-sans text-[13px] text-[#9CA3AF] mt-[4px] m-0">
                      {product.weight_grams ? `${product.weight_grams}g` : '-'}{' '}
                      • ₹{product.unit_price}
                      {product.slug && ` • /${product.slug}`}
                    </div>
                  </div>

                  <div className="flex flex-col md:flex-row md:items-center gap-[12px]">
                    <div className="flex items-center gap-[8px]">
                      {product.is_seasonal && (
                        <span className="bg-[#FEF3C7] text-[#92400E] font-sans text-[10px] font-bold tracking-[0.06em] px-[10px] py-[3px] rounded-[20px] uppercase m-0">
                          Seasonal
                        </span>
                      )}
                      {!product.in_stock ? (
                        <span className="bg-[#FEE2E2] text-[#B91C1C] font-sans text-[10px] font-bold tracking-[0.06em] px-[10px] py-[3px] rounded-[20px] uppercase m-0">
                          Out of Stock
                        </span>
                      ) : (
                        <span className="bg-[#D8F3DC] text-[#1B4332] font-sans text-[10px] font-bold tracking-[0.06em] px-[10px] py-[3px] rounded-[20px] uppercase m-0">
                          In Stock
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-[8px] product-actions">
                      <button
                        onClick={() => handleEdit(product)}
                        className="bg-transparent border border-[#1B4332] text-[#1B4332] font-sans text-[12px] font-semibold px-[16px] py-[8px] md:py-[6px] rounded-[8px] cursor-pointer flex items-center gap-[6px] flex-1 md:flex-none justify-center"
                      >
                        <Pencil size={13} /> Edit
                      </button>
                      <button
                        onClick={() => toggleArchiveAction(product.id)}
                        className="bg-transparent border border-[#E5E7EB] text-[#6B7280] font-sans text-[12px] font-semibold px-[16px] py-[8px] md:py-[6px] rounded-[8px] cursor-pointer flex items-center gap-[6px] flex-1 md:flex-none justify-center"
                      >
                        <Archive size={13} /> Archive
                      </button>
                      {product.order_count === 0 && (
                        <button
                          onClick={() => {
                            if (confirm('Are you sure you want to delete this product?')) {
                              deleteProductAction(product.id);
                            }
                          }}
                          className="bg-transparent border border-[#FEE2E2] text-[#B91C1C] font-sans text-[12px] font-semibold px-[16px] py-[8px] md:py-[6px] rounded-[8px] cursor-pointer flex items-center gap-[6px] flex-1 md:flex-none justify-center hover:bg-[#FEF2F2]"
                        >
                          <Trash2 size={13} /> Delete
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {archivedProducts.length > 0 && (
        <div className="mt-[40px] md:mt-[48px]">
          <div
            onClick={() => setIsArchivedOpen(!isArchivedOpen)}
            className="flex items-center gap-[10px] font-sans text-[13px] font-semibold text-[#6B7280] cursor-pointer py-[12px] border-t-[1px] border-[#E5E7EB]"
          >
            <div
              className={`transition-transform duration-200 ${isArchivedOpen ? 'rotate-90' : ''}`}
            >
              <ChevronRight size={16} />
            </div>
            Archived ({archivedProducts.length})
          </div>

          {isArchivedOpen && (
            <div className="mt-[16px] space-y-[10px]">
              {archivedProducts.map((product) => (
                <div
                  key={product.id}
                  className="bg-[#FAFAFA] border border-[#EBEBEB] rounded-[12px] px-[16px] md:px-[24px] py-[14px] md:py-[18px] flex flex-col md:flex-row md:items-center justify-between opacity-60"
                >
                  <div className="mb-[10px] md:mb-0">
                    <div className="font-sans text-[15px] font-semibold text-[#1A1A1A] m-0">
                      {product.name}
                    </div>
                    <div className="font-sans text-[13px] text-[#9CA3AF] mt-[4px] m-0">
                      {product.base_type} • ₹{product.unit_price}
                    </div>
                  </div>
                  <div className="flex items-center gap-[8px]">
                    <button
                      onClick={() => toggleArchiveAction(product.id)}
                      className="bg-transparent border border-[#D8F3DC] text-[#1B4332] font-sans text-[12px] font-semibold px-[16px] py-[8px] md:py-[6px] rounded-[8px] cursor-pointer flex items-center gap-[6px] md:w-auto w-full justify-center"
                    >
                      <ArchiveRestore size={13} /> Restore
                    </button>
                    {product.order_count === 0 && (
                      <button
                        onClick={() => {
                          if (confirm('Are you sure you want to delete this product?')) {
                            deleteProductAction(product.id);
                          }
                        }}
                        className="bg-transparent border border-[#FEE2E2] text-[#B91C1C] font-sans text-[12px] font-semibold px-[16px] py-[8px] md:py-[6px] rounded-[8px] cursor-pointer flex items-center gap-[6px] md:w-auto w-full justify-center hover:bg-[#FEF2F2]"
                      >
                        <Trash2 size={13} /> Delete
                      </button>
                    )}
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
