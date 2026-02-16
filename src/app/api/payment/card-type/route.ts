import { NextRequest, NextResponse } from 'next/server'

/**
 * Kart numarasının ilk 6 hanesi (BIN) ile kart türünü sorgular.
 * Taksit seçeneği yalnızca kredi kartları için sunulabilsin diye kullanılır.
 * Harici BIN API: binlist.net (ücretsiz, rate limit var)
 */
export async function GET(request: NextRequest) {
  try {
    const bin = request.nextUrl.searchParams.get('bin')?.replace(/\D/g, '').slice(0, 8) || ''
    if (bin.length < 6) {
      return NextResponse.json(
        { error: 'En az 6 hane gerekli', type: 'unknown', installmentsAvailable: false },
        { status: 400 }
      )
    }

    const bin6 = bin.slice(0, 6)
    const url = `https://lookup.binlist.net/${bin6}`
    const res = await fetch(url, {
      headers: { 'Accept-Version': '3' },
      next: { revalidate: 86400 }
    })

    if (!res.ok) {
      return NextResponse.json({
        type: 'unknown',
        installmentsAvailable: false,
        message: 'Kart türü belirlenemedi'
      })
    }

    const data = await res.json()
    const type = (data.type || '').toLowerCase()
    const installmentsAvailable = type === 'credit'

    return NextResponse.json({
      type: type || 'unknown',
      installmentsAvailable,
      scheme: data.scheme || null,
      brand: data.brand || null
    })
  } catch (error) {
    console.error('Card type lookup error:', error)
    return NextResponse.json({
      type: 'unknown',
      installmentsAvailable: false,
      message: 'Sorgu sırasında hata oluştu'
    })
  }
}
