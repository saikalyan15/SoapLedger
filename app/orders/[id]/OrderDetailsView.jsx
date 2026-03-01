'use client';

import { useRouter } from 'next/navigation';
import { 
  ArrowLeft, 
  Trash2, 
  Calendar, 
  User, 
  Phone, 
  MapPin, 
  Package, 
  Receipt,
  AlertCircle
} from 'lucide-react';
import StatusBadge from '@/components/StatusBadge';
import { deleteOrderAction } from '@/lib/actions/orders';

export default function OrderDetailsView({ order }) {
  const router = useRouter();
  
  const subtotal = order.items.reduce((sum, item) => sum + (item.quantity * item.unit_price), 0);
  const total = subtotal + parseFloat(order.shipping_charge);
  const estProfit = order.order_value - order.packaging_cost - order.material_cost;

  const handleDelete = async () => {
    if (confirm("Are you sure you want to delete this order? This action cannot be undone.")) {
      try {
        await deleteOrderAction(order.id);
        router.push('/orders');
      } catch (e) {
        alert("Failed to delete order. It might already be delivered.");
      }
    }
  };

  return (
    <div className="pb-32">
      {/* Page Header */}
      <div className="pt-2 flex justify-between items-start">
        <div>
          <button 
            onClick={() => router.back()}
            className="flex items-center gap-2 text-muted hover:text-primary transition-colors border-none bg-transparent cursor-pointer p-0 mb-4 font-sans text-sm font-semibold"
          >
            <ArrowLeft size={16} />
            Back to Orders
          </button>
          <div className="flex items-center gap-4">
            <h1 className="text-[36px] text-primary font-normal leading-none m-0 font-serif">
              Order Details
            </h1>
            <StatusBadge status={order.status} />
          </div>
        </div>
        
        {order.status !== 'Delivered' && (
          <button 
            onClick={handleDelete}
            className="bg-transparent border border-border text-danger font-sans text-[14px] font-semibold px-5 py-2.5 rounded-[10px] cursor-pointer flex items-center gap-2 transition-all hover:bg-red-50 hover:border-danger m-0"
          >
            <Trash2 size={16} />
            Delete Order
          </button>
        )}
      </div>

      <div className="mt-8 border-b-2 border-border mb-10"></div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Left Column: Info */}
        <div className="md:col-span-2 space-y-8">
          {/* Customer Card */}
          <div className="bg-white border border-[#EBEBEB] rounded-xl p-8 shadow-sm">
            <div className="font-sans text-[11px] font-bold uppercase tracking-[0.1em] text-muted mb-6">Customer Information</div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="flex gap-4">
                <div className="w-10 h-10 rounded-lg bg-bg flex items-center justify-center text-primary flex-shrink-0">
                  <User size={20} />
                </div>
                <div>
                  <div className="text-[13px] text-muted font-sans mb-0.5">Name</div>
                  <div className="text-base font-semibold text-[#1A1A1A] font-sans">{order.customer_name}</div>
                </div>
              </div>
              <div className="flex gap-4">
                <div className="w-10 h-10 rounded-lg bg-bg flex items-center justify-center text-primary flex-shrink-0">
                  <Phone size={20} />
                </div>
                <div>
                  <div className="text-[13px] text-muted font-sans mb-0.5">WhatsApp</div>
                  <div className="text-base font-semibold text-[#1A1A1A] font-sans">{order.customer_phone}</div>
                </div>
              </div>
              <div className="flex gap-4 md:col-span-2">
                <div className="w-10 h-10 rounded-lg bg-bg flex items-center justify-center text-primary flex-shrink-0">
                  <MapPin size={20} />
                </div>
                <div>
                  <div className="text-[13px] text-muted font-sans mb-0.5">Delivery Address</div>
                  <div className="text-base text-[#1A1A1A] font-sans leading-relaxed">
                    {order.customer_address || <span className="text-muted italic opacity-50">No address provided</span>}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Items Card */}
          <div className="bg-white border border-[#EBEBEB] rounded-xl overflow-hidden shadow-sm">
            <div className="p-8 border-b border-[#EBEBEB]">
              <div className="font-sans text-[11px] font-bold uppercase tracking-[0.1em] text-muted">Items Ordered</div>
            </div>
            <div className="p-0">
              {order.items.map((item, idx) => (
                <div key={item.id} className={`p-6 flex items-center justify-between font-sans ${idx !== order.items.length - 1 ? 'border-b border-[#F3F4F6]' : ''}`}>
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-lg border border-border flex items-center justify-center text-muted">
                      <Package size={18} />
                    </div>
                    <div>
                      <div className="text-sm font-semibold text-[#1A1A1A]">{item.product_name}</div>
                      <div className="text-[12px] text-muted uppercase tracking-wider font-bold mt-0.5 opacity-70">{item.base_type}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-12">
                    <div className="text-right">
                      <div className="text-[11px] text-muted uppercase font-bold">Qty</div>
                      <div className="text-sm font-semibold">{item.quantity}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-[11px] text-muted uppercase font-bold">Price</div>
                      <div className="text-sm font-semibold">₹{parseFloat(item.unit_price).toFixed(2)}</div>
                    </div>
                    <div className="text-right min-w-[80px]">
                      <div className="text-[11px] text-muted uppercase font-bold">Total</div>
                      <div className="text-sm font-bold text-primary">₹{(item.quantity * item.unit_price).toFixed(2)}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Notes Section */}
          {order.notes && (
            <div className="bg-[#FAFDF9] border border-primary-light rounded-xl p-8 shadow-sm flex gap-4">
              <AlertCircle size={20} className="text-primary flex-shrink-0" />
              <div>
                <div className="font-sans text-[11px] font-bold uppercase tracking-[0.1em] text-primary mb-2">Order Notes</div>
                <div className="text-sm text-[#1A1A1A] font-sans leading-relaxed">{order.notes}</div>
              </div>
            </div>
          )}
        </div>

        {/* Right Column: Financial Summary */}
        <div className="space-y-8">
          <div className="bg-white border border-[#EBEBEB] rounded-xl p-8 shadow-sm">
            <div className="font-sans text-[11px] font-bold uppercase tracking-[0.1em] text-muted mb-6">Financial Summary</div>
            
            <div className="space-y-4">
              <div className="flex justify-between items-center text-sm font-sans">
                <span className="text-muted">Order Date</span>
                <span className="font-semibold">{new Date(order.order_date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</span>
              </div>
              <div className="flex justify-between items-center text-sm font-sans">
                <span className="text-muted">Subtotal</span>
                <span className="font-semibold">₹{subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between items-center text-sm font-sans pb-4 border-b border-[#F3F4F6]">
                <span className="text-muted">Shipping</span>
                <span className="font-semibold">₹{parseFloat(order.shipping_charge).toFixed(2)}</span>
              </div>
              <div className="flex justify-between items-center pt-2">
                <span className="font-bold text-primary font-sans">Grand Total</span>
                <span className="text-[24px] font-bold text-primary font-sans">₹{total.toFixed(2)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
