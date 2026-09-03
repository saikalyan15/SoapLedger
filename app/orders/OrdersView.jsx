'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Eye, Pencil, Trash2, Check, X, Search, Plus, LayoutList, Calendar } from 'lucide-react';
import PageHeader from '@/components/PageHeader';
import StatusBadge from '@/components/StatusBadge';
import { deleteOrderAction } from '@/lib/actions/orders';
import { ORDER_STATUSES, EDITABLE_STATUSES } from '@/lib/constants';

const formatShipped = (shippedAt) => {
  if (!shippedAt) return null;
  const shipDate = new Date(shippedAt);
  if (Number.isNaN(shipDate.getTime())) return null;
  const date = shipDate.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
  const startOfDay = (d) => new Date(d.getFullYear(), d.getMonth(), d.getDate());
  const daysPassed = Math.round(
    (startOfDay(new Date()) - startOfDay(shipDate)) / 86400000
  );
  const ago =
    daysPassed <= 0 ? 'today' : daysPassed === 1 ? '1 day ago' : `${daysPassed} days ago`;
  return { date, ago };
};

const OrdersView = ({ orders }) => {
  const router = useRouter();
  const [filter, setFilter] = useState('All');
  const [search, setSearch] = useState('');
  const [isMobile, setIsMobile] = useState(false);
  const [viewMode, setViewMode] = useState('list'); // 'list' | 'monthly'

  // Detect Mobile — React State approach
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
      else router.refresh();
    }
  };

  const filteredOrders = orders.filter(order => {
    const matchesFilter = filter === 'All' || order.status === filter;
    const matchesSearch =
      order.customer_name.toLowerCase().includes(search.toLowerCase()) ||
      order.id.toLowerCase().includes(search.toLowerCase()) ||
      (order.customer_email && order.customer_email.toLowerCase().includes(search.toLowerCase())) ||
      (order.customer_phone && order.customer_phone.includes(search));
    return matchesFilter && matchesSearch;
  });

  const groupedByMonth = useMemo(() => {
    const map = {};
    filteredOrders.forEach(order => {
      const key = new Date(order.order_date).toISOString().slice(0, 7); // "YYYY-MM"
      if (!map[key]) map[key] = [];
      map[key].push(order);
    });
    return Object.keys(map)
      .sort((a, b) => b.localeCompare(a))
      .map(key => ({
        key,
        label: new Date(key + '-15').toLocaleDateString('en-IN', { month: 'long', year: 'numeric' }),
        orders: map[key],
        totalRevenue: map[key]
          .filter(o => o.status !== 'Cancelled')
          .reduce((sum, o) => sum + Math.round(Number(o.revenue || 0)), 0),
        totalSoaps: map[key]
          .filter(o => o.status !== 'Cancelled')
          .reduce((sum, o) => sum + Number(o.total_soaps || 0), 0),
      }));
  }, [filteredOrders]);

  return (
    <div className="page-content" style={{ padding: isMobile ? '16px' : '0' }}>
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
        <div style={{ display: 'flex', gap: '4px', marginBottom: '16px', background: '#F3F4F6', padding: '4px', borderRadius: '10px', alignSelf: 'flex-start' }}>
          {[['list', LayoutList, 'List'], ['monthly', Calendar, 'Monthly']].map(([mode, Icon, label]) => (
            <button key={mode} onClick={() => setViewMode(mode)} style={{
              display: 'flex', alignItems: 'center', gap: '6px',
              padding: '7px 16px', borderRadius: '7px', border: 'none',
              background: viewMode === mode ? '#1B4332' : 'transparent',
              color: viewMode === mode ? '#FFFFFF' : '#6B7280',
              fontFamily: 'Plus Jakarta Sans, sans-serif', fontWeight: 600, fontSize: '13px', cursor: 'pointer'
            }}>
              <Icon size={15} /> {label}
            </button>
          ))}
        </div>
        <div
          className="orders-filter-row"
          style={{ 
            display: 'flex', 
            flexDirection: isMobile ? 'column' : 'row',
            justifyContent: 'space-between', 
            alignItems: isMobile ? 'stretch' : 'center', 
            gap: isMobile ? '16px' : '20px' 
          }}
        >
          <div 
            className="status-filter-bar"
            style={{ 
              display: 'flex', 
              gap: '8px', 
              overflowX: isMobile ? 'auto' : 'visible',
              paddingBottom: isMobile ? '4px' : '0',
              flexWrap: isMobile ? 'nowrap' : 'wrap',
              scrollbarWidth: 'none'
            }}
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
                  transition: 'all 0.2s',
                  flexShrink: isMobile ? 0 : 1
                }}
              >
                {s}
              </button>
            ))}
          </div>
          <div 
            className="orders-search"
            style={{ position: 'relative', width: isMobile ? '100%' : '300px' }}
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
                fontSize: '16px', // prevent iOS zoom
                outline: 'none'
              }}
            />
            <Search size={18} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: '#9CA3AF' }} />
          </div>
        </div>
      </div>

      {viewMode === 'list' ? (
        /* LIST VIEW */
        isMobile ? (
          /* Mobile Card List View */
          <div className="orders-card-list" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {filteredOrders.length === 0 ? (
              <div style={{ padding: '40px', textAlign: 'center', color: '#6B7280', background: '#FFFFFF', borderRadius: '12px', border: '1px solid #E5E7EB' }}>
                No orders found
              </div>
            ) : (
              filteredOrders.map((order) => {
                const dateObj = new Date(order.order_date);
                const formattedDate = dateObj.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });

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

                    <div style={{
                      fontFamily: 'Plus Jakarta Sans, sans-serif',
                      fontSize: '13px',
                      color: '#4B5563',
                    }}>
                      {firstProduct}{additionalCount > 0 ? ` +${additionalCount} more` : ''}
                    </div>

                    {(() => {
                      const shipped = formatShipped(order.shipped_at);
                      if (!shipped) return null;
                      return (
                        <div style={{
                          fontFamily: 'Plus Jakarta Sans, sans-serif',
                          fontSize: '12px',
                          color: '#6B7280',
                        }}>
                          Shipped {shipped.date} · {shipped.ago}
                        </div>
                      );
                    })()}

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
                      }}>₹{Math.round(Number(order.revenue || 0)).toLocaleString('en-IN')}</div>
                      <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                        <Link href={`/orders/${order.id}`}>
                          <Eye size={18} color="#1B4332" />
                        </Link>
                        {EDITABLE_STATUSES.includes(order.status) && (
                          <>
                            <Link href={`/orders/${order.id}/edit`}>
                              <Pencil size={18} color="#6B7280" />
                            </Link>
                            <button
                              onClick={() => handleDelete(order.id)}
                              style={{
                                background: 'none',
                                border: 'none',
                                padding: 0,
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center'
                              }}
                            >
                              <Trash2 size={18} color="#DC2626" />
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        ) : (
          /* Desktop Table View — scrollable container */
          <div
            className="orders-table-container"
            style={{
              background: '#FFFFFF',
              borderRadius: '12px',
              border: '1px solid #E5E7EB',
              overflowX: 'auto',
              WebkitOverflowScrolling: 'touch'
            }}
          >
            <table
              className="orders-table"
              style={{
                width: '100%',
                borderCollapse: 'collapse',
                minWidth: '990px',
                tableLayout: 'fixed'
              }}
            >
              <thead>
                <tr style={{ background: '#F9FAFB', borderBottom: '1px solid #E5E7EB' }}>
                  <th style={{ ...thStyle, width: '100px' }}>Order ID</th>
                  <th style={{ ...thStyle, width: '100px' }}>Date</th>
                  <th style={{ ...thStyle, width: '180px' }}>Customer</th>
                  <th style={{ ...thStyle }}>Items</th>
                  <th style={{ ...thStyle, width: '100px' }}>Total</th>
                  <th style={{ ...thStyle, width: '120px' }}>Status</th>
                  <th style={{ ...thStyle, width: '130px' }}>Shipped</th>
                  <th style={{ ...thStyle, width: '120px', textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredOrders.length === 0 ? (
                  <tr>
                    <td colSpan="8" style={{ padding: '40px', textAlign: 'center', color: '#6B7280' }}>
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
                            background: order.customer_type === 'Returning' ? '#D8F3DC' : '#FEF3C7',
                            color: order.customer_type === 'Returning' ? '#1B4332' : '#92400E'
                          }}>
                            {order.customer_type}
                          </span>
                        </div>
                        <div style={{ fontSize: '12px', color: '#6B7280' }}>{order.customer_phone}</div>
                      </td>
                      <td style={{ ...tdStyle, maxWidth: '200px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {order.products}
                      </td>
                      <td style={{ ...tdStyle, fontWeight: '700', color: '#111827' }}>
                        ₹{Math.round(Number(order.revenue || 0)).toLocaleString('en-IN')}
                      </td>
                      <td style={{ ...tdStyle, minWidth: '100px' }}>
                        <StatusBadge status={order.status} short />
                      </td>
                      <td style={tdStyle}>
                        {(() => {
                          const shipped = formatShipped(order.shipped_at);
                          if (!shipped) return <span style={{ color: '#9CA3AF' }}>—</span>;
                          return (
                            <div>
                              <div style={{ color: '#111827' }}>{shipped.date}</div>
                              <div style={{ fontSize: '12px', color: '#6B7280' }}>{shipped.ago}</div>
                            </div>
                          );
                        })()}
                      </td>
                      <td style={{ ...tdStyle, width: '80px', textAlign: 'right' }}>
                        <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                          <Link href={`/orders/${order.id}`} style={actionButtonStyle} title="View Details">
                            <Eye size={18} />
                          </Link>
                          {EDITABLE_STATUSES.includes(order.status) && (
                            <>
                              <Link href={`/orders/${order.id}/edit`} style={actionButtonStyle} title="Edit Order">
                                <Pencil size={18} />
                              </Link>
                              <button onClick={() => handleDelete(order.id)} style={{ ...actionButtonStyle, color: '#DC2626' }} title="Delete Order">
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
        )
      ) : (
        /* MONTHLY VIEW */
        <div>
          {groupedByMonth.length === 0 ? (
            <div style={{ padding: '40px', textAlign: 'center', color: '#6B7280', background: '#FFFFFF', borderRadius: '12px', border: '1px solid #E5E7EB' }}>
              No orders found
            </div>
          ) : (
            groupedByMonth.map(({ key, label, orders: monthOrders, totalRevenue, totalSoaps }) => (
              <div key={key} style={{ marginBottom: '24px' }}>
                {/* Month header */}
                <div style={{
                  background: '#F9FAFB',
                  border: '1px solid #E5E7EB',
                  borderRadius: '12px 12px 0 0',
                  padding: '14px 20px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  borderLeft: '4px solid #1B4332',
                }}>
                  <span style={{ fontFamily: 'DM Serif Display, serif', fontSize: '18px', color: '#1B4332', flex: 1 }}>
                    {label}
                  </span>
                  <span style={{
                    fontSize: '12px',
                    fontWeight: '700',
                    fontFamily: 'Plus Jakarta Sans, sans-serif',
                    background: '#E5E7EB',
                    color: '#374151',
                    padding: '3px 10px',
                    borderRadius: '20px',
                  }}>
                    {monthOrders.length} {monthOrders.length === 1 ? 'order' : 'orders'}
                  </span>
                  <span style={{
                    fontSize: '12px',
                    fontWeight: '700',
                    fontFamily: 'Plus Jakarta Sans, sans-serif',
                    background: '#D1FAE5',
                    color: '#065F46',
                    padding: '3px 10px',
                    borderRadius: '20px',
                  }}>
                    {totalSoaps} {totalSoaps === 1 ? 'soap' : 'soaps'}
                  </span>
                  <span style={{ fontFamily: 'DM Serif Display, serif', fontSize: '18px', color: '#1B4332' }}>
                    ₹{totalRevenue.toLocaleString('en-IN')}
                  </span>
                </div>

                {/* Orders container */}
                <div style={{
                  background: '#FFFFFF',
                  border: '1px solid #E5E7EB',
                  borderTop: 'none',
                  borderRadius: '0 0 12px 12px',
                }}>
                  {isMobile ? (
                    /* Mobile monthly cards */
                    monthOrders.map((order, idx) => {
                      const productsList = order.products?.split(', ') || [];
                      const firstProduct = productsList[0] || 'No items';
                      const additionalCount = productsList.length - 1;
                      const formattedDate = new Date(order.order_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
                      return (
                        <Link key={order.id} href={`/orders/${order.id}`} style={{ textDecoration: 'none', color: 'inherit', display: 'block' }}>
                          <div style={{
                            padding: '14px 16px',
                            borderBottom: idx < monthOrders.length - 1 ? '1px solid #F3F4F6' : 'none',
                          }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                              <span style={{ fontFamily: 'Plus Jakarta Sans, sans-serif', fontWeight: 600, fontSize: '14px', color: '#1A1A1A' }}>
                                {order.customer_name}
                              </span>
                              <StatusBadge status={order.status} />
                            </div>
                            <div style={{ fontFamily: 'Plus Jakarta Sans, sans-serif', fontSize: '13px', color: '#4B5563', marginBottom: '8px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                              {firstProduct}{additionalCount > 0 ? ` +${additionalCount} more` : ''}
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '8px', borderTop: '1px solid #F3F4F6' }}>
                              <span style={{ fontFamily: 'Plus Jakarta Sans, sans-serif', fontSize: '12px', color: '#9CA3AF' }}>{formattedDate}</span>
                              <span style={{ fontFamily: 'DM Serif Display, serif', fontSize: '16px', color: '#1B4332' }}>
                                ₹{Math.round(Number(order.revenue || 0)).toLocaleString('en-IN')}
                              </span>
                            </div>
                          </div>
                        </Link>
                      );
                    })
                  ) : (
                    /* Desktop monthly rows */
                    monthOrders.map((order, idx) => {
                      const productsList = order.products?.split(', ') || [];
                      const firstProduct = productsList[0] || 'No items';
                      const additionalCount = productsList.length - 1;
                      return (
                        <div
                          key={order.id}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            padding: '14px 20px',
                            borderBottom: idx < monthOrders.length - 1 ? '1px solid #F3F4F6' : 'none',
                            gap: '16px',
                          }}
                          onMouseEnter={e => e.currentTarget.style.background = '#F9FAFB'}
                          onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                        >
                          {/* Customer */}
                          <div style={{ flex: '2', minWidth: 0 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                              <span style={{ fontFamily: 'Plus Jakarta Sans, sans-serif', fontWeight: 600, fontSize: '14px', color: '#111827' }}>
                                {order.customer_name}
                              </span>
                              <span style={{
                                fontSize: '9px',
                                fontWeight: '800',
                                padding: '1px 6px',
                                borderRadius: '4px',
                                textTransform: 'uppercase',
                                background: order.customer_type === 'Returning' ? '#D8F3DC' : '#FEF3C7',
                                color: order.customer_type === 'Returning' ? '#1B4332' : '#92400E',
                                whiteSpace: 'nowrap',
                              }}>
                                {order.customer_type}
                              </span>
                            </div>
                          </div>
                          {/* Products */}
                          <div style={{ flex: '3', fontFamily: 'Plus Jakarta Sans, sans-serif', fontSize: '13px', color: '#4B5563', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {firstProduct}{additionalCount > 0 ? ` +${additionalCount} more` : ''}
                          </div>
                          {/* Status */}
                          <div style={{ flex: '1', minWidth: '100px' }}>
                            <StatusBadge status={order.status} short />
                          </div>
                          {/* Revenue */}
                          <div style={{ flex: '1', textAlign: 'right', fontFamily: 'DM Serif Display, serif', fontSize: '16px', color: '#1B4332' }}>
                            ₹{Math.round(Number(order.revenue || 0)).toLocaleString('en-IN')}
                          </div>
                          {/* Link */}
                          <div>
                            <Link href={`/orders/${order.id}`} style={actionButtonStyle} title="View Details">
                              <Eye size={18} />
                            </Link>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      )}
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
