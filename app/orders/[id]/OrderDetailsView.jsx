'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Pencil, ArrowLeft, ChevronDown, CheckCircle } from 'lucide-react';
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

  return (
    <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
      {/* Header Row */}
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        marginBottom: '40px' 
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <Link href="/orders" style={{ color: '#6B7280' }}><ArrowLeft size={24} /></Link>
          <h1 style={{ 
            fontFamily: 'DM Serif Display, serif', 
            fontSize: '28px', 
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
              Edit Order
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
            Back to History
          </Link>
        </div>
      </div>

      {/* Timeline Row */}
      <div style={{ 
        display: 'flex', 
        alignItems: 'center', 
        gap: '12px', 
        marginBottom: '40px',
        fontFamily: '"Plus Jakarta Sans", sans-serif',
        fontSize: '12px',
        color: '#6B7280'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#1B4332' }}></div>
          <span>Ordered {new Date(order.order_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}</span>
        </div>
        
        {order.dispatched_at && (
          <>
            <div style={{ width: '40px', height: '1px', background: '#E5E7EB' }}></div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: order.status === 'Dispatched' || order.status === 'Delivered' ? '#1B4332' : '#E5E7EB' }}></div>
              <span>Dispatched {new Date(order.dispatched_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}</span>
            </div>
          </>
        )}

        {order.delivered_at && (
          <>
            <div style={{ width: '40px', height: '1px', background: '#E5E7EB' }}></div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: order.status === 'Delivered' ? '#1B4332' : '#E5E7EB' }}></div>
              <span>Delivered {new Date(order.delivered_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}</span>
            </div>
          </>
        )}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: '40px' }}>
        {/* Left Column */}
        <div>
          {/* Customer Card */}
          <div style={cardStyle}>
            <div style={sectionLabelStyle}>Customer Info</div>
            <div style={{ fontWeight: '700', fontSize: '20px', color: '#111827', marginBottom: '8px' }}>
              {order.customer_name}
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
