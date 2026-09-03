import { ImageResponse } from 'next/og'

export const alt = 'MapxProp ค้นหาอสังหาริมทรัพย์สำหรับชีวิตและธุรกิจ'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

export default function OpenGraphImage() {
  return new ImageResponse(
    <div
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        padding: '72px 78px',
        color: '#103f35',
        background: 'linear-gradient(135deg, #f8fbf9 0%, #e6f3ed 58%, #fff1e8 100%)',
      }}
    >
      <div style={{ display: 'flex', fontSize: 52, fontWeight: 800, letterSpacing: '-2px' }}>MapxProp</div>
      <div style={{ display: 'flex', maxWidth: 920, flexDirection: 'column', gap: 20 }}>
        <div style={{ display: 'flex', fontSize: 64, fontWeight: 750, lineHeight: 1.08 }}>
          Property search for life and business
        </div>
        <div style={{ display: 'flex', fontSize: 29, color: '#47675f' }}>
          Homes · Rooms · Land · Retail · Office · Warehouse · Event spaces
        </div>
      </div>
      <div style={{ display: 'flex', fontSize: 24, color: '#176b50' }}>mapxprop.com</div>
    </div>,
    size
  )
}
