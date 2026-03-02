'use client';

import React, { useState, useEffect } from 'react';
import { Plus, Pencil, Trash2, X, Check } from 'lucide-react';
import { addCustomerAction, editCustomerAction, deleteCustomerAction } from '@/lib/actions/customers';
import PageHeader from '@/components/PageHeader';
import EmptyState from '@/components/EmptyState';

const CustomersView = ({ customers: initialCustomers, stats }) => {
  const [customers, setCustomers] = useState(initialCustomers);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [deletingId, setDeletingId] = useState(null);
  const [isMobile, setIsMobile] = useState(false);

  // Detect Mobile — React State approach
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Sync state with props when they change
  useEffect(() => {
    setCustomers(initialCustomers);
  }, [initialCustomers]);

  const handleAddClick = () => {
    setEditingCustomer(null);
    setIsFormOpen(true);
    setError(null);
  };

  const handleEditClick = (customer) => {
    setEditingCustomer(customer);
    setIsFormOpen(true);
    setError(null);
  };

  const handleCloseForm = () => {
    setIsFormOpen(false);
    setEditingCustomer(null);
  };

  const handleDeleteClick = (id) => {
    setDeletingId(id);
  };

  const handleCancelDelete = () => {
    setDeletingId(null);
  };

  const handleConfirmDelete = async (id) => {
    setIsSubmitting(true);
    const result = await deleteCustomerAction(id);
    if (result.success) {
      setDeletingId(null);
    } else {
      alert(result.error || 'Failed to delete customer');
    }
    setIsSubmitting(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    const formData = new FormData(e.target);
    
    let result;
    if (editingCustomer) {
      result = await editCustomerAction(editingCustomer.id, formData);
    } else {
      result = await addCustomerAction(formData);
    }

    if (result.success) {
      setIsFormOpen(false);
      setEditingCustomer(null);
    } else {
      setError(result.error);
    }
    setIsSubmitting(false);
  };

  return (
    <div style={{ padding: isMobile ? '16px' : '40px' }} className="page-content">
      <PageHeader 
        title="Customers" 
        subtitle="Your soap buyers" 
        action={
          <button 
            onClick={handleAddClick}
            style={{
              background: '#1B4332',
              color: '#FFFFFF',
              border: 'none',
              padding: '10px 20px',
              borderRadius: '8px',
              fontWeight: '600',
              cursor: 'pointer',
              fontFamily: 'Plus Jakarta Sans, sans-serif'
            }}
          >
            + Add
          </button>
        }
      />

      {/* Summary Stats */}
      <div 
        className="kpi-grid"
        style={{ 
          display: 'grid', 
          gridTemplateColumns: isMobile ? 'repeat(2, 1fr)' : 'repeat(3, 1fr)', 
          gap: isMobile ? '10px' : '20px', 
          marginBottom: '40px' 
        }}
      >
        {[
          { label: 'Total Customers', value: stats.totalCustomers },
          { label: 'Repeat Customers', value: stats.repeatCustomers },
          { label: 'New This Month', value: stats.newThisMonth }
        ].map((stat, i) => (
          <div key={i} className="kpi-card" style={{
            background: '#FFFFFF',
            border: '1px solid #E5E7EB',
            borderRadius: '12px',
            padding: isMobile ? '14px 16px' : '20px',
          }}>
            <div style={{
              fontSize: '11px',
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
              color: '#6B7280',
              marginBottom: '4px',
              fontFamily: 'Plus Jakarta Sans, sans-serif'
            }}>
              {isMobile ? stat.label.split(' ')[0] : stat.label}
            </div>
            <div className="kpi-value" style={{
              fontSize: isMobile ? '24px' : '24px',
              fontWeight: '700',
              color: '#1B4332',
              fontFamily: 'DM Serif Display, serif'
            }}>
              {stat.value}
            </div>
          </div>
        ))}
      </div>

      {/* Inline Form */}
      {isFormOpen && (
        <div 
          className="customer-form"
          style={{
            background: '#F9FAFB',
            border: '1px solid #E5E7EB',
            borderRadius: '12px',
            padding: isMobile ? '16px' : '24px',
            marginBottom: '40px',
          }}
        >
          <div style={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center', 
            marginBottom: '20px' 
          }}>
            <h3 style={{ 
              fontFamily: 'DM Serif Display, serif', 
              fontSize: '20px', 
              color: '#1B4332',
              margin: 0 
            }}>
              {editingCustomer ? 'Edit Customer' : 'Add New Customer'}
            </h3>
            <button 
              onClick={handleCloseForm}
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#6B7280' }}
            >
              <X size={20} />
            </button>
          </div>

          <form onSubmit={handleSubmit}>
            <div 
              className="form-row-2col"
              style={{ 
                display: 'grid', 
                gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', 
                gap: isMobile ? '16px' : '20px', 
                marginBottom: '20px' 
              }}
            >
              <div>
                <label style={labelStyle}>Name *</label>
                <input 
                  name="name" 
                  required 
                  defaultValue={editingCustomer?.name || ''} 
                  placeholder="Full Name"
                  style={inputStyle}
                />
              </div>
              <div>
                <label style={labelStyle}>Phone / WhatsApp *</label>
                <input 
                  name="phone" 
                  required 
                  defaultValue={editingCustomer?.phone || ''} 
                  placeholder="e.g. 9876543210"
                  style={inputStyle}
                />
              </div>
            </div>

            <div style={{ marginBottom: '20px' }}>
              <label style={labelStyle}>Delivery Address</label>
              <textarea 
                name="address" 
                rows={3} 
                defaultValue={editingCustomer?.address || ''} 
                placeholder="Full delivery address"
                style={inputStyle}
              />
            </div>

            <div style={{ marginBottom: '24px' }}>
              <label style={labelStyle}>Notes</label>
              <textarea 
                name="notes" 
                rows={2} 
                defaultValue={editingCustomer?.notes || ''} 
                placeholder="e.g. prefers gift wrap"
                style={inputStyle}
              />
            </div>

            {error && (
              <div style={{ color: '#DC2626', fontSize: '14px', marginBottom: '16px' }}>
                {error}
              </div>
            )}

            <div style={{ display: 'flex', gap: '12px' }}>
              <button 
                type="submit" 
                disabled={isSubmitting}
                style={{
                  background: '#1B4332',
                  color: '#FFFFFF',
                  border: 'none',
                  padding: '12px 24px',
                  borderRadius: '8px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  fontFamily: 'Plus Jakarta Sans, sans-serif',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  flex: 1,
                  justifyContent: 'center'
                }}
              >
                {isSubmitting ? 'Saving...' : (
                  <>
                    <Check size={18} />
                    {editingCustomer ? 'Update' : 'Save'}
                  </>
                )}
              </button>
              <button 
                type="button" 
                onClick={handleCloseForm}
                style={{
                  background: '#FFFFFF',
                  color: '#374151',
                  border: '1px solid #E5E7EB',
                  padding: '12px 24px',
                  borderRadius: '8px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  fontFamily: 'Plus Jakarta Sans, sans-serif',
                  flex: 1
                }}
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Customers List Content — Conditional Rendering */}
      {customers.length === 0 ? (
        <EmptyState 
          title="No customers yet"
          message="They'll appear here once you log your first order" 
        />
      ) : (
        isMobile ? (
          /* Mobile Card View */
          <div className="customers-card-list" style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {customers.map((customer) => (
              <div key={customer.id} style={{
                background: '#FFFFFF',
                border: '1px solid #E5E7EB',
                borderRadius: '12px',
                padding: '16px',
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <div style={{ fontSize: '15px', fontWeight: 600 }}>{customer.name}</div>
                  <div style={{
                    background: '#D8F3DC',
                    color: '#1B4332',
                    borderRadius: '12px',
                    padding: '2px 10px',
                    fontSize: '12px',
                    fontWeight: 600,
                  }}>
                    {customer.order_count} orders
                  </div>
                </div>
                <div style={{ fontSize: '13px', color: '#6B7280', marginBottom: '6px' }}>
                  📱 {customer.phone}
                </div>
                {customer.address && (
                  <div style={{ fontSize: '12px', color: '#9CA3AF', marginBottom: '10px' }}>
                    {customer.address.substring(0, 80)}{customer.address.length > 80 ? '...' : ''}
                  </div>
                )}
                <div style={{ display: 'flex', gap: '8px', paddingTop: '10px', borderTop: '1px solid #F3F4F6' }}>
                  <button 
                    onClick={() => handleEditClick(customer)}
                    style={{
                      flex: 1,
                      padding: '8px',
                      border: '1px solid #E5E7EB',
                      borderRadius: '8px',
                      background: '#FFFFFF',
                      fontSize: '13px',
                      fontWeight: 600,
                      color: '#1B4332',
                      cursor: 'pointer',
                    }}
                  >
                    Edit
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          /* Desktop Table View */
          <div 
            className="customers-table"
            style={{ background: '#FFFFFF', border: '1px solid #E5E7EB', borderRadius: '12px', overflow: 'hidden' }}
          >
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead>
                <tr style={{ background: '#F9FAFB', borderBottom: '1px solid #E5E7EB' }}>
                  <th style={thStyle}>Name</th>
                  <th style={thStyle}>Phone</th>
                  <th style={thStyle}>Address</th>
                  <th style={thStyle}>Orders</th>
                  <th style={thStyle}>Joined</th>
                  <th style={thStyle}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {customers.map((customer) => (
                  <tr key={customer.id} style={{ borderBottom: '1px solid #E5E7EB' }}>
                    <td style={tdStyle}>
                      <div style={{ fontWeight: '600', color: '#111827' }}>{customer.name}</div>
                    </td>
                    <td style={tdStyle}>{customer.phone}</td>
                    <td style={tdStyle}>
                      <div style={{ 
                        maxWidth: '200px', 
                        overflow: 'hidden', 
                        textOverflow: 'ellipsis', 
                        whiteSpace: 'nowrap',
                        color: '#6B7280',
                        fontSize: '13px'
                      }}>
                        {customer.address || '-'}
                      </div>
                    </td>
                    <td style={tdStyle}>
                      <span style={{ 
                        background: '#F3F4F6', 
                        padding: '2px 8px', 
                        borderRadius: '12px', 
                        fontSize: '12px',
                        fontWeight: '600'
                      }}>
                        {customer.order_count}
                      </span>
                    </td>
                    <td style={tdStyle}>
                      {new Date(customer.created_at).toLocaleDateString('en-GB', { 
                        day: 'numeric', month: 'short', year: 'numeric' 
                      })}
                    </td>
                    <td style={tdStyle}>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <button 
                          onClick={() => handleEditClick(customer)}
                          style={actionButtonStyle}
                        >
                          <Pencil size={16} />
                        </button>
                        
                        {parseInt(customer.order_count) === 0 ? (
                          deletingId === customer.id ? (
                            <div style={deleteConfirmStyle}>
                              <span style={{ fontSize: '11px', fontWeight: '600' }}>Sure?</span>
                              <button 
                                onClick={() => handleConfirmDelete(customer.id)}
                                style={{ background: 'none', border: 'none', color: '#DC2626', cursor: 'pointer' }}
                              >
                                <Check size={16} />
                              </button>
                              <button 
                                onClick={handleCancelDelete}
                                style={{ background: 'none', border: 'none', color: '#6B7280', cursor: 'pointer' }}
                              >
                                <X size={16} />
                              </button>
                            </div>
                          ) : (
                            <button 
                              onClick={() => handleDeleteClick(customer.id)}
                              style={{ ...actionButtonStyle, border: 'none', color: '#9CA3AF' }}
                            >
                              <Trash2 size={16} />
                            </button>
                          )
                        ) : (
                          <span style={{ fontSize: '11px', color: '#9CA3AF', alignSelf: 'center' }}>
                            Has orders
                          </span>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )
      )}
    </div>
  );
};

const labelStyle = {
  display: 'block',
  fontSize: '11px',
  textTransform: 'uppercase',
  letterSpacing: '0.08em',
  color: '#6B7280',
  marginBottom: '8px',
  fontFamily: 'Plus Jakarta Sans, sans-serif'
};

const inputStyle = {
  width: '100%',
  padding: '10px 14px',
  borderRadius: '8px',
  border: '1px solid #E5E7EB',
  fontSize: '16px', // prevent iOS zoom
  fontFamily: 'Plus Jakarta Sans, sans-serif',
  outline: 'none',
  transition: 'border-color 0.2s',
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

const actionButtonStyle = {
  background: 'none',
  border: '1px solid #E5E7EB',
  borderRadius: '6px',
  padding: '6px',
  cursor: 'pointer',
  color: '#4B5563'
};

const deleteConfirmStyle = { 
  display: 'flex', 
  alignItems: 'center', 
  gap: '4px',
  background: '#F9FAFB',
  padding: '2px 8px',
  borderRadius: '6px',
  border: '1px solid #E5E7EB'
};

export default CustomersView;
