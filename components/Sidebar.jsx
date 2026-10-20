'use client'
import Link from 'next/link'
import Image from 'next/image'
import { usePathname } from 'next/navigation'
import { useState } from 'react'
import {
  LayoutDashboard, PlusCircle, ShoppingBag, Users,
  Package, Receipt, Settings, X, Tag, TrendingUp, Bell, BarChart2, Droplets, NotebookPen,
  ChevronDown, BarChart3, Wrench, Percent, LogOut, Truck, MessageCircle, BookOpen, Tent, Gift
} from 'lucide-react'
import { signOutAction } from '@/lib/actions/auth'

const navItems = [
  { label: 'Dashboard',   href: '/dashboard',  icon: LayoutDashboard },
  { label: 'New Order',   href: '/orders/new', icon: PlusCircle },
  { label: 'Orders',      href: '/orders',     icon: ShoppingBag },
  { label: 'Interests',   href: '/interests',  icon: MessageCircle },
  { label: 'Customers',   href: '/customers',  icon: Users },
  { label: 'Products',    href: '/products',   icon: Package },
  { label: 'Inventory',   href: '/inventory',  icon: Droplets },
  { label: 'Events',      href: '/events',     icon: Tent },
  {
    label: 'Reports',
    icon: BarChart3,
    children: [
      { label: 'SKU Report', href: '/sku-report', icon: BarChart2 },
      { label: 'Wholesale Pricing', href: '/wholesale-pricing', icon: Percent },
      { label: 'Repeat Customers', href: '/repeat-customers', icon: Users },
      { label: 'Growth',     href: '/growth',     icon: TrendingUp },
      { label: 'Expenses',   href: '/expenses',   icon: Receipt },
    ],
  },
  {
    label: 'Operations',
    icon: Wrench,
    children: [
      { label: 'Print',            href: '/labels',   icon: Tag },
      { label: 'Soap Catalogue',   href: '/catalog',  icon: BookOpen },
      { label: 'Dispatch Report',  href: '/orders/dispatch-report', icon: Truck },
      {
        label: 'Gift Notes',
        icon: NotebookPen,
        children: [
          { label: 'Gift Booklet', href: '/handnote', icon: BookOpen },
          { label: 'Gift Card',    href: '/giftcard', icon: Gift },
        ],
      },
      { label: 'Reorder Outreach', href: '/outreach', icon: Bell },
    ],
  },
  { label: 'Settings', href: '/settings', icon: Settings },
]

const linkBase = {
  display: 'flex',
  alignItems: 'center',
  gap: '12px',
  padding: '10px 24px',
  textDecoration: 'none',
  fontFamily: 'Plus Jakarta Sans, sans-serif',
  fontSize: '14px',
  transition: 'background-color 0.15s ease, color 0.15s ease, border-color 0.15s ease',
}

function NavLink({ href, active, children, style = {} }) {
  const [hovered, setHovered] = useState(false)
  return (
    <Link
      href={href}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        ...linkBase,
        color: active ? '#FFFFFF' : hovered ? 'rgba(255,255,255,0.85)' : 'rgba(255,255,255,0.6)',
        fontWeight: active ? '600' : '400',
        borderLeft: active ? '3px solid #D4A017' : '3px solid transparent',
        backgroundColor: active ? 'rgba(255,255,255,0.08)' : hovered ? 'rgba(255,255,255,0.04)' : 'transparent',
        ...style,
      }}
    >
      {children}
    </Link>
  )
}

/* True if this item's link, or any link nested under it, matches the current path */
function isItemActive(item, pathname) {
  if (item.children) return item.children.some(c => isItemActive(c, pathname))
  return pathname === item.href ||
    (item.href !== '/dashboard' && pathname.startsWith(item.href))
}

/* depth 0 = top level, 1 = inside a group, 2 = group inside a group */
const indentFor = depth => 24 + depth * 22
const sizeFor = depth => ({
  icon: depth === 0 ? 17 : 15,
  font: depth === 0 ? '14px' : '13px',
  pad:  depth === 0 ? '10px' : '8px',
})

