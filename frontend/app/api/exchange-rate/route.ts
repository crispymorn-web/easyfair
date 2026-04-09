import { NextResponse } from 'next/server'
import { DEFAULT_EXCHANGE_RATES } from '@/lib/constants'

export const revalidate = 3600 // 1시간 캐시

export async function GET() {
  try {
    const apiKey = process.env.EXCHANGE_RATE_API_KEY
    const res = await fetch(
      `https://v6.exchangerate-api.com/v6/${apiKey}/latest/USD`,
      { next: { revalidate: 3600 } }
    )

    if (!res.ok) throw new Error('Exchange rate API error')

    const data = await res.json()
    const rates = data.conversion_rates

    return NextResponse.json({
      USD_KRW: Math.round(rates.KRW),
      USD_THB: Math.round(rates.THB * 10) / 10,
      USD_JPY: Math.round(rates.JPY),
      USD_EUR: Math.round(rates.EUR * 100) / 100,
      USD_SGD: Math.round(rates.SGD * 100) / 100,
      updated_at: new Date().toISOString(),
    })
  } catch (error) {
    // API 실패 시 기본값 반환
    return NextResponse.json({
      ...DEFAULT_EXCHANGE_RATES,
      updated_at: new Date().toISOString(),
      fallback: true,
    })
  }
}
