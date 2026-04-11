import './globals.css'
import LayoutWrapper from '@/components/LayoutWrapper'

export const dynamic = 'force-dynamic'

export const metadata = {
  title: 'SoapLedger — Healing Soil',
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
