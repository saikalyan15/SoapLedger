'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Pencil, ArrowLeft, ChevronDown, CheckCircle, UserCheck, AlertCircle } from 'lucide-react';
import StatusBadge from '@/components/StatusBadge';
import { updateOrderStatusAction } from '@/lib/actions/orders';
import { ORDER_STATUSES, EDITABLE_STATUSES } from '@/lib/constants';

const OrderDetailsView = ({ order, items }) => {
  const router = useRouter();
  const [newStatus, setNewStatus] = useState(order.status);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  // Detect Mobile — React State approach
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const isEditable = EDITABLE_STATUSES.includes(order.status);

  // Calculate fields not stored directly in DB
  const subtotal = items.reduce((sum, item) => sum + (Number(item.line_total) || 0), 0);
  const revenue = Number(order.revenue) || 0;
  const shipping = Number(order.shipping_charge) || 0;
  const discount = Math.max(0, subtotal + shipping - revenue);

  const handleUpdateStatus = async () => {
    if (newStatus === order.status) return;
    
    setIsUpdating(true);
    const result = await updateOrderStatusAction(order.id, newStatus);
    setIsUpdating(false);
    
    if (result.success) {
      router.refresh();
    } else {
      alert(result.error);
    }
  };

  return (
    <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
      {/* Header Row */}
      <div 
        className="order-detail-header"
        style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center', 
          marginBottom: '40px' 
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <Link href="/orders" style={{ color: '#6B7280' }}><ArrowLeft size={24} /></Link>
          <h1 style={{ 
            fontFamily: 'DM Serif Display, serif', 
            fontSize: isMobile ? '24px' : '28px', 
            color: '#1B4332',
            margin: 0 
          }}>
            Order #{order.id.slice(0, 8)}
          </h1>
          <StatusBadge status={order.status} />
        </div>
        <div style={{ display: 'flex', gap: '12px' }}>
          {isEditable && (
            <Link 
              href={`/orders/${order.id}/edit`}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                background: '#FFFFFF',
                color: '#374151',
                border: '1px solid #E5E7EB',
                padding: '8px 16px',
                borderRadius: '8px',
                fontWeight: '600',
                textDecoration: 'none',
                fontFamily: 'Plus Jakarta Sans, sans-serif'
              }}
            >
              <Pencil size={18} />
              {!isMobile && 'Edit Order'}
            </Link>
          )}
          <Link 
            href="/orders"
            style={{
              background: '#F3F4F6',
              color: '#374151',
              padding: '8px 16px',
              borderRadius: '8px',
              fontWeight: '600',
              textDecoration: 'none',
              fontFamily: 'Plus Jakarta Sans, sans-serif'
            }}
          >
            {isMobile ? 'Back' : 'Back to History'}
          </Link>
        </div>
      </div>

      {/* Timeline Row (Top Summary) */}
      <div 
        className="order-timeline"
        style={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: '12px', 
          marginBottom: '40px',
          fontFamily: '"Plus Jakarta Sans", sans-serif',
          fontSize: '12px',
          color: '#6B7280'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#1B4332' }}></div>
          <span>Ordered {new Date(order.order_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}</span>
        </div>
        
        {order.dispatched_at && (
          <>
            <div className="timeline-connector" style={{ width: '40px', height: '1px', background: '#E5E7EB' }}></div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#1B4332' }}></div>
              <span>Dispatched {new Date(order.dispatched_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}</span>
            </div>
          </>
        )}

        {order.delivered_at && (
          <>
            <div className="timeline-connector" style={{ width: '40px', height: '1px', background: '#E5E7EB' }}></div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#1B4332' }}></div>
              <span>Delivered {new Date(order.delivered_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}</span>
            </div>
          </>
        )}
      </div>

      <div 
        className="order-detail-grid"
        style={{ display: isMobile ? 'flex' : 'grid', flexDirection: 'column', gridTemplateColumns: '1fr 340px', gap: '40px' }}
      >
        {/* Left Column */}
        <div>
          {/* Customer Card */}
          <div style={cardStyle}>
            <div style={sectionLabelStyle}>Customer Info</div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
              <div style={{ fontWeight: '700', fontSize: isMobile ? '18px' : '20px', color: '#111827' }}>
                {order.customer_name}
              </div>
              <div style={{
                background: order.customer_type === 'Returning' ? '#D8F3DC' : '#FEF3C7',
                color: order.customer_type === 'Returning' ? '#1B4332' : '#92400E',
                padding: '4px 10px',
                borderRadius: '20px',
                fontSize: '11px',
                fontWeight: '700',
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                fontFamily: 'Plus Jakarta Sans, sans-serif',
                textTransform: 'uppercase',
                letterSpacing: '0.04em'
              }}>
                {order.customer_type === 'Returning' ? <UserCheck size={12} /> : <AlertCircle size={12} />}
                {order.customer_type}
              </div>
            </div>
            <div style={{ color: '#4B5563', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              {order.customer_phone}
            </div>
            {order.customer_address && (
              <div style={{ 
                paddingTop: '16px', 
                borderTop: '1px solid #F3F4F6',
                color: '#374151',
                fontSize: '14px',
                lineHeight: '1.6'
              }}>
                {order.customer_address}
              </div>
            )}
          </div>

          {/* Items Card */}
          <div style={cardStyle}>
            <div style={sectionLabelStyle}>Order Items</div>
            
            {isMobile ? (
              /* Mobile Items Cards */
              <div className="line-items-cards">
                {items.map((item) => (
                  <div key={item.id} style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '12px 0',
                    borderBottom: '1px solid #F3F4F6',
                  }}>
                    <div>
                      <div style={{ fontSize: '14px', fontWeight: 600, color: '#111827' }}>{item.product_name}</div>
                      <div style={{ fontSize: '12px', color: '#6B7280' }}>
                        {item.quantity} × ₹{Number(item.unit_price).toLocaleString()}
                      </div>
                    </div>
                    <div style={{
                      fontFamily: 'DM Serif Display, serif',
                      fontSize: '16px',
                      color: '#1B4332',
                    }}>
                      ₹{Number(item.line_total).toLocaleString('en-IN')}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              /* Desktop Items Table */
              <table className="line-items-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid #F3F4F6' }}>
                    <th style={{ ...thStyle, paddingLeft: 0 }}>Product</th>
                    <th style={{ ...thStyle, textAlign: 'center' }}>Qty</th>
                    <th style={{ ...thStyle, textAlign: 'right' }}>Price</th>
                    <th style={{ ...thStyle, textAlign: 'right', paddingRight: 0 }}>Total</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((item) => (
                    <tr key={item.id} style={{ borderBottom: '1px solid #F3F4F6' }}>
                      <td style={{ ...tdStyle, paddingLeft: 0 }}>
                        <div style={{ fontWeight: '600', color: '#111827' }}>{item.product_name}</div>
                        <div style={{ fontSize: '12px', color: '#6B7280' }}>{item.base_type}</div>
                      </td>
                      <td style={{ ...tdStyle, textAlign: 'center' }}>{item.quantity}</td>
                      <td style={{ ...tdStyle, textAlign: 'right' }}>₹{Number(item.unit_price).toLocaleString()}</td>
                      <td style={{ ...tdStyle, textAlign: 'right', fontWeight: '600', color: '#111827', paddingRight: 0 }}>
                        ₹{Number(item.line_total).toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}

            {/* Summary Lines */}
            <div style={{ marginTop: '24px', display: 'flex', flexDirection: 'column', gap: '12px', alignItems: 'flex-end' }}>
              <div style={summaryLineStyle} className="w-full">
                <span>Subtotal</span>
                <span style={{ fontWeight: '600' }}>₹{subtotal.toLocaleString()}</span>
              </div>
              {(shipping > 0 || Number(order.packaging_cost) > 0) && (
                <div style={summaryLineStyle} className="w-full">
                  <span>Charges</span>
                  <span style={{ fontWeight: '600' }}>₹{(shipping + Number(order.packaging_cost)).toLocaleString()}</span>
                </div>
              )}
              {discount > 0 && (
                <div style={summaryLineStyle} className="w-full">
                  <span>Discount</span>
                  <span style={{ fontWeight: '600', color: '#DC2626' }}>-₹{discount.toLocaleString()}</span>
                </div>
              )}
              <div 
                style={{ 
                  ...summaryLineStyle, 
                  borderTop: '1px solid #F3F4F6', 
                  paddingTop: '12px', 
                  marginTop: '4px',
                  width: isMobile ? '100%' : '240px'
                }} 
              >
                <span style={{ fontWeight: '700', fontSize: '16px', color: '#111827' }}>Total</span>
                <span style={{ fontWeight: '800', fontSize: isMobile ? '20px' : '24px', color: '#1B4332' }}>₹{revenue.toLocaleString()}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Actions */}
        <div>
          <div style={cardStyle}>
            <div style={sectionLabelStyle}>Update Status</div>
            <div 
              className="status-update-row"
              style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}
            >
              <div style={{ position: 'relative' }}>
                <select 
                  value={newStatus}
                  onChange={(e) => setNewStatus(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px 16px',
                    borderRadius: '8px',
                    border: '1px solid #E5E7EB',
                    fontSize: '14px',
                    fontFamily: 'inherit',
                    appearance: 'none',
                    background: '#FFFFFF',
                    outline: 'none'
                  }}
                >
                  {ORDER_STATUSES.map(s => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
                <ChevronDown size={16} style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', color: '#9CA3AF', pointerEvents: 'none' }} />
              </div>
              <button
                onClick={handleUpdateStatus}
                disabled={newStatus === order.status || isUpdating}
                style={{
                  width: '100%',
                  padding: '10px',
                  borderRadius: '8px',
                  border: 'none',
                  background: newStatus === order.status ? '#F3F4F6' : '#1B4332',
                  color: newStatus === order.status ? '#9CA3AF' : '#FFFFFF',
                  fontWeight: '700',
                  fontSize: '14px',
                  cursor: newStatus === order.status ? 'default' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  transition: 'all 0.2s'
                }}
              >
                {isUpdating ? 'Updating...' : 'Update Status'}
              </button>
            </div>
          </div>

          <div style={{ ...cardStyle, background: '#F9FAFB' }}>
            <div style={sectionLabelStyle}>Order Timeline</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <TimelineItem 
                label="Order Placed" 
                date={new Date(order.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                active={true}
              />
              {order.dispatched_at && (
                <TimelineItem 
                  label="Dispatched" 
                  date={new Date(order.dispatched_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                  active={true}
                />
              )}
              {order.delivered_at && (
                <TimelineItem 
                  label="Delivered" 
                  date={new Date(order.delivered_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                  active={true}
                />
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const TimelineItem = ({ label, date, active }) => (
  <div style={{ display: 'flex', gap: '12px' }}>
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      <div style={{ 
        width: '12px', 
        height: '12px', 
        borderRadius: '50%', 
        background: active ? '#1B4332' : '#E5E7EB',
        border: active ? '2px solid #D8F3DC' : 'none'
      }}></div>
      <div style={{ flex: 1, width: '2px', background: '#E5E7EB', marginTop: '4px' }}></div>
    </div>
    <div style={{ paddingBottom: '4px' }}>
      <div style={{ fontSize: '13px', fontWeight: '700', color: active ? '#111827' : '#9CA3AF' }}>{label}</div>
      <div style={{ fontSize: '11px', color: '#6B7280', marginTop: '2px' }}>{date}</div>
    </div>
  </div>
);

const cardStyle = {
  background: '#FFFFFF',
  border: '1px solid #E5E7EB',
  borderRadius: '12px',
  padding: '24px',
  marginBottom: '24px'
};

const sectionLabelStyle = {
  fontSize: '11px',
  fontWeight: '800',
  textTransform: 'uppercase',
  letterSpacing: '0.05em',
  color: '#9CA3AF',
  marginBottom: '20px',
  fontFamily: 'Plus Jakarta Sans, sans-serif'
};

const thStyle = {
  padding: '12px 0',
  textAlign: 'left',
  fontSize: '12px',
  fontWeight: '700',
  color: '#6B7280',
  fontFamily: 'Plus Jakarta Sans, sans-serif'
};

const tdStyle = {
  padding: '16px 0',
  fontSize: '14px',
  fontFamily: 'Plus Jakarta Sans, sans-serif',
  color: '#374151'
};

const summaryLineStyle = {
  display: 'flex',
  justifyContent: 'space-between',
  width: '100%',
  maxWidth: '240px',
  fontSize: '14px',
  color: '#4B5563',
  fontFamily: 'Plus Jakarta Sans, sans-serif'
};

export default OrderDetailsView;
