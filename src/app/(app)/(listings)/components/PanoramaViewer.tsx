'use client'

import '@photo-sphere-viewer/core/index.css'

import { Rotate3D } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'

interface PanoramaViewerProps {
  src: string
  caption?: string
  className?: string
}

const PanoramaViewer = ({ src, caption, className = '' }: PanoramaViewerProps) => {
  const containerRef = useRef<HTMLDivElement>(null)
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading')

  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    let disposed = false
    let viewer: import('@photo-sphere-viewer/core').Viewer | null = null

    setStatus('loading')

    void import('@photo-sphere-viewer/core')
      .then(({ Viewer }) => {
        if (disposed) return

        viewer = new Viewer({
          container,
          panorama: src,
          caption,
          loadingTxt: 'กำลังเปิดภาพ 360°',
          defaultZoomLvl: 38,
          minFov: 30,
          maxFov: 90,
          mousewheelCtrlKey: false,
          touchmoveTwoFingers: false,
          navbar: ['zoom', 'move', 'caption', 'fullscreen'],
          lang: {
            zoom: 'ซูม',
            zoomOut: 'ซูมออก',
            zoomIn: 'ซูมเข้า',
            move: 'หมุนภาพ',
            download: 'ดาวน์โหลด',
            fullscreen: 'เต็มหน้าจอ',
            menu: 'เมนู',
            twoFingers: 'ใช้สองนิ้วเพื่อหมุนภาพ',
            ctrlZoom: 'กด Ctrl พร้อมเลื่อนเพื่อซูมภาพ',
            loadError: 'ไม่สามารถเปิดภาพ 360° ได้',
          },
        })

        viewer.addEventListener('ready', () => {
          if (!disposed) setStatus('ready')
        })
      })
      .catch(() => {
        if (!disposed) setStatus('error')
      })

    return () => {
      disposed = true
      viewer?.destroy()
      viewer = null
      container.replaceChildren()
    }
  }, [caption, src])

  return (
    <div className={`relative overflow-hidden bg-neutral-950 ${className}`}>
      <div ref={containerRef} className="absolute inset-0 size-full" />

      {status === 'loading' && (
        <div className="pointer-events-none absolute inset-0 z-10 grid place-items-center bg-neutral-950 text-white">
          <div className="flex flex-col items-center gap-3 text-center">
            <span className="grid size-12 animate-pulse place-items-center rounded-full bg-white/10">
              <Rotate3D className="size-6" aria-hidden="true" />
            </span>
            <span className="text-sm font-medium">กำลังเปิดภาพ 360°</span>
          </div>
        </div>
      )}

      {status === 'error' && (
        <div className="absolute inset-0 z-10 grid place-items-center bg-neutral-950 px-6 text-center text-white">
          <div>
            <Rotate3D className="mx-auto size-8 text-white/70" aria-hidden="true" />
            <p className="mt-3 font-semibold">เปิดภาพ 360° ไม่สำเร็จ</p>
            <p className="mt-1 text-sm text-white/65">กรุณาลองใหม่อีกครั้ง</p>
          </div>
        </div>
      )}

      {status === 'ready' && (
        <div className="pointer-events-none absolute top-4 left-1/2 z-10 -translate-x-1/2 rounded-full bg-neutral-950/55 px-3 py-1.5 text-xs font-medium whitespace-nowrap text-white backdrop-blur-sm sm:text-sm">
          ลากเพื่อหมุน · บีบนิ้วหรือเลื่อนเพื่อซูม
        </div>
      )}
    </div>
  )
}

export default PanoramaViewer
