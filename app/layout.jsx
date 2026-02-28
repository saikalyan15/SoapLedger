import './globals.css'
import Sidebar from '@/components/Sidebar'

export const metadata = {
  title: 'SoapLedger — Healing Soil',
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <div style={{ display: 'flex', minHeight: '100vh' }}>
          <Sidebar />
          <main style={{
            marginLeft: '240px',
            flex: 1,
            padding: '40px 48px',
            backgroundColor: '#F9F6F0',
            minHeight: '100vh',
          }}>
            <div style={{ maxWidth: '960px' }}>
              {children}
            </div>
          </main>
        </div>
      </body>
    </html>
  )
}
