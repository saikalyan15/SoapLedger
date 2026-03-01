'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Plus, ShoppingBag, Phone, ChevronRight, Search } from 'lucide-react';
import StatusBadge from '@/components/StatusBadge';

export default function OrdersView({ orders }) {
  const [search, setSearch] = useState('');

  const filteredOrders = orders.filter(o => 
    o.customer_name.toLowerCase().includes(search.toLowerCase()) ||
    o.customer_phone.includes(search)
  );

  return (
    <div className="pb-32">
      {/* Page Header */}
      <div className="pt-2 flex justify-between items-start">
        <div>
          <h1 className="text-[36px] text-primary font-normal leading-none m-0 font-serif">
            Orders
          </h1>
          <p className="text-sm text-muted mt-1.5 m-0 font-sans">
            Track and manage your WhatsApp orders
          </p>
        </div>
        <Link 
          href="/orders/new"
          className="bg-primary text-white text-sm font-semibold px-6 py-3 rounded-[10px] no-underline border-none cursor-pointer flex items-center gap-2 shadow-[0_2px_8px_rgba(27,67,50,0.25)] hover:bg-[#2D6A4F] hover:shadow-[0_4px_12px_rgba(27,67,50,0.3)] hover:-translate-y-[1px] transition-all duration-200 m-0 font-sans"
        >
          <Plus size={16} />
          New Order
        </Link>
      </div>

      <div className="mt-8 border-b-2 border-border mb-8"></div>

      {/* Search Bar */}
      <div className="relative mb-10 max-w-[420px]">
        <Search size={16} className="absolute left-3.5 top-[50%] -translate-y-[50%] text-muted opacity-50" />
        <input 
          type="text"
          placeholder="Search by name or phone..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-10.5 pr-3.5 py-[11px] border border-border rounded-lg text-sm text-[#1A1A1A] outline-none transition-all duration-150 focus:border-primary focus:ring-[3px] focus:ring-primary/10 font-sans bg-white"
        />
      </div>

      {/* Orders List */}
      {filteredOrders.length === 0 ? (
        <div className="text-center py-[100px] border border-dashed border-border rounded-[14px] bg-white/50">
           <ShoppingBag className="w-12 h-12 text-muted mx-auto mb-4 opacity-20" />
           <p className="text-[22px] text-primary mb-2 mt-0 font-normal font-serif">No orders found</p>
           <p className="text-sm text-muted max-w-[300px] mx-auto m-0 leading-relaxed font-sans">Start by creating a new order from your WhatsApp chat history.</p>
        </div>
      ) : (
        <div className="space-y-[12px]">
          {filteredOrders.map((order) => (
            <div 
              key={order.id}
              className="bg-white border border-[#EBEBEB] rounded-xl px-6 py-5 flex items-center justify-between transition-all duration-180 ease-in-out hover:border-primary-light hover:shadow-card-hover hover:-translate-y-[1px]"
            >
              <div className="flex items-center gap-8 flex-1">
                {/* Date Column */}
                <div className="text-center min-w-[64px] pr-8 border-r border-border">
                  <div className="text-[11px] font-bold uppercase tracking-[0.1em] text-muted m-0 font-sans">
                    {new Date(order.order_date).toLocaleDateString('en-IN', { month: 'short' })}
                  </div>
                  <div className="text-2xl text-primary leading-none mt-1 m-0 font-normal font-serif">
                    {new Date(order.order_date).toLocaleDateString('en-IN', { day: '2-digit' })}
                  </div>
                </div>
                
                {/* Customer Column */}
                <div className="min-w-[200px]">
                  <div className="text-base font-semibold text-[#1A1A1A] m-0 font-sans">
                    {order.customer_name}
                  </div>
                  <div className="text-[13px] text-muted mt-1 m-0 flex items-center gap-1.5 font-sans">
                    <Phone size={12} className="opacity-50" /> {order.customer_phone}
                  </div>
                </div>

                {/* Status Column */}
                <div className="flex-1 px-4">
                  <StatusBadge status={order.status} />
                </div>

                {/* Price Column */}
                <div className="text-right pr-8">
                  <div className="text-[11px] font-bold uppercase tracking-[0.1em] text-muted m-0 font-sans">Order Value</div>
                  <div className="text-lg font-bold text-primary mt-0.5 m-0 tracking-tight font-sans">₹{parseFloat(order.order_value).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</div>
                </div>
              </div>
              
              {/* Action */}
              <Link 
                href={`/orders/${order.id}`}
                className="bg-transparent border border-primary text-primary text-[12px] font-semibold px-[18px] py-2 rounded-lg no-underline flex items-center gap-1.5 transition-all duration-150 hover:bg-primary hover:text-white m-0 flex-shrink-0 font-sans"
              >
                Details
                <ChevronRight size={14} />
              </Link>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
