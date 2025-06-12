import { Inter } from 'next/font/google'
import './globals.css'
import { WalletProvider } from './providers/WalletProvider'

const inter = Inter({ subsets: ['latin'] })

export const metadata = {
  title: 'GoApeMe | Crowdfunding on ApeChain',
  description: 'Decentralized crowdfunding platform built on ApeChain',
  icons: {
    icon: [
      { url: '/app-icon.ico', sizes: 'any' },
      { url: '/app-icon.ico', type: 'image/x-icon' },
    ],
  },
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        {/* Explicit favicon links */}
        <link rel="icon" type="image/x-icon" href="/app-icon.ico" />
        <link rel="shortcut icon" href="/app-icon.ico" />
      </head>
      <body className={inter.className}>
        <WalletProvider>
          {children}
        </WalletProvider>
      </body>
    </html>
  )
}