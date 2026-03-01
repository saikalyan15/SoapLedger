'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Eye, Pencil, Trash2, Check, X } from 'lucide-react';
import PageHeader from '@/components/PageHeader';
import StatusBadge from '@/components/StatusBadge';
import EmptyState from '@/components/EmptyState';
import { deleteOrderAction } from '@/lib/actions/orders';

const statuses = ['All', 'Received', 'Payment Confirmed', 'In Production', 'Dispatched', 'Delivered', 'Cancelled'];

const OrdersView = ({ orders }) => {
  const [activeFilter, setActiveFilter] = useState('All');
  const [deletingId, setDeletingId] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const filteredOrders = activeFilter === 'All' 
    ? orders 
    : orders.filter(o => o.status === activeFilter);

  const handleDeleteClick = (id) => {
    setDeletingId(id);
  };

  const handleCancelDelete = () => {
    setDeletingId(null);
  };

  const handleConfirmDelete = async (id) => {
    setIsDeleting(true);
    const result = await deleteOrderAction(id);
    if (result.success) {
      setDeletingId(null);
    } else {
      alert(result.error || 'Failed to delete order');
    }
    setIsDeleting(false);
  };

  return (
    <div>
      <PageHeader 
        title="Orders" 
        subtitle="Your order history" 
        action={
          <Link 
            href="/orders/new"
            style={{
              background: '#1B4332',
              color: '#FFFFFF',
              padding: '10px 20px',
              borderRadius: '8px',
              fontWeight: '600',
              textDecoration: 'none',
              fontFamily: 'Plus Jakarta Sans, sans-serif'
            }}
          >
            + New Order
          </Link>
        }
      />

      {/* Filter Bar */}
      <div style={{ 
        display: 'flex', 
        gap: '8px', 
        overflowX: 'auto', 
        marginBottom: '32px',
        paddingBottom: '8px' 
      }}>
        {statuses.map(status => (
          <button
            key={status}
            onClick={() => setActiveFilter(status)}
            style={{
              padding: '6px 16px',
              borderRadius: '20px',
              fontSize: '13px',
              fontWeight: '600',
              cursor: 'pointer',
              fontFamily: 'Plus Jakarta Sans, sans-serif',
              whiteSpace: 'nowrap',
              transition: 'all 0.2s',
              border: '1px solid #1B4332',
              background: activeFilter === status ? '#1B4332' : '#FFFFFF',
              color: activeFilter === status ? '#FFFFFF' : '#1B4332',
            }}
          >
            {status}
          </button>
        ))}
      </div>

      {filteredOrders.length === 0 ? (
        <EmptyState 
          title="No orders yet"
          message={activeFilter === 'All' ? "Log your first order from WhatsApp" : `No orders with status ${activeFilter}`} 
        />
      ) : (
        <div style={{ background: '#FFFFFF', border: '1px solid #E5E7EB', borderRadius: '12px', overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ background: '#F9FAFB', borderBottom: '1px solid #E5E7EB' }}>
                <th style={thStyle}>Date</th>
                <th style={thStyle}>Customer</th>
                <th style={thStyle}>Order Value</th>
                <th style={thStyle}>Shipping</th>
                <th style={thStyle}>Status</th>
                <th style={thStyle}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredOrders.map(order => (
                <tr key={order.id} style={{ borderBottom: '1px solid #E5E7EB' }}>
                  <td style={tdStyle}>
                    {new Date(order.order_date).toLocaleDateString('en-GB', { 
                      day: 'numeric', month: 'short', year: 'numeric' 
                    })}
                  </td>
                  <td style={tdStyle}>
                    <div style={{ fontWeight: '600', color: '#111827' }}>{order.customer_name}</div>
                    <div style={{ fontSize: '12px', color: '#6B7280' }}>{order.customer_phone}</div>
                  </td>
                  <td style={tdStyle}>
                    <div style={{ fontWeight: '700', color: '#1B4332' }}>₹{order.revenue}</div>
                  </td>
                  <td style={tdStyle}>₹{order.shipping_charge}</td>
                  <td style={tdStyle}>
                    <StatusBadge status={order.status} />
                  </td>
                  <td style={tdStyle}>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <Link 
                        href={`/orders/${order.id}`}
                        style={{
                          border: '1px solid #E5E7EB',
                          borderRadius: '6px',
                          padding: '6px',
                          color: '#4B5563',
                          display: 'flex'
                        }}
                      >
                        <Eye size={16} />
                      </Link>
                      
                      {['Received', 'Payment Confirmed', 'In Production'].includes(order.status) && (
                        <>
                          <Link 
                            href={`/orders/${order.id}/edit`}
                            style={{
                              border: '1px solid #E5E7EB',
                              borderRadius: '6px',
                              padding: '6px',
                              color: '#4B5563',
                              display: 'flex'
                            }}
                          >
                            <Pencil size={16} />
                          </Link>
                          
                          {deletingId === order.id ? (
                            <div style={{ 
                              display: 'flex', 
                              alignItems: 'center', 
                              gap: '4px',
                              background: '#F9FAFB',
                              padding: '2px 8px',
                              borderRadius: '6px',
                              border: '1px solid #E5E7EB'
                            }}>
                              <span style={{ fontSize: '11px', fontWeight: '600' }}>Sure?</span>
                              <button 
                                onClick={() => handleConfirmDelete(order.id)}
                                disabled={isDeleting}
                                style={{ background: 'none', border: 'none', color: '#DC2626', cursor: 'pointer' }}
                              >
                                <Check size={16} />
                              </button>
                              <button 
                                onClick={handleCancelDelete}
                                disabled={isDeleting}
                                style={{ background: 'none', border: 'none', color: '#6B7280', cursor: 'pointer' }}
                              >
                                <X size={16} />
                              </button>
                            </div>
                          ) : (
                            <button 
                              onClick={() => handleDeleteClick(order.id)}
                              style={{
                                background: 'none',
                                border: 'none',
                                borderRadius: '6px',
                                padding: '6px',
                                cursor: 'pointer',
                                color: '#9CA3AF'
                              }}
                            >
                              <Trash2 size={16} />
                            </button>
                          )}
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

const thStyle = {
  padding: '16px 20px',
  fontSize: '11px',
  textTransform: 'uppercase',
  letterSpacing: '0.08em',
  color: '#6B7280',
  fontWeight: '600',
  fontFamily: 'Plus Jakarta Sans, sans-serif'
};

const tdStyle = {
  padding: '16px 20px',
  fontSize: '14px',
  fontFamily: 'Plus Jakarta Sans, sans-serif',
  color: '#374151'
};

export default OrdersView;
