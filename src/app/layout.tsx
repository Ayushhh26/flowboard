import type { Metadata } from 'next'
import Script from 'next/script'
import { DM_Sans, Newsreader } from 'next/font/google'
import { Providers } from '@/components/providers'
import { ThemeProvider } from '@/components/ThemeProvider'
import './globals.css'

const dmSans = DM_Sans({
  variable: '--font-dm-sans',
  subsets: ['latin'],
  display: 'swap',
})

const newsreader = Newsreader({
  variable: '--font-newsreader',
  subsets: ['latin'],
  weight: ['600', '700'],
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'FlowBoard',
  description: 'A collaborative Kanban workspace for managing tasks across teams.',
}

const themeInitScript = `(function(){try{var r=localStorage.getItem('flowboard-theme');if(!r)return;var p=JSON.parse(r);var t=p.state&&p.state.theme;if(t==='dark')document.documentElement.classList.add('dark');else document.documentElement.classList.remove('dark')}catch(e){}})();`

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html
      lang="en"
      className={`${dmSans.variable} ${newsreader.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <body className={`${dmSans.className} flex h-full flex-col`}>
        <Script
          id="flowboard-theme-init"
          strategy="beforeInteractive"
          dangerouslySetInnerHTML={{ __html: themeInitScript }}
        />
        <ThemeProvider>
          <Providers>{children}</Providers>
        </ThemeProvider>
      </body>
    </html>
  )
}
