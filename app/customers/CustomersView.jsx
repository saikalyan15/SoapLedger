'use client';

import React, { useState } from 'react';
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

  // Sync state with props when they change
  React.useEffect(() => {
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
    <div style={{ padding: '40px' }}>
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
            + Add Customer
          </button>
        }
      />

      {/* Summary Stats */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(3, 1fr)', 
        gap: '20px', 
        marginBottom: '40px' 
      }}>
        {[
          { label: 'Total Customers', value: stats.totalCustomers },
          { label: 'Repeat Customers', value: stats.repeatCustomers },
          { label: 'New This Month', value: stats.newThisMonth }
        ].map((stat, i) => (
          <div key={i} style={{
            background: '#FFFFFF',
            border: '1px solid #E5E7EB',
            borderRadius: '12px',
            padding: '20px',
          }}>
            <div style={{
              fontSize: '11px',
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
              color: '#6B7280',
              marginBottom: '4px',
              fontFamily: 'Plus Jakarta Sans, sans-serif'
            }}>
              {stat.label}
            </div>
            <div style={{
              fontSize: '24px',
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
        <div style={{
          background: '#F9FAFB',
          border: '1px solid #E5E7EB',
          borderRadius: '12px',
          padding: '24px',
          marginBottom: '40px',
        }}>
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
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px' }}>
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
                placeholder="Add later when ready to dispatch"
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
                  gap: '8px'
                }}
              >
                {isSubmitting ? 'Saving...' : (
                  <>
                    <Check size={18} />
                    {editingCustomer ? 'Update Customer' : 'Save Customer'}
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
                  fontFamily: 'Plus Jakarta Sans, sans-serif'
                }}
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Customers Table */}
      {customers.length === 0 ? (
        <EmptyState 
          title="No customers yet"
          message="They'll appear here once you log your first order" 
        />
      ) : (
        <div style={{ background: '#FFFFFF', border: '1px solid #E5E7EB', borderRadius: '12px', overflow: 'hidden' }}>
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
                        style={{
                          background: 'none',
                          border: '1px solid #E5E7EB',
                          borderRadius: '6px',
                          padding: '6px',
                          cursor: 'pointer',
                          color: '#4B5563'
                        }}
                      >
                        <Pencil size={16} />
                      </button>
                      
                      {parseInt(customer.order_count) === 0 ? (
                        deletingId === customer.id ? (
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
  fontSize: '14px',
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

export default CustomersView;
