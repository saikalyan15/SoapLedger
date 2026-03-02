'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Pencil, ArrowLeft, ChevronDown, CheckCircle, UserCheck, AlertCircle } from 'lucide-react';
import StatusBadge from '@/components/StatusBadge';
import { updateOrderStatusAction } from '@/lib/actions/orders';

const OrderDetailsView = ({ order, items }) => {
  const router = useRouter();
  const [newStatus, setNewStatus] = useState(order.status);
  const [isUpdating, setIsUpdating] = useState(false);

  const handleUpdateStatus = async () => {
    setIsUpdating(true);
    const result = await updateOrderStatusAction(order.id, newStatus);
    if (result.success) {
      // Revalidation is handled in the action
    } else {
      alert(result.error || 'Failed to update status');
    }
    setIsUpdating(false);
  };

  const totalUnits = items.reduce((sum, item) => sum + parseInt(item.quantity), 0);
  const profitPerUnit = totalUnits > 0 ? (order.gross_profit / totalUnits).toFixed(2) : 0;
  
  const isEditable = ['Received', 'Payment Confirmed', 'In Production'].includes(order.status);
  const isReturning = parseInt(order.previous_orders_count) > 0;

  return (
    <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
      {/* ... (keep header and timeline) ... */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: '40px' }}>
        {/* Left Column */}
        <div>
          {/* Customer Card */}
          <div style={cardStyle}>
            <div style={sectionLabelStyle}>Customer Info</div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
              <div style={{ fontWeight: '700', fontSize: '20px', color: '#111827' }}>
                {order.customer_name}
              </div>
              <div style={{
                background: isReturning ? '#D8F3DC' : '#FEF3C7',
                color: isReturning ? '#1B4332' : '#92400E',
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
                {isReturning ? <UserCheck size={12} /> : <AlertCircle size={12} />}
                {isReturning ? 'Returning' : 'New'}
              </div>
            </div>
            <div style={{ color: '#4B5563', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              {order.customer_phone}
            </div>
            {order.customer_address && (
              <div style={{ 
                background: '#F9FAFB', 
                padding: '16px', 
                borderRadius: '8px',
                fontSize: '14px',
                color: '#374151',
                lineHeight: 1.5,
                border: '1px solid #E5E7EB'
              }}>
                {order.customer_address}
              </div>
            )}
          </div>

          {/* Items Table */}
          <div style={{ ...cardStyle, padding: 0, overflow: 'hidden' }}>
            <div style={{ padding: '20px 24px', ...sectionLabelStyle, marginBottom: 0 }}>Soaps Ordered</div>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead>
                <tr style={{ background: '#F9FAFB', borderBottom: '1px solid #E5E7EB' }}>
                  <th style={thStyle}>Product</th>
                  <th style={thStyle}>Qty</th>
                  <th style={thStyle}>Unit Price</th>
                  <th style={{ ...thStyle, textAlign: 'right' }}>Total</th>
                </tr>
              </thead>
              <tbody>
                {items.map(item => (
                  <tr key={item.id} style={{ borderBottom: '1px solid #E5E7EB' }}>
                    <td style={tdStyle}>{item.product_name}</td>
                    <td style={tdStyle}>{item.quantity}</td>
                    <td style={tdStyle}>₹{item.unit_price}</td>
                    <td style={{ ...tdStyle, textAlign: 'right', fontWeight: '600' }}>₹{item.line_total}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Notes */}
          {order.notes && (
            <div style={cardStyle}>
              <div style={sectionLabelStyle}>Internal Notes</div>
              <div style={{ fontSize: '14px', color: '#4B5563', lineHeight: 1.6 }}>
                {order.notes}
              </div>
            </div>
          )}
        </div>

        {/* Right Column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {/* Billing Summary */}
          <div style={cardStyle}>
            <div style={sectionLabelStyle}>Billing Summary</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={summaryRowStyle}>
                <span style={{ color: '#6B7280' }}>Subtotal</span>
                <span style={{ fontWeight: '600' }}>₹{order.revenue}</span>
              </div>
              <div style={summaryRowStyle}>
                <span style={{ color: '#6B7280' }}>Shipping</span>
                <span style={{ fontWeight: '600' }}>₹{order.shipping_charge}</span>
              </div>
              <div style={{ height: '1px', background: '#F3F4F6', margin: '4px 0' }}></div>
              <div style={{ ...summaryRowStyle, fontSize: '18px', marginBottom: 0 }}>
                <span style={{ fontWeight: '700', color: '#111827' }}>Total</span>
                <span style={{ fontWeight: '800', color: '#1B4332' }}>
                  ₹{(parseFloat(order.revenue) + parseFloat(order.shipping_charge)).toLocaleString('en-IN')}
                </span>
              </div>
            </div>
          </div>

          {/* Quick Status Update */}
          <div style={cardStyle}>
            <div style={sectionLabelStyle}>Update Status</div>
            {['Dispatched', 'Delivered', 'Cancelled'].includes(order.status) ? (
              <div style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: '8px',
                color: '#6B7280',
                fontSize: '14px'
              }}>
                <CheckCircle size={18} />
                Order is closed
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div style={{ position: 'relative' }}>
                  <select
                    value={newStatus}
                    onChange={(e) => setNewStatus(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '10px 14px',
                      borderRadius: '8px',
                      border: '1px solid #E5E7EB',
                      fontSize: '14px',
                      fontFamily: 'Plus Jakarta Sans, sans-serif',
                      appearance: 'none',
                      background: '#FFFFFF',
                      outline: 'none'
                    }}
                  >
                    <option value="Received">Received</option>
                    <option value="Payment Confirmed">Payment Confirmed</option>
                    <option value="In Production">In Production</option>
                    <option value="Dispatched">Dispatched</option>
                    <option value="Delivered">Delivered</option>
                    <option value="Cancelled">Cancelled</option>
                  </select>
                  <ChevronDown 
                    size={18} 
                    style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', color: '#6B7280' }} 
                  />
                </div>
                <button
                  onClick={handleUpdateStatus}
                  disabled={isUpdating || newStatus === order.status}
                  style={{
                    background: newStatus === order.status ? '#F3F4F6' : '#1B4332',
                    color: newStatus === order.status ? '#9CA3AF' : '#FFFFFF',
                    border: 'none',
                    padding: '10px',
                    borderRadius: '8px',
                    fontWeight: '600',
                    cursor: newStatus === order.status ? 'default' : 'pointer',
                    fontFamily: 'Plus Jakarta Sans, sans-serif',
                    transition: 'all 0.2s'
                  }}
                >
                  {isUpdating ? 'Updating...' : 'Update Status'}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

const cardStyle = {
  background: '#FFFFFF',
  border: '1px solid #E5E7EB',
  borderRadius: '16px',
  padding: '24px',
  marginBottom: '24px'
};

const sectionLabelStyle = {
  fontSize: '11px',
  textTransform: 'uppercase',
  letterSpacing: '0.08em',
  color: '#6B7280',
  marginBottom: '16px',
  fontWeight: '600',
  fontFamily: 'Plus Jakarta Sans, sans-serif'
};

const summaryRowStyle = {
  display: 'flex',
  justifyContent: 'space-between',
  fontSize: '14px',
  marginBottom: '8px',
  fontFamily: 'Plus Jakarta Sans, sans-serif'
};

const thStyle = {
  padding: '12px 24px',
  fontSize: '11px',
  textTransform: 'uppercase',
  letterSpacing: '0.08em',
  color: '#6B7280',
  fontWeight: '600',
  fontFamily: 'Plus Jakarta Sans, sans-serif'
};

const tdStyle = {
  padding: '16px 24px',
  fontSize: '14px',
  fontFamily: 'Plus Jakarta Sans, sans-serif',
  color: '#374151'
};

export default OrderDetailsView;