function NavItem({ item, pathname, depth = 0 }) {
  const hasChildren = Boolean(item.children)
  const childActive = hasChildren && isItemActive(item, pathname)
  const [open, setOpen] = useState(childActive)
  const [hovered, setHovered] = useState(false)

  const Icon = item.icon
  const s = sizeFor(depth)
  const nestedStyle = depth === 0 ? {} : { padding: `${s.pad} 24px ${s.pad} ${indentFor(depth)}px`, fontSize: s.font }

  if (!hasChildren) {
    const isActive = isItemActive(item, pathname)
    return (
      <NavLink href={item.href} active={isActive} style={nestedStyle}>
        <Icon size={s.icon} strokeWidth={isActive ? 2.2 : 1.8} />
        {item.label}
      </NavLink>
    )
  }

  return (
    <div>
      <button
        onClick={() => setOpen(v => !v)}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        style={{
          ...linkBase,
          width: '100%',
          color: childActive ? '#FFFFFF' : hovered ? 'rgba(255,255,255,0.85)' : 'rgba(255,255,255,0.6)',
          background: 'none',
          border: 'none',
          borderLeft: childActive ? '3px solid #D4A017' : '3px solid transparent',
          backgroundColor: childActive ? 'rgba(255,255,255,0.08)' : hovered ? 'rgba(255,255,255,0.04)' : 'transparent',
          fontWeight: childActive ? '600' : '400',
          cursor: 'pointer',
          textAlign: 'left',
          ...nestedStyle,
        }}
      >
        <Icon size={s.icon} strokeWidth={childActive ? 2.2 : 1.8} />
        <span style={{ flex: 1 }}>{item.label}</span>
        <ChevronDown
          size={14}
          style={{
            marginRight: '4px',
            opacity: 0.6,
            transform: open ? 'rotate(0deg)' : 'rotate(-90deg)',
            transition: 'transform 0.2s ease',
          }}
        />
      </button>

      {/* Animated submenu */}
      <div
        style={{
          overflow: 'hidden',
          maxHeight: open ? '600px' : '0',
          transition: 'max-height 0.22s ease',
          backgroundColor: depth === 0 ? 'rgba(0,0,0,0.18)' : 'rgba(0,0,0,0.12)',
        }}
      >
        {item.children.map(child => (
          <NavItem key={child.href || child.label} item={child} pathname={pathname} depth={depth + 1} />
        ))}
      </div>
    </div>
  )
}

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
          display: 'none',
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
        padding: '20px 24px',
        borderBottom: '1px solid rgba(255,255,255,0.10)',
      }}>
        <div style={{
          background: '#FFFFFF',
          borderRadius: '8px',
          padding: '6px 10px',
          display: 'block',
        }}>
          <Image
            src="/logo/healing-soil-v2.1.png"
            alt="Healing Soil"
            width={160}
            height={88}
            style={{ width: '160px', height: 'auto', display: 'block' }}
            priority
          />
        </div>
        <div style={{
          fontFamily: 'Plus Jakarta Sans, sans-serif',
          fontSize: '11px',
          color: 'rgba(255,255,255,0.5)',
          marginTop: '6px',
          letterSpacing: '0.08em',
          textTransform: 'uppercase',
        }}>
          Business Ledger
        </div>
      </div>

      {/* Nav */}
      <nav style={{ flex: 1, minHeight: 0, padding: '16px 0', overflowY: 'auto', scrollbarWidth: 'thin', scrollbarColor: 'rgba(255,255,255,0.15) transparent' }}>
        {navItems.map((item) => (
          <NavItem key={item.label} item={item} pathname={pathname} />
        ))}
      </nav>

      {/* Footer */}
      <div style={{
        padding: '20px 24px',
        borderTop: '1px solid rgba(255,255,255,0.08)',
        fontFamily: 'Plus Jakarta Sans, sans-serif',
        fontSize: '11px',
        color: 'rgba(255,255,255,0.3)',
      }}>
        <form action={signOutAction}>
          <button
            type="submit"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              marginBottom: '12px',
              padding: 0,
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              fontFamily: 'inherit',
              fontSize: '12px',
              color: 'rgba(255,255,255,0.5)',
            }}
          >
            <LogOut size={13} />
            Sign out
          </button>
        </form>
        Healing Soil © 2026
      </div>
    </aside>
  )
}
