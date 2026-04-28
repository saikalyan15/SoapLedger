import './globals.css'
import LayoutWrapper from '@/components/LayoutWrapper'

export const dynamic = 'force-dynamic'

export const metadata = {
  title: 'SoapLedger — Healing Soil',
  icons: {
    icon: [
      { url: '/logo/icon-16.png', sizes: '16x16', type: 'image/png' },
      { url: '/logo/icon-32.png', sizes: '32x32', type: 'image/png' },
      { url: '/logo/icon-64.png', sizes: '64x64', type: 'image/png' },
      { url: '/logo/icon-128.png', sizes: '128x128', type: 'image/png' },
    ],
    apple: { url: '/logo/icon-128.png', sizes: '128x128', type: 'image/png' },
  },
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <LayoutWrapper>
          {children}
        </LayoutWrapper>
      </body>
    </html>
  )
}
