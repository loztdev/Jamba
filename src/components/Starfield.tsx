import { useEffect, useRef } from 'react'
import type { IdleAnimation } from '../types'

interface StarfieldProps {
  onDismiss: () => void
  animationType: IdleAnimation
}

// ── Starfield ────────────────────────────────────────────────────────────────

interface Star {
  x: number; y: number; size: number
  opacity: number; opacityDir: 1 | -1; opacitySpeed: number
  vx: number; vy: number
}

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

function drawStarfield(canvas: HTMLCanvasElement): () => void {
  const ctx = canvas.getContext('2d')!
  const stars: Star[] = Array.from({ length: 160 }, () => randomStar(canvas.width, canvas.height))
  let raf = 0

  function draw() {
    const w = canvas.width; const h = canvas.height
    ctx.clearRect(0, 0, w, h)
    for (const s of stars) {
      s.opacity += s.opacityDir * s.opacitySpeed
      if (s.opacity >= 1) { s.opacity = 1; s.opacityDir = -1 }
      if (s.opacity <= 0.05) { s.opacity = 0.05; s.opacityDir = 1 }
      s.x += s.vx; s.y += s.vy
      if (s.x < -5) s.x = w + 5; if (s.x > w + 5) s.x = -5
      if (s.y < -5) s.y = h + 5; if (s.y > h + 5) s.y = -5
      ctx.beginPath()
      ctx.arc(s.x, s.y, s.size / 2, 0, Math.PI * 2)
      ctx.fillStyle = `rgba(255,255,255,${s.opacity})`
      ctx.fill()
    }
    raf = requestAnimationFrame(draw)
  }

  raf = requestAnimationFrame(draw)
  return () => cancelAnimationFrame(raf)
}

// ── Shooting stars ───────────────────────────────────────────────────────────

interface Shooter {
  x: number; y: number; len: number; speed: number; angle: number; opacity: number; life: number; maxLife: number
}

function drawShootingStars(canvas: HTMLCanvasElement): () => void {
  const ctx = canvas.getContext('2d')!
  const bg: Star[] = Array.from({ length: 80 }, () => randomStar(canvas.width, canvas.height))
  const shooters: Shooter[] = []
  let raf = 0
  let frame = 0

  function spawnShooter() {
    const angle = Math.PI / 4 + (Math.random() - 0.5) * 0.5
    shooters.push({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height * 0.5,
      len: 80 + Math.random() * 120,
      speed: 8 + Math.random() * 12,
      angle,
      opacity: 1,
      life: 0,
      maxLife: 40 + Math.random() * 30,
    })
  }

  function draw() {
    const w = canvas.width; const h = canvas.height
    ctx.clearRect(0, 0, w, h)

    // Background stars
    for (const s of bg) {
      s.opacity += s.opacityDir * s.opacitySpeed
      if (s.opacity >= 1) { s.opacity = 1; s.opacityDir = -1 }
      if (s.opacity <= 0.05) { s.opacity = 0.05; s.opacityDir = 1 }
      ctx.beginPath()
      ctx.arc(s.x, s.y, s.size / 2, 0, Math.PI * 2)
      ctx.fillStyle = `rgba(255,255,255,${s.opacity * 0.6})`
      ctx.fill()
    }

    // Spawn new shooter every ~90 frames
    frame++
    if (frame % 90 === 0) spawnShooter()

    for (let i = shooters.length - 1; i >= 0; i--) {
      const s = shooters[i]
      s.life++
      s.x += Math.cos(s.angle) * s.speed
      s.y += Math.sin(s.angle) * s.speed
      const t = s.life / s.maxLife
      s.opacity = t < 0.2 ? t / 0.2 : 1 - (t - 0.2) / 0.8

      const grad = ctx.createLinearGradient(
        s.x, s.y,
        s.x - Math.cos(s.angle) * s.len, s.y - Math.sin(s.angle) * s.len
      )
      grad.addColorStop(0, `rgba(255,255,255,${s.opacity})`)
      grad.addColorStop(1, 'rgba(255,255,255,0)')
      ctx.beginPath()
      ctx.moveTo(s.x, s.y)
      ctx.lineTo(s.x - Math.cos(s.angle) * s.len, s.y - Math.sin(s.angle) * s.len)
      ctx.strokeStyle = grad
      ctx.lineWidth = 1.5
      ctx.stroke()

      if (s.life >= s.maxLife || s.x > w + 200 || s.y > h + 200) {
        shooters.splice(i, 1)
      }
    }

    raf = requestAnimationFrame(draw)
  }

  spawnShooter()
  raf = requestAnimationFrame(draw)
  return () => cancelAnimationFrame(raf)
}

