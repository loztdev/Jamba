import { useEffect, useRef } from 'react'

interface Star {
  x: number
  y: number
  size: number
  opacity: number
  opacityDir: 1 | -1
  opacitySpeed: number
  vx: number
  vy: number
}

interface StarfieldProps {
  onDismiss: () => void
}

const STAR_COUNT = 160

function randomStar(w: number, h: number): Star {
  return {
    x: Math.random() * w,
    y: Math.random() * h,
    size: 0.5 + Math.random() * 2.5,
    opacity: Math.random(),
    opacityDir: Math.random() > 0.5 ? 1 : -1,
    opacitySpeed: 0.003 + Math.random() * 0.012,
    vx: (Math.random() - 0.5) * 0.18,
    vy: (Math.random() - 0.5) * 0.18,
  }
}

export function Starfield({ onDismiss }: StarfieldProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const starsRef = useRef<Star[]>([])
  const rafRef = useRef<number | null>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')!

    function resize() {
      canvas!.width = window.innerWidth
      canvas!.height = window.innerHeight
    }
    resize()
    window.addEventListener('resize', resize)

    starsRef.current = Array.from({ length: STAR_COUNT }, () =>
      randomStar(canvas.width, canvas.height)
    )

    function draw() {
      const w = canvas!.width
      const h = canvas!.height
      ctx.clearRect(0, 0, w, h)

      for (const star of starsRef.current) {
        // Update opacity (pulsing)
        star.opacity += star.opacityDir * star.opacitySpeed
        if (star.opacity >= 1) { star.opacity = 1; star.opacityDir = -1 }
        if (star.opacity <= 0.05) { star.opacity = 0.05; star.opacityDir = 1 }

        // Update position (gentle drift)
        star.x += star.vx
        star.y += star.vy

        // Wrap around edges
        if (star.x < -5) star.x = w + 5
        if (star.x > w + 5) star.x = -5
        if (star.y < -5) star.y = h + 5
        if (star.y > h + 5) star.y = -5

        ctx.beginPath()
        ctx.arc(star.x, star.y, star.size / 2, 0, Math.PI * 2)
        ctx.fillStyle = `rgba(255, 255, 255, ${star.opacity})`
        ctx.fill()
      }

      rafRef.current = requestAnimationFrame(draw)
    }

    rafRef.current = requestAnimationFrame(draw)

    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
      window.removeEventListener('resize', resize)
    }
  }, [])

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 z-30"
      style={{ cursor: 'pointer' }}
      onClick={onDismiss}
      onKeyDown={onDismiss}
    />
  )
}
