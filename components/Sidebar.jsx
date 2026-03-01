'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard, PlusCircle, ShoppingBag, Users,
  Package, FlaskConical, Receipt, Settings
} from 'lucide-react'

const navItems = [
  { label: 'Dashboard',     href: '/dashboard',    icon: LayoutDashboard },
  { label: 'New Order',     href: '/orders/new',   icon: PlusCircle },
  { label: 'Orders',        href: '/orders',       icon: ShoppingBag },
  { label: 'Customers',     href: '/customers',    icon: Users },
  { label: 'Products',      href: '/products',     icon: Package },
  { label: 'Raw Materials', href: '/raw-materials',icon: FlaskConical },
  { label: 'Expenses',      href: '/expenses',     icon: Receipt },
  { label: 'Settings',      href: '/settings',     icon: Settings },
]

export default function Sidebar() {
  const pathname = usePathname()

  return (
    <aside style={{
      position: 'fixed',
      top: 0, left: 0,
      width: '240px',
      height: '100vh',
      backgroundColor: '#1B4332',
      display: 'flex',
      flexDirection: 'column',
      zIndex: 100,
      borderRight: '1px solid rgba(255,255,255,0.08)',
    }}>
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