// ── Aurora ───────────────────────────────────────────────────────────────────

function drawAurora(canvas: HTMLCanvasElement): () => void {
  const ctx = canvas.getContext('2d')!
  const bg: Star[] = Array.from({ length: 120 }, () => randomStar(canvas.width, canvas.height))
  let raf = 0
  let t = 0

  // Aurora color bands
  const colors = [
    [0, 255, 128],
    [0, 180, 255],
    [180, 80, 255],
    [0, 255, 200],
  ]

  function draw() {
    const w = canvas.width; const h = canvas.height
    ctx.clearRect(0, 0, w, h)
    t += 0.008

    // Background stars (dimmed)
    for (const s of bg) {
      s.opacity += s.opacityDir * s.opacitySpeed * 0.5
      if (s.opacity >= 0.6) { s.opacity = 0.6; s.opacityDir = -1 }
      if (s.opacity <= 0.05) { s.opacity = 0.05; s.opacityDir = 1 }
      ctx.beginPath()
      ctx.arc(s.x, s.y, s.size / 2, 0, Math.PI * 2)
      ctx.fillStyle = `rgba(255,255,255,${s.opacity})`
      ctx.fill()
    }

    // Draw aurora bands at bottom third
    for (let b = 0; b < colors.length; b++) {
      const [r, g, bl] = colors[b]
      const offset = b * 0.7 + t
      const yBase = h * 0.55 + Math.sin(offset * 0.8) * h * 0.08

      ctx.save()
      const grad = ctx.createLinearGradient(0, yBase - h * 0.12, 0, yBase + h * 0.2)
      grad.addColorStop(0, `rgba(${r},${g},${bl},0)`)
      grad.addColorStop(0.3, `rgba(${r},${g},${bl},0.18)`)
      grad.addColorStop(0.7, `rgba(${r},${g},${bl},0.08)`)
      grad.addColorStop(1, `rgba(${r},${g},${bl},0)`)

      ctx.beginPath()
      ctx.moveTo(0, yBase)
      const waves = 6
      for (let i = 0; i <= waves; i++) {
        const x = (w / waves) * i
        const y = yBase + Math.sin(i * 1.2 + t + b) * h * 0.04
        i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y)
      }
      ctx.lineTo(w, yBase + h * 0.25)
      ctx.lineTo(0, yBase + h * 0.25)
      ctx.closePath()
      ctx.fillStyle = grad
      ctx.fill()
      ctx.restore()
    }

    raf = requestAnimationFrame(draw)
  }

  raf = requestAnimationFrame(draw)
  return () => cancelAnimationFrame(raf)
}

// ── Component ────────────────────────────────────────────────────────────────

export function Starfield({ onDismiss, animationType }: StarfieldProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    function resize() {
      canvas!.width = window.innerWidth
      canvas!.height = window.innerHeight
    }
    resize()
    window.addEventListener('resize', resize)

    const type = animationType === 'random'
      ? (['starfield', 'shooting', 'aurora'] as const)[Math.floor(Math.random() * 3)]
      : animationType

    let cleanup: () => void
    if (type === 'shooting') {
      cleanup = drawShootingStars(canvas)
    } else if (type === 'aurora') {
      cleanup = drawAurora(canvas)
    } else {
      cleanup = drawStarfield(canvas)
    }

    return () => {
      cleanup()
      window.removeEventListener('resize', resize)
    }
  }, [animationType])

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 z-30"
      style={{ cursor: 'pointer', background: '#000' }}
      onClick={onDismiss}
    />
  )
}
