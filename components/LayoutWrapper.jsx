'use client'

import React, { useState, useEffect } from 'react'
import { Menu, Plus } from 'lucide-react'
import Sidebar from '@/components/Sidebar'
import { usePathname } from 'next/navigation'

export default function LayoutWrapper({ children }) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const pathname = usePathname()

  // Close sidebar on navigation
  useEffect(() => {
    setSidebarOpen(false)
  }, [pathname])

  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      {/* Mobile top bar — only visible on mobile */}
      <div 
        style={{ display: 'none' }} 
        className="mobile-topbar"
      >
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          height: '56px',
          background: '#1B4332',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 16px',
          zIndex: 100,
          boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
        }}>
          {/* Brand */}
          <div>
            <div style={{
              fontFamily: 'DM Serif Display, serif',
              fontSize: '18px',
              color: '#FFFFFF',
              lineHeight: 1,
            }}>Healing Soil</div>
            <div style={{
              fontFamily: 'Plus Jakarta Sans, sans-serif',
              fontSize: '10px',
              color: 'rgba(255,255,255,0.6)',
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
            }}>Business Ledger</div>
          </div>

          {/* Hamburger button */}
          <button
            onClick={() => setSidebarOpen(true)}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              padding: '8px',
              color: '#FFFFFF',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Menu size={24} />
          </button>
        </div>
      </div>

      {/* Overlay — mobile only, shown when sidebar open */}
      {sidebarOpen && (
        <div
          onClick={() => setSidebarOpen(false)}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.5)',
            zIndex: 150,
            display: 'none', /* shown via media query */
          }}
          className="mobile-overlay"
        />
      )}

      <Sidebar isOpen={sidebarOpen} setIsOpen={setSidebarOpen} />

      <main 
        className="main-content"
        style={{
          marginLeft: '240px',
          flex: 1,
          padding: '40px 48px',
          backgroundColor: '#F9F6F0',
          minHeight: '100vh',
          transition: 'margin-left 0.25s ease',
        }}
      >
        <div style={{ maxWidth: '960px', margin: '0 auto' }}>
          {children}
        </div>
      </main>

      {/* Floating Action Button (FAB) — New Order */}
      <a
        href="/orders/new"
        className="mobile-fab"
        style={{
          display: 'none', /* shown via media query */
          position: 'fixed',
          bottom: '24px',
          right: '20px',
          background: '#1B4332',
          color: '#FFFFFF',
          borderRadius: '28px',
          padding: '14px 20px',
          fontFamily: 'Plus Jakarta Sans, sans-serif',
          fontSize: '14px',
          fontWeight: 600,
          textDecoration: 'none',
          boxShadow: '0 4px 16px rgba(27,67,50,0.4)',
          zIndex: 90,
          alignItems: 'center',
          gap: '8px',
        }}
      >
        <Plus size={18} />
        New Order
      </a>
    </div>
  )
}
