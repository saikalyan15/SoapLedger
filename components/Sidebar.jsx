'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard, PlusCircle, ShoppingBag, Users,
  Package, FlaskConical, Receipt, Settings, X, Tag, TrendingUp, Bell, BarChart2
} from 'lucide-react'

const navItems = [
  { label: 'Dashboard',     href: '/dashboard',    icon: LayoutDashboard },
  { label: 'New Order',     href: '/orders/new',   icon: PlusCircle },
  { label: 'Orders',        href: '/orders',       icon: ShoppingBag },
  { label: 'Customers',     href: '/customers',    icon: Users },
  { label: 'Reorder Outreach', href: '/outreach',  icon: Bell },
  { label: 'Products',      href: '/products',     icon: Package },
  { label: 'SKU Report',    href: '/sku-report',   icon: BarChart2 },
  { label: 'Print',          href: '/labels',       icon: Tag },
  { label: 'Growth',        href: '/growth',       icon: TrendingUp },
  { label: 'Expenses',      href: '/expenses',     icon: Receipt },
  { label: 'Settings',      href: '/settings',     icon: Settings },
]

export default function Sidebar({ isOpen, setIsOpen }) {
  const pathname = usePathname()

  return (
    <aside 
      className={`sidebar ${isOpen ? 'open' : ''}`}
      style={{
        position: 'fixed',
        top: 0, left: 0,
        width: '240px',
        height: '100vh',
        backgroundColor: '#1B4332',
        display: 'flex',
        flexDirection: 'column',
        zIndex: 200,
        borderRight: '1px solid rgba(255,255,255,0.08)',
      }}
    >
      {/* Close button — mobile only */}
      <button
        onClick={() => setIsOpen(false)}
        className="sidebar-close-btn"
        style={{
          display: 'none', /* shown via media query on mobile */
          position: 'absolute',
          top: '12px',
          right: '12px',
          background: 'rgba(255,255,255,0.1)',
          border: 'none',
          borderRadius: '6px',
          color: '#FFFFFF',
          cursor: 'pointer',
          padding: '6px',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 210,
        }}
      >
        <X size={18} />
      </button>

      {/* Brand */}
      <div style={{
        padding: '28px 24px 24px',
        borderBottom: '1px solid rgba(255,255,255,0.10)',
      }}>
        <div style={{
          fontFamily: 'DM Serif Display, serif',
          fontSize: '20px',
          color: '#FFFFFF',
          letterSpacing: '0.01em',
          lineHeight: 1.2,
        }}>
          Healing Soil
        </div>
        <div style={{
          fontFamily: 'Plus Jakarta Sans, sans-serif',
          fontSize: '11px',
          color: 'rgba(255,255,255,0.5)',
          marginTop: '4px',
          letterSpacing: '0.08em',
          textTransform: 'uppercase',
        }}>
          Business Ledger
        </div>
      </div>

      {/* Nav */}
      <nav style={{ flex: 1, padding: '16px 0' }}>
        {navItems.map(({ label, href, icon: Icon }) => {
          const isActive = pathname === href || 
            (href !== '/dashboard' && pathname.startsWith(href))
          return (
            <Link
              key={href}
              href={href}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                padding: '11px 24px',
                color: isActive ? '#FFFFFF' : 'rgba(255,255,255,0.6)',
                textDecoration: 'none',
                fontFamily: 'Plus Jakarta Sans, sans-serif',
                fontSize: '14px',
                fontWeight: isActive ? '600' : '400',
                borderLeft: isActive ? '3px solid #D4A017' : '3px solid transparent',
                backgroundColor: isActive ? 'rgba(255,255,255,0.08)' : 'transparent',
                transition: 'all 0.15s ease',
              }}
            >
              <Icon size={17} strokeWidth={isActive ? 2.2 : 1.8} />
              {label}
            </Link>
          )
        })}
      </nav>

      {/* Footer */}
      <div style={{
        padding: '20px 24px',
        borderTop: '1px solid rgba(255,255,255,0.08)',
        fontFamily: 'Plus Jakarta Sans, sans-serif',
        fontSize: '11px',
        color: 'rgba(255,255,255,0.3)',
      }}>
        Healing Soil © 2026
      </div>
    </aside>
  )
}
