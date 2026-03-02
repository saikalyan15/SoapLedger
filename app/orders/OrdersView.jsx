'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Eye, Pencil, Trash2, Check, X, Search, Plus } from 'lucide-react';
import PageHeader from '@/components/PageHeader';
import StatusBadge from '@/components/StatusBadge';
import { deleteOrderAction } from '@/lib/actions/orders';
import { ORDER_STATUSES, EDITABLE_STATUSES } from '@/lib/constants';

const OrdersView = ({ orders }) => {
  const [filter, setFilter] = useState('All');
  const [search, setSearch] = useState('');
  const [isMobile, setIsMobile] = useState(false); /* mobile only */

  // Detect Mobile
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const handleDelete = async (id) => {
    if (confirm('Are you sure you want to delete this order?')) {
      const result = await deleteOrderAction(id);
      if (!result.success) alert(result.error);
    }
  };

  const filteredOrders = orders.filter(order => {
    const matchesFilter = filter === 'All' || order.status === filter;
    const matchesSearch = 
      order.customer_name.toLowerCase().includes(search.toLowerCase()) ||
      order.id.toLowerCase().includes(search.toLowerCase()) ||
      (order.customer_phone && order.customer_phone.includes(search));
    return matchesFilter && matchesSearch;
  });

  return (
    <div>
      <PageHeader 
        title="Orders" 
        subtitle="Manage and track customer orders"
        action={
          <Link 
            href="/orders/new"
            style={{
              background: '#1B4332',
              color: '#FFFFFF',
              padding: '10px 20px',
              borderRadius: '8px',
              fontWeight: '700',
              textDecoration: 'none',
              fontSize: '14px',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px'
            }}
          >
            <Plus size={18} />
            New Order
          </Link>
        }
      />

      <div style={{ 
        background: '#FFFFFF', 
        borderRadius: '12px', 
        border: '1px solid #E5E7EB',
        marginBottom: '24px',
        padding: '20px'
      }}>
        <div 
          className="orders-filter-row"
          style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '20px' }}
        >
          <div 
            className="status-filter-bar"
            style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}
          >
            {['All', ...ORDER_STATUSES].map(s => (
              <button
                key={s}
                className="filter-pill"
                onClick={() => setFilter(s)}
                style={{
                  padding: '6px 16px',
                  borderRadius: '20px',
                  fontSize: '13px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  border: '1px solid #E5E7EB',
                  background: filter === s ? '#1B4332' : '#FFFFFF',
                  color: filter === s ? '#FFFFFF' : '#6B7280',
                  transition: 'all 0.2s'
                }}
              >
                {s}
              </button>
            ))}
          </div>
          <div 
            className="orders-search"
            style={{ position: 'relative', width: '300px' }}
          >
            <input
              type="text"
              placeholder="Search orders..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{
                width: '100%',
                padding: '10px 16px 10px 40px',
                borderRadius: '8px',
                border: '1px solid #E5E7EB',
                fontSize: '14px',
                outline: 'none'
              }}
            />
            <Search size={18} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: '#9CA3AF' }} />
          </div>
        </div>
      </div>

      {/* Desktop Table View */}
      <div 
        className="orders-table"
        style={{ background: '#FFFFFF', borderRadius: '12px', border: '1px solid #E5E7EB', overflow: 'hidden' }}
      >
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: '#F9FAFB', borderBottom: '1px solid #E5E7EB' }}>
              <th style={thStyle}>Order ID</th>
              <th style={thStyle}>Date</th>
              <th style={thStyle}>Customer</th>
              <th style={thStyle}>Items</th>
              <th style={thStyle}>Total</th>
              <th style={thStyle}>Status</th>
              <th style={{ ...thStyle, textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredOrders.length === 0 ? (
              <tr>
                <td colSpan="7" style={{ padding: '40px', textAlign: 'center', color: '#6B7280' }}>
                  No orders found
                </td>
              </tr>
            ) : (
              filteredOrders.map((order) => (
                <tr key={order.id} style={{ borderBottom: '1px solid #F3F4F6' }}>
                  <td style={tdStyle}>
                    <span style={{ fontWeight: '700', color: '#1B4332' }}>#{order.id.slice(0, 8)}</span>
                  </td>
                  <td style={tdStyle}>
                    {new Date(order.order_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                  </td>
                  <td style={tdStyle}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <div style={{ fontWeight: '600', color: '#111827' }}>{order.customer_name}</div>
                      <span style={{ 
                        fontSize: '9px', 
                        fontWeight: '800', 
                        padding: '1px 6px', 
                        borderRadius: '4px',
                        textTransform: 'uppercase',
                        background: order.is_returning ? '#D8F3DC' : '#FEF3C7',
                        color: order.is_returning ? '#1B4332' : '#92400E'
                      }}>
                        {order.is_returning ? 'Returning' : 'New'}
                      </span>
                    </div>
                    <div style={{ fontSize: '12px', color: '#6B7280' }}>{order.customer_phone}</div>
                  </td>
                  <td style={{ ...tdStyle, maxWidth: '200px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {order.products}
                  </td>
                  <td style={{ ...tdStyle, fontWeight: '700', color: '#111827' }}>
                    ₹{Number(order.revenue || 0).toLocaleString('en-IN')}
                  </td>
                  <td style={tdStyle}>
                    <StatusBadge status={order.status} />
                  </td>
                  <td style={{ ...tdStyle, textAlign: 'right' }}>
                    <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                      <Link 
                        href={`/orders/${order.id}`}
                        style={actionButtonStyle}
                        title="View Details"
                      >
                        <Eye size={18} />
                      </Link>
                      {EDITABLE_STATUSES.includes(order.status) && (
                        <>
                          <Link 
                            href={`/orders/${order.id}/edit`}
                            style={actionButtonStyle}
                            title="Edit Order"
                          >
                            <Pencil size={18} />
                          </Link>
                          <button 
                            onClick={() => handleDelete(order.id)}
                            style={{ ...actionButtonStyle, color: '#DC2626' }}
                            title="Delete Order"
                          >
                            <Trash2 size={18} />
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Mobile Card List View */}
      <div className="orders-card-list">
        {filteredOrders.length === 0 ? (
          <div style={{ padding: '40px', textAlign: 'center', color: '#6B7280', background: '#FFFFFF', borderRadius: '12px', border: '1px solid #E5E7EB' }}>
            No orders found
          </div>
        ) : (
          filteredOrders.map((order) => {
            const dateObj = new Date(order.order_date);
            const formattedDate = dateObj.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
            
            // Extract first product and count for mobile summary
            const productsList = order.products?.split(', ') || [];
            const firstProduct = productsList[0] || 'No items';
            const additionalCount = productsList.length - 1;

            return (
              <div key={order.id} style={{
                background: '#FFFFFF',
                border: '1px solid #E5E7EB',
                borderRadius: '12px',
                padding: '16px',
                display: 'flex',
                flexDirection: 'column',
                gap: '10px',
              }}>
                {/* Row 1: Customer name + Status badge */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <div style={{
                      fontFamily: 'Plus Jakarta Sans, sans-serif',
                      fontSize: '15px',
                      fontWeight: 600,
                      color: '#1A1A1A',
                    }}>{order.customer_name}</div>
                    <div style={{
                      fontFamily: 'Plus Jakarta Sans, sans-serif',
                      fontSize: '12px',
                      color: '#6B7280',
                      marginTop: '2px',
                    }}>{order.customer_phone}</div>
                  </div>
                  <StatusBadge status={order.status} />
                </div>

                {/* Row 2: Products summary */}
                <div style={{
                  fontFamily: 'Plus Jakarta Sans, sans-serif',
                  fontSize: '13px',
                  color: '#4B5563',
                }}>
                  {firstProduct}{additionalCount > 0 ? ` +${additionalCount} more` : ''}
                </div>

                {/* Row 3: Date + Amount + Actions */}
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  paddingTop: '8px',
                  borderTop: '1px solid #F3F4F6',
                }}>
                  <div style={{
                    fontFamily: 'Plus Jakarta Sans, sans-serif',
                    fontSize: '12px',
                    color: '#9CA3AF',
                  }}>{formattedDate}</div>
                  <div style={{
                    fontFamily: 'DM Serif Display, serif',
                    fontSize: '16px',
                    color: '#1B4332',
                  }}>₹{Number(order.revenue || 0).toLocaleString('en-IN')}</div>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <Link href={`/orders/${order.id}`}>
                      <Eye size={16} color="#1B4332" />
                    </Link>
                    {EDITABLE_STATUSES.includes(order.status) && (
                      <Link href={`/orders/${order.id}/edit`}>
                        <Pencil size={16} color="#6B7280" />
                      </Link>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

const thStyle = {
  padding: '16px 20px',
  textAlign: 'left',
  fontSize: '12px',
  fontWeight: '700',
  textTransform: 'uppercase',
  letterSpacing: '0.05em',
  color: '#6B7280',
  fontFamily: 'Plus Jakarta Sans, sans-serif'
};

const tdStyle = {
  padding: '16px 20px',
  fontSize: '14px',
  fontFamily: 'Plus Jakarta Sans, sans-serif',
  color: '#374151'
};

const actionButtonStyle = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  width: '36px',
  height: '36px',
  borderRadius: '8px',
  border: '1px solid #E5E7EB',
  background: '#FFFFFF',
  color: '#4B5563',
  cursor: 'pointer',
  transition: 'all 0.2s',
  textDecoration: 'none'
};

export default OrdersView;
