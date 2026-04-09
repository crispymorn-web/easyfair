import type { Metadata } from 'next'
import './globals.css'
import Sidebar from '@/components/Sidebar'

export const metadata: Metadata = {
  title: 'easyfair — AI 전시 부스 견적 플랫폼',
  description: '렌더링 업로드 한 번으로 전문가 견적서 3분 완성. 전 세계 200+ 전시장 AI 견적 자동 산출.',
  keywords: ['전시 부스', '견적', 'AI', 'MWC', 'KINTEX', 'HortEx'],
  openGraph: {
    title: 'easyfair — AI 전시 부스 견적',
    description: '3분 만에 전문가 견적서 완성',
    url: 'https://easyfair.co.kr',
    siteName: 'easyfair',
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko">
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              tailwind = { config: {
                theme: {
                  extend: {
                    colors: {
                      brand: {
                        50:  '#E8F5E9',
                        100: '#C8E6C9',
                        200: '#A5D6A7',
                        400: '#66BB6A',
                        600: '#2E7D4F',
                        700: '#1B5E20',
                        800: '#145230',
                        900: '#0D3B22',
                      },
                      accent: {
                        400: '#FFCA28',
                        500: '#F9A825',
                        600: '#F57F17',
                      },
                    },
                    borderRadius: { DEFAULT: '10px' },
                    fontFamily: {
                      mono: ['JetBrains Mono', 'monospace'],
                    },
                  },
                },
              }}
            `,
          }}
        />
        <script src="https://cdn.tailwindcss.com" async={false} />
      </head>
      <body className="bg-gray-50 text-gray-900 antialiased">
        <div className="flex h-screen overflow-hidden">
          <Sidebar />
          <main className="flex-1 overflow-y-auto">
            {children}
          </main>
        </div>
      </body>
    </html>
  )
}
